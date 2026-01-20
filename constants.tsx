
import React from 'react';
import { GradeConfig } from './types';

export const GRADES: GradeConfig[] = [
  {
    id: 1,
    label: 'Lớp 1',
    color: 'blue-500', // Xanh dương tươi
    bgLight: 'bg-blue-50',
    subjects: ['Tiếng Việt', 'Toán', 'Đạo đức', 'Tự nhiên và Xã hội', 'Nghệ thuật', 'Giáo dục thể chất', 'Hoạt động trải nghiệm']
  },
  {
    id: 2,
    label: 'Lớp 2',
    color: 'amber-400', // Vàng tươi
    bgLight: 'bg-amber-50',
    subjects: ['Tiếng Việt', 'Toán', 'Đạo đức', 'Tự nhiên và Xã hội', 'Nghệ thuật', 'Giáo dục thể chất', 'Hoạt động trải nghiệm', 'Tiếng Anh']
  },
  {
    id: 3,
    label: 'Lớp 3',
    color: 'pink-500', // Hồng năng động
    bgLight: 'bg-pink-50',
    subjects: ['Tiếng Việt', 'Toán', 'Đạo đức', 'Tự nhiên và Xã hội', 'Tin học và Công nghệ', 'Nghệ thuật', 'Giáo dục thể chất', 'Hoạt động trải nghiệm', 'Ngoại ngữ 1']
  },
  {
    id: 4,
    label: 'Lớp 4',
    color: 'emerald-500', // Xanh lá
    bgLight: 'bg-emerald-50',
    subjects: ['Tiếng Việt', 'Toán', 'Đạo đức', 'Lịch sử và Địa lý', 'Khoa học', 'Tin học', 'Công nghệ', 'Nghệ thuật', 'Giáo dục thể chất', 'Hoạt động trải nghiệm', 'Ngoại ngữ 1']
  },
  {
    id: 5,
    label: 'Lớp 5',
    color: 'violet-500', // Tím mộng mơ
    bgLight: 'bg-violet-50',
    subjects: ['Tiếng Việt', 'Toán', 'Đạo đức', 'Lịch sử và Địa lý', 'Khoa học', 'Tin học', 'Công nghệ', 'Nghệ thuật', 'Giáo dục thể chất', 'Hoạt động trải nghiệm', 'Ngoại ngữ 1']
  }
];

export const PERIODS = ['giữa học kì 1', 'cuối học kì 1', 'giữa học kì 2', 'cuối học kì 2'];

