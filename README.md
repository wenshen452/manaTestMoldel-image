# AI图片生成器

基于 HuggingFace API 的图片生成工具

## 功能特性

- 文字描述生成图片
- 支持上传参考图
- 美观的Web界面
- 实时预览和下载

## 安装

```bash
npm install
```

## 运行

```bash
node app.js
```

然后访问 http://localhost:3000

## 配置

`.env` 文件已包含 HF_TOKEN，无需额外配置

## 技术栈

- Express.js - 后端服务器
- HuggingFace Inference API - 图片生成
- 原生 HTML/CSS/JavaScript - 前端界面
