import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase";
import { parseWorkbookBuffer } from "@/lib/parseExcel";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const reportDate = formData.get("report_date") as string | null;
    const uploadType = formData.get("upload_type") as string | null;

    if (!file || !reportDate || !uploadType) {
      return NextResponse.json({ error: "File, tanggal laporan, dan tipe wajib diisi" }, { status: 400 });
    }
    if (!["1200", "1800"].includes(uploadType)) {
      return NextResponse.json({ error: "Tipe upload harus 1200 atau 1800" }, { status: 400 });
    }

    const buffer = await file.arrayBuffer();
    const parsed = parseWorkbookBuffer(buffer);

    const supabase = getSupabaseServerClient();

    const { data: uploadRow, error: uploadErr } = await supabase
      .from("uploads")
      .insert({
        report_date: reportDate,
        upload_type: uploadType,
        original_filename: file.name,
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

    return NextResponse.json({
      upload: uploadRow,
      counts: {
        ketahanan: parsed.ketahanan.length,
        status: parsed.status.length,
        coverage: parsed.coverage.length,
      },
      warnings: parsed.warnings,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Gagal memproses file" }, { status: 500 });
  }
}
