# Vercel 云端数据库连接指南

## 📋 概述

本指南将帮助您连接 Vercel Postgres 云端数据库到您的项目。

## 🚀 步骤一：在 Vercel Dashboard 创建数据库

### 1. 登录 Vercel Dashboard
访问 [https://vercel.com/dashboard](https://vercel.com/dashboard) 并登录您的账号。

### 2. 选择或创建项目
- 如果项目已存在，点击进入项目
- 如果项目不存在，先部署项目或创建新项目

### 3. 创建 Postgres 数据库
1. 在项目页面，点击顶部菜单栏的 **"Storage"** 标签
2. 点击 **"Create Database"** 按钮
3. 选择 **"Postgres"** 数据库类型
4. 选择数据库计划（Hobby 免费版即可用于开发）
5. 选择数据库所在区域（建议选择离您最近的区域，如 `Southeast Asia (Singapore)`）
6. 输入数据库名称（例如：`exam-db`）
7. 点击 **"Create"** 创建数据库

### 4. 获取数据库连接字符串
数据库创建成功后：
1. 点击数据库卡片进入详情页
2. 在 **"Connection String"** 部分，点击 **"Copy"** 复制连接字符串
3. 连接字符串格式类似：
   ```
   postgres://default:password@host.vercel-storage.com:5432/verceldb
   ```

## 🔧 步骤二：配置环境变量

### 方法 A：在 Vercel Dashboard 中配置（推荐）

1. 在项目页面，点击顶部菜单栏的 **"Settings"** 标签
2. 在左侧菜单选择 **"Environment Variables"**
3. 添加以下环境变量：

| 变量名 | 值 | 环境 | 说明 |
|--------|-----|------|------|
| `DATABASE_URL` | `postgresql://...` | Production, Preview, Development | 从步骤一复制的连接字符串 |
| `JWT_SECRET` | 随机字符串 | Production, Preview, Development | 使用 `openssl rand -base64 32` 生成 |
| `DEEPSEEK_API_KEY` | `sk-7586d9f6564d40328f886b8f0b0fef1c` | Production, Preview, Development | Deepseek API 密钥 |
| `TEXTIN_APP_ID` | `0e5b56a003c7a2bd613302180ad60de0` | Production, Preview, Development | Textin OCR App ID |
| `TEXTIN_SECRET_CODE` | `7b823a7b278fe8df1a1a45e63e23d68f` | Production, Preview, Development | Textin OCR Secret Code |

4. 确保每个变量都勾选了 **Production**、**Preview** 和 **Development** 环境
5. 点击 **"Save"** 保存

### 方法 B：使用 Vercel CLI 配置

```powershell
# 设置 DATABASE_URL
vercel env add DATABASE_URL production
# 粘贴连接字符串，按回车确认

# 设置 JWT_SECRET（生成随机字符串）
$jwtSecret = -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | ForEach-Object {[char]$_})
vercel env add JWT_SECRET production
# 粘贴生成的密钥，按回车确认

# 设置其他环境变量
vercel env add DEEPSEEK_API_KEY production
vercel env add TEXTIN_APP_ID production
vercel env add TEXTIN_SECRET_CODE production
```

## 📥 步骤三：拉取环境变量到本地

在本地开发时，需要将 Vercel 的环境变量拉取到本地：

```powershell
# 拉取环境变量到 .env.local 文件
vercel env pull .env.local
```

这会创建一个 `.env.local` 文件，包含所有配置的环境变量。

## 🗄️ 步骤四：运行数据库迁移

### 在本地运行迁移（推荐）

```powershell
# 确保 .env.local 文件存在（包含 DATABASE_URL）
# 运行数据库迁移
npx prisma db push

# 或者使用迁移命令（如果使用迁移文件）
npx prisma migrate deploy
```

### 在 Vercel 上运行迁移

Vercel 的 `vercel.json` 配置中已经包含了 `prisma db push`，所以每次部署时会自动运行。

如果需要手动运行：

1. 在 Vercel Dashboard 中，进入项目的 **"Deployments"** 标签
2. 点击最新的部署记录
3. 点击 **"View Function Logs"** 查看构建日志
4. 确认 `prisma db push` 成功执行

## ✅ 步骤五：验证数据库连接

### 方法 1：使用 Prisma Studio（可视化工具）

```powershell
# 确保 .env.local 存在并包含 DATABASE_URL
npx prisma studio
```

这会打开浏览器，显示数据库的可视化界面，您可以查看和编辑数据。

### 方法 2：使用 SQL 查询

在 Vercel Dashboard 中：
1. 进入数据库详情页
2. 点击 **"Query"** 标签
3. 运行 SQL 查询，例如：
   ```sql
   SELECT * FROM wrong_books LIMIT 10;
   ```

### 方法 3：在代码中测试

创建一个测试 API 路由或使用现有的 API 来验证连接。

## 🔍 步骤六：检查连接状态

### 检查环境变量是否正确配置

```powershell
# 检查本地环境变量
Get-Content .env.local | Select-String "DATABASE_URL"

# 检查 Vercel 环境变量
vercel env ls
```

### 检查数据库连接

```powershell
# 使用 Prisma 验证连接
npx prisma db pull
```

如果连接成功，会显示数据库的 schema。

## ⚠️ 常见问题

### 问题 1：连接字符串格式错误

**错误信息**：`Invalid connection string`

**解决方法**：
- 确保连接字符串以 `postgresql://` 或 `postgres://` 开头
- 检查连接字符串中是否包含特殊字符，需要 URL 编码
- 确保连接字符串完整（包含用户名、密码、主机、端口、数据库名）

### 问题 2：SSL 连接失败

**错误信息**：`SSL connection required`

**解决方法**：
- 在连接字符串末尾添加 `?sslmode=require`
- 完整格式：`postgresql://user:password@host:5432/database?sslmode=require`

### 问题 3：权限不足

**错误信息**：`permission denied`

**解决方法**：
- 确保使用的是数据库的默认用户（`default`）
- 检查数据库是否已正确创建
- 确认环境变量已正确配置

### 问题 4：数据库迁移失败

**错误信息**：`Migration failed`

**解决方法**：
1. 检查 Prisma schema 是否正确
2. 确保数据库连接正常
3. 尝试使用 `--accept-data-loss` 标志（会丢失数据）：
   ```powershell
   npx prisma db push --accept-data-loss
   ```

## 📝 完整连接流程总结

```powershell
# 1. 登录 Vercel
vercel login

# 2. 拉取环境变量到本地
vercel env pull .env.local

# 3. 运行数据库迁移
npx prisma db push

# 4. 生成 Prisma Client
npx prisma generate

# 5. 验证连接（可选）
npx prisma studio
```

## 🔐 安全提示

1. **不要将 `.env.local` 文件提交到 Git**
   - 确保 `.gitignore` 中包含 `.env.local`
   
2. **生产环境使用强密码**
   - `JWT_SECRET` 应该使用随机生成的强密码
   - 可以使用 PowerShell 生成：
     ```powershell
     -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | ForEach-Object {[char]$_})
     ```

3. **定期备份数据库**
   - 在 Vercel Dashboard 中可以导出数据库备份

## 📞 需要帮助？

如果遇到问题：
1. 检查 Vercel Dashboard 中的数据库状态
2. 查看 Vercel 构建日志
3. 确认所有环境变量已正确配置
4. 验证 Prisma schema 是否正确

---

**最后更新**：2026-02-05
