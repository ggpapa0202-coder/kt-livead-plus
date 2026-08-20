import { Fragment } from "react";
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { UploadForm } from "./upload-form";
import { ApproveButton } from "./approve-button";
import { SearchBox } from "./search-box";
import { DateSelect } from "./date-select";
import { ChannelChart } from "./channel-chart";
import { AdvertiserChart } from "./advertiser-chart";

const MATCH_STATUS_LABEL: Record<string, string> = {
  matched: "매칭됨",
  no_advertiser_email: "이메일 미확보",
};

type CueAdRow = {
  id: string;
  advertiser_name_raw: string;
  channel: string;
  broadcast_date: string;
  slot_time: string;
  precise_notify_time: string | null;
  cm_name: string;
  cm_seconds: number | null;
  contract_id: string;
  match_status: string;
  approval_status: string;
  send_status: string;
  advertisers: { contact_email?: string } | null;
};

function StatusBadge({
  tone,
  children,
}: {
  tone: "green" | "amber" | "slate" | "red";
  children: React.ReactNode;
}) {
  const toneClass = {
    green: "bg-emerald-500/15 text-emerald-400",
    amber: "bg-amber-500/15 text-amber-400",
    slate: "bg-slate-700 text-slate-300",
    red: "bg-red-500/15 text-red-400",
  }[tone];
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap ${toneClass}`}
    >
      {children}
    </span>
  );
}

function SectionHeading({
  title,
  count,
  bare = false,
}: {
  title: string;
  count?: number;
  bare?: boolean;
}) {
  return (
    <h2
      className={`flex items-center gap-2 text-sm font-semibold text-slate-200 ${
        bare ? "" : "border-b border-slate-800 px-4 py-3"
      }`}
    >
      <span className="h-4 w-1 rounded-full bg-blue-500" />
      {title}
      {typeof count === "number" && (
        <span className="ml-auto rounded-full bg-slate-800 px-2.5 py-0.5 text-xs font-medium text-slate-400">
          {count}건
        </span>
      )}
    </h2>
  );
}

function groupByAdvertiser(rows: CueAdRow[]): [string, CueAdRow[]][] {
  const map = new Map<string, CueAdRow[]>();
  for (const r of rows) {
    const list = map.get(r.advertiser_name_raw) ?? [];
    list.push(r);
    map.set(r.advertiser_name_raw, list);
  }
  return [...map.entries()];
}

function ResultTable({ rows }: { rows: CueAdRow[] }) {
  if (rows.length === 0) {
    return (
      <p className="px-4 py-8 text-center text-sm text-slate-500">해당하는 항목이 없습니다.</p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[880px] text-left text-sm">
        <thead>
          <tr className="bg-slate-800 text-xs font-semibold tracking-wide text-slate-300 uppercase">
            <th className="px-4 py-3">채널명</th>
            <th className="px-4 py-3">편성일자</th>
            <th className="px-4 py-3">송출 예정 시각</th>
            <th className="px-4 py-3">CM소재명</th>
            <th className="px-4 py-3">CM초수</th>
            <th className="px-4 py-3">약정서ID</th>
            <th className="px-4 py-3">상태</th>
            <th className="px-4 py-3">승인</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800">
          {groupByAdvertiser(rows).map(([advertiserName, group]) => (
            <Fragment key={advertiserName}>
              <tr className="bg-slate-800/60">
                <td colSpan={8} className="px-4 py-2">
                  <span className="font-semibold text-white">{advertiserName}</span>
                  <span className="ml-2 text-xs text-slate-400">
                    {group[0].advertisers?.contact_email ?? "담당자 이메일 미확보"} · {group.length}건
                  </span>
                </td>
              </tr>
              {group.map((row) => (
                <tr key={row.id} className="transition hover:bg-slate-800/40">
                  <td className="px-4 py-3 text-slate-300">{row.channel}</td>
                  <td className="px-4 py-3 text-slate-300">{row.broadcast_date}</td>
                  <td className="px-4 py-3 text-slate-300">{row.precise_notify_time}</td>
                  <td className="max-w-[280px] truncate px-4 py-3 text-slate-300">
                    {row.cm_name}
                  </td>
                  <td className="px-4 py-3 text-slate-300">
                    {row.cm_seconds ? `${row.cm_seconds}초` : "-"}
                  </td>
                  <td className="px-4 py-3 text-slate-500">{row.contract_id}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      <StatusBadge tone={row.match_status === "matched" ? "green" : "amber"}>
                        {MATCH_STATUS_LABEL[row.match_status] ?? row.match_status}
                      </StatusBadge>
                      <StatusBadge tone={row.approval_status === "approved" ? "green" : "slate"}>
                        {row.approval_status === "approved" ? "승인완료" : "미승인"}
                      </StatusBadge>
                      {row.send_status !== "not_sent" && (
                        <StatusBadge tone={row.send_status === "sent" ? "green" : "red"}>
                          {row.send_status === "sent" ? "발송완료" : "발송실패"}
                        </StatusBadge>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {row.approval_status === "pending" && <ApproveButton id={row.id} />}
                  </td>
                </tr>
              ))}
            </Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// 대시보드 본문 — 메인 페이지의 두 번째 슬라이드(#dashboard)와 /admin/cue-ads 단독 접근 양쪽에서
// 공유하는 컴포넌트다. 화면 구성 자체는 두 곳에서 동일해야 하므로 여기 하나만 유지한다.
export async function Dashboard({ q, date }: { q?: string; date?: string }) {
  const admin = createAdminClient();

  // 계속 업로드가 쌓이므로, 편성일자별로 골라 볼 수 있게 실제 데이터가 있는 날짜 목록을 먼저 뽑는다.
  const { data: dateRows } = await admin
    .from("cue_ads")
    .select("broadcast_date")
    .order("broadcast_date", { ascending: false })
    .limit(5000);
  const availableDates = [...new Set((dateRows ?? []).map((r) => r.broadcast_date))];
  const selectedDate = date && availableDates.includes(date) ? date : (availableDates[0] ?? null);

  let query = admin
    .from("cue_ads")
    .select(
      "id, advertiser_name_raw, channel, broadcast_date, slot_time, precise_notify_time, cm_name, cm_seconds, contract_id, match_status, approval_status, send_status, advertisers(contact_email)",
    )
    .order("advertiser_name_raw", { ascending: true })
    .order("channel", { ascending: true })
    .order("cm_name", { ascending: true })
    .limit(500);

  if (selectedDate) {
    query = query.eq("broadcast_date", selectedDate);
  }
  if (q?.trim()) {
    query = query.ilike("advertiser_name_raw", `%${q.trim()}%`);
  }

  const { data: cueAds } = await query;

  let unmatchedQuery = admin.from("unmatched_items").select("id", { count: "exact", head: true });
  if (selectedDate) {
    unmatchedQuery = unmatchedQuery.eq("broadcast_date", selectedDate);
  }
  const { count: unmatchedCount } = await unmatchedQuery;

  const rows = (cueAds ?? []) as unknown as CueAdRow[];
  // 15초 미만·121초 이상처럼 범위를 벗어나는 값은 드물지만 실제로 있을 수 있어 "기타"로 따로 모아
  // 조용히 누락되지 않도록 한다.
  const rowsLong = rows.filter((r) => r.cm_seconds === 120);
  const rowsBrand = rows.filter(
    (r) => r.cm_seconds !== null && r.cm_seconds >= 15 && r.cm_seconds <= 119,
  );
  const rowsEtc = rows.filter((r) => !rowsLong.includes(r) && !rowsBrand.includes(r));

  return (
    <div className="min-h-screen bg-slate-950">
      {/* 상단 헤더 */}
      <header className="border-b border-slate-800 bg-slate-900/80">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-9 w-12 items-center justify-center rounded-lg bg-blue-600 text-base font-extrabold tracking-tight text-white">
              ENA
            </div>
            <div>
              <p className="text-sm font-semibold leading-none text-white">
                KT그룹 LiveAD+ 방송광고 송출예정 대시보드
              </p>
              <p className="mt-1 text-xs text-slate-500">관리자 화면</p>
            </div>
          </Link>
          <div className="flex items-center gap-3">
            <span className="rounded-full bg-amber-500/15 px-3 py-1 text-xs font-semibold text-amber-400">
              로그인 보호 준비 중
            </span>
            <Link
              href="/login"
              className="rounded-full border border-slate-700 px-3 py-1 text-xs font-medium text-slate-300 transition hover:bg-slate-800"
            >
              로그인
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6">
        <div>
          <h1 className="text-xl font-bold text-white">
            방송광고 송출예정 대시보드
            {selectedDate && <span className="text-slate-500"> · {selectedDate}</span>}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            큐톤 예정 데이터와 업로드한 편성현황 엑셀을 자동으로 매칭한 결과입니다.
            {availableDates.length === 0 && " 아직 업로드된 데이터가 없습니다."}
          </p>
        </div>

        {/* 업로드 카드 */}
        <section className="rounded-xl border border-slate-800 bg-slate-900 p-5">
          <SectionHeading title="편성현황 엑셀 업로드" bare />
          <div className="mt-3">
            <UploadForm />
          </div>
        </section>

        {/* 액션 바 */}
        <section className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <DateSelect dates={availableDates} selected={selectedDate} />
            <a
              href={(() => {
                const params = new URLSearchParams();
                if (selectedDate) params.set("date", selectedDate);
                if (q?.trim()) params.set("q", q.trim());
                const qs = params.toString();
                return `/api/admin/cue-ads/export${qs ? `?${qs}` : ""}`;
              })()}
              className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-500"
            >
              매칭 결과 엑셀 다운로드
            </a>
            <span className="inline-flex items-center rounded-full bg-slate-800 px-3 py-1 text-xs font-medium text-slate-400">
              불일치 항목 {unmatchedCount ?? 0}건
            </span>
          </div>
          <SearchBox />
        </section>

        {q?.trim() && (
          <p className="text-sm text-slate-500">
            <span className="font-medium text-slate-300">&ldquo;{q}&rdquo;</span> 검색 결과{" "}
            {rows.length}건
          </p>
        )}

        {/* 채널별 송출 횟수 */}
        <section className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900">
          <SectionHeading title="채널별 송출 횟수" />
          <ChannelChart
            slots={rows.map((r) => ({
              channel: r.channel,
              broadcastDate: r.broadcast_date,
              slotTime: r.slot_time,
            }))}
          />
        </section>

        {/* 광고주별 송출 횟수 */}
        <section className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900">
          <SectionHeading title="광고주별 송출 횟수" />
          <AdvertiserChart
            slots={rows.map((r) => ({
              advertiser: r.advertiser_name_raw,
              channel: r.channel,
              broadcastDate: r.broadcast_date,
              slotTime: r.slot_time,
            }))}
          />
        </section>

        {/* 장초수 광고 (120초) */}
        <section className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900">
          <SectionHeading title="장초수 광고 (120초)" count={rowsLong.length} />
          <ResultTable rows={rowsLong} />
        </section>

        {/* 브랜드 광고 (15~119초) */}
        <section className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900">
          <SectionHeading title="브랜드 광고" count={rowsBrand.length} />
          <ResultTable rows={rowsBrand} />
        </section>

        {/* 기타 (범위를 벗어나는 초수) */}
        {rowsEtc.length > 0 && (
          <section className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900">
            <SectionHeading title="기타" count={rowsEtc.length} />
            <ResultTable rows={rowsEtc} />
          </section>
        )}
      </main>
    </div>
  );
}

// 메인 화면 히어로 카드에서 쓰는 요약 통계 — 별도로 export해서 재사용한다.
export async function getDashboardSummary() {
  const admin = createAdminClient();

  const [{ count: totalCount }, { count: pendingCount }, { count: unmatchedCount }] =
    await Promise.all([
      admin.from("cue_ads").select("id", { count: "exact", head: true }),
      admin
        .from("cue_ads")
        .select("id", { count: "exact", head: true })
        .eq("approval_status", "pending"),
      admin.from("unmatched_items").select("id", { count: "exact", head: true }),
    ]);

  return {
    total: totalCount ?? 0,
    pending: pendingCount ?? 0,
    unmatched: unmatchedCount ?? 0,
  };
}
