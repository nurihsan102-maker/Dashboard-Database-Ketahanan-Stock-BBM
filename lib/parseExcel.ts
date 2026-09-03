import * as XLSX from "xlsx";
import { PRODUCTS, REGIONS, STATUS_LIST } from "./constants";

export type KetahananRow = {
  product: string;
  ownership: "COCO" | "KSO";
  ketahanan_hari: number | null;
  sales_per_day_kl: number | null;
};

export type StatusRow = {
  product: string;
  ownership: "COCO" | "KSO";
  region: string;
  jam: string;
  status: "DEADSTOCK" | "CRITICAL" | "NORMAL";
  jumlah_unit: number;
};

export type CoverageRow = {
  product: string;
  region: string;
  ownership: "COCO" | "KSO";
  coverage_day: number | null;
};

export type TacChecklistRow = {
  spbu_id: string | null;
  spbu_name: string | null;
  region: string | null;
  item_no: number;
  item_label: string | null;
  status: boolean | null;
};

export type ParsedResult = {
  ketahanan: KetahananRow[];
  status: StatusRow[];
  coverage: CoverageRow[];
  tac: TacChecklistRow[];
  warnings: string[];
};

function toGrid(sheet: XLSX.WorkSheet): any[][] {
  return XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null, raw: true }) as any[][];
}

function norm(v: any): string {
  return String(v ?? "").trim().toUpperCase();
}

function parseNumberLoose(v: any): number | null {
  if (v === null || v === undefined) return null;
  if (typeof v === "number") return v;
  const s = String(v).replace(/[^\d.,-]/g, "").replace(/\./g, "").replace(",", ".");
  const n = parseFloat(s);
  return isNaN(n) ? null : n;
}

function findProductMatch(cell: string): string | null {
  const c = norm(cell);
  for (const p of PRODUCTS) {
    if (c === norm(p)) return p;
  }
  return null;
}

// Parses card style sheet like "KETAHANAN STOCK PERTAMINA RETAIL"
function parseKetahananSheet(grid: any[][], warnings: string[]): KetahananRow[] {
  const rows: KetahananRow[] = [];
  const found = new Set<string>();

  for (let r = 0; r < grid.length; r++) {
    for (let c = 0; c < (grid[r]?.length || 0); c++) {
      const product = findProductMatch(grid[r][c]);
      if (!product || found.has(`${product}`)) continue;

      // search window below anchor for COCO / KSO columns and values
      const windowRows = grid.slice(r, r + 10);
      let cocoCol = -1;
      let ksoCol = -1;
      for (let wr = 0; wr < windowRows.length; wr++) {
        for (let wc = 0; wc < (windowRows[wr]?.length || 0); wc++) {
          const val = norm(windowRows[wr][wc]);
          if (val === "COCO" && cocoCol === -1) cocoCol = wc;
          if (val === "KSO" && ksoCol === -1) ksoCol = wc;
        }
        if (cocoCol !== -1 && ksoCol !== -1) break;
      }
      if (cocoCol === -1 || ksoCol === -1) {
        warnings.push(`Tidak menemukan kolom COCO/KSO untuk produk ${product}`);
        continue;
      }

      let cocoHari: number | null = null;
      let cocoKl: number | null = null;
      let ksoHari: number | null = null;
      let ksoKl: number | null = null;

      const numbersInCol = (colIdx: number) => {
        const nums: number[] = [];
        for (let wr = 0; wr < windowRows.length; wr++) {
          const raw = windowRows[wr]?.[colIdx];
          if (raw === null || raw === undefined) continue;
          const s = String(raw);
          if (/hari/i.test(s) || typeof raw === "number") {
            const n = parseNumberLoose(raw);
            if (n !== null) nums.push(n);
          } else if (/^\d/.test(s.trim())) {
            const n = parseNumberLoose(raw);
            if (n !== null) nums.push(n);
          }
        }
        return nums;
      };

      const cocoNums = numbersInCol(cocoCol);
      const ksoNums = numbersInCol(ksoCol);
      if (cocoNums.length >= 1) cocoHari = cocoNums[0];
      if (cocoNums.length >= 2) cocoKl = cocoNums[1];
      if (ksoNums.length >= 1) ksoHari = ksoNums[0];
      if (ksoNums.length >= 2) ksoKl = ksoNums[1];

      rows.push({ product, ownership: "COCO", ketahanan_hari: cocoHari, sales_per_day_kl: cocoKl });
      rows.push({ product, ownership: "KSO", ketahanan_hari: ksoHari, sales_per_day_kl: ksoKl });
      found.add(product);
    }
  }
  return rows;
}

