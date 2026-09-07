import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_SUPABASE_URL:
      process.env.NEXT_PUBLIC_SUPABASE_URL || "https://vrayvovpmpmucupaizsh.supabase.co",
    NEXT_PUBLIC_SUPABASE_ANON_KEY:
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZyYXl2b3ZwbXBtdWN1cGFpenNoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgzNzUzNTQsImV4cCI6MjEwMzk1MTM1NH0.JIAaE71LunryS5f5PVk2J3b8uS_pKPfrl82aOcNLoXo",
  },
};

export default nextConfig;
