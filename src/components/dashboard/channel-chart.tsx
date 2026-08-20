export type ChannelSlot = {
  channel: string;
  broadcastDate: string;
  slotTime: string; // HH:MM:SS
};

type ChannelStat = {
  channel: string;
  count: number;
  hours: Set<number>;
};

function buildChannelStats(slots: ChannelSlot[]): ChannelStat[] {
  // 같은 채널·일자·시간대 슬롯에 광고가 여러 건 매칭돼 있어도 실제 송출은 1회이므로,
  // 슬롯 단위로 먼저 중복 제거한 뒤 채널별 횟수와 송출된 시간대(시 단위)를 함께 집계한다.
  const uniqueSlots = new Map<string, ChannelSlot>();
  for (const s of slots) {
    const key = `${s.channel}|${s.broadcastDate}|${s.slotTime}`;
    if (!uniqueSlots.has(key)) uniqueSlots.set(key, s);
  }

  const byChannel = new Map<string, ChannelStat>();
  for (const s of uniqueSlots.values()) {
    const hour = Number(s.slotTime.slice(0, 2));
    const stat = byChannel.get(s.channel) ?? { channel: s.channel, count: 0, hours: new Set() };
    stat.count += 1;
    stat.hours.add(hour);
    byChannel.set(s.channel, stat);
  }

  return [...byChannel.values()].sort((a, b) => b.count - a.count);
}

// 특정 채널의 건수가 압도적으로 많아도 다른 채널 막대가 눌려 보이지 않도록
// 제곱근 스케일로 폭을 계산한다. 옆 숫자는 항상 실제 건수 그대로다.
function barWidthPercent(count: number, max: number): number {
  return (Math.sqrt(count) / Math.sqrt(max)) * 100;
}

export function ChannelChart({ slots }: { slots: ChannelSlot[] }) {
  const data = buildChannelStats(slots);
  const max = Math.max(1, ...data.map((d) => d.count));

  if (data.length === 0) {
    return (
      <p className="px-4 py-8 text-center text-sm text-slate-500">표시할 데이터가 없습니다.</p>
    );
  }

  return (
    <div className="space-y-4 px-4 py-4">
      {data.map(({ channel, count, hours }) => (
        <div key={channel}>
          <div className="flex items-center gap-3 text-sm">
            <span className="w-24 shrink-0 truncate text-slate-400">{channel}</span>
            <div className="h-4 flex-1 rounded-full bg-slate-800">
              <div
                className="h-4 rounded-full bg-blue-500"
                style={{ width: `${barWidthPercent(count, max)}%` }}
              />
            </div>
            <span className="w-10 shrink-0 text-right font-medium text-slate-200">{count}</span>
          </div>
          {/* 0~23시 중 실제로 송출이 있었던 시간대 표시 */}
          <div className="ml-[108px] mt-1 flex gap-[2px]">
            {Array.from({ length: 24 }, (_, hour) => (
              <div
                key={hour}
                title={`${hour}시대 ${hours.has(hour) ? "송출 있음" : "송출 없음"}`}
                className={`h-2 flex-1 rounded-sm ${
                  hours.has(hour) ? "bg-blue-500" : "bg-slate-800"
                }`}
              />
            ))}
          </div>
        </div>
      ))}
      <div className="ml-[108px] flex justify-between text-[10px] text-slate-500">
        <span>0시</span>
        <span>6시</span>
        <span>12시</span>
        <span>18시</span>
        <span>24시</span>
      </div>
    </div>
  );
}
