import Link from "next/link";
import { LoginForm } from "@/components/login-form";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 px-6">
      <Link href="/" className="mb-8 flex items-center gap-3">
        <div className="flex h-9 w-12 items-center justify-center rounded-lg bg-blue-600 text-base font-extrabold tracking-tight text-white">
          ENA
        </div>
        <span className="text-sm font-semibold text-slate-200">
          KT그룹 LiveAD+ 방송광고 송출예정 대시보드
        </span>
      </Link>

      <div className="w-full max-w-sm rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-lg">
        <LoginForm />

        <Link
          href="/admin/cue-ads"
          className="mt-3 block text-center text-xs font-medium text-blue-400 underline underline-offset-2"
        >
          지금은 인증 없이 대시보드 보기 →
        </Link>
      </div>
    </div>
  );
}
