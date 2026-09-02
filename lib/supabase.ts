import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

export function getSupabaseClient() {
  return createClient(url, anonKey);
}

export function getSupabaseServerClient() {
  return createClient(url, anonKey);
}
