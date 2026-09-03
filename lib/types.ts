export type UploadRow = {
  id: string;
  report_date: string;
  report_time: string;
  data_category: string;
  ownership_scope: string | null;
  original_filename: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type KetahananRow = {
  id: string;
  upload_id: string;
  product: string;
  ownership: "COCO" | "KSO" | "TAC";
  ketahanan_hari: number | null;
  sales_per_day_kl: number | null;
};

export type StatusRow = {
  id: string;
  upload_id: string;
  product: string;
  ownership: "COCO" | "KSO" | "TAC";
  region: string;
  jam: string;
  status: "DEADSTOCK" | "CRITICAL" | "NORMAL";
  jumlah_unit: number;
};

export type CoverageRow = {
  id: string;
  upload_id: string;
  product: string;
  region: string;
  ownership: "COCO" | "KSO" | "TAC";
  coverage_day: number | null;
};

export type TacChecklistRow = {
  id: string;
  upload_id: string;
  spbu_id: string | null;
  spbu_name: string | null;
  region: string | null;
  item_no: number;
  item_label: string | null;
  status: boolean | null;
};

export type DashboardData = {
  upload: UploadRow;
  ketahanan: KetahananRow[];
  status: StatusRow[];
  coverage: CoverageRow[];
  tac: TacChecklistRow[];
};
