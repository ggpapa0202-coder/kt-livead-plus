// cjenm.com 큐톤 예정 페이지에서 정밀 시각 데이터를 가져온다.
// 이 페이지는 Next.js SSR 페이지라 __NEXT_DATA__ 스크립트 안에 원본 JSON이 그대로 들어있어,
// 별도 HTML 파싱 라이브러리 없이 정규식 + JSON.parse로 추출한다.
//
// cjenm.com 큐톤 포털에는 채널이 여러 개 있고(chnList), 채널마다 URL의 마지막 경로(chnSiteId)만
// 바뀐다. chnList는 어느 채널 페이지에서 열어도 전체 채널 목록이 동일하게 내려오므로,
// 첫 페이지에서 전체 채널 목록을 얻은 뒤 채널별로 각각의 큐톤 예정(ctonList)을 가져온다.

const CJENM_BASE_URL = "https://tvn.cjenm.com/ko/broadcast/Cuetone";

type CjenmChannel = {
  chnSiteId: string;
  chnNm: string;
};

type CjenmCtonEntry = {
  runDt: string; // 편성일자 YYYY-MM-DD
  runTtm: string; // 정밀 시각 HH:MM:SS
  runLen: string; // 지속 시간(분) 문자열
};

export type CrawledEvent = {
  channel: string;
  broadcastDate: string; // YYYY-MM-DD
  preciseTime: string; // HH:MM:SS
  durationMinutes: number | null;
};

async function fetchChannelPage(
  chnSiteId: string,
): Promise<{ chnList: CjenmChannel[]; ctonList: CjenmCtonEntry[] }> {
  const res = await fetch(`${CJENM_BASE_URL}/${chnSiteId}/`, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`cjenm.com 페이지 요청 실패 (${chnSiteId}): ${res.status}`);
  }
  const html = await res.text();

  const match = html.match(
    /__NEXT_DATA__"\s*type="application\/json">([\s\S]*?)<\/script>/,
  );
  if (!match) {
    throw new Error(
      `cjenm.com 페이지에서 예정 데이터를 찾지 못했습니다 (${chnSiteId}, 페이지 구조 변경 가능성)`,
    );
  }

  const parsed = JSON.parse(match[1]);
  const result = parsed?.props?.pageProps?.data?.result;
  return {
    chnList: result?.chnList ?? [],
    ctonList: result?.ctonList ?? [],
  };
}

export async function fetchCjenmSchedule(): Promise<CrawledEvent[]> {
  const first = await fetchChannelPage("tvn");
  const events: CrawledEvent[] = [];

  for (const ch of first.chnList) {
    const { ctonList } =
      ch.chnSiteId === "tvn" ? first : await fetchChannelPage(ch.chnSiteId);

    for (const c of ctonList) {
      events.push({
        channel: ch.chnNm,
        broadcastDate: c.runDt,
        preciseTime: c.runTtm,
        durationMinutes: c.runLen ? Number(c.runLen) : null,
      });
    }
  }

  return events;
}
