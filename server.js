require('dotenv').config();
const express = require('express');
const cookieSession = require('cookie-session');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { supabase } = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

function normalizeHexColor(input, fallback) {
  const v = String(input ?? '').trim();
  if (/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(v)) return v;
  return fallback;
}

const sessionKeys = [process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex')];

// Photo upload — whitelist เฉพาะรูปภาพ เพื่อกันไฟล์ประเภทอันตราย
const allowedImageMimes = new Set(['image/jpeg', 'image/png', 'image/webp']);
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!allowedImageMimes.has(file.mimetype)) return cb(new Error('Invalid file type. Only JPG/PNG/WebP allowed.'));
    cb(null, true);
  },
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// cookie-session ใช้แทน express-session — ทำงานได้ใน serverless เพราะเก็บใน cookie
app.use(cookieSession({
  name: 'senate_session',
  keys: sessionKeys,
  maxAge: 24 * 60 * 60 * 1000,
  httpOnly: true,
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
}));

function requireAuth(req, res, next) {
  if (req.session && req.session.adminLoggedIn) return next();
  res.status(401).json({ error: 'Unauthorized' });
}

// PUBLIC API
app.get('/api/members', async (req, res) => {
  const { data, error } = await supabase.from('members').select('*, groups(name_th, color)').order('number');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data.map(m => ({ ...m, group_name: m.groups?.name_th || null, group_color: m.groups?.color || null, groups: undefined })));
});

app.get('/api/members/:id', async (req, res) => {
  const { data, error } = await supabase.from('members').select('*, groups(name_th, color)').eq('id', req.params.id).single();
  if (error) return res.status(404).json({ error: 'Not found' });
  res.json({ ...data, group_name: data.groups?.name_th || null, group_color: data.groups?.color || null, groups: undefined });
});

app.get('/api/officers', async (req, res) => {
  const { data, error } = await supabase.from('officers')
    .select('*, members(id, number, prefix, first_name, last_name, nickname, photo, position)')
    .order('sort_order', { ascending: true })
    .order('id', { ascending: true });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data.map(o => {
    const mem = o.members;
    return {
      ...o,
      member_number: mem?.number, member_prefix: mem?.prefix,
      member_first_name: mem?.first_name, member_last_name: mem?.last_name,
      member_nickname: mem?.nickname, member_photo: mem?.photo,
      member_position: mem?.position,
      members: undefined,
      // ชื่อ/รูประดับบนสุดให้ตรงกับหน้า officers.html และแอดมิน (เดิมอ่านแค่ member_*)
      prefix: mem?.prefix ?? null,
      first_name: mem?.first_name ?? null,
      last_name: mem?.last_name ?? null,
      nickname: mem?.nickname ?? null,
      photo: mem?.photo ?? null,
      position: mem?.position ?? null,
      number: mem?.number ?? null,
    };
  }));
});

app.get('/api/groups', async (req, res) => {
  const { data: groups, error } = await supabase.from('groups').select('*').order('sort_order');
  if (error) return res.status(500).json({ error: error.message });
  const { data: members } = await supabase.from('members').select('id, number, prefix, first_name, last_name, nickname, photo, position, group_id, is_group_leader').order('number');
  res.json(groups.map(g => ({ ...g, members: (members||[]).filter(m => m.group_id === g.id), member_count: (members||[]).filter(m => m.group_id === g.id).length })));
});

