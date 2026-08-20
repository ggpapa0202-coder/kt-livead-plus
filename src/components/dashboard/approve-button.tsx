"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

// 이메일 발송(작업 13·14)과 인증(작업 4·5)이 아직 없어서, 지금 승인해도 뒤이어 아무 일도
// 일어나지 않는다. 혼란을 막기 위해 버튼을 비활성화해두고, 해당 작업을 진행할 때 이 값만
// true로 바꾸면 다시 활성화된다.
const APPROVAL_ENABLED = false;

export function ApproveButton({ id }: { id: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  if (!APPROVAL_ENABLED) {
    return (
      <button
        disabled
        title="이메일 발송 기능을 만들기 전까지는 비활성화되어 있습니다"
        className="cursor-not-allowed rounded-md bg-slate-800 px-3 py-1 text-xs font-medium text-slate-500"
      >
        승인
      </button>
    );
  }

  async function handleClick() {
    setLoading(true);
    try {
      await fetch(`/api/admin/cue-ads/${id}/approve`, { method: "PATCH" });
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="rounded-md bg-blue-600 px-3 py-1 text-xs font-medium text-white transition hover:bg-blue-500 disabled:opacity-60"
    >
      {loading ? "..." : "승인"}
    </button>
  );
}
