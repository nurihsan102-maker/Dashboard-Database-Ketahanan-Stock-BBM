"use client";

import { StatusRow } from "@/lib/types";
import { REGIONS, STATUS_LIST } from "@/lib/constants";

function cellValue(rows: StatusRow[], product: string, ownership: string, region: string, jam: string, status: string) {
  const r = rows.find(
    (x) => x.product === product && x.ownership === ownership && x.region === region && x.jam === jam && x.status === status
  );
  return r ? r.jumlah_unit : null;
}

function diffBadge(v0900: number | null, v1200: number | null) {
  if (v0900 === null || v1200 === null) return null;
  const diff = v1200 - v0900;
  if (diff > 0) return <span className="text-red-400"> (+)</span>;
  if (diff < 0) return <span className="text-green-400"> (-)</span>;
  return null;
}

export default function StatusStockTable({ rows, product, ownership }: { rows: StatusRow[]; product: string; ownership: "COCO" | "KSO" }) {
  const filtered = rows.filter((r) => r.product === product && r.ownership === ownership);
  if (filtered.length === 0) return null;

  return (
    <div className="mb-4">
      <div className="text-xs font-semibold mb-1 text-slate-300">Status Stock di SPBU {ownership}</div>
      <div className="overflow-x-auto">
        <table className="text-xs border-collapse w-full">
          <thead>
            <tr className="bg-lime-800/60">
              <th className="border border-slate-700 px-2 py-1">Status</th>
              {REGIONS.map((r) => (
                <th key={r} className="border border-slate-700 px-2 py-1" colSpan={2}>
                  {r}
                </th>
              ))}
            </tr>
            <tr className="bg-lime-800/40">
              <th className="border border-slate-700 px-2 py-1"></th>
              {REGIONS.map((r) => (
                <>
                  <th key={r + "-9"} className="border border-slate-700 px-2 py-1">09:00</th>
                  <th key={r + "-12"} className="border border-slate-700 px-2 py-1">12:00</th>
                </>
              ))}
            </tr>
          </thead>
          <tbody>
            {STATUS_LIST.map((status) => (
              <tr key={status}>
                <td className="border border-slate-700 px-2 py-1 font-medium">{status}</td>
                {REGIONS.map((region) => {
                  const v9 = cellValue(filtered, product, ownership, region, "09:00", status);
                  const v12 = cellValue(filtered, product, ownership, region, "12:00", status);
                  return (
                    <>
                      <td key={region + "-9"} className="border border-slate-700 px-2 py-1 text-center">{v9 ?? "-"}</td>
                      <td key={region + "-12"} className="border border-slate-700 px-2 py-1 text-center">
                        {v12 ?? "-"}
                        {diffBadge(v9, v12)}
                      </td>
                    </>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function TindakLanjutList({ rows, product }: { rows: StatusRow[]; product: string }) {
  const items: string[] = [];
  for (const ownership of ["COCO", "KSO"] as const) {
    for (const status of ["DEADSTOCK", "CRITICAL"] as const) {
      const total9 = rows
        .filter((r) => r.product === product && r.ownership === ownership && r.status === status && r.jam === "09:00")
        .reduce((a, b) => a + b.jumlah_unit, 0);
      const total12 = rows
        .filter((r) => r.product === product && r.ownership === ownership && r.status === status && r.jam === "12:00")
        .reduce((a, b) => a + b.jumlah_unit, 0);
      if (total9 === 0 && total12 === 0) continue;
      const trend = total12 > total9 ? "Kenaikan" : total12 < total9 ? "Penurunan" : "Tidak berubah";
      const color = total12 > total9 ? "text-red-400" : total12 < total9 ? "text-green-400" : "text-slate-400";
      items.push(
        `Produk ${product} di SPBU ${ownership} yang mengalami ${status === "DEADSTOCK" ? "Dead Stock" : "Critical Stock"} sebanyak ${total12} Unit SPBU mengalami <b class="${color}">${trend}</b> dari sebelumnya sebanyak ${total9} Unit SPBU`
      );
    }
  }
  if (items.length === 0) return null;
  return (
    <div className="mb-4 text-xs border border-slate-800 rounded p-3 bg-slate-900/60">
      <div className="font-semibold mb-2">Tindaklanjut Kendala Pemesanan {product}</div>
      <ol className="list-decimal list-inside space-y-1">
        {items.map((it, i) => (
          <li key={i} dangerouslySetInnerHTML={{ __html: it }} />
        ))}
      </ol>
    </div>
  );
}
