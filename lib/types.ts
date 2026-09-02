export type UploadRow = {
  id: string;
  report_date: string;
  upload_type: "1200" | "1800";
  original_filename: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type KetahananRow = {
  id: string;
  upload_id: string;
  product: string;
  ownership: "COCO" | "KSO";
  ketahanan_hari: number | null;
  sales_per_day_kl: number | null;
};

export type StatusRow = {
  id: string;
  upload_id: string;
  product: string;
  ownership: "COCO" | "KSO";
  region: string;
  jam: "09:00" | "12:00";
  status: "DEADSTOCK" | "CRITICAL" | "NORMAL";
  jumlah_unit: number;
};

export type CoverageRow = {
  id: string;
  upload_id: string;
  product: string;
  region: string;
  ownership: "COCO" | "KSO";
  coverage_day: number | null;
};

export type DashboardData = {
  upload: UploadRow;
  ketahanan: KetahananRow[];
  status: StatusRow[];
  coverage: CoverageRow[];
};
