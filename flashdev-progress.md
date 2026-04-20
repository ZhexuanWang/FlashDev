---
# FlashDev — 项目技术文档

> 最后更新：2026-04-20  
> 当前阶段：Phase 21 — 未来扩展（规划中）

---

## 一、项目概述

FlashDev 是一个面向编程服务公司的多页面展示网站，支持项目展示、团队介绍、联系表单，
并内置了一套供公司账号使用的可视化内容编辑系统（Editor Mode）和权限管理面板。

**核心特性：**
- 双语支持（中文 / English），运行时切换
- 两种首页菜单风格：星空（Starfield）/ 闪电（Lightning）
- 公司账号可直接在页面上点击编辑文字，自动保存
- 三种项目类型：展示项目 / 出售源码 / 定制开发
- 公司账号管理 admin 权限开关

---

## 二、技术栈

| 层级 | 技术 | 版本 / 说明 |
|---|---|---|
| 前端框架 | Vite + React + TypeScript | React 19，严格 verbatimModuleSyntax |
| 样式 | Tailwind CSS | 配合内联样式 |
| 路由 | React Router | v6 |
| 状态管理 | Zustand | authStore / editorStore / powerStore |
| 国际化 | react-i18next | 中文 + 英文，运行时切换 |
| 3D 渲染 | Three.js / React Three Fiber | r9 + drei v10，React 19 兼容版 |
| 后端框架 | NestJS | v11（禁止混用 v10 包） |
| 数据库 | PostgreSQL + Prisma | schema 位于 backend/prisma/schema.prisma |
| 身份验证 | JWT + Passport | 无状态，基于角色 |
| 邮件服务 | Nodemailer | 联系表单发送 |
| 部署（规划） | Docker + Nginx | Phase 20 |

---

## 三、重要开发规范

- `useRef<T>` 必须写 `useRef<T | null>(null)`，不能写 `useRef<T>(null)`（React 19）
- 所有 type-only import 必须使用 `import type {...}`（verbatimModuleSyntax）
- NestJS 包版本必须全部为 v11，不可混装 v10
- Prisma schema 路径：`backend/prisma/schema.prisma`（package.json 已配置）
- COMPANY 账号：正常注册后在 Prisma Studio 手动将 role 改为 COMPANY
- 根目录 tsconfig.json 必须保留 `"files": []`，不能添加 `"include": ["src"]`
- Three.js Clock 警告为已知 react-three-fiber 内部问题，无害可忽略
---

## 四、数据库模型（Prisma）

User
  id          String
  email       String   (unique)
  password    String   (bcrypt)
  role        Enum     COMPANY | ADMIN | USER
  permissions Json     (按功能的权限开关)
  isActive    Boolean  (禁用 admin 账号用)

SiteConfig
  key         String   (PK)
  value       String
  updatedAt   DateTime

Project
  id          String
  title       Json     { zh: string, en: string }
  description Json     { zh: string, en: string }
  type        Enum     showcase | for_sale | custom
  category    ProjectCategory (关联)
  media       String[] (图片/视频 URL 数组)
  price       Float?   (for_sale 类型填写)
  isPublished Boolean

ProjectCategory
  id    String
  name  Json   { zh: string, en: string }
  icon  String (emoji)
  order Int

TeamMember
  id        String
  name      Json     { zh: string, en: string }
  role      Json     { zh: string, en: string }
  bio       Json     { zh: string, en: string }
  avatar    String?
  github    String?
  order     Int
  isVisible Boolean

Translation
  lang  String  ← 复合主键
  key   String  ← 复合主键
  value String

---

## 五、API 端点

| 方法    | 路径                      | 权限            | 说明               |
| ----- | ----------------------- | ------------- | ---------------- |
| POST  | /api/auth/register      | 无             | 注册新用户            |
| POST  | /api/auth/login         | 无             | 登录，返回 JWT + role |
| GET   | /api/site-config        | 无             | 获取全部配置           |
| GET   | /api/site-config/:key   | 无             | 获取单项配置           |
| PUT   | /api/site-config/:key   | COMPANY       | 更新单项配置           |
| PATCH | /api/site-config        | COMPANY       | 批量更新配置           |
| GET   | /api/projects           | 无             | 项目列表             |
| GET   | /api/projects/:id       | 无             | 项目详情             |
| POST  | /api/projects           | COMPANY/ADMIN | 新建项目             |
| PATCH | /api/projects/:id       | COMPANY/ADMIN | 编辑项目             |
| GET   | /api/project-categories | 无             | 分类列表             |
| GET   | /api/team               | 无             | 团队成员列表           |
| PATCH | /api/team/:id           | COMPANY/ADMIN | 编辑团队成员           |
| GET   | /api/users              | COMPANY       | 用户权限管理           |
| POST  | /api/contact            | 无             | 发送联系邮件           |

