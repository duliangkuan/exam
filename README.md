# 专升本学习系统

专升本教学培训机构的学习管理系统，包含用户管理系统和学习测评系统。

## 功能特性

### 用户系统
- **管理端**: 创建教师账号、查看统计
- **教师端**: 创建学生账号（可注销）、查看学生报告、布置作业
- **学生端**: 学习系统核心功能

### 学习系统
- **AI通关测**: 四个学科（大学语文、大学英语、高等数学、计算机基础）的智能测评
- **AI错题本**: 学生自定义上传错题、分类保存，支持 OCR 录入、AI 解析与举一反三（与测评报告、AI通关测隔离）
- **学习计划**: 接收教师布置的作业
- **AI精准练**: 暂未上线

## 技术栈

- Next.js 14+ (App Router)
- TypeScript
- Tailwind CSS
- Prisma (PostgreSQL)
- Deepseek API

## 安装步骤

1. 安装依赖：
```bash
npm install
```

2. 配置环境变量：
```bash
cp .env.example .env
# 编辑 .env 文件，填入数据库连接等信息
```

3. 初始化数据库：
```bash
npx prisma generate
npx prisma db push
```

4. 运行开发服务器：
```bash
npm run dev
```

## 部署到Vercel

### 快速部署步骤

1. **将代码推送到GitHub仓库**
   ```bash
   git add .
   git commit -m "准备部署到Vercel"
   git push origin main
   ```

2. **在Vercel中导入项目**
   - 访问 [Vercel Dashboard](https://vercel.com/dashboard)
   - 点击 "Add New" → "Project"
   - 导入 GitHub 仓库

3. **配置环境变量**（在 Vercel Dashboard → Settings → Environment Variables）
   
   **必需的环境变量**（必须添加到 Production、Preview、Development 三个环境）：
   - `DATABASE_URL`: Vercel Postgres 连接字符串（推荐使用 Prisma Accelerate）
   - `JWT_SECRET`: 随机生成的密钥（生产环境必须使用强密码）
   - `DEEPSEEK_API_KEY`: Deepseek API 密钥
   - `TEXTIN_APP_ID`: Textin OCR App ID
   - `TEXTIN_SECRET_CODE`: Textin OCR Secret Code
   
   **可选的环境变量**：
   - `NEXT_PUBLIC_CENTER_LOGO_IMAGE`: 学生端仪表盘 Logo 路径（如：`/images/logo.png`）

4. **部署**
   - 使用部署脚本：`.\deploy-vercel.ps1`
   - 或手动部署：`vercel --prod`

5. **数据库迁移**（已自动配置）
   - `vercel.json` 中已配置自动迁移：`prisma db push --accept-data-loss`
   - 首次部署后会自动运行数据库迁移
   - 如果自动迁移失败，可以手动运行：
     ```bash
     vercel env pull .env.local
     npx prisma db push
     ```

### 详细部署指南

查看 `DEPLOYMENT_READY.md` 获取完整的部署检查清单和故障排除指南。

## 默认管理员密码

- 管理员密码: `admin888`

## 注意事项

- 教师账号由管理员创建，永久有效
- 学生账号由教师创建，可被注销（数据永久删除）
- 所有密码使用bcrypt加密存储
- Deepseek API调用需要网络连接