app.get('/api/settings', async (req, res) => {
  const { data, error } = await supabase.from('settings').select('*').eq('id', 1).single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// ADMIN AUTH
app.post('/api/admin/login', async (req, res) => {
  const { username, password } = req.body;
  const { data } = await supabase.from('admin_users').select('*').eq('username', username).single();
  if (!data || !bcrypt.compareSync(password, data.password)) return res.status(401).json({ error: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' });
  req.session.adminLoggedIn = true;
  req.session.adminUsername = username;
  res.json({ success: true });
});

app.post('/api/admin/logout', (req, res) => {
  req.session = null; // วิธี destroy ของ cookie-session
  res.json({ success: true });
});

app.get('/api/admin/check', (req, res) => res.json({ loggedIn: !!req.session?.adminLoggedIn, username: req.session?.adminUsername || '' }));

// ADMIN MEMBERS
app.get('/api/admin/members', requireAuth, async (req, res) => {
  const { data, error } = await supabase.from('members').select('*, groups(name_th, color)').order('number');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data.map(m => ({ ...m, group_name: m.groups?.name_th||null, group_color: m.groups?.color||null, groups: undefined })));
});

app.post('/api/admin/members', requireAuth, async (req, res) => {
  const b = req.body;
  const { data, error } = await supabase.from('members').insert({
    number: parseInt(b.number)||null, prefix: b.prefix||'', first_name: b.first_name||'', last_name: b.last_name||'',
    nickname: b.nickname||null, position: b.position||null, organization: b.organization||null,
    department: b.department||null, expertise: b.expertise||null, education: b.education||null,
    experience: b.experience||null, email: b.email||null, phone: b.phone||null,
    line_id: b.line_id||null, linkedin: b.linkedin||null, facebook: b.facebook||null,
    instagram: b.instagram||null, youtube: b.youtube||null, tiktok: b.tiktok||null,
    vision: b.vision||null, group_id: b.group_id?parseInt(b.group_id):null,
    is_group_leader: b.is_group_leader===true||b.is_group_leader==='true',
  }).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true, id: data.id });
});

app.put('/api/admin/members/:id', requireAuth, async (req, res) => {
  const b = req.body;
  const { error } = await supabase.from('members').update({
    number: parseInt(b.number)||undefined, prefix: b.prefix, first_name: b.first_name, last_name: b.last_name,
    nickname: b.nickname||null, position: b.position||null, organization: b.organization||null,
    department: b.department||null, expertise: b.expertise||null, education: b.education||null,
    experience: b.experience||null, email: b.email||null, phone: b.phone||null,
    line_id: b.line_id||null, linkedin: b.linkedin||null, facebook: b.facebook||null,
    instagram: b.instagram||null, youtube: b.youtube||null, tiktok: b.tiktok||null,
    vision: b.vision||null, group_id: b.group_id?parseInt(b.group_id):null,
    is_group_leader: b.is_group_leader===true||b.is_group_leader==='true',
    updated_at: new Date().toISOString(),
  }).eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

app.delete('/api/admin/members/:id', requireAuth, async (req, res) => {
  const { error } = await supabase.from('members').delete().eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

// Photo upload → Supabase Storage (ใช้ได้ทั้ง Netlify serverless และ local)
app.post('/api/admin/members/:id/photo', requireAuth, upload.single('photo'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file' });
  const extByMime = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp' };
  const ext = extByMime[req.file.mimetype] || '.jpg';
  const filename = `member_${req.params.id}_${Date.now()}${ext}`;

  const { error: uploadError } = await supabase.storage
    .from('member-photos')
    .upload(filename, req.file.buffer, { contentType: req.file.mimetype, upsert: true });

  if (uploadError) return res.status(500).json({ error: uploadError.message });

  const { data: { publicUrl } } = supabase.storage.from('member-photos').getPublicUrl(filename);

  const { error } = await supabase.from('members').update({ photo: publicUrl }).eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true, photo: publicUrl });
});

// ADMIN OFFICERS
app.get('/api/admin/officers', requireAuth, async (req, res) => {
  const { data, error } = await supabase.from('officers').select('*')
    .order('sort_order', { ascending: true })
    .order('id', { ascending: true });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

app.post('/api/admin/officers', requireAuth, async (req, res) => {
  let sortOrder = parseInt(req.body.sort_order, 10);
  if (!Number.isFinite(sortOrder) || sortOrder < 1) {
    const { data: rows } = await supabase.from('officers').select('sort_order');
    const nums = (rows || []).map(r => Number(r.sort_order)).filter(n => Number.isFinite(n));
    sortOrder = nums.length ? Math.max(...nums) + 1 : 1;
  }
  const { data, error } = await supabase.from('officers').insert({
    member_id: parseInt(req.body.member_id), role_th: req.body.role_th,
    role_en: req.body.role_en||null, sort_order: sortOrder,
  }).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true, id: data.id });
});

app.put('/api/admin/officers/:id', requireAuth, async (req, res) => {
  const so = parseInt(req.body.sort_order, 10);
  const sortOrder = Number.isFinite(so) && so >= 1 ? so : 1;
  const { error } = await supabase.from('officers').update({
    member_id: parseInt(req.body.member_id), role_th: req.body.role_th,
    role_en: req.body.role_en||null, sort_order: sortOrder,
  }).eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

app.delete('/api/admin/officers/:id', requireAuth, async (req, res) => {
  const { error } = await supabase.from('officers').delete().eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

// ADMIN GROUPS
app.put('/api/admin/groups/:id', requireAuth, async (req, res) => {
  const { error } = await supabase.from('groups').update({
    name_th: req.body.name_th, name_en: req.body.name_en||null,
    description: req.body.description||'', color: normalizeHexColor(req.body.color, '#1a2b5e'),
    sort_order: parseInt(req.body.sort_order)||0,
  }).eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

// Multer/file upload errors -> respond cleanly (prevents leaking stack)
app.use((err, req, res, next) => {
  if (err && err.message) return res.status(400).json({ error: err.message });
  return next(err);
});

// ADMIN SETTINGS
app.put('/api/admin/settings', requireAuth, async (req, res) => {
  const { error } = await supabase.from('settings').update({
    site_title_th: req.body.site_title_th, site_title_en: req.body.site_title_en,
    course_name_th: req.body.course_name_th, course_name_en: req.body.course_name_en,
    fiscal_year: req.body.fiscal_year, welcome_message: req.body.welcome_message,
  }).eq('id', 1);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

// ADMIN CHANGE PASSWORD
app.post('/api/admin/change-password', requireAuth, async (req, res) => {
  const { current_password, new_password } = req.body;
  const { data } = await supabase.from('admin_users').select('*').eq('username', req.session.adminUsername).single();
  if (!data || !bcrypt.compareSync(current_password, data.password)) return res.status(400).json({ error: 'รหัสผ่านปัจจุบันไม่ถูกต้อง' });
  const { error } = await supabase.from('admin_users').update({ password: bcrypt.hashSync(new_password, 10) }).eq('username', req.session.adminUsername);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});


// HTML ROUTES (สำหรับ local dev — Netlify ใช้ redirects ใน netlify.toml แทน)
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public/index.html')));
app.get('/member/:id', (req, res) => res.sendFile(path.join(__dirname, 'public/member.html')));
app.get('/officers', (req, res) => res.sendFile(path.join(__dirname, 'public/officers.html')));
app.get('/groups', (req, res) => res.sendFile(path.join(__dirname, 'public/groups.html')));
app.get('/admin', (req, res) => res.sendFile(path.join(__dirname, 'public/admin/index.html')));
app.get('/admin/login', (req, res) => res.sendFile(path.join(__dirname, 'public/admin/login.html')));

// รัน local dev server เฉพาะเมื่อเรียกตรง ไม่ใช่เมื่อถูก import โดย Netlify
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`\n✅ ทำเนียบรุ่น พศว. รุ่น 6 พร้อมใช้งาน!`);
    console.log(`🌐 http://localhost:${PORT}`);
    console.log(`🔐 Admin: http://localhost:${PORT}/admin/login`);
    console.log(`🗄️  Supabase: hyizwfivccgypaqcwhvu.supabase.co\n`);
  });
}

module.exports = app;
