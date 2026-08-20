import * as XLSX from "xlsx";

// 실제 샘플 파일(20260819_편성현황.xls, 구버전 .xls 바이너리 포맷) 기준 컬럼 구성.
// xlsx(SheetJS) 패키지는 .xls/.xlsx 모두 읽을 수 있어 채택했다 (exceljs는 .xls를 못 읽음 — 실제 파일로 확인).
export type ExcelRow = {
  broadcastDate: string; // YYYY-MM-DD
  channel: string;
  rateClass: string | null;
  slotTime: string; // HH:MM (30분 슬롯)
  cmName: string;
  cmSeconds: number | null;
  contractId: string;
  advertiserName: string;
  campaignStartDate: string | null;
  campaignEndDate: string | null;
  broadcastType: string | null;
};

const HEADER_MAP: Record<string, keyof ExcelRow> = {
  "편성일자": "broadcastDate",
  "채널명": "channel",
  "시급명": "rateClass",
  "편성 시간대": "slotTime",
  "CM소재명": "cmName",
  "CM 초수": "cmSeconds",
  "약정서ID": "contractId",
  "광고주명": "advertiserName",
  "방송시작일자": "campaignStartDate",
  "방송종료일자": "campaignEndDate",
  "방송구분": "broadcastType",
};

function normalizeDate(value: unknown): string | null {
  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }
  if (typeof value === "string" && value.trim()) {
    const m = value.trim().match(/^(\d{4})[.\-/](\d{1,2})[.\-/](\d{1,2})/);
    if (m) {
      return `${m[1]}-${m[2].padStart(2, "0")}-${m[3].padStart(2, "0")}`;
    }
  }
  return null;
}

function normalizeTime(value: unknown): string | null {
  if (value instanceof Date) {
    return value.toISOString().slice(11, 16);
  }
  if (typeof value === "number") {
    // 엑셀이 시간을 하루 대비 소수(0~1)로 저장한 경우 대비
    const totalMinutes = Math.round(value * 24 * 60);
    const hh = Math.floor(totalMinutes / 60) % 24;
    const mm = totalMinutes % 60;
    return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
  }
  if (typeof value === "string") {
    const m = value.trim().match(/^(\d{1,2}):(\d{2})/);
    if (m) return `${m[1].padStart(2, "0")}:${m[2]}`;
  }
  return null;
}

// 관리자가 업로드한 편성현황 엑셀을 파싱한다. 필수값(일자·채널·시간대·약정서ID·광고주명)이
// 없는 행은 건너뛴다 — 매칭 로직에서 다룰 수 없는 불완전한 행이기 때문이다.
export async function parseExcelBuffer(buffer: ArrayBuffer): Promise<ExcelRow[]> {
  const workbook = XLSX.read(Buffer.from(buffer), { type: "buffer", cellDates: true });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) return [];
  const sheet = workbook.Sheets[sheetName];

  const raw = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: null });
  if (raw.length === 0) return [];

  const headerRow = raw[0];
  const colIndexByField = new Map<keyof ExcelRow, number>();
  headerRow.forEach((h, idx) => {
    const header = String(h ?? "").trim();
    const field = HEADER_MAP[header];
    if (field) colIndexByField.set(field, idx);
  });

  const rows: ExcelRow[] = [];
  for (let i = 1; i < raw.length; i++) {
    const row = raw[i];
    const get = (field: keyof ExcelRow) => {
      const idx = colIndexByField.get(field);
      return idx === undefined ? null : row[idx];
    };

    const broadcastDate = normalizeDate(get("broadcastDate"));
    const slotTime = normalizeTime(get("slotTime"));
    const channel = String(get("channel") ?? "").trim();
    const contractId = String(get("contractId") ?? "").trim();
    const advertiserName = String(get("advertiserName") ?? "").trim();
    const cmName = String(get("cmName") ?? "").trim();

    if (!broadcastDate || !slotTime || !channel || !contractId || !advertiserName) {
      continue;
    }

    const cmSecondsRaw = get("cmSeconds");
    const rateClassRaw = get("rateClass");
    const broadcastTypeRaw = get("broadcastType");

    rows.push({
      broadcastDate,
      channel,
      rateClass: rateClassRaw ? String(rateClassRaw).trim() : null,
      slotTime,
      cmName,
      cmSeconds:
        typeof cmSecondsRaw === "number" ? cmSecondsRaw : Number(cmSecondsRaw) || null,
      contractId,
      advertiserName,
      campaignStartDate: normalizeDate(get("campaignStartDate")),
      campaignEndDate: normalizeDate(get("campaignEndDate")),
      broadcastType: broadcastTypeRaw ? String(broadcastTypeRaw).trim() : null,
    });
  }

  return rows;
}
