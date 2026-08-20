import Image from "next/image";
import { Dashboard, getDashboardSummary } from "@/components/dashboard";
import { LoginButton } from "@/components/login-button";

const STAT_COLORS = {
  blue: "bg-blue-500",
  purple: "bg-purple-500",
  amber: "bg-amber-500",
} as const;

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: keyof typeof STAT_COLORS;
}) {
  return (
    <div className="flex flex-1 items-center gap-2 rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-left">
      <span className={`h-2 w-2 shrink-0 rounded-full ${STAT_COLORS[color]}`} />
      <div>
        <p className="text-base font-bold text-white">{value}</p>
        <p className="text-[11px] text-slate-400">{label}</p>
      </div>
    </div>
  );
}

// 메인(첫 번째 슬라이드) + 대시보드(두 번째 슬라이드)를 CSS 스크롤 스냅으로 이어붙인 한 페이지.
// 로그인하면 대시보드로 넘어가는 것이 기본 진입 경로다(스크롤은 보조 수단).
export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; date?: string }>;
}) {
  const { q, date } = await searchParams;
  const summary = await getDashboardSummary();

  return (
    <div className="h-screen snap-y snap-mandatory overflow-y-scroll scroll-smooth">
      {/* 슬라이드 1: 메인 */}
      <section className="relative flex h-screen snap-start flex-col overflow-hidden bg-slate-950">
        <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-[55%] lg:block">
          <Image
            src="/ko img.png"
            alt=""
            fill
            priority
            sizes="55vw"
            className="object-cover object-left opacity-80"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/40 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-slate-950/60" />
        </div>

        <header className="relative border-b border-slate-800 bg-slate-900/80">
          <div className="mx-auto flex max-w-6xl items-center px-4 py-4 sm:px-6">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-12 items-center justify-center rounded-lg bg-blue-600 text-base font-extrabold tracking-tight text-white">
                ENA
              </div>
              <div>
                <p className="text-sm font-semibold leading-none text-white">
                  KT그룹 LiveAD+ 방송광고 송출예정 대시보드
                </p>
                <p className="mt-1 text-xs text-slate-500">메인</p>
              </div>
            </div>
          </div>
        </header>

        <div className="relative mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center px-6 sm:px-10">
          <p className="text-lg font-semibold tracking-widest text-blue-400 uppercase sm:text-xl">
            KT그룹 통합광고
          </p>
          <h1 className="mt-3 text-6xl font-extrabold text-white sm:text-7xl">LiveAD+</h1>
          <div className="mt-6 h-0.5 w-16 bg-blue-500" />
          <p className="mt-6 text-xl font-semibold text-slate-200 sm:text-2xl">
            방송광고 송출예정 대시보드
          </p>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-slate-400">
            큐톤광고의 송출 예정 시간을 자동으로 수집하고 편성현황과 매칭해,
            한눈에 확인할 수 있는 서비스입니다.
          </p>

          <div className="mt-8 flex w-full max-w-xs gap-2 sm:max-w-sm">
            <StatCard label="매칭 건수" value={summary.total} color="blue" />
            <StatCard label="승인 대기" value={summary.pending} color="amber" />
            <StatCard label="불일치 항목" value={summary.unmatched} color="purple" />
          </div>

          <LoginButton className="mt-8 inline-flex w-fit items-center gap-2 rounded-full bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-500">
            로그인
          </LoginButton>
        </div>

        <p className="relative px-6 pb-6 text-xs font-medium tracking-widest text-slate-600 uppercase sm:px-10">
          KT ENA
        </p>
      </section>

      {/* 슬라이드 2: 대시보드 */}
      <section id="dashboard" className="snap-start">
        <Dashboard q={q} date={date} />
      </section>
    </div>
  );
}
