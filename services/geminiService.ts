import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult } from "../types";

// Helper to convert File to Base64
const fileToGenerativePart = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = (reader.result as string).split(',')[1];
      resolve(base64String);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export const analyzeImageWithGemini = async (file: File): Promise<AnalysisResult> => {
  if (!process.env.API_KEY) {
    throw new Error("API Key not found");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const base64Data = await fileToGenerativePart(file);

  const prompt = `
    你是一个专业的图像压缩算法专家。请分析这张图片的内容，以便进行文件压缩优化。
    
    请根据图片内容（是照片、截图、文字扫描件还是矢量图？）给出以下建议：
    1. 最佳的文件格式 (JPEG, PNG, 或 WEBP)。注意：截图或包含大量文字的图片通常首选 PNG 或 WEBP；照片首选 JPEG 或 WEBP。
    2. 推荐的压缩质量 (0.1 - 1.0)，在尽可能减小体积的同时保持肉眼可接受的清晰度。
    3. 推荐的缩放比例 (0.1 - 1.0)。如果图片分辨率过高（如超过 4K），建议适当缩小。
    4. 预测压缩后的"清晰度评分" (0-100)，100 代表无损，< 60 代表有明显噪点。
    5. 用简短的中文解释你的推荐理由。

    请以 JSON 格式返回结果。
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: file.type,
              data: base64Data
            }
          },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            recommendedQuality: { type: Type.NUMBER, description: "推荐的质量设置 0.1 到 1.0" },
            recommendedFormat: { 
              type: Type.STRING, 
              enum: ["image/jpeg", "image/png", "image/webp"],
              description: "最优 MIME 类型"
            },
            recommendedScale: { type: Type.NUMBER, description: "推荐的缩放比例 0.1 到 1.0" },
            predictedClarityScore: { type: Type.NUMBER, description: "预测的清晰度评分 0-100" },
            reasoning: { type: Type.STRING, description: "中文推荐理由" }
          },
          required: ["recommendedQuality", "recommendedFormat", "recommendedScale", "predictedClarityScore", "reasoning"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("API 未返回有效数据");
    
    const result = JSON.parse(text);
    
    // Normalize quality to be safe
    let quality = result.recommendedQuality;
    if (quality > 1) quality = quality / 100;
    
    let scale = result.recommendedScale || 1.0;
    if (scale > 1) scale = 1.0;

    return {
      ...result,
      recommendedQuality: quality,
      recommendedScale: scale
    };

  } catch (error) {
    console.error("Gemini analysis failed:", error);
    // Fallback default
    return {
      recommendedQuality: 0.8,
      recommendedFormat: 'image/webp',
      recommendedScale: 1.0,
      predictedClarityScore: 85,
      reasoning: "AI 分析服务暂时不可用，已切换至默认平衡模式。"
    };
  }
};