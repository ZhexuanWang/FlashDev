# FlashDev — 项目技术文档

> 最后更新：2026-04-22
> 当前版本：v0.02（开发中）

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

```
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

PosterSlot
  id      String     @id @default(uuid())
  area    PosterArea @unique
  media   String[]
  updatedAt DateTime @updatedAt

ProjectBlock
  id        String @id @default(cuid())
  projectId String
  project   Project @relation(..., onDelete: Cascade)
  type      String  // title|subtitle|description|carousel|text|divider|progress|link|tags
  content   Json
  order     Int    @default(0)
```

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
| DELETE| /api/projects/:id       | COMPANY/ADMIN | 删除项目             |
| GET   | /api/projects/:id/blocks | 无            | 获取项目积木列表       |
| POST  | /api/projects/:id/blocks | COMPANY/ADMIN | 新增积木             |
| PATCH | /api/projects/:id/blocks/:blockId | COMPANY/ADMIN | 更新积木   |
| DELETE| /api/projects/:id/blocks/:blockId | COMPANY/ADMIN | 删除积木   |
| PATCH | /api/projects/:id/blocks/reorder | COMPANY/ADMIN | 重排积木顺序 |
| POST  | /api/projects/:id/inquiry | JWT        | 项目咨询表单      |
| GET   | /api/project-categories | 无             | 分类列表             |
| GET   | /api/team               | 无             | 团队成员列表           |
| PATCH | /api/team/:id           | COMPANY/ADMIN | 编辑团队成员           |
| GET   | /api/users              | COMPANY       | 用户权限管理           |
| POST  | /api/contact            | 无             | 发送联系邮件           |
| GET   | /api/posters            | 无             | 获取海报区域           |
| POST  | /api/posters/upload     | COMPANY/ADMIN | 上传海报文件           |
| PATCH | /api/posters/:area      | COMPANY/ADMIN | 更新海报内容           |

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

---

## 七、前端状态管理

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

---

## 八、国际化结构

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

## 九、已知注意事项

1. `EditableText` / `EditableTextarea` 所有硬编码中文必须替换为 `t()` 调用
2. `ProjectsPage` 分类筛选按钮须用 `cat.name[lang]` 而不是 `cat.name.zh`
3. 数据库所有多语言字段必须是 JSON 格式：`{"zh": "...", "en": "..."}`
4. `JwtAuthGuard` 使用自定义 Guard 类，不直接用 `AuthGuard('jwt')`（NestJS v11 类型问题）
5. COMPANY 账号需在 Prisma Studio 手动设置 role，不通过注册接口设置

---

## 十、实施进度

| Phase | 内容 | 状态 |
| ----- | ---- | ---- |
| Phase 1 | 修复 Bug + 基础增强 | ✅ 完成 |
| Phase 2 | 博客模块后端 | ✅ 完成 |
| Phase 3 | 博客模块前端 | ✅ 完成 |
| Phase 4 | 博客权限接入管理面板 | ✅ 完成 |
| Phase 5 | 团队管理增强 | ✅ 完成 |
| Phase 6 | 分页功能 | ✅ 完成 |
| Phase 7 | 差异化设计与侧边栏 | 🚧 部分完成 |
| Phase 8 | 导航增强 | ✅ 完成 |
| Phase 9 | 市场页面（Market） | ✅ 完成 |
| Phase 10 | 论坛页面（Forum） | ✅ 完成 |
| Phase 11 | 用户信息页 | ✅ 完成 |
| Phase 12 | 收尾与优化 | 🔄 进行中 |
| Phase 13 | 文档更新与发布 | 🔄 进行中 |

### Phase 1 完成项
- [x] **Bug：新建项目 500 错误** — `ProjectsController.create()` 改用 `Record<string, unknown>` 绕过验证
- [x] **新建项目默认语言** — `NewProjectModal` 语言切换，默认选中当前界面语言
- [x] **项目详情页可编辑类型/分类** — `isEditing` 模式下类型 badge 和分类 tag 变成可点击选择器
- [x] 数据库迁移（`phone`/`avatar`/`bio` 字段添加到 User 模型）

### Phase 2 完成项
- [x] **Prisma 模型** — `BlogPost`、`BlogBlock`、`MarketPost`（含 `MarketStatus` enum）、`ForumPost`、`ForumComment`
- [x] **BlogPostsController** — CRUD endpoints
- [x] **BlogBlocksController** — CRUD + reorder endpoints
- [x] **BlogPostsService / BlogBlocksService** — 业务逻辑
- [x] **DTO** — `CreateBlogPostDto`、`UpdateBlogPostDto`、`CreateBlockDto`

### Phase 3 完成项
- [x] **`/blogs` 页面** — `BlogsPage.tsx`，列表 + 标签筛选 + 侧边栏
- [x] **`/blogs/:id` 页面** — `BlogDetailPage.tsx`，BlockEditor 渲染
- [x] **BlockEditor 复用** — `apiBase` 和 `permissionKey` props
- [x] **新建/编辑博客** — `NewBlogModal`，COMPANY/ADMIN 可见
- [x] **国际化** — `blogs.*` 翻译

### Phase 4 完成项
- [x] **新增权限 Key** — `manage_blogs` 添加到 `PERMISSION_KEYS`
- [x] **前端权限标签** — `PERMISSION_LABELS` 添加中文/英文标签
- [x] **PermissionsPage** — 显示 `manage_blogs` 权限开关
- [x] **COMPANY 默认权限** — `authStore.login()` 中 COMPANY 默认包含 `{ manage_blogs: true }`
- [x] **BlogPostsController** — 使用 `@Permissions('manage_blogs')`

