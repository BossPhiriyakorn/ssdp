#!/bin/bash
# ============================================================
#  upload-to-github.sh
#  รันสคริปต์นี้จาก Terminal บนเครื่องของคุณ
#  เพื่อ upload โค้ดขึ้น GitHub
# ============================================================

set -e  # หยุดทันทีถ้ามี error

REPO_NAME="senate-directory-batch6"
GITHUB_USER="zikarint"

echo ""
echo "🚀 เริ่ม upload code ขึ้น GitHub..."
echo ""

# 1. ลบ .git เก่าออก (ถ้ามี) แล้ว init ใหม่
echo "📁 กำลัง init git repository..."
rm -rf .git
git init
git branch -m main

# 2. ตั้งค่า user
git config user.email "zikarint@gmail.com"
git config user.name "Zikarin"

# 3. Stage ไฟล์ (ยกเว้น .env, db.json, node_modules ตาม .gitignore)
echo "📦 กำลัง stage files..."
git add .
echo ""
echo "ไฟล์ที่จะ upload:"
git status --short
echo ""

# 4. Commit
echo "💾 กำลัง commit..."
git commit -m "Initial commit: ทำเนียบรุ่น พศว. รุ่น 6

- Node.js + Express server
- Supabase database integration
- Public pages: members, officers, groups
- Admin panel with authentication
- Netlify serverless functions support"

# 5. สร้าง GitHub repo และ push (ต้องมี gh CLI)
echo ""
echo "🔗 กำลังสร้าง GitHub repository..."

if command -v gh &> /dev/null; then
    # ใช้ gh CLI (วิธีง่ายที่สุด)
    gh repo create "$REPO_NAME" --private --source=. --remote=origin --push
    echo ""
    echo "✅ สำเร็จ! เข้าดูได้ที่: https://github.com/$GITHUB_USER/$REPO_NAME"
else
    # ถ้าไม่มี gh CLI — ให้สร้าง repo เองบน GitHub แล้วใส่ URL
    echo "⚠️  ไม่พบ gh CLI — กรุณาทำตามขั้นตอนนี้:"
    echo ""
    echo "  1. ไปที่ https://github.com/new"
    echo "  2. ตั้งชื่อ repository: $REPO_NAME"
    echo "  3. เลือก Private แล้วกด 'Create repository'"
    echo "  4. กลับมารัน 3 คำสั่งนี้:"
    echo ""
    echo "     git remote add origin https://github.com/$GITHUB_USER/$REPO_NAME.git"
    echo "     git push -u origin main"
    echo ""
fi
