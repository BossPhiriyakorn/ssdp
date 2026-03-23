/**
 * One-off: create or reset an admin user (bcrypt password, same as server.js).
 * Prefer SUPABASE_SERVICE_ROLE_KEY in .env if RLS blocks anon writes on admin_users.
 * Usage: node scripts/create-admin.js <username> <password>
 */
require('dotenv').config();
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

const username = process.argv[2];
const password = process.argv[3];

if (!url || !key) {
  console.error('Missing SUPABASE_URL or Supabase key in .env (ANON or SERVICE_ROLE).');
  process.exit(1);
}
if (!username || !password) {
  console.error(`Usage: node ${path.relative(process.cwd(), __filename)} <username> <password>`);
  process.exit(1);
}

const supabase = createClient(url, key);
const hash = bcrypt.hashSync(password, 10);

(async () => {
  const { data: row, error: selErr } = await supabase
    .from('admin_users')
    .select('id')
    .eq('username', username)
    .maybeSingle();

  if (selErr) {
    console.error('Select failed:', selErr.message);
    process.exit(1);
  }

  if (row) {
    const { error } = await supabase.from('admin_users').update({ password: hash }).eq('username', username);
    if (error) {
      console.error('Update failed:', error.message);
      if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
        console.error('Tip: add SUPABASE_SERVICE_ROLE_KEY to .env if RLS denied the write.');
      }
      process.exit(1);
    }
    console.log('Updated password for:', username);
    return;
  }

  const { error } = await supabase.from('admin_users').insert({ username, password: hash });
  if (error) {
    console.error('Insert failed:', error.message);
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('Tip: add SUPABASE_SERVICE_ROLE_KEY to .env if RLS denied the write.');
    }
    process.exit(1);
  }
  console.log('Created admin:', username);
})();