---

## 六、SiteConfig 配置项

| Key                 | 默认值                  | 说明                  |
| ------------------- | -------------------- | ------------------- |
| theme.primary       | 0ea5e9               | 主色调（sky-500）        |
| theme.glow          | 38bdf8               | 发光强调色               |
| default.menu        | starfield            | 首页菜单风格              |
| intro.video.url     | （空）                  | Splash 视频 URL，空则用动画 |
| contact.email       | contact@flashdev.com | 联系表单收件邮箱            |
| rtl.enabled         | false                | RTL 布局开关            |
| splash.skip.allowed | false                | 锁定，始终为 false        |

## 七、项目文件结构flashdev-web/

## 八、前端状态管理

### authStore.ts

- `token` — JWT 字符串
- `role` — COMPANY | ADMIN | USER
- `login()` — 存储 token/role，COMPANY/ADMIN 自动触发 `enterEditMode()`
- `logout()` — 清空状态，触发 `exitEditMode()`
- `isCompany()` — role === 'COMPANY'
- `isAdmin()` — role === 'ADMIN'

### editorStore.ts

- `isEditing` — 控制所有 EditableText 是否可编辑
- `token / role` — 当前编辑者信息
- `enterEditMode()` — 设置 isEditing = true
- `exitEditMode()` — 设置 isEditing = false

### powerStore.ts

- Lightning 菜单能量值（0-100）、充能、衰减、设施激活逻辑

### siteStore.ts

- `config: Record<string, string>` — 全部 SiteConfig
- `primary` / `glow` — 当前主题色（来自 `theme.primary` / `theme.glow`）
- `setConfig(config)` — 由 `useTheme` 调用
- `setTheme(primary, glow)` — 由 `useTheme` 和 `ThemeEditor` 调用

* * *

## 九、国际化结构

`i18n/zh.ts` 和 `i18n/en.ts` 导出相同结构的翻译对象：

- `nav` — 导航菜单
- `splash` — Splash 页
- `projects` — 项目页（标题、筛选、价格、按钮）
- `team` — 团队页
- `contact` — 联系表单（所有字段 + 状态文字）
- `common` — 通用（返回、加载中）
- `lightning` — 闪电菜单
- `editor` — 编辑工具栏（toolbar.*、clickToEdit、saving、saved、cancel）

数据库多语言字段统一格式：`{ "zh": "...", "en": "..." }`
前端取值：`const lang = i18n.language === 'zh' ? 'zh' : 'en'`

---

## 十、阶段进度

| Phase | 名称                      | 状态     |
| ----- | ----------------------- | ------ |
| 0     | 项目确认与方向                 | ✅ 完成   |
| 1     | 项目初始化                   | ✅ 完成   |
| 2     | 前端基础搭建                  | ✅ 完成   |
| 3     | 后端基础搭建                  | ✅ 完成   |
| 4     | 数据库与 Prisma             | ✅ 完成   |
| 5     | Prisma Service          | ✅ 完成   |
| 6     | 身份验证系统                  | ✅ 完成   |
| 7     | 站点配置系统                  | ✅ 完成   |
| 8     | 前端路由与 Splash 页          | ✅ 完成   |
| 9     | 首页菜单系统                  | ✅ 完成   |
| 10    | Starfield 星空菜单          | ✅ 完成   |
| 11    | Lightning 闪电菜单          | ✅ 完成   |
| 12    | 项目展示系统                  | ✅ 完成   |
| 13    | 团队介绍系统                  | ✅ 完成   |
| 14    | 邮件联系系统                  | ✅ 完成   |
| 15    | 国际化与 RTL                | ✅ 完成   |
| 16    | 编辑模式（Editor Mode）       | ✅ 完成   |
| 17    | 权限面板（Permissions Panel） | ✅ 完成   |
| 18    | 主题系统                    | ✅ 完成   |
| 19    | 测试与验证                   | ✅ 完成   |
| 20    | 部署准备（Docker + Nginx）    | ✅ 完成   |
| 21    | 未来扩展                    | ⬜ 规划中  |

---

## 十一、Phase 17 当前进度

**已完成：**

