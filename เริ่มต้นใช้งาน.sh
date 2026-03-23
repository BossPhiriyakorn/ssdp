#!/bin/bash
# ===================================================
# สคริปต์เริ่มต้นเว็บไซต์ทำเนียบรุ่น พศว. รุ่น 6
# ===================================================

cd "$(dirname "$0")"

echo "╔════════════════════════════════════════════════╗"
echo "║   ทำเนียบรุ่น พศว. รุ่น 6                       ║"
echo "║   Senate Staff Development Program Batch 6     ║"
echo "╚════════════════════════════════════════════════╝"
echo ""

# ตรวจสอบ Node.js
if ! command -v node &> /dev/null; then
    echo "❌ ไม่พบ Node.js กรุณาติดตั้ง Node.js ก่อนใช้งาน"
    echo "   ดาวน์โหลดได้ที่: https://nodejs.org"
    exit 1
fi

echo "✅ Node.js version: $(node --version)"

# ติดตั้ง dependencies ถ้ายังไม่มี
if [ ! -d "node_modules" ]; then
    echo "📦 กำลังติดตั้ง dependencies..."
    npm install
fi

# เริ่มเซิร์ฟเวอร์
echo ""
echo "🚀 กำลังเริ่มต้นเว็บไซต์..."
echo "📍 เมื่อพร้อมใช้งาน กรุณาเปิด browser ไปที่:"
echo "   🌐 http://localhost:3000"
echo "   🔐 http://localhost:3000/admin/login  (admin / admin1234)"
echo ""
echo "กด Ctrl+C เพื่อหยุดเซิร์ฟเวอร์"
echo "─────────────────────────────────────────────────"

node server.js
