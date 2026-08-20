import * as XLSX from "xlsx";
import { createAdminClient } from "@/lib/supabase/admin";

// 매칭 결과를 엑셀로 다운로드한다 (PRD §5-1, DESIGN.md 1-4).
// 대시보드에서 보고 있는 화면과 동일한 결과만 내려받도록, 대시보드 조회와 같은 필터(편성일자·광고주명 검색어·건수 상한)를 그대로 적용한다.
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const date = params.get("date");
  const q = params.get("q")?.trim();
  const admin = createAdminClient();
  let query = admin
    .from("cue_ads")
    .select(
      "advertiser_name_raw, channel, broadcast_date, slot_time, precise_notify_time, cm_name, contract_id, match_status, approval_status, send_status",
    )
    .order("advertiser_name_raw", { ascending: true })
    .order("channel", { ascending: true })
    .order("cm_name", { ascending: true })
    .limit(500);

  if (date) {
    query = query.eq("broadcast_date", date);
  }
  if (q) {
    query = query.ilike("advertiser_name_raw", `%${q}%`);
  }

  const { data, error } = await query;

  if (error) {
    return new Response(JSON.stringify({ error: { code: "db_error", message: error.message } }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const rows = (data ?? []).map((r) => ({
    광고주명: r.advertiser_name_raw,
    채널명: r.channel,
    편성일자: r.broadcast_date,
    편성시간대: r.slot_time,
    송출예정시각: r.precise_notify_time ?? "",
    CM소재명: r.cm_name,
    약정서ID: r.contract_id,
    매칭상태: r.match_status,
    승인상태: r.approval_status,
    발송상태: r.send_status,
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "매칭결과");
  const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

  return new Response(buffer, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="cue_ads_export.xlsx"`,
    },
  });
}
