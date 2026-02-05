# ✅ Vercel 部署检查清单

**最后更新**: 2026-02-05

---

## 🔧 一、代码修复

### ✅ 已完成的修复
- [x] 修复了路由冲突（删除了 `[subject]` 和根目录的 `[wrongBookId]` 目录）
- [x] 修复了错题保存的 JSON 解析错误
- [x] 改进了 API 错误处理（确保始终返回 JSON）
- [x] 更新了主页面样式（添加背景渐变）
- [x] 更新了部署配置和文档

### ⚠️ 待处理
- [ ] 清除 `.next` 缓存并重新构建测试
- [ ] 确认构建成功无错误

---

## 🔐 二、环境变量配置（Vercel Dashboard）

### 必需的环境变量

| 变量名 | 值 | 环境 | 状态 |
|--------|-----|------|------|
| `DATABASE_URL` | Prisma Accelerate 或标准 PostgreSQL 连接字符串 | All | ⚠️ 需配置 |
| `JWT_SECRET` | 强随机字符串（生产环境） | All | ⚠️ 需配置 |
| `DEEPSEEK_API_KEY` | `sk-7586d9f6564d40328f886b8f0b0fef1c` | All | ⚠️ 需配置 |
| `TEXTIN_APP_ID` | `0e5b56a003c7a2bd613302180ad60de0` | All | ⚠️ 需配置 |
| `TEXTIN_SECRET_CODE` | `7b823a7b278fe8df1a1a45e63e23d68f` | All | ⚠️ 需配置 |

**重要**: 所有变量必须添加到 Production、Preview、Development 三个环境！

---

## 🗄️ 三、数据库设置

- [ ] 在 Vercel Dashboard 中创建 Postgres 数据库
- [ ] 复制数据库连接字符串
- [ ] 配置 `DATABASE_URL` 环境变量
- [ ] 数据库迁移会在构建时自动运行（已配置在 `vercel.json`）

---

## 📦 四、部署步骤

### 1. 清除缓存并测试构建
```powershell
# 清除 Next.js 缓存
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue

# 测试构建
npm run build
```

### 2. 提交代码
```powershell
git add .
git commit -m "准备部署：修复路由冲突、错误处理、更新配置"
git push origin main
```

### 3. 配置环境变量
- 在 Vercel Dashboard → Settings → Environment Variables
- 添加所有必需的环境变量
- 确保添加到所有环境（Production、Preview、Development）

### 4. 部署
```powershell
# 使用部署脚本
.\deploy-vercel.ps1

# 或手动部署
vercel --prod
```

### 5. 验证
- [ ] 访问部署的 URL
- [ ] 测试管理员登录（密码：`admin888`）
- [ ] 访问 `/api/check-db` 验证数据库连接
- [ ] 测试核心功能

---

## 📝 五、文件变更总结

### 新增文件
- `DEPLOYMENT_READY.md` - 完整部署指南
- `PRE_DEPLOYMENT_SUMMARY.md` - 部署前总结
- `DEPLOYMENT_CHECKLIST.md` - 本文件
- `app/api/check-db/route.ts` - 数据库检查 API

### 修改文件
- `vercel.json` - 更新构建配置
- `README.md` - 更新部署说明
- `.env.example` - 更新环境变量示例
- `deploy-vercel.ps1` - 更新部署脚本提示
- `app/page.tsx` - 添加背景样式
- `app/api/student/wrong-questions/route.ts` - 改进错误处理
- `components/student/CreateQuestionModal.tsx` - 修复 JSON 解析错误

### 删除文件
- `app/student/notebook/[subject]/page.tsx` - 路由冲突
- `app/student/notebook/[subject]/[wrongBookId]/page.tsx` - 路由冲突
- `app/student/notebook/[wrongBookId]/page.tsx` - 路由冲突

---

## ⚠️ 六、注意事项

1. **构建前清除缓存**: 如果遇到路由冲突错误，清除 `.next` 目录
2. **环境变量**: 确保所有环境变量都添加到三个环境
3. **数据库迁移**: 首次部署后会自动运行，如果失败需要手动运行
4. **JWT_SECRET**: 生产环境必须使用强密码

---

## 🚀 快速部署命令

```powershell
# 1. 清除缓存
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue

# 2. 测试构建
npm run build

# 3. 提交代码
git add .
git commit -m "准备部署到Vercel"
git push origin main

# 4. 部署（配置环境变量后）
.\deploy-vercel.ps1
```

---

**状态**: ✅ 代码已准备好，待清除缓存后测试构建
