import { HfInference } from "@huggingface/inference";
import dotenv from "dotenv";

dotenv.config();

const hf = new HfInference(process.env.HF_TOKEN);

async function testGenerate() {
  try {
    console.log("测试文本生成图片...");
    
    // 测试1: textToImage
    console.log("方式1: textToImage");
    const response1 = await hf.textToImage({
      model: 'black-forest-labs/FLUX.1-Kontext-dev',
      inputs: 'A cat',
      parameters: {
        guidance_scale: 3.5,
        num_inference_steps: 28,
      }
    });

    console.log("response1 type:", typeof response1);
    console.log("response1:", response1);
    console.log("Has arrayBuffer:", typeof response1.arrayBuffer);

    if (typeof response1.arrayBuffer === 'function') {
      console.log("调用 arrayBuffer...");
      const buffer = Buffer.from(await response1.arrayBuffer());
      console.log("Buffer 长度:", buffer.length);
    }

  } catch (error) {
    console.error("测试失败:", error);
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);
  }
}

testGenerate();
