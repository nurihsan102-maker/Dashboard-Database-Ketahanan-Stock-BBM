import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = getSupabaseServerClient();

  const [
    { data: upload, error: e0 },
    { data: ketahanan, error: e1 },
    { data: status, error: e2 },
    { data: coverage, error: e3 },
    { data: tac, error: e4 },
  ] = await Promise.all([
    supabase.from("uploads").select("*").eq("id", id).single(),
    supabase.from("ketahanan_stock").select("*").eq("upload_id", id),
    supabase.from("status_stock").select("*").eq("upload_id", id),
    supabase.from("coverage_region").select("*").eq("upload_id", id),
    supabase.from("tac_checklist").select("*").eq("upload_id", id),
  ]);

  const error = e0 || e1 || e2 || e3 || e4;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ upload, ketahanan, status, coverage, tac });
}
