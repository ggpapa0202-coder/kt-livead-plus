"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function UploadForm() {
  const router = useRouter();
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isError, setIsError] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const file = (form.elements.namedItem("file") as HTMLInputElement).files?.[0];
    if (!file) return;

    setLoading(true);
    setStatus(null);
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/admin/upload", { method: "POST", body });
      const json = await res.json();
      if (!res.ok) {
        setIsError(true);
        setStatus(`실패: ${json.error?.message ?? "알 수 없는 오류"}`);
      } else {
        setIsError(false);
        const d = json.data;
        setStatus(
          `총 ${d.totalRows}행 · 매칭 ${d.matched} · 이메일미확보 ${d.noAdvertiserEmail} · 승인건 건너뜀 ${d.skippedApproved} · 불일치(엑셀) ${d.unmatchedExcel} · 불일치(크롤링) ${d.unmatchedCrawled}`,
        );
        router.refresh();
      }
    } finally {
      setLoading(false);
      form.reset();
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="file"
          name="file"
          accept=".xls,.xlsx"
          required
          className="block w-full max-w-xs cursor-pointer rounded-lg border border-slate-700 bg-slate-800 text-sm text-slate-400 file:mr-3 file:cursor-pointer file:rounded-md file:border-0 file:bg-slate-700 file:px-3 file:py-2 file:text-sm file:font-medium file:text-slate-200 hover:file:bg-slate-600"
        />
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-500 disabled:opacity-60"
        >
          {loading ? "업로드 중..." : "엑셀 업로드"}
        </button>
      </div>
      {status && (
        <p
          className={`rounded-md px-3 py-2 text-sm ${
            isError ? "bg-red-500/10 text-red-400" : "bg-emerald-500/10 text-emerald-400"
          }`}
        >
          {status}
        </p>
      )}
    </form>
  );
}
