-- รันใน Supabase SQL Editor หรือผ่าน migration
alter table public.members
  add column if not exists birth_date date;

comment on column public.members.birth_date is 'วันเกิด (รูปแบบ ISO date)';