export const SYSTEM_INSTRUCTION = `BẠN LÀ: Chuyên gia sư phạm tiểu học, am hiểu sâu sắc Thông tư 27/2020/TT-BGDĐT.

NHIỆM VỤ: Viết nhận xét học bạ dựa trên mức đánh giá (Level) được cung cấp.

=== QUY TẮC CỐT LÕI (TUÂN THỦ TUYỆT ĐỐI) ===
1. KHÔNG dùng từ chỉ thời gian (VD: "trong học kì 1", "cuối năm").
2. KHÔNG dùng đại từ nhân xưng (em, con, bạn). Bắt đầu câu bằng Động từ hoặc Tính từ.
3. KHÔNG nhắc lại điểm số.

=== HƯỚNG DẪN CHI TIẾT THEO LOẠI ĐÁNH GIÁ ===

A. ĐỐI VỚI MÔN HỌC (TEMPLATE: DINH_KY)
Mức đánh giá: T (Hoàn thành tốt), H (Hoàn thành), C (Chưa hoàn thành).
- Mức T: Dùng từ "Nắm vững", "Thành thạo", "Rất tốt", "Vận dụng linh hoạt". (VD: "Đọc to, rõ ràng, diễn cảm. Hiểu sâu nội dung bài.")
- Mức H: Dùng từ "Hoàn thành", "Đạt yêu cầu", "Nắm được". Nhắc nhở nhẹ nếu cần. (VD: "Thực hiện được các phép tính cơ bản. Cần tính toán cẩn thận hơn.")
- Mức C: Dùng từ "Cần cố gắng", "Cần rèn thêm". Chỉ rõ điểm yếu và giải pháp. (VD: "Cần luyện đọc nhiều hơn để trôi chảy.")

B. ĐỐI VỚI NĂNG LỰC & PHẨM CHẤT (TEMPLATE: NLPC)
Mức đánh giá: T (Tốt), Đ (Đạt), C (Cần cố gắng).
Hệ thống phải sinh ra 3 trường: Năng lực Chung, Năng lực Đặc thù, Phẩm chất.
Cả 3 trường này PHẢI tương thích với mức đánh giá chung của học sinh.

1. Mức T (Tốt):
   - Từ khóa: "Tự giác", "Tích cực", "Nổi bật", "Gương mẫu", "Thường xuyên", "Rất tốt".
   - NL Chung: Tự chủ, tự học rất tốt. Giao tiếp tự tin, hợp tác hiệu quả.
   - Phẩm chất: Chăm chỉ, nhân ái, trách nhiệm cao.

2. Mức Đ (Đạt):
   - Từ khóa: "Có ý thức", "Biết", "Thực hiện được", "Hoàn thành", "Đầy đủ".
   - NL Chung: Có ý thức tự học. Biết giao tiếp, hòa đồng với bạn bè.
   - Phẩm chất: Biết kính trọng thầy cô, đoàn kết với bạn bè.

3. Mức C (Cần cố gắng):
   - Từ khóa: "Cần rèn thêm", "Chưa thường xuyên", "Cần chú ý", "Cần sự hỗ trợ".
   - NL Chung: Cần rèn nề nếp tự học. Cần mạnh dạn hơn trong giao tiếp.
   - Phẩm chất: Cần thực hiện nội quy đầy đủ hơn.

LƯU Ý QUAN TRỌNG:
- Dữ liệu đầu vào có thể ký hiệu mức Đạt là "H" hoặc "Đ". Hãy coi "H" trong bối cảnh NLPC tương đương với "Đ" (Đạt).
- Nội dung phải ngắn gọn, súc tích (10-20 từ/trường).
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
  ),
  Robot: ({ className }: { className?: string }) => (
     <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}><rect x="3" y="11" width="18" height="10" rx="2"/><circle cx="12" cy="5" r="2"/><path d="M12 7v4"/><line x1="8" y1="16" x2="8" y2="16"/><line x1="16" y1="16" x2="16" y2="16"/></svg>
  ),
  CloudUpload: ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"/><path d="M12 12v9"/><path d="m16 16-4-4-4 4"/></svg>
  ),
  Flower: ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 2.25c-1.24 0-2.25 1.01-2.25 2.25 0 1.24 1.01 2.25 2.25 2.25 1.24 0 2.25-1.01 2.25-2.25 0-1.24-1.01-2.25-2.25-2.25zM6.5 6.5c-1.24 0-2.25 1.01-2.25 2.25 0 1.24 1.01 2.25 2.25 2.25 1.24 0 2.25-1.01 2.25-2.25 0-1.24-1.01-2.25-2.25-2.25zM17.5 6.5c-1.24 0-2.25 1.01-2.25 2.25 0 1.24 1.01 2.25 2.25 2.25 1.24 0 2.25-1.01 2.25-2.25 0-1.24-1.01-2.25-2.25-2.25zM3.5 12c-1.24 0-2.25 1.01-2.25 2.25 0 1.24 1.01 2.25 2.25 2.25 1.24 0 2.25-1.01 2.25-2.25 0-1.24-1.01-2.25-2.25-2.25zM20.5 12c-1.24 0-2.25 1.01-2.25 2.25 0 1.24 1.01 2.25 2.25 2.25 1.24 0 2.25-1.01 2.25-2.25 0-1.24-1.01-2.25-2.25-2.25zM6.5 17.5c-1.24 0-2.25 1.01-2.25 2.25 0 1.24 1.01 2.25 2.25 2.25 1.24 0 2.25-1.01 2.25-2.25 0-1.24-1.01-2.25-2.25-2.25zM17.5 17.5c-1.24 0-2.25 1.01-2.25 2.25 0 1.24 1.01 2.25 2.25 2.25 1.24 0 2.25-1.01 2.25-2.25 0-1.24-1.01-2.25-2.25-2.25zM12 10.5c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5 1.5-.67 1.5-1.5-.67-1.5-1.5-1.5z" />
    </svg>
  ),
  Leaf: ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12.9 3.1c.3-.5.9-.6 1.4-.2.4.3.5.9.2 1.4l-1.6 2.5C14 6.6 15 6.9 15.9 7.4c2.8 1.4 4.7 4 4.1 7.1-.6 2.8-2.9 4.8-5.8 5-2.9.2-5.7-1.3-7.2-3.8-1.5-2.5-1.4-5.7.3-8 .5-.8 1.2-1.5 1.9-2.1L7.7 4.1c-.3-.5-.2-1.1.2-1.4.5-.3 1.1-.2 1.4.2L12 6l.9-2.9z" />
    </svg>
  )
};
