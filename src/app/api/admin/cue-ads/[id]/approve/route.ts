import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// 매칭 결과를 최종 승인 처리한다.
// 이메일 발송(작업 13)과 로그인 권한 확인(작업 4/5)은 아직 뒤로 미뤄둔 상태라
// 지금은 승인 상태만 바꾼다 — 나중에 이 자리에 발송 로직을 붙인다.
export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const admin = createAdminClient();

  const { error } = await admin
    .from("cue_ads")
    .update({ approval_status: "approved" })
    .eq("id", id);

  if (error) {
    return NextResponse.json(
      { error: { code: "db_error", message: error.message } },
      { status: 500 },
    );
  }

  return NextResponse.json({ data: { id, approval_status: "approved" } });
}
