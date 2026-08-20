import { Dashboard } from "@/components/dashboard";

export const dynamic = "force-dynamic";

// 대시보드를 단독 URL로 직접 열 때 쓰는 얇은 래퍼. 실제 내용은 컴포넌트 하나로 공유되며
// 메인 페이지(/)의 두 번째 슬라이드에서도 동일하게 쓰인다.
export default async function CueAdsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; date?: string }>;
}) {
  const { q, date } = await searchParams;
  return <Dashboard q={q} date={date} />;
}
