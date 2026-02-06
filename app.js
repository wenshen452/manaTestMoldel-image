import express from 'express';
import { generateImage } from './server.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// 增加请求体大小限制到50MB
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// 静态文件服务
app.use(express.static(__dirname));
app.use('/outputs', express.static(path.join(__dirname, 'outputs')));

// 图片生成API
app.post('/api/generate', async (req, res) => {
  const { prompt, referenceImage } = req.body;

  if (!prompt) {
    return res.status(400).json({ 
      success: false, 
      error: '请输入文字描述' 
    });
  }

  const result = await generateImage(prompt, referenceImage);
  res.json(result);
});

app.listen(PORT, () => {
  console.log(`🚀 服务器运行在 http://localhost:${PORT}`);
});
