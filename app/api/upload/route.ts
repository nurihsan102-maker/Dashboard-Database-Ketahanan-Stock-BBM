import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase";
import { parseWorkbookBuffer } from "@/lib/parseExcel";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const reportDate = formData.get("report_date") as string | null;
    const reportTime = formData.get("report_time") as string | null;
    const dataCategory = formData.get("data_category") as string | null;
    const ownershipScope = formData.get("ownership_scope") as string | null;
    const notes = formData.get("notes") as string | null;

    if (!file || !reportDate || !reportTime || !dataCategory) {
      return NextResponse.json(
        { error: "File, tanggal, jam, dan kategori data wajib diisi" },
        { status: 400 }
      );
    }

    const buffer = await file.arrayBuffer();
    const parsed = parseWorkbookBuffer(buffer, ownershipScope || undefined);

    const supabase = getSupabaseServerClient();

    const { data: uploadRow, error: uploadErr } = await supabase
      .from("uploads")
      .insert({
        report_date: reportDate,
        report_time: reportTime,
        data_category: dataCategory,
        ownership_scope: ownershipScope || null,
        original_filename: file.name,
        notes: notes || null,
      })
      .select()
      .single();

    if (uploadErr) throw uploadErr;
    const uploadId = uploadRow.id;

    if (parsed.ketahanan.length > 0) {
      const rows = parsed.ketahanan.map((k) => ({ ...k, upload_id: uploadId }));
      const { error } = await supabase.from("ketahanan_stock").insert(rows);
      if (error) throw error;
    }
    if (parsed.status.length > 0) {
      const rows = parsed.status.map((s) => ({ ...s, upload_id: uploadId }));
      const { error } = await supabase.from("status_stock").insert(rows);
      if (error) throw error;
    }
    if (parsed.coverage.length > 0) {
      const rows = parsed.coverage.map((c) => ({ ...c, upload_id: uploadId }));
      const { error } = await supabase.from("coverage_region").insert(rows);
      if (error) throw error;
    }
    if (parsed.tac.length > 0) {
      const rows = parsed.tac.map((t) => ({ ...t, upload_id: uploadId }));
      const { error } = await supabase.from("tac_checklist").insert(rows);
      if (error) throw error;
    }

    return NextResponse.json({
      upload: uploadRow,
      counts: {
        ketahanan: parsed.ketahanan.length,
        status: parsed.status.length,
        coverage: parsed.coverage.length,
        tac: parsed.tac.length,
      },
      warnings: parsed.warnings,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Gagal memproses file" }, { status: 500 });
  }
}
