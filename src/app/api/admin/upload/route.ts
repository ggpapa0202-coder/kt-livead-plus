import { NextResponse } from "next/server";
import { parseExcelBuffer } from "@/lib/matching/parse-excel";
import { runMatching } from "@/lib/matching/match";

// 관리자가 편성현황 엑셀을 업로드하면 즉시 파싱 + 매칭까지 실행한다 (DESIGN.md 2-3).
// 인증 게이트는 작업 4/5 진행 시 붙일 예정 — 지금은 로직 검증이 목적이다.
export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json(
      { error: { code: "no_file", message: "엑셀 파일이 없습니다" } },
      { status: 400 },
    );
  }

  try {
    const buffer = await file.arrayBuffer();
    const rows = await parseExcelBuffer(buffer);
    const summary = await runMatching(rows);
    return NextResponse.json({ data: { totalRows: rows.length, ...summary } });
  } catch (err) {
    return NextResponse.json(
      {
        error: {
          code: "upload_failed",
          message: err instanceof Error ? err.message : "알 수 없는 오류",
        },
      },
      { status: 500 },
    );
  }
}
