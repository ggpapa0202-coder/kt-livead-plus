"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";

export function DateSelect({
  dates,
  selected,
}: {
  dates: string[];
  selected: string | null;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("date", e.target.value);
    router.push(`${pathname}?${params.toString()}#dashboard`);
  }

  if (dates.length === 0) {
    return null;
  }

  return (
    <label className="flex items-center gap-2 text-sm text-slate-400">
      편성일자
      <select
        value={selected ?? ""}
        onChange={handleChange}
        className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 focus:border-blue-500 focus:outline-none"
      >
        {dates.map((date) => (
          <option key={date} value={date}>
            {date}
          </option>
        ))}
      </select>
    </label>
  );
}
