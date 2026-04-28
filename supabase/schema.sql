-- 합리적 미신 DB Schema
-- Supabase SQL Editor에서 실행

-- 1. profiles: 사용자 프로필
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text,
  email text,
  avatar_url text,
  mbti text check (mbti is null or length(mbti) = 4),
  birth_date date,
  birth_time text, -- HH:MM or 'unknown'
  birth_calendar text default 'solar' check (birth_calendar in ('solar', 'lunar')),
  gender text check (gender in ('male', 'female', null)),
  provider text, -- kakao, naver
  plan text default 'free' check (plan in ('free', 'basic', 'premium')),
  daily_usage int default 0,
  daily_usage_date date default current_date,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2. subscriptions: 구독 정보
create table if not exists subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade not null,
  plan text not null check (plan in ('basic', 'premium')),
  status text default 'active' check (status in ('active', 'cancelled', 'expired')),
  toss_billing_key text,
  toss_customer_key text,
  price int not null,
  started_at timestamptz default now(),
  expires_at timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz default now()
);

-- 3. chat_sessions: 채팅 세션
create table if not exists chat_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  guest_id text, -- 비회원용 식별자
  category text not null check (category in (
    'basic', 'yearly', 'love', 'compatibility', 'reunion',
    'wealth', 'career', 'health'
  )),
  mbti text not null,
  birth_date date not null,
  birth_time text,
  birth_calendar text default 'solar',
  gender text,
  -- 궁합용 상대방 정보
  partner_mbti text,
  partner_birth_date date,
  partner_birth_time text,
  partner_gender text,
  -- 만세력 원본 데이터
  saju_data jsonb,
  -- 분석 깊이
  analysis_depth text default 'summary' check (analysis_depth in ('summary', 'detailed', 'premium')),
  created_at timestamptz default now()
);

-- 4. chat_messages: 채팅 메시지
create table if not exists chat_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references chat_sessions(id) on delete cascade not null,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null,
  metadata jsonb, -- AI source, tokens used, etc.
  created_at timestamptz default now()
);

-- 5. usage_logs: 사용량 추적
create table if not exists usage_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  guest_id text,
  session_id uuid references chat_sessions(id) on delete cascade,
  action text not null, -- 'analysis', 'follow_up'
  tokens_used int default 0,
  created_at timestamptz default now()
);

-- Indexes
create index if not exists idx_chat_sessions_user on chat_sessions(user_id);
create index if not exists idx_chat_messages_session on chat_messages(session_id);
create index if not exists idx_usage_logs_user_date on usage_logs(user_id, created_at);
create index if not exists idx_subscriptions_user on subscriptions(user_id);

-- RLS
alter table profiles enable row level security;
alter table subscriptions enable row level security;
alter table chat_sessions enable row level security;
alter table chat_messages enable row level security;
alter table usage_logs enable row level security;

-- Profiles: 본인만 조회/수정
create policy "profiles_select_own" on profiles for select using (auth.uid() = id);
create policy "profiles_update_own" on profiles for update using (auth.uid() = id);

-- Subscriptions: 본인만 조회
create policy "subscriptions_select_own" on subscriptions for select using (auth.uid() = user_id);

-- Chat Sessions: 본인만 조회/생성
create policy "sessions_select_own" on chat_sessions for select using (auth.uid() = user_id);
create policy "sessions_insert_own" on chat_sessions for insert with check (auth.uid() = user_id);

-- Chat Messages: 세션 소유자만
create policy "messages_select_own" on chat_messages for select
  using (exists (select 1 from chat_sessions where id = chat_messages.session_id and user_id = auth.uid()));
create policy "messages_insert_own" on chat_messages for insert
  with check (exists (select 1 from chat_sessions where id = chat_messages.session_id and user_id = auth.uid()));

-- Usage Logs: 본인만
create policy "usage_select_own" on usage_logs for select using (auth.uid() = user_id);

-- Auto-create profile on signup
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, name, email, avatar_url, provider)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    new.email,
    new.raw_user_meta_data->>'avatar_url',
    new.raw_app_meta_data->>'provider'
  );
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
