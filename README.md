# Novel AI - AI 辅助长篇小说创作平台

一个专为长篇小说作者设计的 AI 辅助创作平台，提供完整的世界观管理、人物档案、章节编辑和一致性检查功能。

## 技术栈

### 前端
- React 18 + TypeScript
- Tailwind CSS
- React Query (数据管理)
- Zustand (状态管理)
- React Router (路由)
- Vite (构建工具)
- Nginx (生产环境部署)

### 后端
- NestJS + TypeScript
- Prisma (ORM)
- PostgreSQL (数据库)

## 项目结构

```
.
├── client/             # 前端应用
│   ├── src/
│   │   ├── components/ # UI 组件
│   │   ├── pages/      # 页面组件
│   │   ├── api/        # API 客户端
│   │   ├── store/      # 状态管理
│   │   ├── types/      # TypeScript 类型
│   │   └── utils/      # 工具函数
│   ├── Dockerfile
│   ├── nginx.conf
│   └── package.json
│
├── server/             # 后端应用
│   ├── src/
│   │   ├── modules/    # 业务模块
│   │   ├── common/     # 公共组件
│   │   └── prisma/     # 数据库相关
│   ├── Dockerfile
│   └── package.json
│
├── docker-compose.yml  # Docker 部署配置
└── docs/               # 文档
    └── superpowers/    # 项目规划文档
```

## 快速开始

### 方法一：Docker 部署 (推荐)

#### 前置要求
- Docker 和 Docker Compose

#### 部署步骤

1. 复制环境变量配置文件
```bash
cp .env.example .env
```

2. 根据需要修改 `.env` 文件中的配置（特别是 JWT_SECRET，生产环境一定要修改）

3. 启动所有服务
```bash
docker-compose up -d
```

4. 访问应用
- 前端: http://localhost:3000
- 后端 API: http://localhost:4000
- 数据库: localhost:5432

5. 查看日志
```bash
docker-compose logs -f
```

6. 停止服务
```bash
docker-compose down
```

7. 停止服务并删除数据卷
```bash
docker-compose down -v
```

### 方法二：本地开发

#### 前置要求
- Node.js 18+ 
- PostgreSQL 数据库

#### 安装后端

1. 进入 server 目录
```bash
cd server
```

2. 安装依赖
```bash
npm install
```

3. 配置数据库
复制 `prisma/.env.example` 为 `prisma/.env`，配置数据库连接：
```
DATABASE_URL="postgresql://user:password@localhost:5432/novel_ai"
```

4. 初始化数据库
```bash
npm run prisma:migrate
npm run prisma:generate
```

5. 启动后端服务
```bash
npm run dev
```
后端服务将在 http://localhost:4000 运行

#### 安装前端

1. 进入 client 目录
```bash
cd client
```

2. 安装依赖
```bash
npm install
```

3. 启动开发服务器
```bash
npm run dev
```
前端服务将在 http://localhost:3000 运行

## 功能特性

- ✅ 用户认证 (注册/登录)
- ✅ 项目管理 (创建/编辑/删除)
- ✅ 创作工作台
- 🔄 人物管理 (开发中)
- 🔄 世界观设定 (开发中)
- 🔄 章节编辑器 (开发中)
- 🔄 AI 辅助功能 (开发中)

## 开发说明

### 前端脚本
- `npm run dev`: 启动开发服务器
- `npm run build`: 构建生产版本
- `npm run preview`: 预览构建版本

### 后端脚本
- `npm run dev`: 启动开发服务器
- `npm run build`: 构建生产版本
- `npm run prisma:migrate`: 运行数据库迁移（开发环境）
- `npm run prisma:migrate:deploy`: 部署数据库迁移（生产环境）
- `npm run prisma:generate`: 生成 Prisma 客户端

### Docker 开发
- 构建并启动: `docker-compose up --build`
- 仅构建: `docker-compose build`
- 重启特定服务: `docker-compose restart server`

## 许可证

MIT
