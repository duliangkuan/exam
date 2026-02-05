# 🚀 Vercel 部署准备检查清单

**检查日期**: 2026-02-05  
**项目状态**: ✅ 已准备好部署

---

## 📋 一、代码检查

### ✅ 1.1 项目配置
- [x] `package.json` - 依赖完整，构建脚本正确
- [x] `tsconfig.json` - TypeScript 配置正确
- [x] `next.config.mjs` - Next.js 配置正确
- [x] `tailwind.config.ts` - Tailwind CSS 配置正确
- [x] `vercel.json` - Vercel 构建配置正确
- [x] `.gitignore` - 已排除敏感文件和构建产物

### ✅ 1.2 Prisma 数据库
- [x] `prisma/schema.prisma` - Schema 完整，包含所有表结构
- [x] 数据库迁移命令已配置在 `vercel.json`
- [x] 使用 PostgreSQL（Vercel Postgres 兼容）

### ✅ 1.3 代码质量
- [x] 无 TypeScript 编译错误
- [x] 无 ESLint 错误
- [x] 所有 API 路由正确配置
- [x] 错误处理已完善（JSON 响应）

---

## 🔐 二、环境变量配置

### 必需的环境变量（必须在 Vercel Dashboard 中配置）

| 变量名 | 环境 | 说明 | 状态 |
|--------|------|------|------|
| `DATABASE_URL` | All | PostgreSQL 连接字符串（Prisma Accelerate 或标准连接） | ⚠️ 需配置 |
| `JWT_SECRET` | All | JWT 签名密钥（生产环境使用强随机字符串） | ⚠️ 需配置 |
| `DEEPSEEK_API_KEY` | All | Deepseek API 密钥 | ⚠️ 需配置 |
| `TEXTIN_APP_ID` | All | Textin OCR App ID | ⚠️ 需配置 |
| `TEXTIN_SECRET_CODE` | All | Textin OCR Secret Code | ⚠️ 需配置 |

### 可选的环境变量

| 变量名 | 环境 | 说明 | 状态 |
|--------|------|------|------|
| `NEXT_PUBLIC_CENTER_LOGO_IMAGE` | All | 学生端仪表盘 Logo 路径（如：`/images/logo.png`） | ⚪ 可选 |

### ⚠️ 重要提示

1. **所有环境变量必须添加到以下环境**：
   - ✅ Production（生产环境）
   - ✅ Preview（预览环境）
   - ✅ Development（开发环境）

2. **DATABASE_URL 配置**：
   - 推荐使用 Prisma Accelerate（`prisma+postgres://...`）
   - 或使用标准 PostgreSQL 连接（`postgres://...`）

3. **JWT_SECRET 安全**：
   - 生产环境必须使用强随机字符串
   - 可以使用 PowerShell 生成：`-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | ForEach-Object {[char]$_})`

---

## 🗄️ 三、数据库设置

### ✅ 3.1 Vercel Postgres 数据库
- [ ] 在 Vercel Dashboard 中创建 Postgres 数据库
- [ ] 复制数据库连接字符串
- [ ] 将连接字符串添加到 `DATABASE_URL` 环境变量

### ✅ 3.2 数据库迁移
- [x] `vercel.json` 中已配置自动迁移：`prisma db push --accept-data-loss`
- [ ] 首次部署后验证数据库表结构是否正确创建

---

## 📦 四、构建和部署

### ✅ 4.1 本地构建测试
```powershell
# 测试构建
npm run build

# 如果构建成功，可以继续部署
```

### ✅ 4.2 部署步骤

#### 方法 1：使用部署脚本（推荐）
```powershell
.\deploy-vercel.ps1
```

#### 方法 2：手动部署
```powershell
# 1. 检查 Vercel 登录状态
vercel whoami

# 2. 部署到生产环境
vercel --prod

# 3. 配置环境变量后，拉取并运行数据库迁移
vercel env pull .env.local
npx prisma db push

# 4. 重新部署以应用环境变量
vercel --prod
```

---

## ✅ 五、部署后验证

### 5.1 基础功能测试
- [ ] 访问部署的 URL，检查页面是否正常加载
- [ ] 检查主页面样式是否正确显示
- [ ] 测试管理员登录（密码：`admin888`）
- [ ] 创建教师账号
- [ ] 创建学生账号

### 5.2 核心功能测试
- [ ] 学生登录并进入学习系统
- [ ] 测试 AI 通关测（生成题目、答题、保存报告）
- [ ] 测试 AI 错题本（OCR 识别、保存错题、AI 分析）
- [ ] 测试教师端功能（查看报告、布置作业）
- [ ] 测试管理端功能（创建教师、查看统计）

### 5.3 数据库验证
- [ ] 访问 `/api/check-db` 检查数据库连接状态
- [ ] 验证所有表已正确创建
- [ ] 验证数据可以正常保存和读取

---

## 🔧 六、故障排除

### 6.1 构建失败
- 检查 Vercel Dashboard 中的构建日志
- 确认所有依赖已正确安装
- 检查 TypeScript 编译错误

### 6.2 数据库连接失败
- 检查 `DATABASE_URL` 环境变量是否正确配置
- 确认数据库已创建并运行
- 检查连接字符串格式（必须包含 `?sslmode=require`）

### 6.3 API 错误
- 检查环境变量是否已正确配置
- 查看服务器日志（Vercel Dashboard → Functions → Logs）
- 确认 API 密钥有效

### 6.4 样式显示问题
- 清除浏览器缓存（Ctrl + F5）
- 检查 Tailwind CSS 是否正确编译
- 确认 `globals.css` 已正确导入

---

## 📝 七、部署前最终检查

### ✅ 代码提交
- [ ] 所有更改已提交到 Git
- [ ] 已推送到 GitHub 仓库
- [ ] 确认 `.env` 文件已添加到 `.gitignore`（不会提交敏感信息）

### ✅ 环境变量
- [ ] 所有必需的环境变量已在 Vercel Dashboard 中配置
- [ ] 环境变量已添加到所有环境（Production、Preview、Development）
- [ ] 确认环境变量值正确（特别是 `DATABASE_URL`）

### ✅ 数据库
- [ ] Vercel Postgres 数据库已创建
- [ ] 数据库连接字符串已配置
- [ ] 准备运行数据库迁移

### ✅ 文档
- [ ] README.md 已更新
- [ ] 部署文档已更新
- [ ] 环境变量说明已更新

---

## 🎯 部署命令总结

```powershell
# 1. 检查登录状态
vercel whoami

# 2. 部署到生产环境
vercel --prod

# 3. 配置环境变量后，拉取并迁移数据库
vercel env pull .env.local
npx prisma db push

# 4. 重新部署
vercel --prod
```

---

## 📞 需要帮助？

如果遇到问题：
1. 查看 Vercel Dashboard 中的构建日志
2. 检查环境变量配置
3. 验证数据库连接状态
4. 查看服务器函数日志

---

**最后更新**: 2026-02-05  
**检查人**: AI Assistant  
**状态**: ✅ 已准备好部署
