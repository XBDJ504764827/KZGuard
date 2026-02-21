# KZGuard - 综合管理与游戏服务器防御系统

KZGuard 是一个现代化的游戏服务器管理系统，专门为 CS:GO (或相似 Source 引擎游戏) 打造，支持进服验证、全局封禁、白名单管理以及多服实时节点监控。

本项目由三个主要部分组成：
1. **Frontend (前端)**: 基于 Next.js, React, 和 Tailwind CSS 开发的现代 SaaS 风格网页管理面板。
2. **Backend (后端)**: 基于 Rust 和 Axum 开发的高性能 API 服务器，处理数据流转与 SourceMod 的并发请求。
3. **KZGuard Plugin (游戏插件)**: 基于 SourcePawn 编写的 SourceMod 插件，在游戏服务器内实时验证玩家身份、封禁记录和 RCON 同步。

---

## 目录
- [环境依赖](#环境依赖)
- [Backend (后端) 部署指南](#backend-后端-部署指南)
- [Frontend (前端) 部署指南](#frontend-前端-部署指南)
- [KZGuard Plugin (游戏端插件) 部署与配置](#kzguard-plugin-游戏端插件-部署与配置)
- [使用流程及常见问题](#使用流程及常见问题)

---

## 环境依赖
在开始之前，请确保您的主服务器（运行前/后端的机器）安装了以下软件：
- **Node.js** (v18 或更高版本) & **npm** / **yarn** (用于前端)
- **Rust & Cargo** (最新稳定版，用于编译后端)
- **MySQL / MariaDB** (版本 8.x 或 10.x+，用于数据存储)
- (可选但推荐) **Nginx** 或 **Caddy** 等反向代理软件

游戏服务器端需要：
- **SourceMod** (推荐 1.11 或更高版本)
- **SteamWorks** 扩展包 (用于使插件支持 HTTP API 请求)

---

## Backend (后端) 部署指南

后端采用 Rust 编写，负责直接与数据库交互，并响应来自前端和游戏服务器的所有请求。

### 1. 数据库准备
登录您的 MySQL 服务，创建一个空的数据库：
```sql
CREATE DATABASE kzguard CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 2. 环境配置
进入 `backend` 目录，通过复制配置模板创建环境变量文件：
```bash
cd backend
cp .env.example .env
```
修改 `.env` 文件，填入正确的数据库连接、JWT 秘钥等：
```env
# 示例配置
DATABASE_URL=mysql://root:你的密码@127.0.0.1:3306/kzguard
# 运行端口
PORT=8080
# 生成 JWT 令牌用的随机秘钥，请修改为强密码字符串
JWT_SECRET=super_secret_jwt_key_please_change_this_in_production
# RCON 设置等 (如有)
RCON_TIMEOUT=3
```

### 3. 应用数据库迁移
后端使用了 `sqlx-cli` 来管理数据库迁移。如果未安装 `sqlx-cli`，请先全局安装：
```bash
cargo install sqlx-cli --no-default-features --features rustls,mysql
```
然后执行数据库表结构生成：
```bash
sqlx database create
sqlx migrate run
```
> 这会自动在您的 `kzguard` 数据库中创建诸如 users, servers, bans 等所有表。

### 4. 编译与运行
您可以先使用 run 来测试是否能正常启动：
```bash
cargo run
```
如果您要在生产环境中部署，请使用 release 模式编译以获取最大性能：
```bash
cargo build --release
# 二进制文件将位于 target/release/kzguard-backend
# 推荐使用 systemd, pm2 或 screen/tmux 后台持久化运行该二进制文件。
./target/release/kzguard-backend
```

*默认启动后，后端将在 `http://127.0.0.1:8080` 监听。*

---

## Frontend (前端) 部署指南

前端是一个纯 SSR+CSR 混合的 Next.js 项目，提供了对后端 API 的可视化控制。

### 1. 环境配置
进入 `frontend` 目录：
```bash
cd frontend
cp .env.example .env.local
```
确保您的 `.env.local` 里面配置了后端 API 的反代地址。如果在同一台机器，前端会自动代理到后端的 8080 端口（详情可见 `next.config.mjs` 中的 `rewrites` 设置）。

### 2. 安装依赖并编译
```bash
npm install
# 或者
yarn install
```

### 3. 本地开发与生产构建
如果只在本地开发调试：
```bash
npm run dev
```

如果在生产服务器上部署，需先进行构建，再启动服务：
```bash
npm run build
npm run start
```
*前端默认将运行于 `http://127.0.0.1:3000`。*
> **建议**：使用 Nginx 将您的域名同时代理到本地的 3000 端口（前端渲染），并在 Nginx 配置中将 `/api/` 路径直接代理给 8080（Rust 后端），以此实现最佳性能和分离。

---

## KZGuard Plugin (游戏端插件) 部署与配置

这一步骤是在您的 **CS:GO 或其它适用游戏服务器** 上操作。

### 1. 依赖文件准备
确保您的服务端已安装并正常运行 SourceMod，并请下载安装最新的 `SteamWorks` extension（放置到对应 addons 目录下并重启服务器确认加载成功）。

### 2. 编译插件
进入 `kzguard` 目录，这里存放了插件的源码 `kzguard.sp`。您需要使用 SourceMod 提供的 `spcomp` 编译器对其进行编译：

*Linux 端编译示例* (如果您就在当前的 Linux 机器上操作)：
```bash
cd kzguard
chmod +x sourcemod-1.11.0-git6970-linux/addons/sourcemod/scripting/spcomp
./sourcemod-1.11.0-git6970-linux/addons/sourcemod/scripting/spcomp kzguard.sp
```
这会生成一个编译好的 `kzguard.smx` 文件。

### 3. 安装到服务器
将生成的 `kzguard.smx` 放入您游戏服务端目录的 `csgo/addons/sourcemod/plugins/` 文件夹下。

### 4. 核心配置: Server ID
**（非常重要！）**
网页控制台支持分别为每一台物理服务器单独设置：评分限制、等级限制和白名单专属模式。但您的游戏服务端必须知道自己属于面板上的“哪一台”，才能拉取正确的配置。

1. 打开前端网页面板 -> 社区组管理，在现有的某个组下“添加服务器”。
2. 添加完成后，注意看每个服务器卡片上显示的 **ID** (例如：ID: 2)。
3. 前往该台游戏服务端，打开 `csgo/cfg/server.cfg`。
4. 在其中写入以下两个 CVAR（参数）：
   ```cfg
   // 将此处的 URL 替换为您网站的实际完整地址 (末尾不要加 / )
   kzguard_api_url "http://您的网站API地址或域名"

   // 此处的数字必须与网站面板上显示的该服务器的 ID 一致
   kzguard_server_id 2
   ```

保存后，重启您的游戏服务端。此时如果有玩家加入，服务端会自动与面板验证该玩家是否具备进服资格。

---

## 使用流程及常见问题

### 首次登录
- **初始管理员**：在完成部署后，由于没有默认超级管理员，建议您直接访问数据库（通过 phpMyAdmin 等工具），在 `users` 表中手动插入您的第一条管理员记录，确保具有最高权限方便后续在 Web 页面中操作。或者若后端带有 `create_first_admin` 之类的初始化接口/脚本，也可以使用。

### 为何配置未生效或报错 "A component is changing an uncontrolled input..."？
- 已经在此开源版本中修复。若您自行开发或改动后遇到前端组件报错，请确保 `editForm` 状态中的值始终备有默认值（如 `editForm.value || 0`）。
- **配置未生效**：前端点选后如果成功保存，但刷新后复原，通常是因为您热更了代码却没有**重启后端 Rust 服务**。务必停止后端的旧进程并重新 `cargo run` 或重启对应的 systemd 服务。

### "Can't connect to server through socket..." 错误？
该错误表明 Rust 后端无法连上 MySQL 数据库。
- 检查您的 `kzguard/backend/.env` 文件。
- 确保 `DATABASE_URL` 指定的机器 IP，端口，账号密码正确。
- 确认您的 MySQL 服务正在运行。

### 插件无法验证全局玩家？
- 确认游戏服务端内的 `kzguard_api_url` 指向的是能够被外网（或该机器）直接访问到的 HTTP 地址。
- 如果提示“未找到 SteamWorks”，表明服务端缺少 SteamWorks 扩展支持，请去 AlliedModders 论坛下载并装入您的服务端。
