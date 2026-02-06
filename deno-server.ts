import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const HF_TOKEN = Deno.env.get("HF_TOKEN") || "";

async function generateImage(prompt: string, referenceImage: string | null) {
  console.log("正在生成图片，请稍候...");
  console.log("Prompt:", prompt);
  console.log("Has reference image:", !!referenceImage);

  try {
    let response;
    let data;
    const headers: HeadersInit = {
      "Authorization": `Bearer ${HF_TOKEN}`,
    };

    if (referenceImage) {
      // 使用参考图进行生成
      headers["Content-Type"] = "application/json";
      data = {
        inputs: referenceImage,
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
        // 直接返回图片URL
        console.log("✅ 图片生成成功！");
        return {
          success: true,
          imageUrl: result.image.url,
        };
      } else {
        throw new Error("未收到有效的图片响应");
      }
    } else {
      // 纯文本生成
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

      // 将图片转换为base64
      const buffer = await response.arrayBuffer();
      const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));
      
      console.log("✅ 图片生成成功！");
      return {
        success: true,
        imageBase64: `data:image/png;base64,${base64}`,
      };
    }
  } catch (error) {
    console.error("❌ 生成失败:", error);
    console.error("Error details:", error.message);
    return {
      success: false,
      error: error.message || "生成图片失败，请检查网络连接或稍后重试"
    };
  }
}

async function handler(req: Request): Promise<Response> {
  const url = new URL(req.url);
  
  console.log(`[REQUEST] ${req.method} ${url.pathname}`);
  console.log(`[REQUEST URL] ${req.url}`);
  
  // 处理 OPTIONS 预检请求
  if (req.method === "OPTIONS") {
    console.log("[OPTIONS] Handling preflight request");
    return new Response(null, {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  }

  // 静态文件服务 - 返回HTML
  if (url.pathname === "/" && req.method === "GET") {
    console.log("[ROOT] Serving index.html");
    try {
      const html = await Deno.readTextFile("./index.html");
      return new Response(html, {
        status: 200,
        headers: {
          "Content-Type": "text/html; charset=utf-8",
        },
      });
    } catch (error) {
      console.error("[ROOT] Error reading index.html:", error);
      return new Response("Error loading page", { status: 500 });
    }
  }

  // API 端点
  if (url.pathname === "/api/generate" && req.method === "POST") {
    console.log("[API] Processing /api/generate request");
    try {
      const body = await req.json();
      console.log("[API] Request body:", body);
      const { prompt, referenceImage } = body;

      if (!prompt) {
        return new Response(
          JSON.stringify({ success: false, error: "请输入文字描述" }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      const result = await generateImage(prompt, referenceImage);
      
      return new Response(JSON.stringify(result), {
        status: 200,
        headers: { 
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      });
    } catch (error) {
      console.error("[API] Error:", error);
      return new Response(
        JSON.stringify({ success: false, error: error.message }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  }

  console.log(`[404] Path not found: ${url.pathname}`);
  // 404
  return new Response("Not Found", { status: 404 });
}

serve(handler);
