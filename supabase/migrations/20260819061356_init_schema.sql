-- 큐톤광고 송출 예정 안내 서비스 초기 스키마
-- 참고 문서: DESIGN.md 2장(데이터 흐름), 4장(보안 설계) / CLAUDE.md 비즈니스 규칙

-- 1) 관리자 계정: Supabase Auth 사용자(auth.users)에 관리자 권한을 표시하는 테이블
create table public.admins (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null unique,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- 2) 광고주명-담당자 이메일 마스터 (관리자가 등록/관리, 광고주 로그인 이메일과 매칭 기준)
create table public.advertisers (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  contact_email text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index advertisers_contact_email_idx on public.advertisers (lower(contact_email));

-- 3) cjenm.com 큐톤 예정 자동 수집 데이터 (정밀 시각, HH:MM:SS)
create table public.crawled_schedules (
  id uuid primary key default gen_random_uuid(),
  channel text not null,
  broadcast_date date not null,
  precise_time time not null,
  duration_minutes integer,
  crawled_at timestamptz not null default now(),
  unique (channel, broadcast_date, precise_time)
);

-- 4) 매칭 결과 = 큐톤광고 (관리자 업로드 엑셀 기준, crawled_schedules와 매칭되어 생성됨)
create table public.cue_ads (
  id uuid primary key default gen_random_uuid(),
  contract_id text not null,               -- 약정서ID
  broadcast_date date not null,             -- 편성일자
  slot_time time not null,                  -- 편성 시간대 (30분 슬롯 시작, HH:MM)
  channel text not null,                    -- 채널명
  rate_class text,                          -- 시급명
  cm_name text not null,                    -- CM소재명
  cm_seconds integer,                       -- CM초수
  advertiser_id uuid references public.advertisers (id),
  advertiser_name_raw text not null,        -- 엑셀 원본 광고주명 (advertiser_id 조회 실패 대비)
  campaign_start_date date,                 -- 방송시작일자
  campaign_end_date date,                   -- 방송종료일자
  broadcast_type text,                      -- 방송구분 (예: HD)
  precise_notify_time time,                 -- 슬롯 내 1:1 배정된 정밀 안내 시각 (모호하면 NULL)
  match_status text not null default 'matched'
    check (match_status in ('matched', 'needs_review', 'no_advertiser_email')),
  approval_status text not null default 'pending'
    check (approval_status in ('pending', 'approved')),
  send_status text not null default 'not_sent'
    check (send_status in ('not_sent', 'sent', 'failed')),
  send_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (contract_id, broadcast_date, slot_time)
);
create index cue_ads_advertiser_id_idx on public.cue_ads (advertiser_id);
create index cue_ads_broadcast_date_idx on public.cue_ads (broadcast_date);

-- 5) 매칭되지 않은 항목 (크롤링 또는 엑셀 원본 기준, 관리자 확인용)
create table public.unmatched_items (
  id uuid primary key default gen_random_uuid(),
  source text not null check (source in ('crawled', 'excel')),
  channel text,
  broadcast_date date,
  time_value text,          -- 원본 표기 그대로 (크롤링: HH:MM:SS, 엑셀: HH:MM)
  raw_data jsonb,
  created_at timestamptz not null default now()
);

-- 보안: 모든 테이블 RLS 기본 차단 (정책을 추가하지 않아 anon/authenticated는 접근 불가,
-- service_role만 서버 API를 통해 조회 — DESIGN.md 4장 원칙)
alter table public.admins enable row level security;
alter table public.advertisers enable row level security;
alter table public.crawled_schedules enable row level security;
alter table public.cue_ads enable row level security;
alter table public.unmatched_items enable row level security;
