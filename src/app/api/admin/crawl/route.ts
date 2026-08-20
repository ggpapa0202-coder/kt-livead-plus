import { NextResponse } from "next/server";
import { fetchCjenmSchedule } from "@/lib/crawler/cjenm";
import { createAdminClient } from "@/lib/supabase/admin";

// Vercel Cron이 매일 07:00(KST) 호출하는 크롤링 엔드포인트.
// Vercel은 CRON_SECRET이 설정돼 있으면 Cron 요청에 Authorization 헤더를 자동으로 붙여준다 —
// 그 값이 일치할 때만 실행해서 외부에서 임의 실행하지 못하게 막는다 (DESIGN.md 4장).
export async function GET(request: Request) {
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json(
      { error: { code: "unauthorized", message: "인증되지 않은 요청입니다" } },
      { status: 401 },
    );
  }

  try {
    const events = await fetchCjenmSchedule();
    const admin = createAdminClient();

    const { error } = await admin.from("crawled_schedules").upsert(
      events.map((e) => ({
        channel: e.channel,
        broadcast_date: e.broadcastDate,
        precise_time: e.preciseTime,
        duration_minutes: e.durationMinutes,
      })),
      { onConflict: "channel,broadcast_date,precise_time", ignoreDuplicates: true },
    );

    if (error) {
      return NextResponse.json(
        { error: { code: "db_error", message: error.message } },
        { status: 500 },
      );
    }

    return NextResponse.json({ data: { collected: events.length } });
  } catch (err) {
    return NextResponse.json(
      {
        error: {
          code: "crawl_failed",
          message: err instanceof Error ? err.message : "알 수 없는 오류",
        },
      },
      { status: 500 },
    );
  }
}
