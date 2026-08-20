"use client";

import { useState } from "react";
import { LoginForm } from "./login-form";

// 로그인 버튼 + 모달. 페이지 이동 없이 같은 화면 위에 로그인 폼을 띄운다.
// className/children을 받아서 헤더의 작은 버튼, 메인 CTA의 큰 버튼 등 여러 자리에서 재사용한다.
export function LoginButton({
  className,
  children = "로그인",
}: {
  className?: string;
  children?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={className}>
        {children}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-6"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-sm rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-2 flex items-start justify-between">
              <div className="flex h-9 w-12 items-center justify-center rounded-lg bg-blue-600 text-base font-extrabold tracking-tight text-white">
                ENA
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="닫기"
                className="text-slate-500 transition hover:text-slate-300"
              >
                ✕
              </button>
            </div>
            <LoginForm />
          </div>
        </div>
      )}
    </>
  );
}
