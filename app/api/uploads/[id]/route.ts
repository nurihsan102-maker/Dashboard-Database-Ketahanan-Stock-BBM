import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const supabase = getSupabaseServerClient();

  const updatable: Record<string, any> = {};
  if (body.report_date) updatable.report_date = body.report_date;
  if (body.upload_type) updatable.upload_type = body.upload_type;
  if (body.notes !== undefined) updatable.notes = body.notes;
  updatable.updated_at = new Date().toISOString();

  const { data, error } = await supabase.from("uploads").update(updatable).eq("id", id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ upload: data });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = getSupabaseServerClient();
  const { error } = await supabase.from("uploads").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
