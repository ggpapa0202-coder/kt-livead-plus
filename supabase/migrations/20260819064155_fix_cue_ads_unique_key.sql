-- 버그 수정: 동일 약정서ID가 같은 시간대에 여러 채널로 동시 송출되는 경우가
-- 실제 데이터에 흔해서, 중복 방지 키에 채널명이 반드시 포함돼야 한다.
-- (채널명 없이는 서로 다른 채널의 정상적인 동시 송출 건을 충돌로 오판함)
alter table public.cue_ads
  drop constraint cue_ads_contract_id_broadcast_date_slot_time_key;

alter table public.cue_ads
  add constraint cue_ads_contract_channel_date_slot_key
  unique (contract_id, channel, broadcast_date, slot_time);
