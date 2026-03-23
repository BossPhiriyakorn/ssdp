const serverless = require('serverless-http');
const app = require('../../server');
const handler = serverless(app);

module.exports.handler = async (event, context) => {
  // Netlify redirect "/api/*" → "/.netlify/functions/api/:splat"
  // ทำให้ event.path = "/:splat" เช่น "/members"
  // แต่ Express routes ทั้งหมดขึ้นต้นด้วย /api/ → ต้อง restore กลับ
  const p = event.path || '/';
  if (!p.startsWith('/api')) {
    event.path = '/api' + (p.startsWith('/') ? p : '/' + p);
  }
  return handler(event, context);
};