- `User` 模型含 `permissions Json` 和 `isActive` 字段
- `auth.service.ts` 登录时检查 `isActive` 状态
- `PermissionsPage.tsx` 从 `/api/users` 拉取用户并显示权限管理 UI
- `editorStore` 含 `role` 字段和 `enterEditMode` / `exitEditMode`
- `authStore.login()` 在 COMPANY / ADMIN 登录后自动调用 `enterEditMode()`
- `authStore.logout()` 调用 `exitEditMode()`
- 统一权限 key 格式：`manage_projects` / `manage_team` / `manage_categories` / `view_users` / `send_announcements`（`usePermissions.ts` 与 `permissions.ts` 对齐）
- `EditableText` / `EditableTextarea` 新增 `permission?: PermissionKey` prop，不传则允许编辑
- `useHasPermission(permission)` 在 COMPANY 角色返回 true，ADMIN 按 DB 存储值控制
- `ProjectDetailPage` 的 `EditableText` / `EditableTextarea` 已传入 `permission="manage_projects"`
- 后端 PATCH `/api/users/:id/permissions` 和 PATCH `/api/users/:id/active` 接口已实现

---

## 十三、Phase 18 完成记录

**已完成：**

- `useTheme` 更新后同步写入 `siteStore`（`setConfig` + `setTheme`）
- `applyTheme` 同时设置 `--color-primary` / `--color-glow` / `--color-brand` / `--color-brand-glow`
- `index.css` 的 `@theme` 块加入 `--color-brand: var(--color-primary)`，使 Tailwind v4 生成 `text-brand`、`bg-brand`、`border-brand` 等工具类
- `ThemeEditor` 从 `siteStore` 读取初始色值（而非硬编码），保存后同步更新 store
- `ThemeEditor` 嵌入 `EditorToolbar` 下方，COMPANY 登录后自动可见
- 修复 seed 和后端 `ALLOWED_KEYS` 的 key 命名：从 underscore 改为 dot（`theme.primary` / `theme.glow` 等），与进度文档保持一致
- `applyTheme` 对输入值做 `#` 前缀兼容处理，可兼容旧数据（带 `#`）和新数据（不带 `#`）

---

## 十四、Phase 19 完成记录

**已完成：**

- 安装 `@types/jest` 并配置 `tsconfig.json` 的 `types: ["node", "jest"]`
- `auth.service.spec.ts` — 21 tests covering:
  - Login: success, user not found, inactive account, wrong password
  - Register: success, duplicate email
  - `bcrypt` 模块级别 mock，`beforeEach` 重置 `bcrypt.compare` 默认值
- `users.service.spec.ts` — 8 tests covering:
  - `findByEmail` / `create` / `findAll`
  - `updatePermissions`: success, COMPANY forbidden, not found
  - `setActive`: success, COMPANY forbidden, not found
- `roles.guard.spec.ts` — 5 tests covering:
  - No roles required → allowed
  - Role matches → allowed
  - Role mismatch / missing → denied
- 运行命令：`cd backend && npx jest --no-coverage`

---

## 十五、Phase 20 完成记录

**已完成：**

- `backend/Dockerfile` — multi-stage (node:18-alpine build → prod), `npm ci --omit=dev`
- `frontend/Dockerfile` — multi-stage (node:18-alpine build Vite → nginx:alpine serve), context = repo root
- `docker-compose.yml` — 4 services: `postgres:16-alpine`, `backend`, `frontend`, `nginx:alpine` on `:80`
  - `postgres`: healthcheck via `pg_isready`, persisted volume
  - `backend`: depends on `postgres` (healthy), env via `${VAR:?required}`, uploads volume
  - `frontend`: depends on `backend`, serves built dist
  - `nginx`: reverse proxy — `/api/` + `/uploads/` → backend:3000, all else → frontend:80
- `nginx.conf` — upstream definitions, `proxy_set_header` for real IP and scheme
- `.dockerignore` — backend + frontend; excludes `node_modules`, `dist`, `.env`
- `.gitignore` — excludes `.env`, `node_modules/`, `dist/`, `uploads/`, IDE files
- `backend/.env` 从 git 移除跟踪（`git update-index --assume-unchanged`），通过 `.env.example` 提供模板
- `.env.example`（根目录 + backend/）提供所有必需环境变量模板

**部署命令：**
```bash
cp .env.example .env          # 填写 JWT_SECRET 和邮件配置
docker compose up --build     # 首次构建
docker compose up -d          # 后续启动
docker compose exec backend npx prisma migrate deploy  # 数据库迁移
docker compose exec backend npm run seed                # 数据初始化
```


---

## 十二、已知注意事项

1. `EditableText` / `EditableTextarea` 所有硬编码中文必须替换为 `t()` 调用
2. `ProjectsPage` 分类筛选按钮须用 `cat.name[lang]` 而不是 `cat.name.zh`
3. 数据库所有多语言字段必须是 JSON 格式：`{"zh": "...", "en": "..."}`
4. `JwtAuthGuard` 使用自定义 Guard 类，不直接用 `AuthGuard('jwt')`（NestJS v11 类型问题）
5. COMPANY 账号需在 Prisma Studio 手动设置 role，不通过注册接口设置
