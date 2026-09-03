"use client";

import { DashboardData } from "@/lib/types";
import { PRODUCTS } from "@/lib/constants";

function fmt(n: number | null) {
  if (n === null || n === undefined) return "-";
  return n.toLocaleString("id-ID", { maximumFractionDigits: 1 });
}

function trendBadge(a: number | null, b: number | null) {
  if (a === null || b === null) return null;
  const diff = b - a;
  if (diff > 0) return <span className="text-red-400">▲ {fmt(Math.abs(diff))}</span>;
  if (diff < 0) return <span className="text-green-400">▼ {fmt(Math.abs(diff))}</span>;
  return <span className="text-slate-500">tetap</span>;
}

function label(d: DashboardData) {
  return `${d.upload.report_date} ${d.upload.report_time?.slice(0, 5)}`;
}

export default function ComparePanel({ a, b }: { a: DashboardData; b: DashboardData }) {
  const aTime = new Date(`${a.upload.report_date}T${a.upload.report_time}`).getTime();
  const bTime = new Date(`${b.upload.report_date}T${b.upload.report_time}`).getTime();
  const [first, second] = aTime <= bTime ? [a, b] : [b, a];

  return (
    <div>
      <div className="text-sm font-medium mb-2 bg-purple-800/30 border border-purple-700 rounded px-3 py-2">
        Perbandingan Gap {label(first)} vs {label(second)}
      </div>
      <div className="overflow-x-auto">
        <table className="text-xs border-collapse w-full">
          <thead>
            <tr className="bg-purple-900/50">
              <th className="border border-slate-700 px-2 py-1">Produk</th>
              <th className="border border-slate-700 px-2 py-1">Ownership</th>
              <th className="border border-slate-700 px-2 py-1">Ketahanan {label(first)}</th>
              <th className="border border-slate-700 px-2 py-1">Ketahanan {label(second)}</th>
              <th className="border border-slate-700 px-2 py-1">Gap</th>
            </tr>
          </thead>
          <tbody>
            {PRODUCTS.map((product) =>
              (["COCO", "KSO", "TAC"] as const).map((ownership) => {
                const r1 = first.ketahanan.find((r) => r.product === product && r.ownership === ownership);
                const r2 = second.ketahanan.find((r) => r.product === product && r.ownership === ownership);
                if (!r1 && !r2) return null;
                return (
                  <tr key={product + ownership}>
                    <td className="border border-slate-700 px-2 py-1">{product}</td>
                    <td className="border border-slate-700 px-2 py-1 text-center">{ownership}</td>
                    <td className="border border-slate-700 px-2 py-1 text-center">{fmt(r1?.ketahanan_hari ?? null)} Hari</td>
                    <td className="border border-slate-700 px-2 py-1 text-center">{fmt(r2?.ketahanan_hari ?? null)} Hari</td>
                    <td className="border border-slate-700 px-2 py-1 text-center">
                      {trendBadge(r1?.ketahanan_hari ?? null, r2?.ketahanan_hari ?? null)}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