// Parses status stock sheet (DEADSTOCK / CRITICAL / NORMAL per region per jam) per ownership block
function parseStatusSheet(grid: any[][], productHint: string, warnings: string[]): StatusRow[] {
  const rows: StatusRow[] = [];

  // find region header row(s): a row containing multiple "Region" labels
  const regionHeaderRows: number[] = [];
  for (let r = 0; r < grid.length; r++) {
    const rowStr = (grid[r] || []).map(norm).join("|");
    if (REGIONS.filter((rg) => rowStr.includes(norm(rg))).length >= 3) {
      regionHeaderRows.push(r);
    }
  }

  for (const headerRow of regionHeaderRows) {
    // determine ownership block: look upward for "COCO" or "KSO" mention within 3 rows
    let ownership: "COCO" | "KSO" = "COCO";
    for (let back = headerRow; back >= Math.max(0, headerRow - 3); back--) {
      const line = (grid[back] || []).map(norm).join(" ");
      if (line.includes("KSO")) {
        ownership = "KSO";
        break;
      }
      if (line.includes("COCO")) {
        ownership = "COCO";
        break;
      }
    }

    // map region -> column index (region label column), then jam sub header row is headerRow+1 with 09:00/12:00
    const regionCols: { region: string; col: number }[] = [];
    (grid[headerRow] || []).forEach((cell, idx) => {
      const c = norm(cell);
      const match = REGIONS.find((rg) => norm(rg) === c);
      if (match) regionCols.push({ region: match, col: idx });
    });

    const jamRow = grid[headerRow + 1] || [];
    // For each region column, detect any HH:MM style jam label, bebas bukan preset
    const jamPattern = /^\d{1,2}:\d{2}$/;
    const regionJamCols: { region: string; jam: string; col: number }[] = [];
    for (const rc of regionCols) {
      for (let offset = 0; offset <= 2; offset++) {
        const cell = norm(jamRow[rc.col + offset]);
        if (jamPattern.test(cell)) {
          regionJamCols.push({ region: rc.region, jam: cell, col: rc.col + offset });
        }
      }
    }

    // status rows below
    for (let r = headerRow + 2; r < Math.min(grid.length, headerRow + 8); r++) {
      const label = norm(grid[r]?.[0]);
      const status = STATUS_LIST.find((s) => s === label);
      if (!status) continue;
      for (const rjc of regionJamCols) {
        const raw = grid[r][rjc.col];
        const n = parseNumberLoose(raw);
        if (n === null) continue;
        rows.push({
          product: productHint,
          ownership,
          region: rjc.region,
          jam: rjc.jam,
          status: status as any,
          jumlah_unit: n,
        });
      }
    }
  }

  if (rows.length === 0) {
    warnings.push(`Sheet status stock untuk ${productHint} tidak menghasilkan data, cek format header region`);
  }
  return rows;
}

// Parses coverage day per region table (one row per product)
function parseCoverageSheet(grid: any[][], warnings: string[]): CoverageRow[] {
  const rows: CoverageRow[] = [];

  let headerRow = -1;
  for (let r = 0; r < grid.length; r++) {
    const rowStr = (grid[r] || []).map(norm).join("|");
    if (REGIONS.filter((rg) => rowStr.includes(norm(rg))).length >= 3) {
      headerRow = r;
      break;
    }
  }
  if (headerRow === -1) {
    warnings.push("Sheet coverage per region tidak ditemukan headernya");
    return rows;
  }

  const regionCols: { region: string; col: number }[] = [];
  (grid[headerRow] || []).forEach((cell, idx) => {
    const c = norm(cell);
    const match = REGIONS.find((rg) => norm(rg) === c);
    if (match) regionCols.push({ region: match, col: idx });
  });

  const subHeaderRow = grid[headerRow + 1] || [];
  const regionOwnershipCols: { region: string; ownership: "COCO" | "KSO"; col: number }[] = [];
  for (const rc of regionCols) {
    for (let offset = 0; offset <= 2; offset++) {
      const cell = norm(subHeaderRow[rc.col + offset]);
      if (cell === "COCO" || cell === "KSO") {
        regionOwnershipCols.push({ region: rc.region, ownership: cell as "COCO" | "KSO", col: rc.col + offset });
      }
    }
  }

  for (let r = headerRow + 2; r < grid.length; r++) {
    const firstCell = grid[r]?.[0];
    const product = findProductMatch(firstCell);
    if (!product) continue;
    for (const roc of regionOwnershipCols) {
      const raw = grid[r][roc.col];
      const val = parseNumberLoose(raw);
      rows.push({ product, region: roc.region, ownership: roc.ownership, coverage_day: val });
    }
  }
  return rows;
}

