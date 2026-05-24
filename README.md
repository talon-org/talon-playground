# Talon Playground

浏览器内的代码编辑与运行环境,由 Talon Sandbox 提供运行时支持。

## 在线访问

[playground.sandbox.talon.net.cn](https://playground.sandbox.talon.net.cn) (beta,邀请制)

## 本地开发

### 1. 安装依赖

```bash
pnpm install
```

### 2. 配置 API Key

复制 `.env.example` 为 `.env`，填入你的 Sandbox API Key：

```bash
cp .env.example .env
```

编辑 `.env`：

```
VITE_SANDBOX_API_BASE=https://api.sandbox.talon.net.cn
VITE_SANDBOX_API_KEY=ask_your_actual_key_here
```

API Key 格式为 `ask_` 前缀。向 Talon 团队申请开发期 Key。

**注意：** `.env` 已在 `.gitignore` 中，不会被提交。

### 3. 启动开发服务器

```bash
pnpm dev
```

需要 Node 20+。

### Static 模板

Static HTML/CSS/JS 模板不调用 sandbox API，直接用 Blob URL 渲染预览，无需配置 Key。

### 其他模板

React + Vite、Vue + Vite、Node Express、Python Flask 模板需要有效的 API Key 才能运行。点击 Run 后会：

1. 在 Talon Sandbox 上创建沙箱容器
2. 写入项目文件
3. 安装依赖（npm install / pip install）
4. 启动开发服务器或应用
5. 暴露端口，返回预览 URL

## 模板

| 模板 | 运行时 | 默认端口 |
|------|--------|---------|
| Static HTML/CSS/JS | Blob URL（无服务器） | — |
| React + Vite | Vite dev server | 5173 |
| Vue + Vite | Vite dev server | 5173 |
| Node Express | Node.js | 3000 |
| Python Flask | Python | 5000 |

## 文档

完整文档：[github.com/talon-org/agent-sandbox-docs](https://github.com/talon-org/agent-sandbox-docs)（文档站建设中）
