export type AdvertiserSlot = {
  advertiser: string;
  channel: string;
  broadcastDate: string;
  slotTime: string;
};

const TOP_N = 20;

function countByAdvertiser(slots: AdvertiserSlot[]): [string, number][] {
  // 같은 광고주라도 채널·일자·시간대가 다르면 서로 다른 송출이므로, 그 조합 단위로
  // 중복 제거한 뒤 광고주별로 센다 (채널별 그래프와 같은 방식).
  const uniqueSlots = new Map<string, string>();
  for (const s of slots) {
    const key = `${s.advertiser}|${s.channel}|${s.broadcastDate}|${s.slotTime}`;
    if (!uniqueSlots.has(key)) uniqueSlots.set(key, s.advertiser);
  }

  const counts = new Map<string, number>();
  for (const advertiser of uniqueSlots.values()) {
    counts.set(advertiser, (counts.get(advertiser) ?? 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1]);
}

// 막대 폭은 건수를 그대로 비례시키지 않고 제곱근 스케일을 쓴다 — 특정 광고주(예: 인포벨)의
// 건수가 압도적으로 많을 때, 다른 광고주 막대가 안 보일 정도로 눌리는 걸 막기 위함.
// 옆에 표시되는 숫자는 항상 실제 건수 그대로다.
function barWidthPercent(count: number, max: number): number {
  return (Math.sqrt(count) / Math.sqrt(max)) * 100;
}

export function AdvertiserChart({ slots }: { slots: AdvertiserSlot[] }) {
  const all = countByAdvertiser(slots);
  const data = all.slice(0, TOP_N);
  const max = Math.max(1, ...data.map(([, count]) => count));

  if (data.length === 0) {
    return (
      <p className="px-4 py-8 text-center text-sm text-slate-500">표시할 데이터가 없습니다.</p>
    );
  }

  return (
    <div className="space-y-2 px-4 py-4">
      {data.map(([advertiser, count]) => (
        <div key={advertiser} className="flex items-center gap-3 text-sm">
          <span className="w-40 shrink-0 truncate text-slate-400">{advertiser}</span>
          <div className="h-4 flex-1 rounded-full bg-slate-800">
            <div
              className="h-4 rounded-full bg-emerald-500"
              style={{ width: `${barWidthPercent(count, max)}%` }}
            />
          </div>
          <span className="w-10 shrink-0 text-right font-medium text-slate-200">{count}</span>
        </div>
      ))}
      {all.length > TOP_N && (
        <p className="pt-1 text-xs text-slate-500">
          송출 횟수 상위 {TOP_N}개 광고주만 표시 (전체 {all.length}곳)
        </p>
      )}
    </div>
  );
}
