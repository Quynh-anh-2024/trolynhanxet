
import React, { useState, useRef, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { TemplateType, AppState, PeriodicResult, NLPCResult, EvaluationPeriod, StudentData } from './types';
import { generateComments, verifyApiKey } from './services/geminiService';
import { Icons, GRADES, PERIODS } from './constants';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>({
    templateType: TemplateType.DINH_KY,
    grade: 1,
    period: 'giữa học kì 1',
    subjectName: 'Toán',
    isProcessing: false,
    results: [],
    error: null,
    uploadedData: []
  });

  // API Key State
  const [apiKey, setApiKey] = useState<string>('');
  const [showApiModal, setShowApiModal] = useState<boolean>(false);
  const [tempKey, setTempKey] = useState<string>('');
  const [isVerifyingKey, setIsVerifyingKey] = useState<boolean>(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const activeGrade = GRADES.find(g => g.id === state.grade) || GRADES[0];

  useEffect(() => {
    const storedKey = localStorage.getItem('gemini_api_key');
    if (storedKey) {
      setApiKey(storedKey);
    } else {
      setShowApiModal(true);
    }
  }, []);

  useEffect(() => {
    setState(prev => ({ ...prev, subjectName: activeGrade.subjects[0] }));
  }, [state.grade]);

  const handleVerifyAndSaveKey = async () => {
    if (!tempKey.trim()) {
      setApiError("Vui lòng nhập khóa API.");
      return;
    }
    
    setIsVerifyingKey(true);
    setApiError(null);

    const isValid = await verifyApiKey(tempKey);
    
    setIsVerifyingKey(false);
    
    if (isValid) {
      setApiKey(tempKey);
      localStorage.setItem('gemini_api_key', tempKey);
      setShowApiModal(false);
      setTempKey('');
    } else {
      setApiError("Khóa API không hợp lệ hoặc đã hết hạn. Vui lòng kiểm tra lại.");
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];

      if (data.length < 2) {
        setState(prev => ({ ...prev, error: "File không có dữ liệu hoặc định dạng sai." }));
        return;
      }

      let students: StudentData[] = [];
      let headerRowIndex = -1;

      // 1. Detect Header Row based on keywords
      for (let i = 0; i < Math.min(data.length, 10); i++) {
        const row = data[i] || [];
        // Safe conversion handling sparse arrays from Excel
        const rowStr = Array.from(row).map(c => c ? String(c).toLowerCase() : '').join(' ');
        if (rowStr.includes('stt') || rowStr.includes('họ và tên') || rowStr.includes('họ tên')) {
          headerRowIndex = i;
          break;
        }
      }

      if (headerRowIndex !== -1) {
        // Dynamic Mapping
        const rawHeader = data[headerRowIndex] || [];
        // Convert to dense array of strings to avoid undefined errors in sparse arrays
        const header = Array.from(rawHeader).map(c => c ? String(c).toLowerCase().trim() : '');
        
        // Find index with safety check for h (header string) being truthy
        const getIdx = (keywords: string[]) => header.findIndex(h => h && keywords.some(k => h.includes(k)));

        const idxSTT = getIdx(['stt']);
        const idxCode = getIdx(['mã', 'id', 'định danh']);
        const idxName = getIdx(['họ và tên', 'họ tên', 'tên']);
        const idxDob = getIdx(['ngày sinh', 'ns', 'năm sinh']);
        const idxClass = getIdx(['lớp']);
        const idxLevel = getIdx(['mức', 'đạt được', 'xếp loại', 'kết quả']);
        const idxScore = getIdx(['điểm']);

        students = data.slice(headerRowIndex + 1).map(row => ({
          stt: idxSTT > -1 ? String(row[idxSTT] || '') : '',
          idCode: idxCode > -1 ? String(row[idxCode] || '') : '',
          name: idxName > -1 ? String(row[idxName] || '') : '',
          dob: idxDob > -1 ? String(row[idxDob] || '') : '',
          className: idxClass > -1 ? String(row[idxClass] || '') : '',
          level: idxLevel > -1 ? String(row[idxLevel] || 'H') : 'H',
          score: idxScore > -1 ? String(row[idxScore] || '') : undefined,
          rawRow: row
        })).filter(s => s.name && s.name !== 'undefined');

      } else {
        // Fallback: Fixed Indices (Legacy Support)
        let startRow = 0;
        for (let i = 0; i < Math.min(data.length, 10); i++) {
           const val = data[i] && data[i][0];
           if (val && !isNaN(Number(val))) {
             startRow = i;
             break;
           }
        }
        
        students = data.slice(startRow).map((row) => {
          return {
            stt: String(row[0] || ''),
            idCode: String(row[1] || ''),
            name: String(row[2] || ''),
            dob: row[3] ? String(row[3]) : '',
            className: '',
            level: String(row[4] || 'H'),
            score: row[5] ? String(row[5]) : undefined,
            rawRow: row
          };
        }).filter(s => s.name && s.name !== 'undefined');
      }

      setState(prev => ({ ...prev, uploadedData: students, results: [], error: null }));
    };
    reader.readAsBinaryString(file);
  };

  const handleProcess = async () => {
    if (state.uploadedData.length === 0) {
      setState(prev => ({ ...prev, error: "Vui lòng tải lên file dữ liệu học sinh." }));
      return;
    }

    if (!apiKey) {
      setShowApiModal(true);
      return;
    }

    setState(prev => ({ ...prev, isProcessing: true, error: null }));

    try {
      const response = await generateComments(
        state.templateType, 
        state.uploadedData.map(s => ({ 
          stt: s.stt, 
          name: s.name, 
          level: s.level, 
          score: s.score, 
          dob: s.dob 
        })), 
        state.subjectName, 
        state.grade, 
        state.period,
        apiKey
      );
      setState(prev => ({
        ...prev,
        results: response.results,
        isProcessing: false
      }));
    } catch (err: any) {
      setState(prev => ({
        ...prev,
        isProcessing: false,
        error: err.message
      }));
    }
  };

  const updateResult = (index: number, field: string, value: string) => {
    const newResults = [...state.results];
    (newResults[index] as any)[field] = value;
    setState(prev => ({ ...prev, results: newResults }));
  };

  const updateStudent = (stt: string, field: string, value: string) => {
    setState(prev => ({
      ...prev,
      uploadedData: prev.uploadedData.map(s => 
        s.stt === stt ? { ...s, [field]: value } : s
      )
    }));
  };

  const exportExcel = () => {
    if (state.results.length === 0) return;

    const wb = XLSX.utils.book_new();
    let wsData: any[][] = [];

    if (state.templateType === TemplateType.DINH_KY) {
      wsData.push(['STT', 'Lớp', 'Mã học sinh', 'Họ và tên', 'Ngày sinh', 'Mức đạt được', 'Điểm KTĐK', 'Mã nhận xét', 'Nội dung nhận xét', 'Thời điểm đánh giá']);
      state.uploadedData.forEach((student, idx) => {
        const result = state.results.find(r => r.stt === student.stt) as PeriodicResult;
        wsData.push([
          student.stt,
          student.className || '',
          student.idCode,
          student.name,
          student.dob,
          student.level,
          student.score || '',
          '',
          result ? result.noi_dung_nhan_xet : '',
          state.period
        ]);
      });
    } else {
      wsData.push(['STT', 'Lớp', 'Mã định danh', 'Họ và tên', 'Ngày sinh', 'Nhận xét NL Chung', 'Nhận xét NL Đặc thù', 'Nhận xét Phẩm chất', 'Thời điểm đánh giá']);
      state.uploadedData.forEach((student, idx) => {
        const result = state.results.find(r => r.stt === student.stt) as NLPCResult;
        wsData.push([
          student.stt,
          student.className || '',
          student.idCode,
          student.name,
          student.dob,
          result ? result.nx_nang_luc_chung : '',
          result ? result.nx_nang_luc_dac_thu : '',
          result ? result.nx_pham_chat : '',
          state.period
        ]);
      });
    }

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    XLSX.utils.book_append_sheet(wb, ws, "Nhận xét");
    XLSX.writeFile(wb, `Nhan_Xet_${state.templateType}_${state.grade}_${state.period}.xlsx`);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const resetAll = () => {
    setState(prev => ({ ...prev, uploadedData: [], results: [], error: null }));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const getLevelColor = (level: string = '') => {
    const l = level.trim().toUpperCase();
    if (l === 'T') return 'bg-emerald-100 text-emerald-700 border-emerald-200 ring-emerald-500';
    if (l === 'H' || l === 'Đ') return 'bg-blue-100 text-blue-700 border-blue-200 ring-blue-500';
    if (l === 'C') return 'bg-orange-100 text-orange-700 border-orange-200 ring-orange-500';
    return 'bg-slate-100 text-slate-600 border-slate-200 ring-slate-400';
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-slate-50 font-sans selection:bg-pink-300/40">
      
      {/* --- BACKGROUND DECORATION --- */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        {/* Abstract Blobs */}
        <div 
          className={`absolute -top-20 -left-20 w-96 h-96 rounded-full blur-[80px] opacity-40 mix-blend-multiply animate-pulse transition-colors duration-1000 bg-${activeGrade.color}/30`}
          style={{ animationDuration: '4s' }}
        />
        <div 
          className="absolute -bottom-32 -right-32 w-[500px] h-[500px] bg-emerald-300/30 rounded-full blur-[100px] opacity-40 mix-blend-multiply" 
        />
        <div 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-200/20 rounded-full blur-[120px] opacity-30" 
        />
        <div 
           className="absolute top-40 right-10 w-64 h-64 bg-pink-200/30 rounded-full blur-[60px] opacity-30 mix-blend-multiply"
        />

        {/* Floral SVGs */}
        <Icons.Flower className={`absolute top-20 right-12 w-48 h-48 text-${activeGrade.color}/5 rotate-12`} />
        <Icons.Leaf className="absolute bottom-20 left-10 w-40 h-40 text-emerald-600/5 -rotate-12" />
        <Icons.Flower className="absolute bottom-1/4 right-1/4 w-32 h-32 text-orange-400/5 rotate-45" />
      </div>

      {/* --- CONTENT LAYER --- */}
      <div className="relative z-10">
        
        {/* Header with Glassmorphism */}
        <header className={`sticky top-0 z-50 backdrop-blur-xl bg-white/70 border-b border-white/50 shadow-sm`}>
          <div className="max-w-7xl mx-auto px-4 h-18 py-3 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-2xl bg-gradient-to-br from-${activeGrade.color} to-${activeGrade.color}/70 shadow-lg text-white`}>
                <Icons.GraduationCap />
              </div>
              <div>
                <h1 className="text-2xl font-bold leading-none tracking-tight text-slate-800">Trợ lý Nhận xét</h1>
                <p className={`text-${activeGrade.color} text-xs font-bold mt-1 uppercase tracking-wide opacity-80`}>Chuẩn TT27 & CT GDPT 2018</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setShowApiModal(true)}
                className="text-xs bg-slate-900/5 hover:bg-slate-900/10 backdrop-blur px-3 py-1.5 rounded-full text-slate-600 transition-colors font-bold flex items-center gap-2 border border-slate-200/50"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                Đổi API Key
              </button>
              <div className="flex bg-slate-100/50 p-1.5 rounded-full backdrop-blur-md border border-white/50 shadow-inner">
                {GRADES.map(g => (
                  <button
                    key={g.id}
                    onClick={() => setState(prev => ({ ...prev, grade: g.id }))}
                    className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                      state.grade === g.id 
                      ? `bg-gradient-to-br from-${g.color} to-${g.color}/80 text-white shadow-lg shadow-${g.color}/30 scale-105 ring-2 ring-white` 
                      : 'text-slate-400 hover:bg-white/50 hover:text-slate-600'
                    }`}
                  >
                    {g.id}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8 pb-12">
          {/* Left Column: Input & Config */}
          <div className="lg:col-span-5 space-y-6">
            <section className="bg-white/80 backdrop-blur-xl p-6 rounded-[2rem] border border-white/60 shadow-xl shadow-slate-200/40 relative overflow-hidden group">
               {/* Decorative Gradient Line */}
               <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-${activeGrade.color}/40 via-${activeGrade.color} to-${activeGrade.color}/40`}></div>

              <h2 className={`font-bold text-xl mb-6 flex items-center gap-2 text-slate-700`}>
                 <span className={`p-2 rounded-xl bg-${activeGrade.color}/10 text-${activeGrade.color}`}>
                  <Icons.Upload />
                </span>
                Cấu hình & Dữ liệu
              </h2>

              <div className="space-y-6">
                {/* Type Toggle */}
                <div className="bg-slate-100/50 p-1.5 rounded-2xl flex border border-slate-200/60 shadow-inner">
                    <button
                      onClick={() => setState(prev => ({ ...prev, templateType: TemplateType.DINH_KY }))}
                      className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all duration-300 ${
                        state.templateType === TemplateType.DINH_KY
                          ? `bg-white text-${activeGrade.color} shadow-sm ring-1 ring-black/5`
                          : 'text-slate-400 hover:text-slate-600'
                      }`}
                    >
                      Đánh giá Môn học
                    </button>
                    <button
                      onClick={() => setState(prev => ({ ...prev, templateType: TemplateType.NLPC }))}
                      className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all duration-300 ${
                        state.templateType === TemplateType.NLPC
                          ? `bg-white text-${activeGrade.color} shadow-sm ring-1 ring-black/5`
                          : 'text-slate-400 hover:text-slate-600'
                      }`}
                    >
                      Năng lực & Phẩm chất
                    </button>
                </div>

                {/* Period & Subject */}
                <div className="grid grid-cols-1 gap-4">
                   <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Thời điểm đánh giá</label>
                    <div className="relative group/select">
                      <select
                        value={state.period}
                        onChange={(e) => setState(prev => ({ ...prev, period: e.target.value as EvaluationPeriod }))}
                        className="w-full appearance-none bg-slate-50/50 border border-slate-200/80 rounded-2xl px-5 py-3.5 text-sm font-semibold text-slate-700 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white outline-none transition-all cursor-pointer hover:border-indigo-300"
                      >
                        {PERIODS.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
                      </select>
                      <div className="absolute right-4 top-4 pointer-events-none text-slate-400 group-hover/select:text-indigo-500 transition-colors">▼</div>
                    </div>
                  </div>

                  {state.templateType === TemplateType.DINH_KY && (
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Môn học</label>
                      <div className="relative group/select">
                        <select
                          value={state.subjectName}
                          onChange={(e) => setState(prev => ({ ...prev, subjectName: e.target.value }))}
                          className="w-full appearance-none bg-slate-50/50 border border-slate-200/80 rounded-2xl px-5 py-3.5 text-sm font-semibold text-slate-700 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white outline-none transition-all cursor-pointer hover:border-indigo-300"
                        >
                          {activeGrade.subjects.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                        <div className="absolute right-4 top-4 pointer-events-none text-slate-400 group-hover/select:text-indigo-500 transition-colors">▼</div>
                      </div>
                    </div>
                  )}
                </div>

                {/* File Upload Area */}
                <div className="space-y-1">
                   <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">File dữ liệu học sinh</label>
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className={`group/upload relative border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all duration-300 overflow-hidden ${
                      state.uploadedData.length > 0 
                      ? 'border-emerald-300 bg-emerald-50/50' 
                      : `border-slate-200 bg-slate-50/50 hover:border-${activeGrade.color}/40 hover:bg-${activeGrade.color}/5`
                    }`}
                  >
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                      accept=".xlsx, .xls"
                      className="hidden"
                    />
                    {state.uploadedData.length > 0 ? (
                      <div className="relative z-10 text-center">
                        <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-3 mx-auto shadow-sm ring-4 ring-emerald-50">
                          <Icons.Check />
                        </div>
                        <p className="text-emerald-800 font-bold text-lg">Đã nhận {state.uploadedData.length} học sinh</p>
                        <p className="text-emerald-600 text-xs mt-1 font-medium">Click để thay đổi file khác</p>
                      </div>
                    ) : (
                      <div className="relative z-10 text-center">
                        <div className={`w-16 h-16 bg-white text-slate-400 rounded-full flex items-center justify-center mb-3 mx-auto shadow-sm border border-slate-100 group-hover/upload:scale-110 group-hover/upload:text-${activeGrade.color} transition-all duration-300`}>
                          <Icons.FileSpreadsheet />
                        </div>
                        <p className="text-slate-600 font-bold group-hover/upload:text-slate-800 transition-colors">Tải file Excel từ CSDL</p>
                        <p className="text-xs text-slate-400 mt-2">Cấu trúc: STT | Mã | Tên | Lớp | Ngày sinh | Mức | Điểm</p>
                      </div>
                    )}
                  </div>
                </div>

                {state.error && (
                  <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3 text-red-600 text-sm shadow-sm animate-pulse">
                    <Icons.Trash />
                    <span className="font-medium">{state.error}</span>
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={handleProcess}
                    disabled={state.isProcessing || state.uploadedData.length === 0}
                    className={`flex-1 py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2 transition-all shadow-xl shadow-${activeGrade.color}/20 active:scale-95 ${
                      state.isProcessing || state.uploadedData.length === 0
                      ? 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none'
                      : `bg-gradient-to-r from-${activeGrade.color} to-${activeGrade.color}/80 text-white hover:shadow-${activeGrade.color}/40 hover:-translate-y-0.5`
                    }`}
                  >
                    {state.isProcessing ? (
                       <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    ) : (
                      <Icons.Sparkles />
                    )}
                    {state.isProcessing ? 'Đang phân tích...' : 'Tạo nhận xét AI'}
                  </button>
                  <button
                    onClick={resetAll}
                    className="px-5 border border-slate-200/80 bg-white/50 backdrop-blur rounded-2xl text-slate-400 hover:text-red-500 hover:bg-red-50 hover:border-red-100 transition-all shadow-sm active:scale-95"
                    title="Xóa tất cả"
                  >
                    <Icons.Trash />
                  </button>
                </div>
              </div>
            </section>
          </div>

          {/* Right Column: Results */}
          <div className="lg:col-span-7 space-y-6">
            <section className="bg-white/80 backdrop-blur-xl rounded-[2rem] border border-white/60 shadow-xl shadow-slate-200/40 flex flex-col min-h-[700px] overflow-hidden relative">
               <div className={`absolute top-0 right-0 w-full h-1 bg-gradient-to-l from-${activeGrade.color}/40 via-${activeGrade.color} to-${activeGrade.color}/40`}></div>

              <div className="p-6 border-b border-slate-100/80 bg-white/40 flex items-center justify-between backdrop-blur-md">
                <h2 className={`font-bold text-xl flex items-center gap-2 text-slate-700`}>
                  <Icons.Check />
                  Kết quả ({state.results.length})
                </h2>
                <div className="flex items-center gap-3">
                  {state.results.length > 0 && (
                    <button 
                      onClick={exportExcel}
                      className={`flex items-center gap-2 px-6 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-black transition-all shadow-lg shadow-slate-900/20 active:scale-95`}
                    >
                      <Icons.Download />
                      Xuất Excel
                    </button>
                  )}
                </div>
              </div>

              <div className="flex-1 overflow-auto p-6 space-y-6 bg-slate-50/30">
                {state.results.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-300 py-32 opacity-70">
                    <div className={`p-10 rounded-full bg-white/50 mb-6 border border-white shadow-lg`}>
                      <Icons.Sparkles />
                    </div>
                    <p className="text-xl font-bold text-slate-400">Chưa có kết quả</p>
                    <p className="text-sm font-medium">Vui lòng tải file và nhấn nút tạo.</p>
                  </div>
                ) : (
                  state.results.map((res, i) => {
                    const student = state.uploadedData.find(s => s.stt === res.stt);
                    const studentName = student ? student.name : `Học sinh ${res.stt}`;
                    
                    return (
                      <div key={i} className="group relative bg-white/70 backdrop-blur-sm border border-white rounded-3xl p-1 hover:border-indigo-300 hover:shadow-xl hover:shadow-indigo-100 transition-all duration-500 hover:-translate-y-1">
                        <div className="p-5 rounded-[1.3rem] bg-white/50">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-4">
                              <span className={`w-10 h-10 rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center text-sm font-black shadow-inner`}>
                                {res.stt}
                              </span>
                              <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-base font-bold text-slate-800 block">
                                    {studentName}
                                  </span>
                                  <input
                                    type="text"
                                    value={student?.className || ''}
                                    onChange={(e) => student && updateStudent(student.stt, 'className', e.target.value)}
                                    placeholder="Lớp"
                                    className="w-16 px-2 py-1 text-[10px] font-bold bg-white/80 text-slate-600 rounded-lg border border-slate-200 outline-none focus:border-indigo-300 transition-all text-center placeholder:text-slate-300 shadow-sm"
                                    title="Nhập tên lớp"
                                  />
                                </div>
                                 {/* Interactive Level and Score selectors */}
                                 <div className="flex gap-2 mt-2">
                                    {/* Level Selector */}
                                    <div className="relative">
                                      <select
                                        value={student?.level || (state.templateType === TemplateType.NLPC ? 'Đ' : 'H')}
                                        onChange={(e) => student && updateStudent(student.stt, 'level', e.target.value)}
                                        className={`appearance-none px-3 py-1 pr-6 rounded-lg text-[11px] font-bold border uppercase tracking-wider cursor-pointer outline-none focus:ring-2 focus:ring-offset-1 transition-all shadow-sm ${getLevelColor(student?.level)}`}
                                      >
                                        {state.templateType === TemplateType.DINH_KY ? (
                                          <>
                                            <option value="T">Mức: T (Tốt)</option>
                                            <option value="H">Mức: H (Hoàn thành)</option>
                                            <option value="C">Mức: C (Chưa hoàn thành)</option>
                                          </>
                                        ) : (
                                          <>
                                            <option value="T">Mức: T (Tốt)</option>
                                            <option value="Đ">Mức: Đ (Đạt)</option>
                                            <option value="H">Mức: H (Đạt)</option>
                                            <option value="C">Mức: C (Cần cố gắng)</option>
                                          </>
                                        )}
                                      </select>
                                      <div className="absolute right-1.5 top-1.5 pointer-events-none opacity-50 text-[8px]">▼</div>
                                    </div>

                                    {/* Score Input (Only for DINH_KY) */}
                                    {state.templateType === TemplateType.DINH_KY && (
                                      <div className="relative flex items-center">
                                        <input
                                          type="number"
                                          value={student?.score || ''}
                                          onChange={(e) => student && updateStudent(student.stt, 'score', e.target.value)}
                                          placeholder="Điểm"
                                          className="w-16 px-2 py-1 rounded-lg text-[11px] font-bold border bg-purple-50 text-purple-700 border-purple-200 uppercase tracking-wider outline-none focus:ring-2 focus:ring-purple-500/30 text-center shadow-sm"
                                        />
                                        <span className="absolute right-0 -mr-6 text-[10px] text-slate-400 font-medium hidden group-hover:block">đ</span>
                                      </div>
                                    )}
                                  </div>
                              </div>
                            </div>
                            
                            <button
                              onClick={() => {
                                const text = 'noi_dung_nhan_xet' in res 
                                  ? res.noi_dung_nhan_xet 
                                  : `${res.nx_nang_luc_chung} ${res.nx_nang_luc_dac_thu} ${res.nx_pham_chat}`;
                                copyToClipboard(text);
                              }}
                              className={`px-4 py-1.5 rounded-xl bg-slate-50 text-slate-400 text-xs font-bold hover:bg-${activeGrade.color} hover:text-white transition-all shadow-sm active:scale-95`}
                            >
                              Copy
                            </button>
                          </div>

                          {'noi_dung_nhan_xet' in res ? (
                            <div className="relative">
                              <textarea
                                value={res.noi_dung_nhan_xet}
                                onChange={(e) => updateResult(i, 'noi_dung_nhan_xet', e.target.value)}
                                className="w-full bg-slate-50/50 hover:bg-white focus:bg-white border border-slate-200 rounded-2xl p-4 text-sm text-slate-700 font-medium focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-400 outline-none transition-all resize-none leading-relaxed shadow-inner"
                                rows={3}
                              />
                              <div className="absolute bottom-2 right-2 pointer-events-none">
                                <span className="text-[10px] text-slate-300 font-bold bg-white/80 px-1.5 py-0.5 rounded border border-slate-100">AI</span>
                              </div>
                            </div>
                          ) : (
                            <div className="grid gap-3">
                              <div className="space-y-1">
                                <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest pl-1">NL Chung</span>
                                <textarea
                                  value={res.nx_nang_luc_chung}
                                  onChange={(e) => updateResult(i, 'nx_nang_luc_chung', e.target.value)}
                                  className="w-full bg-slate-50/50 hover:bg-white focus:bg-white border border-slate-200 rounded-xl p-3 text-sm focus:border-indigo-300 outline-none resize-none shadow-inner"
                                  rows={2}
                                />
                              </div>
                              <div className="space-y-1">
                                <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest pl-1">NL Đặc thù</span>
                                <textarea
                                  value={res.nx_nang_luc_dac_thu}
                                  onChange={(e) => updateResult(i, 'nx_nang_luc_dac_thu', e.target.value)}
                                  className="w-full bg-slate-50/50 hover:bg-white focus:bg-white border border-slate-200 rounded-xl p-3 text-sm focus:border-indigo-300 outline-none resize-none shadow-inner"
                                  rows={2}
                                />
                              </div>
                              <div className="space-y-1">
                                <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest pl-1">Phẩm chất</span>
                                <textarea
                                  value={res.nx_pham_chat}
                                  onChange={(e) => updateResult(i, 'nx_pham_chat', e.target.value)}
                                  className="w-full bg-slate-50/50 hover:bg-white focus:bg-white border border-slate-200 rounded-xl p-3 text-sm focus:border-indigo-300 outline-none resize-none shadow-inner"
                                  rows={2}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </section>
          </div>
        </main>

        <footer className="mt-8 text-center text-slate-500/60 text-xs px-4 pb-8 backdrop-blur-sm">
          <p className="max-w-md mx-auto leading-relaxed opacity-70 font-bold uppercase">
            &copy; TRƯỜNG PTDTBT TH GIÀNG CHU PHÌN &copy;
          </p>
        </footer>
      </div>

      {/* API Key Modal */}
      {showApiModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md transition-all">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-white/50 relative">
             <div className="absolute top-0 right-0 w-32 h-32 bg-blue-400/20 rounded-full blur-3xl -mr-10 -mt-10"></div>
             <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-400/20 rounded-full blur-3xl -ml-10 -mb-10"></div>
            
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-8 text-white text-center relative z-10">
              <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-md border border-white/20 shadow-lg">
                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>
              </div>
              <h3 className="text-2xl font-bold tracking-tight">Kết nối AI</h3>
              <p className="text-blue-100 text-sm mt-2 font-medium opacity-90">Cần có API Key từ Google AI Studio</p>
            </div>
            
            <div className="p-8 space-y-6 relative z-10">
              <div className="space-y-4 text-sm text-slate-600">
                <div className="flex items-start gap-3 group">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs ring-1 ring-blue-100 group-hover:bg-blue-600 group-hover:text-white transition-colors">1</span>
                  <p>Truy cập <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-blue-600 font-bold hover:underline">Google AI Studio</a>.</p>
                </div>
                <div className="flex items-start gap-3 group">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs ring-1 ring-blue-100 group-hover:bg-blue-600 group-hover:text-white transition-colors">2</span>
                  <p>Nhấn vào nút <strong>Create API Key</strong>.</p>
                </div>
                <div className="flex items-start gap-3 group">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs ring-1 ring-blue-100 group-hover:bg-blue-600 group-hover:text-white transition-colors">3</span>
                  <p>Dán khóa API vào bên dưới.</p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase ml-1">Khóa API của bạn</label>
                <input 
                  type="password"
                  value={tempKey}
                  onChange={(e) => {
                    setTempKey(e.target.value);
                    if(apiError) setApiError(null);
                  }}
                  placeholder="AIzaSy..."
                  className="w-full px-5 py-3.5 bg-slate-50/80 border border-slate-200 rounded-xl text-slate-800 font-medium focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white outline-none transition-all"
                />
                {apiError && (
                  <p className="text-red-500 text-xs font-medium flex items-center gap-1 bg-red-50 p-2 rounded-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>
                    {apiError}
                  </p>
                )}
              </div>

              <button
                onClick={handleVerifyAndSaveKey}
                disabled={isVerifyingKey || !tempKey}
                className={`w-full py-4 rounded-xl font-bold text-white shadow-xl shadow-blue-600/20 active:scale-95 transition-all flex items-center justify-center gap-2 ${
                  isVerifyingKey || !tempKey 
                  ? 'bg-slate-300 cursor-not-allowed shadow-none'
                  : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:shadow-blue-600/30'
                }`}
              >
                {isVerifyingKey ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Đang xác thực...
                  </>
                ) : (
                  'Lưu & Bắt đầu'
                )}
              </button>
              
              {!apiKey && (
                <p className="text-center text-[10px] text-slate-400 font-medium uppercase tracking-wide">
                  An toàn & Bảo mật trên trình duyệt
                </p>
              )}
              {apiKey && (
                 <button onClick={() => setShowApiModal(false)} className="w-full py-2 text-slate-500 text-sm font-medium hover:text-slate-800 hover:bg-slate-50 rounded-lg transition-colors">
                    Đóng
                 </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
