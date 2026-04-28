-- 일일 사용량 증가 RPC
-- Supabase SQL Editor에서 실행

create or replace function increment_daily_usage(uid uuid)
returns void as $$
begin
  update profiles
  set daily_usage = daily_usage + 1,
      daily_usage_date = current_date
  where id = uid;
end;
$$ language plpgsql security definer;
