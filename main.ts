import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { HfInference } from "npm:@huggingface/inference@2.8.1";

const HF_TOKEN = Deno.env.get("HF_TOKEN") || "";

console.log("Server starting...");
console.log("HF_TOKEN set:", HF_TOKEN ? "YES" : "NO");

const hf = new HfInference(HF_TOKEN);

async function generateImage(prompt: string, referenceImage: string | null) {
  console.log("Generating image...");
  console.log("Prompt:", prompt);

  try {
    let blob;

    if (referenceImage) {
      // 使用参考图进行生成
      const imageBuffer = Uint8Array.from(
        atob(referenceImage.split(',')[1]),
        c => c.charCodeAt(0)
      );

      blob = await hf.imageToImage({
        provider: "auto",
        model: "black-forest-labs/FLUX.1-Kontext-dev",
        inputs: imageBuffer,
        parameters: {
          prompt: prompt,
          strength: 0.7,
        },
      });
    } else {
      // 纯文本生成
      blob = await hf.textToImage({
        provider: "auto",
        model: "black-forest-labs/FLUX.1-dev",
        inputs: prompt,
        parameters: {
          guidance_scale: 3.5,
          num_inference_steps: 28,
        }
      });
    }

    // 将 Blob 转换为 base64
    const buffer = await blob.arrayBuffer();
    const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));

    return {
      success: true,
      imageBase64: `data:image/png;base64,${base64}`,
    };
  } catch (error: any) {
    console.error("Generation error:", error);
    return {
      success: false,
      error: error.message || "Failed to generate image",
    };
  }
}

async function handler(req: Request): Promise<Response> {
  const url = new URL(req.url);

  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }

  if (url.pathname === "/" && req.method === "GET") {
    try {
      const html = await Deno.readTextFile("./index.html");
      return new Response(html, {
        status: 200,
        headers: {
          "Content-Type": "text/html; charset=utf-8",
        },
      });
    } catch (error: any) {
      return new Response(`Error: ${error.message}`, { status: 500 });
    }
  }

  if (url.pathname === "/api/generate" && req.method === "POST") {
    try {
      const body = await req.json();
      const { prompt, referenceImage } = body;

      if (!prompt) {
        return new Response(
          JSON.stringify({ success: false, error: "Prompt required" }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }

      const result = await generateImage(prompt, referenceImage || null);
      return new Response(JSON.stringify(result), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      });
    } catch (error: any) {
      return new Response(
        JSON.stringify({ success: false, error: error.message }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
  }

  return new Response("Not Found", { status: 404 });
}

console.log("Server ready!");
serve(handler);
