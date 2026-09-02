"use client";

import { useRef, useState } from "react";
import { UploadRow } from "@/lib/types";
import { UPLOAD_TYPE_LABEL } from "@/lib/constants";
import { Upload, Trash2, Pencil, Check, X, FileSpreadsheet } from "lucide-react";

export default function Sidebar({
  uploads,
  loading,
  onRefresh,
  selectedIds,
  onToggleSelect,
}: {
  uploads: UploadRow[];
  loading: boolean;
  onRefresh: () => void;
  selectedIds: string[];
  onToggleSelect: (id: string) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [reportDate, setReportDate] = useState("");
  const [uploadType, setUploadType] = useState<"1200" | "1800">("1200");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDate, setEditDate] = useState("");
  const [editType, setEditType] = useState<"1200" | "1800">("1200");

  async function handleUpload() {
    const file = fileRef.current?.files?.[0];
    if (!file) {
      setMessage("Pilih file excel dulu");
      return;
    }
    if (!reportDate) {
      setMessage("Isi tanggal laporan dulu");
      return;
    }
    setBusy(true);
    setMessage(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("report_date", reportDate);
      fd.append("upload_type", uploadType);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal upload");
      const counts = json.counts;
      setMessage(
        `Berhasil. Ketahanan ${counts.ketahanan} baris, Status ${counts.status} baris, Coverage ${counts.coverage} baris.` +
          (json.warnings?.length ? ` Catatan: ${json.warnings.join(" | ")}` : "")
      );
      if (fileRef.current) fileRef.current.value = "";
      onRefresh();
    } catch (err: any) {
      setMessage(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Hapus data ini? Semua data terkait akan ikut terhapus.")) return;
    const res = await fetch(`/api/uploads/${id}`, { method: "DELETE" });
    if (res.ok) onRefresh();
  }

  function startEdit(u: UploadRow) {
    setEditingId(u.id);
    setEditDate(u.report_date);
    setEditType(u.upload_type);
  }

  async function saveEdit(id: string) {
    const res = await fetch(`/api/uploads/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ report_date: editDate, upload_type: editType }),
    });
    if (res.ok) {
      setEditingId(null);
      onRefresh();
    }
  }

  return (
    <aside className="w-80 shrink-0 border-r border-slate-800 h-screen overflow-y-auto p-4 flex flex-col gap-4 bg-slate-900/40">
      <div>
        <h1 className="text-lg font-semibold">Dashboard Ketahanan Pasokan BBM</h1>
        <p className="text-xs text-slate-400 mt-1">Upload file laporan, sistem otomatis membaca dan menyimpan datanya ke database. File asli tidak disimpan.</p>
      </div>

      <div className="rounded-lg border border-slate-800 p-3 flex flex-col gap-2">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Upload size={16} /> Upload Laporan Baru
        </div>
        <label className="text-xs text-slate-400">Tanggal Laporan</label>
        <input
          type="date"
          value={reportDate}
          onChange={(e) => setReportDate(e.target.value)}
          className="bg-slate-800 rounded px-2 py-1 text-sm outline-none"
        />
        <label className="text-xs text-slate-400">Tipe Laporan</label>
        <select
          value={uploadType}
          onChange={(e) => setUploadType(e.target.value as "1200" | "1800")}
          className="bg-slate-800 rounded px-2 py-1 text-sm outline-none"
        >
          <option value="1200">Pukul 12:00 WIB</option>
          <option value="1800">Pukul 18:00 WIB</option>
        </select>
        <label className="text-xs text-slate-400">File Excel</label>
        <input ref={fileRef} type="file" accept=".xlsx,.xls" className="text-xs" />
        <button
          onClick={handleUpload}
          disabled={busy}
          className="mt-1 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 rounded px-3 py-2 text-sm font-medium flex items-center justify-center gap-2"
        >
          <FileSpreadsheet size={16} /> {busy ? "Memproses..." : "Upload dan Proses"}
        </button>
        {message && <p className="text-xs text-slate-300 mt-1">{message}</p>}
      </div>

      <div className="flex-1">
        <div className="text-sm font-medium mb-2">Riwayat Data ({uploads.length})</div>
        {loading && <p className="text-xs text-slate-400">Memuat...</p>}
        <div className="flex flex-col gap-2">
          {uploads.map((u) => (
            <div
              key={u.id}
              className={`rounded border px-2 py-2 text-xs cursor-pointer ${
                selectedIds.includes(u.id) ? "border-teal-500 bg-teal-500/10" : "border-slate-800 bg-slate-900"
              }`}
              onClick={() => onToggleSelect(u.id)}
            >
              {editingId === u.id ? (
                <div className="flex flex-col gap-1" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="date"
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                    className="bg-slate-800 rounded px-1 py-1"
                  />
                  <select
                    value={editType}
                    onChange={(e) => setEditType(e.target.value as "1200" | "1800")}
                    className="bg-slate-800 rounded px-1 py-1"
                  >
                    <option value="1200">1200</option>
                    <option value="1800">1800</option>
                  </select>
                  <div className="flex gap-2 mt-1">
                    <button onClick={() => saveEdit(u.id)} className="flex items-center gap-1 text-teal-400">
                      <Check size={14} /> Simpan
                    </button>
                    <button onClick={() => setEditingId(null)} className="flex items-center gap-1 text-slate-400">
                      <X size={14} /> Batal
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-medium">{u.report_date}</div>
                    <div className="text-slate-400">{UPLOAD_TYPE_LABEL[u.upload_type]}</div>
                    <div className="text-slate-500 truncate max-w-[160px]">{u.original_filename}</div>
                  </div>
                  <div className="flex flex-col gap-1 shrink-0">
                    <button onClick={(e) => { e.stopPropagation(); startEdit(u); }} className="text-slate-400 hover:text-teal-400">
                      <Pencil size={14} />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); handleDelete(u.id); }} className="text-slate-400 hover:text-red-400">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
          {!loading && uploads.length === 0 && (
            <p className="text-xs text-slate-500">Belum ada data. Upload file pertama kamu di atas.</p>
          )}
        </div>
      </div>
      <p className="text-[10px] text-slate-500">Klik satu data untuk lihat Terpisah. Klik dua data pada tanggal sama tipe beda untuk bandingkan 1200 vs 1800.</p>
    </aside>
  );
}
