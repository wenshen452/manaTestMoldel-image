# Deno Deploy 部署说明

## 重要：部署配置

在 Deno Deploy 中，请确保：

1. **入口文件** 设置为 `main.ts`（不是 `dist/main.ts`）

2. **项目结构** 应该是：
   ```
   / (根目录)
   ├── main.ts
   ├── index.html
   ├── deno-server.ts
   └── ...
   ```

3. **环境变量**：
   - 名称: `HF_TOKEN`
   - 值: 你的 HuggingFace Token

## 本地测试

```bash
deno run --allow-net --allow-env --allow-read main.ts
```

## 如果必须使用 dist 目录

```bash
# 创建 dist 目录
mkdir dist

# 复制文件
copy main.ts dist\
copy index.html dist\

# 然后在 Deno Deploy 中使用 dist/main.ts 作为入口
```
