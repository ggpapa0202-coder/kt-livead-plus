// 로그인 폼 UI만 따로 뗀 조각 — /login 단독 페이지와 로그인 모달에서 함께 쓴다.
// 실제 이메일 인증 로직(작업 4·5)은 후순위로 미뤄둔 상태라 입력칸과 버튼 모두 비활성화돼 있다.
export function LoginForm() {
  return (
    <div>
      <h2 className="text-lg font-bold text-white">로그인</h2>
      <p className="mt-1 text-xs text-slate-400">
        이메일과 비밀번호로 로그인하면, 관리자 또는 광고주 권한에 맞는 정보만 보여드립니다.
      </p>

      <form className="mt-5 space-y-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-400">이메일</label>
          <input
            type="email"
            disabled
            placeholder="name@company.com"
            className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-400 placeholder:text-slate-500"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-400">비밀번호</label>
          <input
            type="password"
            disabled
            placeholder="••••••••"
            className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-400 placeholder:text-slate-500"
          />
        </div>
        <button
          type="button"
          disabled
          className="w-full cursor-not-allowed rounded-lg bg-slate-700 px-4 py-2 text-sm font-medium text-slate-400"
        >
          로그인
        </button>
      </form>

      <p className="mt-4 rounded-lg bg-amber-500/10 px-3 py-2 text-xs text-amber-400">
        이메일 인증 기능은 아직 준비 중입니다. 현재는 대시보드를 인증 없이 바로 확인할 수 있습니다.
      </p>
    </div>
  );
}
