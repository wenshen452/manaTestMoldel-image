# Deno Deploy 部署指南

## 部署到 Deno Deploy

1. 将代码上传到 GitHub 仓库

2. 访问 [Deno Deploy](https://dash.deno.com/)

3. 点击 "New Project"

4. 连接你的 GitHub 仓库

5. 选择部署入口文件：`deno-server.ts`

6. 配置环境变量：
   - 名称：`HF_TOKEN`
   - 值：你的 HuggingFace Token（从 .env 文件中获取）

7. 点击 "Deploy"

## 本地测试（使用 Deno）

```bash
# 安装 Deno（如果还没有）
# Windows: winget install deno

# 运行
HF_TOKEN=你的_HF_TOKEN deno run --allow-net --allow-env --allow-read deno-server.ts
```

## 主要改动

1. **移除 Node.js 依赖**：不再使用 express、fs、path 等 Node.js 特有模块
2. **使用 Deno 原生 HTTP 服务器**：使用 `serve` 函数
3. **环境变量**：使用 `Deno.env.get()` 获取
4. **静态文件**：使用 `Deno.readTextFile()` 读取
5. **CORS 支持**：添加了 CORS 头部
6. **返回方式**：
   - 纯文本生成：返回 base64 图片数据
   - 参考图生成：返回图片 URL（因为 fal-ai 返回的是 URL）
