-- 슬롯에 광고가 여러 건이라 어떤 게 어떤 시각인지 정확히 특정 못 해도,
-- 관리자 요청에 따라 알고 있는 큐톤 예정 시각을 그대로 보여주기로 결정.
-- precise_notify_time을 여러 개(콤마 구분) 담을 수 있도록 text로 바꾸고,
-- 더 이상 쓰지 않는 'needs_review' 상태를 match_status에서 제거한다.
alter table public.cue_ads
  alter column precise_notify_time type text using precise_notify_time::text;

alter table public.cue_ads
  drop constraint cue_ads_match_status_check;

alter table public.cue_ads
  add constraint cue_ads_match_status_check
  check (match_status in ('matched', 'no_advertiser_email'));
