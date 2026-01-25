# Vercel 部署指南

## 部署前准备

### 1. 环境变量配置

在Vercel项目设置中需要配置以下环境变量：

#### 必需的环境变量：

1. **DATABASE_URL**
   - 在Vercel Dashboard中创建PostgreSQL数据库
   - 复制连接字符串
   - 格式：`postgresql://user:password@host:5432/database?sslmode=require`

2. **JWT_SECRET**
   - 生成随机字符串（建议使用：`openssl rand -base64 32`）
   - 或使用在线工具生成

3. **DEEPSEEK_API_KEY**
   - 值：`sk-7586d9f6564d40328f886b8f0b0fef1c`

### 2. 数据库迁移

部署后需要在Vercel中运行数据库迁移：

```bash
npx prisma db push
```

或者通过Vercel CLI：
```bash
vercel env pull .env.local
npx prisma db push
```

## 部署步骤

### 方法1：使用Vercel CLI（推荐）

1. 登录Vercel：
   ```bash
   vercel login
   ```

2. 在项目目录中部署：
   ```bash
   vercel
   ```

3. 按照提示完成部署：
   - 选择项目范围（个人/团队）
   - 确认项目名称
   - 确认部署设置

4. 配置环境变量：
   ```bash
   vercel env add DATABASE_URL
   vercel env add JWT_SECRET
   vercel env add DEEPSEEK_API_KEY
   ```

5. 重新部署以应用环境变量：
   ```bash
   vercel --prod
   ```

### 方法2：通过GitHub集成

1. 在Vercel Dashboard中导入GitHub仓库
2. 配置环境变量
3. 自动部署

## 部署后操作

1. **运行数据库迁移**：
   - 在Vercel项目设置中找到数据库
   - 运行 `npx prisma db push` 或使用Vercel CLI

2. **验证部署**：
   - 访问部署的URL
   - 使用管理员密码 `admin888` 登录测试

## 注意事项

- 数据库已从SQLite改为PostgreSQL（适配Vercel）
- Json字段已恢复为PostgreSQL的Json类型
- 确保所有环境变量都已正确配置
- 首次部署后需要运行数据库迁移
