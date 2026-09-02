"use client";

import { KetahananRow, UploadRow } from "@/lib/types";
import { PRODUCTS, UPLOAD_TYPE_LABEL } from "@/lib/constants";

function fmt(n: number | null) {
  if (n === null || n === undefined) return "-";
  return n.toLocaleString("id-ID", { maximumFractionDigits: 1 });
}

export default function KetahananCards({ upload, rows, products }: { upload: UploadRow; rows: KetahananRow[]; products?: string[] }) {
  const list = products && products.length > 0 ? products : [...PRODUCTS];
  return (
    <div>
      <div className="text-sm font-medium mb-2 bg-teal-700/30 border border-teal-700 rounded px-3 py-2">
        Ketahanan Stock Pertamina Retail per {upload.report_date} {UPLOAD_TYPE_LABEL[upload.upload_type]}
      </div>
      <p className="text-xs text-slate-400 mb-2">Konsol adalah volume gabungan dari seluruh jenis BBM.</p>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {list.map((product) => {
          const coco = rows.find((r) => r.product === product && r.ownership === "COCO");
          const kso = rows.find((r) => r.product === product && r.ownership === "KSO");
          return (
            <div key={product} className="rounded border border-slate-800 overflow-hidden">
              <div className="bg-teal-800 text-center text-xs font-semibold py-1">{product}</div>
              <div className="grid grid-cols-2 text-center text-xs divide-x divide-slate-800">
                <div className="p-2">
                  <div className="font-semibold">COCO</div>
                  <div className="text-teal-400 font-bold">{fmt(coco?.ketahanan_hari ?? null)} Hari</div>
                  <div className="text-slate-400">Ketahanan Stock</div>
                  <div className="font-bold mt-1">{fmt(coco?.sales_per_day_kl ?? null)} KL</div>
                  <div className="text-slate-400">Sales Per Day</div>
                </div>
                <div className="p-2">
                  <div className="font-semibold">KSO</div>
                  <div className="text-teal-400 font-bold">{fmt(kso?.ketahanan_hari ?? null)} Hari</div>
                  <div className="text-slate-400">Ketahanan Stock</div>
                  <div className="font-bold mt-1">{fmt(kso?.sales_per_day_kl ?? null)} KL</div>
                  <div className="text-slate-400">Sales Per Day</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
