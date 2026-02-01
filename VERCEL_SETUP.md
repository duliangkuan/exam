# Vercel 部署完整指南

## ✅ 已完成的准备工作

1. ✅ 数据库配置已改为PostgreSQL（适配Vercel）
2. ✅ Json字段已恢复为PostgreSQL的Json类型
3. ✅ 代码已更新以适配PostgreSQL
4. ✅ Vercel CLI已安装
5. ✅ vercel.json配置文件已更新

## 📋 部署步骤

### 第一步：登录Vercel

在终端中运行：
```bash
vercel login
```

按照提示：
1. 按回车键打开浏览器
2. 在浏览器中完成登录
3. 返回终端确认

### 第二步：创建Vercel Postgres数据库

1. 访问 [Vercel Dashboard](https://vercel.com/dashboard)
2. 进入你的项目（或创建新项目）
3. 点击 "Storage" 标签
4. 创建 "Postgres" 数据库
5. 复制数据库连接字符串（DATABASE_URL）

### 第三步：部署项目

#### 方法A：使用部署脚本（推荐）

```powershell
.\deploy-vercel.ps1
```

#### 方法B：手动部署

```bash
# 1. 部署到预览环境
vercel

# 2. 配置环境变量（在Vercel Dashboard中）
# 或使用CLI：
vercel env add DATABASE_URL
vercel env add JWT_SECRET
vercel env add DEEPSEEK_API_KEY

# 3. 部署到生产环境
vercel --prod
```

### 第四步：配置环境变量

在Vercel Dashboard中设置以下环境变量：

| 变量名 | 值 | 说明 |
|--------|-----|------|
| `DATABASE_URL` | `postgresql://...` | Vercel Postgres连接字符串 |
| `JWT_SECRET` | 随机字符串 | 使用 `openssl rand -base64 32` 生成 |
| `DEEPSEEK_API_KEY` | `sk-7586d9f6564d40328f886b8f0b0fef1c` | Deepseek API密钥 |

### 第五步：运行数据库迁移

```bash
# 拉取环境变量到本地
vercel env pull .env.local

# 运行数据库迁移
npx prisma db push
```

### 第六步：重新部署

配置环境变量后，重新部署以应用更改：

```bash
vercel --prod
```

## 🔍 验证部署

1. 访问部署的URL（Vercel会提供）
2. 测试管理员登录（密码：`admin888`）
3. 创建教师账号
4. 创建学生账号
5. 测试学习系统功能

## ⚠️ 重要提示

1. **数据库迁移必须在配置环境变量后运行**
2. **确保所有环境变量都已正确配置**
3. **首次部署后需要手动运行数据库迁移**
4. **如果部署失败，检查Vercel构建日志**

## 🐛 常见问题

### 问题1：构建失败
- 检查 `package.json` 中的依赖是否正确
- 确保 `prisma generate` 在构建命令中

### 问题2：数据库连接失败
- 检查 `DATABASE_URL` 环境变量是否正确
- 确保Vercel Postgres数据库已创建

### 问题3：环境变量未生效
- 确保环境变量已添加到生产环境
- 重新部署项目

## 📞 需要帮助？

如果遇到问题，检查：
1. Vercel Dashboard中的构建日志
2. 环境变量配置
3. 数据库连接状态
