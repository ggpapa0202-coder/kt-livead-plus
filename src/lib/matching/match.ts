import { createAdminClient } from "@/lib/supabase/admin";
import type { ExcelRow } from "./parse-excel";

// "02:13:14" -> "02:00" / "02:30" — 30분 슬롯 키로 변환 (DESIGN.md 2-3)
function slotKeyFromPreciseTime(preciseTime: string): string {
  const [hh, mm] = preciseTime.split(":").map(Number);
  const slotMinute = mm < 30 ? 0 : 30;
  return `${String(hh).padStart(2, "0")}:${String(slotMinute).padStart(2, "0")}`;
}

type CueAdRecord = {
  contract_id: string;
  broadcast_date: string;
  slot_time: string;
  channel: string;
  rate_class: string | null;
  cm_name: string;
  cm_seconds: number | null;
  advertiser_id: string | null;
  advertiser_name_raw: string;
  campaign_start_date: string | null;
  campaign_end_date: string | null;
  broadcast_type: string | null;
  precise_notify_time: string | null;
  match_status: "matched" | "no_advertiser_email";
};

export type MatchSummary = {
  matched: number;
  noAdvertiserEmail: number;
  skippedApproved: number;
  unmatchedExcel: number;
  unmatchedCrawled: number;
};

// 엑셀 행 ↔ 크롤링 이벤트를 (채널, 편성일자, 30분 슬롯) 단위로 매칭한다.
// - 슬롯 안에 크롤링 이벤트가 1건 이상이면 매칭으로 간주하고, 그 슬롯의 정밀 시각을
//   전부(콤마로 구분) 안내한다 — 슬롯에 광고가 여러 건이라 어떤 게 어떤 시각인지
//   정확히 특정할 수 없어도, 아는 시각 정보는 그대로 보여주는 게 낫다는 판단
// - 광고주명이 advertisers 마스터에 없으면 no_advertiser_email
// - 이미 승인완료된 건은 재업로드해도 덮어쓰지 않는다 (중복 발송 방지)
export async function runMatching(rows: ExcelRow[]): Promise<MatchSummary> {
  if (rows.length === 0) {
    return {
      matched: 0,
      noAdvertiserEmail: 0,
      skippedApproved: 0,
      unmatchedExcel: 0,
      unmatchedCrawled: 0,
    };
  }

  const admin = createAdminClient();

  const channels = [...new Set(rows.map((r) => r.channel))];
  const dates = [...new Set(rows.map((r) => r.broadcastDate))];

  const { data: crawledRows, error: crawledErr } = await admin
    .from("crawled_schedules")
    .select("channel, broadcast_date, precise_time")
    .in("channel", channels)
    .in("broadcast_date", dates);
  if (crawledErr) throw new Error(crawledErr.message);

  const { data: advertisers, error: advErr } = await admin
    .from("advertisers")
    .select("id, name");
  if (advErr) throw new Error(advErr.message);
  const advertiserIdByName = new Map(
    (advertisers ?? []).map((a) => [a.name.trim(), a.id as string]),
  );

  const crawledBySlot = new Map<string, string[]>();
  for (const c of crawledRows ?? []) {
    const slot = slotKeyFromPreciseTime(c.precise_time);
    const key = `${c.channel}|${c.broadcast_date}|${slot}`;
    const list = crawledBySlot.get(key) ?? [];
    list.push(c.precise_time);
    crawledBySlot.set(key, list);
  }

  const excelBySlot = new Map<string, ExcelRow[]>();
  for (const r of rows) {
    const key = `${r.channel}|${r.broadcastDate}|${r.slotTime}`;
    const list = excelBySlot.get(key) ?? [];
    list.push(r);
    excelBySlot.set(key, list);
  }

  const cueAdRecords: CueAdRecord[] = [];
  const unmatchedExcelRecords: Record<string, unknown>[] = [];
  const usedCrawledKeys = new Set<string>();

  for (const [key, excelGroup] of excelBySlot) {
    const crawledTimes = crawledBySlot.get(key);
    usedCrawledKeys.add(key);

    if (!crawledTimes || crawledTimes.length === 0) {
      for (const r of excelGroup) {
        unmatchedExcelRecords.push({
          source: "excel",
          channel: r.channel,
          broadcast_date: r.broadcastDate,
          time_value: r.slotTime,
          raw_data: r,
        });
      }
      continue;
    }

    const notifyTime = [...crawledTimes].sort().join(", ");

    for (const r of excelGroup) {
      const advertiserId = advertiserIdByName.get(r.advertiserName.trim()) ?? null;

      cueAdRecords.push({
        contract_id: r.contractId,
        broadcast_date: r.broadcastDate,
        slot_time: r.slotTime,
        channel: r.channel,
        rate_class: r.rateClass,
        cm_name: r.cmName,
        cm_seconds: r.cmSeconds,
        advertiser_id: advertiserId,
        advertiser_name_raw: r.advertiserName,
        campaign_start_date: r.campaignStartDate,
        campaign_end_date: r.campaignEndDate,
        broadcast_type: r.broadcastType,
        precise_notify_time: notifyTime,
        match_status: advertiserId ? "matched" : "no_advertiser_email",
      });
    }
  }

  const unmatchedCrawledRecords: Record<string, unknown>[] = [];
  for (const [key, times] of crawledBySlot) {
    if (usedCrawledKeys.has(key)) continue;
    const [channel, broadcastDate, slot] = key.split("|");
    for (const t of times) {
      unmatchedCrawledRecords.push({
        source: "crawled",
        channel,
        broadcast_date: broadcastDate,
        time_value: t,
        raw_data: { slot },
      });
    }
  }

  // 원본 엑셀에 완전히 동일한 행이 중복으로 들어있는 경우가 실제로 있어(같은 계약·채널·
  // 일자·슬롯·소재가 그대로 반복), 같은 배치 안에서도 키 기준으로 한 번만 남긴다.
  const cueAdKey = (r: CueAdRecord) =>
    `${r.contract_id}|${r.channel}|${r.broadcast_date}|${r.slot_time}`;
  const dedupedCueAdRecords = [...new Map(cueAdRecords.map((r) => [cueAdKey(r), r])).values()];

  const { data: existingApproved } = await admin
    .from("cue_ads")
    .select("contract_id, channel, broadcast_date, slot_time")
    .eq("approval_status", "approved")
    .in(
      "contract_id",
      dedupedCueAdRecords.map((r) => r.contract_id),
    );
  const approvedKeys = new Set(
    (existingApproved ?? []).map(
      (r) => `${r.contract_id}|${r.channel}|${r.broadcast_date}|${r.slot_time}`,
    ),
  );
  const toUpsert = dedupedCueAdRecords.filter((r) => !approvedKeys.has(cueAdKey(r)));

  if (toUpsert.length > 0) {
    const { error } = await admin
      .from("cue_ads")
      .upsert(toUpsert, { onConflict: "contract_id,channel,broadcast_date,slot_time" });
    if (error) throw new Error(error.message);
  }

  if (unmatchedExcelRecords.length + unmatchedCrawledRecords.length > 0) {
    const { error } = await admin
      .from("unmatched_items")
      .insert([...unmatchedExcelRecords, ...unmatchedCrawledRecords]);
    if (error) throw new Error(error.message);
  }

  return {
    matched: toUpsert.filter((r) => r.match_status === "matched").length,
    noAdvertiserEmail: toUpsert.filter((r) => r.match_status === "no_advertiser_email")
      .length,
    skippedApproved: dedupedCueAdRecords.length - toUpsert.length,
    unmatchedExcel: unmatchedExcelRecords.length,
    unmatchedCrawled: unmatchedCrawledRecords.length,
  };
}
