
import { GoogleGenAI, Type } from "@google/genai";
import { SYSTEM_INSTRUCTION } from "../constants";
import { TemplateType, EvaluationResponse, EvaluationPeriod } from "../types";

export const verifyApiKey = async (apiKey: string): Promise<boolean> => {
  if (!apiKey) return false;
  try {
    const ai = new GoogleGenAI({ apiKey });
    // Use the same model as the main function to ensure consistency and validity
    await ai.models.generateContent({
      model: "gemini-3-flash-preview", 
      contents: "Hello",
    });
    return true;
  } catch (error) {
    console.error("API Verification Failed:", error);
    return false;
  }
};

export const generateComments = async (
  templateType: TemplateType,
  data: any[],
  subjectName: string,
  grade: number,
  period: EvaluationPeriod,
  apiKey: string
): Promise<EvaluationResponse> => {
  if (!apiKey) {
    throw new Error("Vui lòng nhập khóa API trước khi thực hiện.");
  }

  const ai = new GoogleGenAI({ apiKey });
  
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
    - Thời điểm: ${period}
    - Loại đánh giá: ${templateType === TemplateType.DINH_KY ? 'ĐỊNH KỲ MÔN HỌC' : 'NĂNG LỰC & PHẨM CHẤT (NLPC)'}
    - Môn học (nếu có): ${subjectName}

    Dữ liệu học sinh (bao gồm mức đánh giá T, H/Đ, C):
    ${JSON.stringify(data, null, 2)}
    
    YÊU CẦU ĐẶC BIỆT CHO ${templateType === TemplateType.NLPC ? 'NLPC (Năng lực Phẩm chất)' : 'MÔN HỌC'}:
    ${templateType === TemplateType.NLPC 
      ? `
        1. PHÂN LOẠI CHẶT CHẼ DỰA TRÊN CỘT 'level':
           - Mức T (Tốt): Nhận xét phải thể hiện sự nổi bật, tích cực, tự giác cao.
           - Mức Đ (Đạt) hoặc H (Hoàn thành): Nhận xét thể hiện sự hoàn thành nhiệm vụ, đạt chuẩn, có ý thức.
           - Mức C (Cần cố gắng): Nhận xét cần chỉ ra điểm cần hỗ trợ, rèn luyện.
        2. Sinh ra 3 nội dung riêng biệt: Năng lực chung, Năng lực đặc thù, Phẩm chất.
        3. Tuyệt đối KHÔNG được viết nhận xét mức Tốt cho học sinh mức Đ/C và ngược lại.
      ` 
      : `
        1. Dựa vào mức T, H, C để viết nhận xét môn học.
        2. Nhận xét ngắn gọn, tập trung vào kiến thức và kỹ năng môn ${subjectName}.
      `
    }

    YÊU CẦU CHUNG:
    - KHÔNG chứa từ chỉ thời gian.
    - KHÔNG bắt đầu bằng "em", "con", "bạn".
    - Chuẩn ngữ pháp, văn phong sư phạm tích cực.
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

    return JSON.parse(response.text.trim());
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    throw new Error(error.message || "Đã xảy ra lỗi khi kết nối với AI.");
  }
};