// Parses TAC 44 item binary checklist sheet, satu baris per SPBU per item
function parseTacSheet(grid: any[][], warnings: string[]): TacChecklistRow[] {
  const rows: TacChecklistRow[] = [];

  let headerRow = -1;
  let colSpbuId = -1;
  let colSpbuName = -1;
  let colRegion = -1;
  const itemCols: { col: number; label: string; itemNo: number }[] = [];

  for (let r = 0; r < Math.min(grid.length, 10); r++) {
    const rowStr = (grid[r] || []).map(norm).join("|");
    if (rowStr.includes("SPBU") || rowStr.includes("ITEM") || rowStr.includes("CHECKLIST")) {
      headerRow = r;
      break;
    }
  }
  if (headerRow === -1) {
    warnings.push("Header checklist TAC tidak ditemukan, pastikan ada kolom SPBU dan daftar item");
    return rows;
  }

  let itemCounter = 0;
  (grid[headerRow] || []).forEach((cell, idx) => {
    const c = norm(cell);
    if (c.includes("SPBU") && c.includes("ID") && colSpbuId === -1) colSpbuId = idx;
    else if (c.includes("SPBU") && colSpbuName === -1) colSpbuName = idx;
    else if (c.includes("REGION") && colRegion === -1) colRegion = idx;
    else if (c && idx > 0) {
      itemCounter += 1;
      itemCols.push({ col: idx, label: String(cell), itemNo: itemCounter });
    }
  });

  for (let r = headerRow + 1; r < grid.length; r++) {
    const row = grid[r] || [];
    if (!row.length || row.every((x) => x === null || x === "")) continue;
    const spbuId = colSpbuId >= 0 ? String(row[colSpbuId] ?? "") : null;
    const spbuName = colSpbuName >= 0 ? String(row[colSpbuName] ?? "") : null;
    const region = colRegion >= 0 ? String(row[colRegion] ?? "") : null;
    for (const ic of itemCols) {
      const raw = row[ic.col];
      if (raw === null || raw === undefined || raw === "") continue;
      const s = norm(raw);
      const statusBool = s === "1" || s === "YA" || s === "Y" || s === "OK" || s === "TRUE" || s === "SESUAI";
      rows.push({
        spbu_id: spbuId,
        spbu_name: spbuName,
        region,
        item_no: ic.itemNo,
        item_label: ic.label,
        status: statusBool,
      });
    }
  }

  if (rows.length === 0) warnings.push("Sheet checklist TAC tidak menghasilkan data, cek format kolom");
  return rows;
}

export function parseWorkbookBuffer(buffer: ArrayBuffer, ownershipHint?: string): ParsedResult {
  const wb = XLSX.read(buffer, { type: "array" });
  const warnings: string[] = [];

  let ketahanan: KetahananRow[] = [];
  let status: StatusRow[] = [];
  let coverage: CoverageRow[] = [];
  let tac: TacChecklistRow[] = [];

  const isTacUpload = ownershipHint === "TAC";

  for (const sheetName of wb.SheetNames) {
    const sheet = wb.Sheets[sheetName];
    const grid = toGrid(sheet);
    const flatText = grid.flat().map(norm).join(" | ");

    const isKetahananSheet = flatText.includes("KETAHANAN STOCK");
    const isCoverageSheet = flatText.includes("COVERAGE DAY");
    const isStatusSheet =
      flatText.includes("DEADSTOCK") && flatText.includes("CRITICAL") && flatText.includes("NORMAL");

    if (isTacUpload && !isKetahananSheet && !isCoverageSheet && !isStatusSheet) {
      tac = tac.concat(parseTacSheet(grid, warnings));
    } else if (isKetahananSheet) {
      ketahanan = ketahanan.concat(parseKetahananSheet(grid, warnings));
    } else if (isCoverageSheet) {
      coverage = coverage.concat(parseCoverageSheet(grid, warnings));
    } else if (isStatusSheet) {
      const productMatch = PRODUCTS.find((p) => flatText.includes(norm(p))) || sheetName.toUpperCase();
      status = status.concat(parseStatusSheet(grid, productMatch, warnings));
    }
  }

  if (!isTacUpload && ketahanan.length === 0) warnings.push("Data ketahanan stock (kartu ringkasan) tidak ditemukan di file ini");
  if (!isTacUpload && status.length === 0) warnings.push("Data status stock dead/critical/normal tidak ditemukan di file ini");
  if (!isTacUpload && coverage.length === 0) warnings.push("Data coverage per region tidak ditemukan di file ini");
  if (isTacUpload && tac.length === 0) warnings.push("Data checklist TAC tidak ditemukan di file ini");

  return { ketahanan, status, coverage, tac, warnings };
}
