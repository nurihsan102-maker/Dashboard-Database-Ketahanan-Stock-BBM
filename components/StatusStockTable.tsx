"use client";

import { StatusRow } from "@/lib/types";
import { REGIONS, STATUS_LIST } from "@/lib/constants";

function cellValue(rows: StatusRow[], product: string, ownership: string, region: string, jam: string, status: string) {
  const r = rows.find(
    (x) => x.product === product && x.ownership === ownership && x.region === region && x.jam === jam && x.status === status
  );
  return r ? r.jumlah_unit : null;
}

function diffBadge(vPrev: number | null, vNext: number | null) {
  if (vPrev === null || vNext === null) return null;
  const diff = vNext - vPrev;
  if (diff > 0) return <span className="text-red-400"> (+)</span>;
  if (diff < 0) return <span className="text-green-400"> (-)</span>;
  return null;
}

export default function StatusStockTable({ rows, product, ownership }: { rows: StatusRow[]; product: string; ownership: "COCO" | "KSO" | "TAC" }) {
  const filtered = rows.filter((r) => r.product === product && r.ownership === ownership);
  if (filtered.length === 0) return null;

  const jamList = Array.from(new Set(filtered.map((r) => r.jam))).sort();

  return (
    <div className="mb-4">
      <div className="text-xs font-semibold mb-1 text-slate-300">Status Stock di SPBU {ownership}</div>
      <div className="overflow-x-auto">
        <table className="text-xs border-collapse w-full">
          <thead>
            <tr className="bg-lime-800/60">
              <th className="border border-slate-700 px-2 py-1">Status</th>
              {REGIONS.map((r) => (
                <th key={r} className="border border-slate-700 px-2 py-1" colSpan={jamList.length}>
                  {r}
                </th>
              ))}
            </tr>
            <tr className="bg-lime-800/40">
              <th className="border border-slate-700 px-2 py-1"></th>
              {REGIONS.map((r) =>
                jamList.map((j) => (
                  <th key={r + "-" + j} className="border border-slate-700 px-2 py-1">{j}</th>
                ))
              )}
            </tr>
          </thead>
          <tbody>
            {STATUS_LIST.map((status) => (
              <tr key={status}>
                <td className="border border-slate-700 px-2 py-1 font-medium">{status}</td>
                {REGIONS.map((region) =>
                  jamList.map((jam, idx) => {
                    const v = cellValue(filtered, product, ownership, region, jam, status);
                    const vPrev = idx > 0 ? cellValue(filtered, product, ownership, region, jamList[idx - 1], status) : null;
                    return (
                      <td key={region + "-" + jam} className="border border-slate-700 px-2 py-1 text-center">
                        {v ?? "-"}
                        {idx > 0 && diffBadge(vPrev, v)}
                      </td>
                    );
                  })
                )}
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
  for (const ownership of ["COCO", "KSO", "TAC"] as const) {
    const jamList = Array.from(
      new Set(rows.filter((r) => r.product === product && r.ownership === ownership).map((r) => r.jam))
    ).sort();
    if (jamList.length < 2) continue;
    const jamFirst = jamList[0];
    const jamLast = jamList[jamList.length - 1];
    for (const status of ["DEADSTOCK", "CRITICAL"] as const) {
      const totalFirst = rows
        .filter((r) => r.product === product && r.ownership === ownership && r.status === status && r.jam === jamFirst)
        .reduce((a, b) => a + b.jumlah_unit, 0);
      const totalLast = rows
        .filter((r) => r.product === product && r.ownership === ownership && r.status === status && r.jam === jamLast)
        .reduce((a, b) => a + b.jumlah_unit, 0);
      if (totalFirst === 0 && totalLast === 0) continue;
      const trend = totalLast > totalFirst ? "Kenaikan" : totalLast < totalFirst ? "Penurunan" : "Tidak berubah";
      const color = totalLast > totalFirst ? "text-red-400" : totalLast < totalFirst ? "text-green-400" : "text-slate-400";
      items.push(
        `Produk ${product} di SPBU ${ownership} yang mengalami ${status === "DEADSTOCK" ? "Dead Stock" : "Critical Stock"} sebanyak ${totalLast} Unit SPBU mengalami <b class="${color}">${trend}</b> dari sebelumnya (${jamFirst}) sebanyak ${totalFirst} Unit SPBU`
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
