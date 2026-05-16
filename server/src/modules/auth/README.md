# 认证模块使用说明

## 已创建的文件

### 1. 认证服务 - `src/modules/auth/auth.service.ts`
提供以下方法：
- `register(registerDto)` - 用户注册，使用bcrypt加密密码
- `login(loginDto)` - 用户登录，返回JWT token
- `validateUser(userId)` - 验证用户
- `sanitizeUser(user)` - 移除密码字段

### 2. 认证控制器 - `src/modules/auth/auth.controller.ts`
提供以下端点：
- `POST /auth/register` - 用户注册
- `POST /auth/login` - 用户登录
- `GET /auth/me` - 获取当前用户（需要JWT认证）

### 3. JWT策略 - `src/modules/auth/strategies/jwt.strategy.ts`
- 从Authorization header提取Bearer token
- 验证token并返回用户信息

### 4. JWT守卫 - `src/common/guards/jwt-auth.guard.ts`
- 使用Passport的JWT策略保护路由

### 5. 当前用户装饰器 - `src/modules/auth/decorators/current-user.decorator.ts`
- 方便在控制器中获取当前登录用户

### 6. DTOs
- `src/modules/auth/dto/register.dto.ts` - 注册数据验证
- `src/modules/auth/dto/login.dto.ts` - 登录数据验证

## 环境配置

在 `.env` 文件中配置以下环境变量：

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/ai_novel_platform?schema=public"
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
```

## 使用示例

### 注册用户
```bash
POST /auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "name": "用户名"
}
```

### 登录
```bash
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

### 获取当前用户
```bash
GET /auth/me
Authorization: Bearer <your-jwt-token>
```

## 依赖项

所有依赖已在 `package.json` 中配置：
- `@nestjs/jwt` - JWT支持
- `@nestjs/passport` - Passport集成
- `passport-jwt` - JWT策略
- `bcrypt` - 密码加密
- `class-validator` - 数据验证
- `class-transformer` - 数据转换

## 下一步

1. 安装依赖：`npm install`
2. 生成Prisma客户端：`npm run prisma:generate`
3. 运行数据库迁移：`npm run prisma:migrate`
4. 启动开发服务器：`npm run start:dev`
