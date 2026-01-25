# Vercel 自动部署脚本

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Vercel 部署准备" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# 检查是否已登录
Write-Host "`n检查Vercel登录状态..." -ForegroundColor Yellow
$whoami = vercel whoami 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "未登录Vercel，请先登录..." -ForegroundColor Red
    Write-Host "运行: vercel login" -ForegroundColor Yellow
    Write-Host "然后重新运行此脚本" -ForegroundColor Yellow
    exit 1
}

Write-Host "已登录Vercel" -ForegroundColor Green
Write-Host "当前用户: $whoami" -ForegroundColor Green

# 部署到Vercel
Write-Host "`n开始部署到Vercel..." -ForegroundColor Yellow
vercel --prod

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n部署成功！" -ForegroundColor Green
    Write-Host "`n重要提示：" -ForegroundColor Yellow
    Write-Host "1. 在Vercel Dashboard中配置环境变量：" -ForegroundColor Yellow
    Write-Host "   - DATABASE_URL (PostgreSQL连接字符串)" -ForegroundColor Yellow
    Write-Host "   - JWT_SECRET (随机字符串)" -ForegroundColor Yellow
    Write-Host "   - DEEPSEEK_API_KEY (sk-7586d9f6564d40328f886b8f0b0fef1c)" -ForegroundColor Yellow
    Write-Host "`n2. 配置环境变量后，运行数据库迁移：" -ForegroundColor Yellow
    Write-Host "   vercel env pull .env.local" -ForegroundColor Cyan
    Write-Host "   npx prisma db push" -ForegroundColor Cyan
    Write-Host "`n3. 重新部署以应用环境变量：" -ForegroundColor Yellow
    Write-Host "   vercel --prod" -ForegroundColor Cyan
} else {
    Write-Host "`n部署失败，请检查错误信息" -ForegroundColor Red
}