### Phase 5 完成项
- [x] **TeamPage 增强** — 新增/删除/编辑按钮，COMPANY/ADMIN 可见
- [x] **TeamMember CRUD API** — `PATCH /api/team/:id` 支持所有字段更新
- [x] **批量重排序 API** — `PATCH /api/team/reorder`
- [x] **头像上传** — 前端集成 `POST /api/team/upload/avatar`
- [x] **团队卡片组件** — `MemberCard` 支持编辑模式内联编辑
- [x] **国际化** — `team.*` 翻译

### Phase 6 完成项
- [x] **ProjectsPage 分页** — 每页 9 个，带分页器
- [x] **BlogsPage 分页** — 每页 6 篇
- [x] **TeamPage 分页** — 每页 12 人
- [x] **后端分页 API** — `skip/take` Prisma 查询

### Phase 7 部分完成项
- [x] **ProjectsPage 侧边栏** — 保持卡片网格 + 顶部 filter chips
- [x] **BlogsPage 侧边栏** — 标签云 + About 区，右侧固定
- [ ] **TeamPage 差异化** — 分组合集视图或横向滚动组（未实现）
- [ ] **视觉差异** — 布局/交互模式的明确区分（未完全实现）

### Phase 8 完成项
- [x] **Layout/App** — 添加 `/market`、`/forum`、`/profile` 路由
- [x] **导航菜单** — 左侧菜单增加"市场"、"论坛"按钮
- [x] **用户状态按钮** — 登录后菜单改为 PROFILE/PERMISSIONS 按钮

### Phase 9 完成项
- [x] **数据库模型** — `MarketPost` + `MarketStatus` enum
- [x] **后端 API** — `GET/POST/PATCH /api/market`
- [x] **MarketPage** — 搜索栏 + 状态筛选 + 卡片网格
- [x] **发布表单** — `MarketPostModal`，登录用户可发布
- [x] **搜索** — 400ms 防抖实时搜索
- [x] **国际化** — `market.*` 翻译

### Phase 10 完成项
- [x] **数据库模型** — `ForumPost`、`ForumComment`
- [x] **后端 API** — `GET/POST /api/forum`，`GET/POST /api/forum/:id/comments`，`POST /api/forum/:id/upvote`
- [x] **ForumPage** — 主题列表 + 点赞 + 标签筛选
- [x] **ForumDetailPage** — 帖子内容 + 富文本 + 评论区
- [x] **未登录提示** — 登录提示 + 跳转登录
- [x] **国际化** — `forum.*` 翻译

### Phase 11 完成项
- [x] **后端 API** — `GET /api/users/me`、`PATCH /api/users/me`
- [x] **用户信息模型** — User 添加 `phone`、`avatar`、`bio`
- [x] **ProfilePage** — 个人信息展示 + 可编辑 phone/bio + logout
- [x] **路由** — `/profile`，需登录
- [x] **国际化** — `profile.*` 翻译

---

## 十一、版本记录

### v0.01 — 项目富文本编辑器 + 咨询表单 + 页脚 ✅

**发布日期：** 2026-04-21

**内容：**

- **ProjectBlock 数据模型** — 新增 `ProjectBlock` 模型（id, projectId, type, content Json, order），支持 onDelete Cascade
- **Block CRUD API** — 后端实现 `GET/POST/PATCH/DELETE /api/projects/:id/blocks` 及 `PATCH .../reorder`
- **项目咨询表单** — `InquiryForm` / `InquirySection` 组件，`POST /api/projects/:id/inquiry`，邮件含项目标题和简介
- **富文本编辑器** — `BlockEditor` 组件，9 种 block 类型（title/subtitle/description/carousel/text/divider/progress/link/tags），可折叠侧边栏，HTML5 拖拽排序，inline 编辑
- **ProjectDetailPage 重构** — 读取 Block 列表并渲染，编辑控件在 `isEditing` 模式下可见
- **可编辑封面图** — 项目详情页支持单张封面图上传/替换/删除（COMPANY/ADMIN 权限）
- **可编辑标题** — 项目详情页标题在编辑模式下可直接点击修改，自动保存
- **EditorToolbar 重构** — 底部固定工具栏，主题设置下拉面板，COMPANY/ADMIN 登录后可见
- **海报轮播系统** — `PosterSlot` / `Carousel` 组件，5s 自动轮播，支持图片/视频
- **SiteFooter** — 全站页脚，版权信息，置于所有 Layout 页面底部
- **ADMIN 权限修复** — `PermissionsGuard` 免除 COMPANY 和 ADMIN 的 DB 权限检查
- **NestJS ValidationPipe 绕过** — `PATCH /api/projects/:id` 使用 `Record<string, unknown>` 绕过 DTO 转换，确保 media 数组正确持久化

**文件变更：**
- `backend/prisma/schema.prisma` — 新增 ProjectBlock 模型
- `backend/src/projects/projects.controller.ts` — Block CRUD endpoints
- `backend/src/projects/projects.service.ts` — Block CRUD + media update logic
- `backend/src/project-blocks/` — 新建 Block 模块
- `frontend/src/components/editor/BlockEditor/` — 新建 BlockEditor 组件
- `frontend/src/components/InquiryForm.tsx` — 新建咨询表单
- `frontend/src/components/InquirySection.tsx` — 新建咨询区块
- `frontend/src/components/SiteFooter.tsx` — 新建页脚
- `frontend/src/components/editor/EditorToolbar.tsx` — 底部工具栏重构
- `frontend/src/pages/ProjectDetailPage.tsx` — 重构为 Block 渲染 + 可编辑封面/标题
- `frontend/src/auth/guards/permissions.guard.ts` — ADMIN 权限豁免
- `backend/src/projects/dto/update-project.dto.ts` — 显式字段声明
