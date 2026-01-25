# 部署指南

## 准备工作

### 1. 复制JSON数据文件

请将以下文件从 `c:\Users\23303\OneDrive\ドキュメント\` 复制到项目的 `data\` 目录：

- `chinese_exam_nodes.json`
- `english_exam_nodes.json`
- `math_exam_nodes.json`
- `computer_exam_nodes.json`

### 2. 安装依赖

```bash
npm install
```

### 3. 配置环境变量

创建 `.env` 文件（参考 `.env.example`）：

```env
DATABASE_URL="postgresql://user:password@host:5432/database?sslmode=require"
JWT_SECRET="your-secret-key-change-in-production"
DEEPSEEK_API_KEY="sk-7586d9f6564d40328f886b8f0b0fef1c"
```

### 4. 初始化数据库

```bash
npx prisma generate
npx prisma db push
```

## 本地开发

```bash
npm run dev
```

访问 http://localhost:3000

## 部署到Vercel

1. **推送代码到GitHub**

2. **在Vercel中导入项目**

3. **配置环境变量**：
   - 在Vercel项目设置中添加环境变量
   - `DATABASE_URL`: 创建Vercel Postgres数据库，复制连接字符串
   - `JWT_SECRET`: 生成随机字符串（可使用 `openssl rand -base64 32`）
   - `DEEPSEEK_API_KEY`: `sk-7586d9f6564d40328f886b8f0b0fef1c`

4. **部署后运行数据库迁移**：
   - 在Vercel项目设置中，找到数据库
   - 运行 `npx prisma db push`

5. **验证部署**：
   - 访问部署的URL
   - 使用管理员密码 `admin888` 登录管理端

## 默认账号

- **管理员密码**: `admin888`

## 注意事项

- 确保所有JSON数据文件已正确复制到 `data\` 目录
- 数据库连接字符串必须正确配置
- Deepseek API密钥已包含在代码中，如需更改请修改 `lib/deepseek.ts`
