export const PRODUCTS = [
  "KONSOL",
  "BIO SOLAR",
  "DEXLITE",
  "PERTAMINA DEX",
  "PERTALITE",
  "PERTAMAX",
  "PERTAMAX GREEN",
  "PERTAMAX TURBO",
] as const;

export const REGIONS = [
  "Region I",
  "Region II",
  "Region III",
  "Region IV",
  "Region V",
  "Region VI",
  "Region VII",
] as const;

export const OWNERSHIPS = ["COCO", "KSO"] as const;

export const STATUS_LIST = ["DEADSTOCK", "CRITICAL", "NORMAL"] as const;

export const JAM_LIST = ["09:00", "12:00"] as const;

export const UPLOAD_TYPES = ["1200", "1800"] as const;

export const UPLOAD_TYPE_LABEL: Record<string, string> = {
  "1200": "Pukul 12:00 WIB",
  "1800": "Pukul 18:00 WIB",
};
