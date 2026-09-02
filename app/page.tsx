"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import KetahananCards from "@/components/KetahananCards";
import StatusStockTable, { TindakLanjutList } from "@/components/StatusStockTable";
import CoverageTable from "@/components/CoverageTable";
import ComparePanel from "@/components/ComparePanel";
import { UploadRow, DashboardData } from "@/lib/types";
import { PRODUCTS, REGIONS, OWNERSHIPS } from "@/lib/constants";

export default function Home() {
  const [uploads, setUploads] = useState<UploadRow[]>([]);
  const [loadingUploads, setLoadingUploads] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [dataById, setDataById] = useState<Record<string, DashboardData>>({});
  const [tab, setTab] = useState<"lengkap" | "terpisah">("lengkap");
  const [filterProduct, setFilterProduct] = useState<string>("");
  const [filterOwnership, setFilterOwnership] = useState<string>("");
  const [filterRegion, setFilterRegion] = useState<string>("");

  async function refreshUploads() {
    setLoadingUploads(true);
    const res = await fetch("/api/uploads");
    const json = await res.json();
    setUploads(json.uploads || []);
    setLoadingUploads(false);
  }

  useEffect(() => {
    refreshUploads();
  }, []);

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 2) return [prev[1], id];
      return [...prev, id];
    });
  }

  useEffect(() => {
    async function loadData(id: string) {
      if (dataById[id]) return;
      const res = await fetch(`/api/dashboard/${id}`);
      const json = await res.json();
      setDataById((prev) => ({ ...prev, [id]: json }));
    }
    selectedIds.forEach(loadData);
  }, [selectedIds]);

  const primaryId = selectedIds[0];
  const secondaryId = selectedIds[1];
  const primary = primaryId ? dataById[primaryId] : undefined;
  const secondary = secondaryId ? dataById[secondaryId] : undefined;

  const productList = tab === "terpisah" && filterProduct ? [filterProduct] : undefined;
  const ownershipFilter = tab === "terpisah" && filterOwnership ? [filterOwnership] : OWNERSHIPS;

  return (
    <div className="flex">
      <Sidebar
        uploads={uploads}
        loading={loadingUploads}
        onRefresh={refreshUploads}
        selectedIds={selectedIds}
        onToggleSelect={toggleSelect}
      />
      <main className="flex-1 p-6 overflow-y-auto h-screen">
        <div className="flex items-center gap-2 mb-4">
          <button
            onClick={() => setTab("lengkap")}
            className={`px-3 py-1.5 rounded text-sm ${tab === "lengkap" ? "bg-teal-600" : "bg-slate-800"}`}
          >
            Lengkap
          </button>
          <button
            onClick={() => setTab("terpisah")}
            className={`px-3 py-1.5 rounded text-sm ${tab === "terpisah" ? "bg-teal-600" : "bg-slate-800"}`}
          >
            Terpisah
          </button>
        </div>

        {tab === "terpisah" && (
          <div className="flex flex-wrap gap-2 mb-4 text-xs">
            <select value={filterProduct} onChange={(e) => setFilterProduct(e.target.value)} className="bg-slate-800 rounded px-2 py-1">
              <option value="">Semua Produk</option>
              {PRODUCTS.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
            <select value={filterOwnership} onChange={(e) => setFilterOwnership(e.target.value)} className="bg-slate-800 rounded px-2 py-1">
              <option value="">Semua Ownership</option>
              {OWNERSHIPS.map((o) => (
                <option key={o} value={o}>{o}</option>
              ))}
            </select>
            <select value={filterRegion} onChange={(e) => setFilterRegion(e.target.value)} className="bg-slate-800 rounded px-2 py-1">
              <option value="">Semua Region</option>
              {REGIONS.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
        )}

        {!primary && (
          <p className="text-sm text-slate-400">Pilih salah satu data di panel kiri untuk mulai melihat dashboard. Pilih dua data pada tanggal sama dengan tipe berbeda untuk melihat perbandingan 1200 vs 1800.</p>
        )}

        {primary && !secondary && (
          <div className="flex flex-col gap-6">
            <KetahananCards upload={primary.upload} rows={primary.ketahanan} products={productList} />
            <div>
              <div className="text-sm font-medium mb-2 bg-lime-700/30 border border-lime-700 rounded px-3 py-2">Status Stock per Region</div>
              {(productList || PRODUCTS).map((product) => (
                <div key={product} className="mb-6">
                  <div className="text-sm font-semibold mb-1">{product}</div>
                  {ownershipFilter.includes("COCO") && <StatusStockTable rows={primary.status} product={product} ownership="COCO" />}
                  {ownershipFilter.includes("KSO") && <StatusStockTable rows={primary.status} product={product} ownership="KSO" />}
                  <TindakLanjutList rows={primary.status} product={product} />
                </div>
              ))}
            </div>
            <div>
              <div className="text-sm font-medium mb-2 bg-blue-800/30 border border-blue-700 rounded px-3 py-2">Coverage Day Per Region</div>
              <CoverageTable rows={primary.coverage} products={productList} />
            </div>
          </div>
        )}

        {primary && secondary && (
          <div className="flex flex-col gap-6">
            <ComparePanel a={primary} b={secondary} />
            <div className="grid md:grid-cols-2 gap-4">
              <KetahananCards upload={primary.upload} rows={primary.ketahanan} products={productList} />
              <KetahananCards upload={secondary.upload} rows={secondary.ketahanan} products={productList} />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
