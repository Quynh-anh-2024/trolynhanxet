
export enum TemplateType {
  DINH_KY = 'dinh_ky',
  NLPC = 'nlpc'
}

export type EvaluationPeriod = 'giữa học kì 1' | 'cuối học kì 1' | 'giữa học kì 2' | 'cuối học kì 2';

export interface StudentData {
  stt: string;
  idCode?: string; // Mã học sinh / Mã định danh
  name: string;
  dob?: string;    // Ngày sinh
  className?: string; // Lớp
  level: string;   // Mức đạt được
  score?: string;  // Điểm KTĐK
  rawRow: any[];   // Original Excel row for reconstruction
}

export interface PeriodicResult {
  stt: string;
  noi_dung_nhan_xet: string;
}

export interface NLPCResult {
  stt: string;
  nx_nang_luc_chung: string;
  nx_nang_luc_dac_thu: string;
  nx_pham_chat: string;
}

export interface EvaluationResponse {
  template_type: TemplateType;
  results: (PeriodicResult | NLPCResult)[];
}

export interface GradeConfig {
  id: number;
  label: string;
  color: string;
  bgLight: string;
  subjects: string[];
}

export interface AppState {
  templateType: TemplateType;
  grade: number;
  period: EvaluationPeriod;
  subjectName: string;
  isProcessing: boolean;
  results: (PeriodicResult | NLPCResult)[];
  error: string | null;
  uploadedData: StudentData[];
}
