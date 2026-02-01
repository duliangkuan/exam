# 专升本学习系统

专升本教学培训机构的学习管理系统，包含用户管理系统和学习测评系统。

## 功能特性

### 用户系统
- **管理端**: 创建教师账号、查看统计
- **教师端**: 创建学生账号（可注销）、查看学生报告、布置作业
- **学生端**: 学习系统核心功能

### 学习系统
- **AI通关测**: 四个学科（大学语文、大学英语、高等数学、计算机基础）的智能测评
- **AI错题本**: 错题管理与智能分析
- **学习计划**: 接收教师布置的作业

## 技术栈

- Next.js 14+ (App Router)
- TypeScript
- Tailwind CSS
- Prisma (PostgreSQL)
- Deepseek API

## 快速开始

1. 安装依赖：
```bash
npm install
```

2. 配置环境变量（复制 `.env.example` 为 `.env.local`，填入配置）

3. 初始化数据库：
```bash
npx prisma generate
npx prisma db push
```

4. 运行开发服务器：
```bash
npm run dev
```

## 部署到 Vercel

详见 [VERCEL_SETUP.md](./VERCEL_SETUP.md)。或使用部署脚本：

```powershell
.\deploy-vercel.ps1
```

## 默认账号

- 管理员密码: `admin888`

## 注意事项

- 教师账号由管理员创建
- 学生账号由教师创建，可被注销
- 所有密码使用 bcrypt 加密存储
