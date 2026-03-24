-- เพิ่มคอลัมน์ที่อยู่สมาชิก (แยกตามฟิลด์เอกสาร)
alter table public.members
  add column if not exists house_no text,
  add column if not exists village_no text,
  add column if not exists village_name text,
  add column if not exists soi text,
  add column if not exists road text,
  add column if not exists subdistrict text,
  add column if not exists district text,
  add column if not exists province text,
  add column if not exists postal_code varchar(5);

comment on column public.members.house_no is 'บ้านเลขที่';
comment on column public.members.village_no is 'หมู่ที่';
comment on column public.members.village_name is 'ชื่อหมู่บ้าน/อาคาร/โครงการ';
comment on column public.members.soi is 'ซอย';
comment on column public.members.road is 'ถนน';
comment on column public.members.subdistrict is 'แขวง/ตำบล';
comment on column public.members.district is 'เขต/อำเภอ';
comment on column public.members.province is 'จังหวัด';
comment on column public.members.postal_code is 'รหัสไปรษณีย์ 5 หลัก';
