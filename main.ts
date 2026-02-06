import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const HF_TOKEN = Deno.env.get("HF_TOKEN") || "";

console.log("Server starting...");
console.log("HF_TOKEN set:", HF_TOKEN ? "YES" : "NO");

async function generateImage(prompt: string, referenceImage: string | null) {
  console.log("Generating image...");
  console.log("Prompt:", prompt);
  console.log("Has reference:", !!referenceImage);

  try {
    let response: Response;

    if (referenceImage) {
      // 使用参考图进行生成 - 使用 fal-ai 端点
      const imageData = {
        inputs: referenceImage,
        parameters: {
          prompt: prompt,
          strength: 0.7,
        }
      };

      response = await fetch(
        "https://router.huggingface.co/fal-ai/fal-ai/flux-kontext/dev?_subdomain=queue",
        {
          headers: {
            "Authorization": `Bearer ${HF_TOKEN}`,
            "Content-Type": "application/json",
          },
          method: "POST",
          body: JSON.stringify(imageData),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API Error ${response.status}: ${errorText}`);
      }

      const result = await response.json();

      // fal-ai 返回 JSON，包含图片 URL
      if (result && result.image && result.image.url) {
        // 下载图片
        const imageResponse = await fetch(result.image.url);
        const buffer = await imageResponse.arrayBuffer();
        const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));

        return {
          success: true,
          imageBase64: `data:image/png;base64,${base64}`,
        };
      } else {
        throw new Error("Invalid response from API");
      }
    } else {
      // 纯文本生成
      const imageData = {
        inputs: prompt,
        parameters: {
          guidance_scale: 3.5,
          num_inference_steps: 28,
        }
      };

      response = await fetch(
        "https://router.huggingface.co/models/black-forest-labs/FLUX.1-dev",
        {
          headers: {
            "Authorization": `Bearer ${HF_TOKEN}`,
            "Content-Type": "application/json",
          },
          method: "POST",
          body: JSON.stringify(imageData),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API Error ${response.status}: ${errorText}`);
      }

      const buffer = await response.arrayBuffer();
      const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));

      return {
        success: true,
        imageBase64: `data:image/png;base64,${base64}`,
      };
    }
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
