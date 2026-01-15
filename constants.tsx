
import React from 'react';
import { GradeConfig } from './types';

export const GRADES: GradeConfig[] = [
  {
    id: 1,
    label: 'Khối 1',
    color: 'blue-600',
    bgLight: 'bg-blue-50',
    subjects: ['Tiếng Việt', 'Toán', 'Đạo đức', 'Tự nhiên và Xã hội', 'Nghệ thuật', 'Giáo dục thể chất', 'Hoạt động trải nghiệm']
  },
  {
    id: 2,
    label: 'Khối 2',
    color: 'indigo-600',
    bgLight: 'bg-indigo-50',
    subjects: ['Tiếng Việt', 'Toán', 'Đạo đức', 'Tự nhiên và Xã hội', 'Nghệ thuật', 'Giáo dục thể chất', 'Hoạt động trải nghiệm', 'Tiếng Anh']
  },
  {
    id: 3,
    label: 'Khối 3',
    color: 'purple-600',
    bgLight: 'bg-purple-50',
    subjects: ['Tiếng Việt', 'Toán', 'Đạo đức', 'Tự nhiên và Xã hội', 'Tin học và Công nghệ', 'Nghệ thuật', 'Giáo dục thể chất', 'Hoạt động trải nghiệm', 'Ngoại ngữ 1']
  },
  {
    id: 4,
    label: 'Khối 4',
    color: 'emerald-600',
    bgLight: 'bg-emerald-50',
    subjects: ['Tiếng Việt', 'Toán', 'Đạo đức', 'Lịch sử và Địa lý', 'Khoa học', 'Tin học', 'Công nghệ', 'Nghệ thuật', 'Giáo dục thể chất', 'Hoạt động trải nghiệm', 'Ngoại ngữ 1']
  },
  {
    id: 5,
    label: 'Khối 5',
    color: 'amber-600',
    bgLight: 'bg-amber-50',
    subjects: ['Tiếng Việt', 'Toán', 'Đạo đức', 'Lịch sử và Địa lý', 'Khoa học', 'Tin học', 'Công nghệ', 'Nghệ thuật', 'Giáo dục thể chất', 'Hoạt động trải nghiệm', 'Ngoại ngữ 1']
  }
];

export const PERIODS = ['giữa học kì 1', 'cuối học kì 1', 'giữa học kì 2', 'cuối học kì 2'];

export const SYSTEM_INSTRUCTION = `BẠN LÀ: Chuyên gia sư phạm tiểu học, chuyên viết nhận xét học bạ theo Thông tư 27 và CT GDPT 2018.

NHIỆM VỤ: Tạo nội dung nhận xét ngắn gọn, súc tích, chuyên nghiệp cho sổ học bạ.

1. QUY TẮC "3 KHÔNG" VỀ TỪ NGỮ (BẮT BUỘC):
- KHÔNG dùng từ chỉ thời gian trong lời nhận xét (Vd: TUYỆT ĐỐI KHÔNG viết "trong học kì 1", "cuối kì này", "giữa kì"... vì tiêu đề cột đã có thông tin này).
- KHÔNG dùng đại từ nhân xưng (em, con, bạn). Hãy bắt đầu câu bằng động từ hoặc tính từ.
- KHÔNG nhắc lại điểm số.

2. QUY TẮC LOGIC THEO THỜI ĐIỂM:
* GIỮA HỌC KÌ (1 & 2):
  - Mục tiêu: Đánh giá quá trình, sự tiến bộ.
  - Văn phong: Khích lệ, động viên.
  - Từ khóa: "Có tiến bộ", "đang cố gắng", "cần rèn thêm thường xuyên", "tiếp tục phát huy".
* CUỐI HỌC KÌ (1 & 2):
  - Mục tiêu: Xác nhận kết quả đầu ra, năng lực đạt được.
  - Văn phong: Khẳng định, tổng kết.
  - Từ khóa: "Hoàn thành tốt", "nắm vững", "thành thạo", "đạt yêu cầu", "cần ôn luyện thêm".

3. ÁNH XẠ MỨC ĐÁNH GIÁ:
- Mức T (Tốt): Khen ngợi kỹ năng cụ thể + Khuyến khích phát triển. (VD: "Tính toán nhanh, chính xác. Có tư duy giải quyết vấn đề tốt.")
- Mức H (Hoàn thành): Ghi nhận mức đạt + Nhắc nhở nhẹ (nếu cần). (VD: "Đọc to, rõ ràng. Cần rèn thêm về diễn cảm.")
- Mức C (Cần cố gắng): Chỉ ra điểm cần rèn + Giải pháp cụ thể. KHÔNG chê bai. (VD: "Cần tập trung hơn khi làm toán. Nên ôn lại bảng cửu chương.")

4. ĐỊNH DẠNG:
- Câu ngắn (10-20 từ).
- Chuẩn chính tả, ngữ pháp tiếng Việt.
- Đa dạng hóa cách diễn đạt để tránh trùng lặp 100% giữa các học sinh.
`;

export const Icons = {
  Sparkles: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L12 3Z"/><path d="M5 3v4"/><path d="M19 17v4"/><path d="M3 5h4"/><path d="M17 19h4"/></svg>
  ),
  Upload: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>
  ),
  FileSpreadsheet: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><line x1="3" x2="21" y1="9" y2="9"/><line x1="3" x2="21" y1="15" y2="15"/><line x1="9" x2="9" y1="3" y2="21"/><line x1="15" x2="15" y1="3" y2="21"/></svg>
  ),
  Check: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
  ),
  Trash: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
  ),
  GraduationCap: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>
  ),
  Download: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
  )
};
