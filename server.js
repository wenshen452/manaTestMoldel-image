import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const HF_TOKEN = process.env.HF_TOKEN;

export async function generateImage(prompt, referenceImage = null) {
  console.log("正在生成图片，请稍候...");
  console.log("Prompt:", prompt);
  console.log("Has reference image:", !!referenceImage);

  try {
    let response;
    let data;
    let headers = {
      "Authorization": `Bearer ${HF_TOKEN}`,
    };

    if (referenceImage) {
      // 使用参考图进行生成
      const imageBuffer = Buffer.from(referenceImage.split(',')[1], 'base64');
      
      headers["Content-Type"] = "application/json";
      data = {
        inputs: `data:image/png;base64,${imageBuffer.toString('base64')}`,
        parameters: {
          prompt: prompt,
          strength: 0.7,
        }
      };
      
      const responseJson = await fetch(
        "https://router.huggingface.co/fal-ai/fal-ai/flux-kontext/dev?_subdomain=queue",
        {
          headers: headers,
          method: "POST",
          body: JSON.stringify(data),
        }
      );
      
      const result = await responseJson.json();
      
      // fal-ai 返回的是JSON，其中包含图片URL
      if (result && result.image && result.image.url) {
        // 下载图片
        const imageResponse = await fetch(result.image.url);
        const buffer = Buffer.from(await imageResponse.arrayBuffer());
        
        const fileName = `flux_output_${Date.now()}.png`;
        const outputPath = path.join(__dirname, 'outputs', fileName);

        if (!fs.existsSync(path.join(__dirname, 'outputs'))) {
          fs.mkdirSync(path.join(__dirname, 'outputs'), { recursive: true });
        }

        fs.writeFileSync(outputPath, buffer);
        
        console.log(`✅ 图片生成成功！已保存为: ${fileName}`);
        return {
          success: true,
          fileName: fileName,
          path: `/outputs/${fileName}`,
          buffer: buffer.toString('base64')
        };
      } else {
        throw new Error("未收到有效的图片响应");
      }
    } else {
      // 纯文本生成 - 使用标准推理API
      headers["Content-Type"] = "application/json";
      data = {
        inputs: prompt,
        parameters: {
          guidance_scale: 3.5,
          num_inference_steps: 28,
        }
      };
      
      response = await fetch(
        "https://api-inference.huggingface.co/models/black-forest-labs/FLUX.1-dev",
        {
          headers: headers,
          method: "POST",
          body: JSON.stringify(data),
        }
      );
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("API 错误:", response.status, errorText);
        throw new Error(`API 请求失败: ${response.status} - ${errorText}`);
      }

      const buffer = Buffer.from(await response.arrayBuffer());
      const fileName = `flux_output_${Date.now()}.png`;
      const outputPath = path.join(__dirname, 'outputs', fileName);

      if (!fs.existsSync(path.join(__dirname, 'outputs'))) {
        fs.mkdirSync(path.join(__dirname, 'outputs'), { recursive: true });
      }

      fs.writeFileSync(outputPath, buffer);
      
      console.log(`✅ 图片生成成功！已保存为: ${fileName}`);
      return {
        success: true,
        fileName: fileName,
        path: `/outputs/${fileName}`,
        buffer: buffer.toString('base64')
      };
    }
  } catch (error) {
    console.error("❌ 生成失败:", error);
    console.error("Error details:", error.message);
    console.error("Error stack:", error.stack);
    return {
      success: false,
      error: error.message || "生成图片失败，请检查网络连接或稍后重试"
    };
  }
}
