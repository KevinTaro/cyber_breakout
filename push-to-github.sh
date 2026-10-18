#!/bin/bash
set -e

# ========================================================
# Cyber Breakout - GitHub & Cloudflare Push Helper Script
# ========================================================

echo "🎮 Cyber Breakout: GitHub 部署推送助手"
echo "=========================================="

if [ -z "$1" ]; then
  echo "⚠️  請提供您的 GitHub 遠端倉庫 URL 作為參數："
  echo "使用方式: ./push-to-github.sh <GITHUB_REPO_URL>"
  echo "範例: ./push-to-github.sh https://github.com/your-username/cyber-breakout.git"
  echo "或:   ./push-to-github.sh git@github.com:your-username/cyber-breakout.git"
  exit 1
fi

REPO_URL="$1"

# 1. 檢查是否已初始化 Git
if [ ! -d ".git" ]; then
  echo "📦 初始化 Git 倉庫..."
  git init -b main
else
  echo "✅ Git 倉庫已存在"
fi

# 2. 加入所有檔案
echo "📝 添加專案檔案..."
git add .

# 3. 提交變更
echo "💾 建立 Commit..."
git commit -m "feat: complete Cyber Breakout game with Cloudflare Pages/Workers serverless config and GitHub Actions" || echo "無需額外提交"

# 4. 配置 Remote
echo "🔗 綁定遠端倉庫: $REPO_URL"
git remote remove origin 2>/dev/null || true
git remote add origin "$REPO_URL"

# 5. 推送至 GitHub
echo "🚀 正在推送至 GitHub main 分支..."
git push -u origin main

echo ""
echo "🎉 成功推送到 GitHub！"
echo "👉 接下來至 Cloudflare Pages 控制台綁定該 GitHub Repo，或設定 GitHub Secrets (CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID) 自動觸發 CI/CD！"
