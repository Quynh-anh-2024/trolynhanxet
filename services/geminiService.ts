
import { GoogleGenAI, Type } from "@google/genai";
import { SYSTEM_INSTRUCTION } from "../constants";
import { TemplateType, EvaluationResponse, EvaluationPeriod } from "../types";

export const generateComments = async (
  templateType: TemplateType,
  data: any[],
  subjectName: string,
  grade: number,
  period: EvaluationPeriod
): Promise<EvaluationResponse> => {
  // Always use const ai = new GoogleGenAI({apiKey: process.env.API_KEY});
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const responseSchema = templateType === TemplateType.DINH_KY ? {
    type: Type.OBJECT,
    properties: {
      template_type: { type: Type.STRING },
      results: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            stt: { type: Type.STRING },
            noi_dung_nhan_xet: { type: Type.STRING }
          },
          required: ["stt", "noi_dung_nhan_xet"]
        }
      }
    },
    required: ["template_type", "results"]
  } : {
    type: Type.OBJECT,
    properties: {
      template_type: { type: Type.STRING },
      results: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            stt: { type: Type.STRING },
            nx_nang_luc_chung: { type: Type.STRING },
            nx_nang_luc_dac_thu: { type: Type.STRING },
            nx_pham_chat: { type: Type.STRING }
          },
          required: ["stt", "nx_nang_luc_chung", "nx_nang_luc_dac_thu", "nx_pham_chat"]
        }
      }
    },
    required: ["template_type", "results"]
  };

  const prompt = `
    BỐI CẢNH QUAN TRỌNG:
    - Khối lớp: ${grade}
    - Thời điểm: ${period} (Quyết định văn phong: Giữa kì = Tiến bộ/Cố gắng; Cuối kì = Kết quả/Thành thạo)
    - Loại đánh giá: ${templateType === TemplateType.DINH_KY ? 'Định kỳ môn học' : 'Năng lực Phẩm chất'}
    - Môn học: ${subjectName}

    Dữ liệu học sinh cần nhận xét:
    ${JSON.stringify(data, null, 2)}
    
    YÊU CẦU ĐẶC BIỆT (TUÂN THỦ 100%):
    1. KHÔNG chứa các từ chỉ thời gian như "học kì 1", "cuối năm", "giữa kì".
    2. KHÔNG bắt đầu bằng "em", "con", "bạn". Bắt đầu ngay bằng động từ/tính từ.
    3. Nhận xét phải logic với mức đạt (T, H, C) và phù hợp với thời điểm ${period}.
    
    Hãy thực hiện nhận xét cho từng học sinh.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: responseSchema as any
      },
    });

    if (!response.text) {
      throw new Error("Không nhận được phản hồi từ AI.");
    }

    // Access the .text property directly as per SDK guidelines.
    return JSON.parse(response.text.trim());
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    throw new Error(error.message || "Đã xảy ra lỗi khi kết nối với AI.");
  }
};
