# 专升本学习系统

专升本教学培训机构的学习管理系统，包含用户管理系统和学习测评系统。

## 功能特性

### 用户系统
- **管理端**: 创建教师账号、查看统计
- **教师端**: 创建学生账号（可注销）、查看学生报告、布置作业
- **学生端**: 学习系统核心功能

### 学习系统
- **AI通关测**: 四个学科（大学语文、大学英语、高等数学、计算机基础）的智能测评
- **AI错题本**: 查看历史测评报告
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

1. 将代码推送到GitHub仓库

2. 在Vercel中导入项目

3. 配置环境变量：
   - `DATABASE_URL`: Vercel Postgres连接字符串
   - `JWT_SECRET`: 随机生成的密钥
   - `DEEPSEEK_API_KEY`: Deepseek API密钥

4. 部署完成后，运行数据库迁移：
   - 在Vercel项目设置中，找到数据库，运行 `npx prisma db push`

## 默认管理员密码

- 管理员密码: `admin888`

## 注意事项

- 教师账号由管理员创建，永久有效
- 学生账号由教师创建，可被注销（数据永久删除）
- 所有密码使用bcrypt加密存储
- Deepseek API调用需要网络连接
