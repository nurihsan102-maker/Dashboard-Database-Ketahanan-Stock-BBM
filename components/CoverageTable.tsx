"use client";

import { CoverageRow } from "@/lib/types";
import { REGIONS, PRODUCTS } from "@/lib/constants";

function fmt(n: number | null) {
  if (n === null || n === undefined) return "-";
  return n.toLocaleString("id-ID", { maximumFractionDigits: 1 });
}

export default function CoverageTable({ rows, products }: { rows: CoverageRow[]; products?: string[] }) {
  const list = products && products.length > 0 ? products : [...PRODUCTS];
  if (rows.length === 0) return <p className="text-xs text-slate-500">Data coverage per region tidak tersedia untuk data ini.</p>;

  return (
    <div className="overflow-x-auto">
      <table className="text-xs border-collapse w-full">
        <thead>
          <tr className="bg-blue-900/60">
            <th className="border border-slate-700 px-2 py-1">Produk</th>
            {REGIONS.map((r) => (
              <th key={r} className="border border-slate-700 px-2 py-1" colSpan={2}>{r}</th>
            ))}
          </tr>
          <tr className="bg-blue-900/40">
            <th className="border border-slate-700 px-2 py-1"></th>
            {REGIONS.map((r) => (
              <>
                <th key={r + "c"} className="border border-slate-700 px-2 py-1">COCO</th>
                <th key={r + "k"} className="border border-slate-700 px-2 py-1">KSO</th>
              </>
            ))}
          </tr>
        </thead>
        <tbody>
          {list.map((product) => (
            <tr key={product}>
              <td className="border border-slate-700 px-2 py-1 font-medium whitespace-nowrap">{product}</td>
              {REGIONS.map((region) => {
                const coco = rows.find((r) => r.product === product && r.region === region && r.ownership === "COCO");
                const kso = rows.find((r) => r.product === product && r.region === region && r.ownership === "KSO");
                return (
                  <>
                    <td key={region + "c"} className="border border-slate-700 px-2 py-1 text-center">{fmt(coco?.coverage_day ?? null)}</td>
                    <td key={region + "k"} className="border border-slate-700 px-2 py-1 text-center">{fmt(kso?.coverage_day ?? null)}</td>
                  </>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
