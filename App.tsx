
import React, { useState, useRef, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { TemplateType, AppState, PeriodicResult, NLPCResult, EvaluationPeriod, StudentData } from './types';
import { generateComments } from './services/geminiService';
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

  const fileInputRef = useRef<HTMLInputElement>(null);
  const activeGrade = GRADES.find(g => g.id === state.grade) || GRADES[0];

  useEffect(() => {
    setState(prev => ({ ...prev, subjectName: activeGrade.subjects[0] }));
  }, [state.grade]);

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
        const rowStr = (data[i] || []).map(c => String(c).toLowerCase()).join(' ');
        if (rowStr.includes('stt') || rowStr.includes('họ và tên') || rowStr.includes('họ tên')) {
          headerRowIndex = i;
          break;
        }
      }

      if (headerRowIndex !== -1) {
        // Dynamic Mapping
        const header = (data[headerRowIndex] || []).map(c => String(c).toLowerCase().trim());
        const getIdx = (keywords: string[]) => header.findIndex(h => keywords.some(k => h.includes(k)));

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
        // Assume: STT | Mã | Tên | Ngày sinh | Mức | Điểm
        // We find the first row where STT is a number to start
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
            className: '', // No class column in legacy fixed format assumption
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
        state.period
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
    if (l === 'H') return 'bg-blue-100 text-blue-700 border-blue-200 ring-blue-500';
    if (l === 'C') return 'bg-orange-100 text-orange-700 border-orange-200 ring-orange-500';
    return 'bg-slate-100 text-slate-600 border-slate-200 ring-slate-400';
  };

  return (
    <div className={`min-h-screen pb-12 transition-colors duration-500 bg-gradient-to-br from-slate-50 to-${activeGrade.color}/5`}>
      {/* Header with Gradient */}
      <header className={`bg-gradient-to-r from-${activeGrade.color} to-${activeGrade.color}/80 sticky top-0 z-10 shadow-lg text-white`}>
        <div className="max-w-7xl mx-auto px-4 h-18 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-white/20 backdrop-blur-sm shadow-inner">
              <Icons.GraduationCap />
            </div>
            <div>
              <h1 className="text-2xl font-bold leading-none tracking-tight">Trợ lý Nhận xét</h1>
              <p className="text-blue-100 text-xs font-medium mt-1">Chuẩn TT27 & CT GDPT 2018</p>
            </div>
          </div>
          
          <div className="flex bg-white/10 p-1 rounded-full backdrop-blur-md">
            {GRADES.map(g => (
              <button
                key={g.id}
                onClick={() => setState(prev => ({ ...prev, grade: g.id }))}
                className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                  state.grade === g.id 
                  ? 'bg-white text-${activeGrade.color} shadow-md scale-105' 
                  : 'text-white/70 hover:bg-white/10'
                }`}
                style={{ color: state.grade === g.id ? 'black' : undefined }} // Tailwinds text color dynamic hack
              >
                {g.id}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Input & Config */}
        <div className="lg:col-span-5 space-y-6">
          <section className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/50 backdrop-blur-xl">
            <h2 className={`font-bold text-xl mb-6 flex items-center gap-2 text-${activeGrade.color}`}>
               <span className={`p-2 rounded-lg bg-${activeGrade.color}/10`}>
                <Icons.Upload />
              </span>
              Cấu hình & Dữ liệu
            </h2>

            <div className="space-y-6">
              {/* Type Toggle */}
              <div className="bg-slate-50 p-1 rounded-2xl flex border border-slate-200">
                  <button
                    onClick={() => setState(prev => ({ ...prev, templateType: TemplateType.DINH_KY }))}
                    className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all duration-300 ${
                      state.templateType === TemplateType.DINH_KY
                        ? `bg-white text-${activeGrade.color} shadow-sm ring-1 ring-slate-200`
                        : 'text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    Đánh giá Môn học
                  </button>
                  <button
                    onClick={() => setState(prev => ({ ...prev, templateType: TemplateType.NLPC }))}
                    className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all duration-300 ${
                      state.templateType === TemplateType.NLPC
                        ? `bg-white text-${activeGrade.color} shadow-sm ring-1 ring-slate-200`
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
                  <div className="relative">
                    <select
                      value={state.period}
                      onChange={(e) => setState(prev => ({ ...prev, period: e.target.value as EvaluationPeriod }))}
                      className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-700 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all cursor-pointer"
                    >
                      {PERIODS.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
                    </select>
                    <div className="absolute right-4 top-3.5 pointer-events-none text-slate-400">▼</div>
                  </div>
                </div>

                {state.templateType === TemplateType.DINH_KY && (
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Môn học</label>
                    <div className="relative">
                      <select
                        value={state.subjectName}
                        onChange={(e) => setState(prev => ({ ...prev, subjectName: e.target.value }))}
                        className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-700 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all cursor-pointer"
                      >
                        {activeGrade.subjects.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                      <div className="absolute right-4 top-3.5 pointer-events-none text-slate-400">▼</div>
                    </div>
                  </div>
                )}
              </div>

              {/* File Upload Area */}
              <div className="space-y-1">
                 <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">File dữ liệu học sinh</label>
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className={`group relative border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all duration-300 overflow-hidden ${
                    state.uploadedData.length > 0 
                    ? 'border-emerald-300 bg-emerald-50' 
                    : `border-slate-200 bg-slate-50 hover:border-${activeGrade.color}/50 hover:bg-${activeGrade.color}/5`
                  }`}
                >
                  <div className={`absolute inset-0 bg-gradient-to-br from-transparent to-${activeGrade.color}/5 opacity-0 group-hover:opacity-100 transition-opacity`}></div>
                  
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept=".xlsx, .xls"
                    className="hidden"
                  />
                  {state.uploadedData.length > 0 ? (
                    <div className="relative z-10 text-center">
                      <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-3 mx-auto shadow-sm">
                        <Icons.Check />
                      </div>
                      <p className="text-emerald-800 font-bold text-lg">Đã nhận {state.uploadedData.length} học sinh</p>
                      <p className="text-emerald-600 text-xs mt-1 font-medium">Click để thay đổi file khác</p>
                    </div>
                  ) : (
                    <div className="relative z-10 text-center">
                      <div className="w-14 h-14 bg-white text-slate-400 rounded-full flex items-center justify-center mb-3 mx-auto shadow-sm border border-slate-100 group-hover:scale-110 transition-transform">
                        <Icons.FileSpreadsheet />
                      </div>
                      <p className="text-slate-600 font-bold">Tải file Excel từ CSDL</p>
                      <p className="text-xs text-slate-400 mt-2">Cấu trúc: STT | Mã | Tên | Lớp | Ngày sinh | Mức | Điểm</p>
                    </div>
                  )}
                </div>
              </div>

              {state.error && (
                <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3 text-red-600 text-sm shadow-sm">
                  <Icons.Trash />
                  <span className="font-medium">{state.error}</span>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleProcess}
                  disabled={state.isProcessing || state.uploadedData.length === 0}
                  className={`flex-1 py-4 rounded-xl font-bold text-base flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95 ${
                    state.isProcessing || state.uploadedData.length === 0
                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none'
                    : `bg-gradient-to-r from-${activeGrade.color} to-${activeGrade.color}/80 text-white hover:shadow-${activeGrade.color}/30`
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
                  className="px-5 border border-slate-200 bg-white rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 hover:border-red-100 transition-all shadow-sm active:scale-95"
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
          <section className="bg-white rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/50 flex flex-col min-h-[700px] overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-gradient-to-b from-slate-50 to-white flex items-center justify-between">
              <h2 className={`font-bold text-xl flex items-center gap-2 text-${activeGrade.color}`}>
                <Icons.Check />
                Kết quả ({state.results.length})
              </h2>
              <div className="flex items-center gap-3">
                {state.results.length > 0 && (
                  <button 
                    onClick={exportExcel}
                    className={`flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-black transition-all shadow-lg active:scale-95`}
                  >
                    <Icons.Download />
                    Xuất Excel
                  </button>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-auto p-6 space-y-6 bg-slate-50/50">
              {state.results.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-300 py-32 opacity-60">
                  <div className={`p-8 rounded-full bg-slate-50 mb-6 border border-slate-100 shadow-inner`}>
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
                    <div key={i} className="group relative bg-white border border-slate-200 rounded-2xl p-1 hover:border-indigo-300 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                      <div className="p-5 rounded-xl bg-white">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-4">
                            <span className={`w-10 h-10 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center text-sm font-black`}>
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
                                  className="w-16 px-1.5 py-0.5 text-[10px] font-bold bg-slate-100 text-slate-600 rounded border border-slate-200 outline-none focus:bg-white focus:border-indigo-300 transition-all text-center placeholder:text-slate-300"
                                  title="Nhập tên lớp"
                                />
                              </div>
                               {/* Interactive Level and Score selectors for DINH_KY */}
                              {state.templateType === TemplateType.DINH_KY && (
                                <div className="flex gap-2 mt-2">
                                  {/* Level Selector */}
                                  <div className="relative">
                                    <select
                                      value={student?.level || 'H'}
                                      onChange={(e) => student && updateStudent(student.stt, 'level', e.target.value)}
                                      className={`appearance-none px-3 py-1 pr-6 rounded-md text-[11px] font-bold border uppercase tracking-wider cursor-pointer outline-none focus:ring-2 focus:ring-offset-1 transition-all ${getLevelColor(student?.level)}`}
                                    >
                                      <option value="T">Mức: T</option>
                                      <option value="H">Mức: H</option>
                                      <option value="C">Mức: C</option>
                                    </select>
                                    <div className="absolute right-1.5 top-1.5 pointer-events-none opacity-50 text-[8px]">▼</div>
                                  </div>

                                  {/* Score Input */}
                                  <div className="relative flex items-center">
                                    <input
                                      type="number"
                                      value={student?.score || ''}
                                      onChange={(e) => student && updateStudent(student.stt, 'score', e.target.value)}
                                      placeholder="Điểm"
                                      className="w-16 px-2 py-1 rounded-md text-[11px] font-bold border bg-purple-50 text-purple-700 border-purple-200 uppercase tracking-wider outline-none focus:ring-2 focus:ring-purple-500/30 text-center"
                                    />
                                    <span className="absolute right-0 -mr-6 text-[10px] text-slate-400 font-medium hidden group-hover:block">đ</span>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <button
                            onClick={() => {
                              const text = 'noi_dung_nhan_xet' in res 
                                ? res.noi_dung_nhan_xet 
                                : `${res.nx_nang_luc_chung} ${res.nx_nang_luc_dac_thu} ${res.nx_pham_chat}`;
                              copyToClipboard(text);
                            }}
                            className={`px-4 py-1.5 rounded-lg bg-slate-50 text-slate-400 text-xs font-bold hover:bg-${activeGrade.color} hover:text-white transition-colors`}
                          >
                            Copy
                          </button>
                        </div>

                        {'noi_dung_nhan_xet' in res ? (
                          <div className="relative">
                            <textarea
                              value={res.noi_dung_nhan_xet}
                              onChange={(e) => updateResult(i, 'noi_dung_nhan_xet', e.target.value)}
                              className="w-full bg-slate-50/50 border border-slate-200 rounded-xl p-4 text-sm text-slate-700 font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 focus:bg-white outline-none transition-all resize-none leading-relaxed"
                              rows={3}
                            />
                            <div className="absolute bottom-2 right-2 pointer-events-none">
                              <span className="text-[10px] text-slate-300 font-bold bg-white px-1 rounded">AI</span>
                            </div>
                          </div>
                        ) : (
                          <div className="grid gap-3">
                            <div className="space-y-1">
                              <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest pl-1">NL Chung</span>
                              <textarea
                                value={res.nx_nang_luc_chung}
                                onChange={(e) => updateResult(i, 'nx_nang_luc_chung', e.target.value)}
                                className="w-full bg-slate-50/50 border border-slate-200 rounded-xl p-3 text-sm focus:bg-white focus:border-indigo-300 outline-none resize-none"
                                rows={2}
                              />
                            </div>
                            <div className="space-y-1">
                              <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest pl-1">NL Đặc thù</span>
                              <textarea
                                value={res.nx_nang_luc_dac_thu}
                                onChange={(e) => updateResult(i, 'nx_nang_luc_dac_thu', e.target.value)}
                                className="w-full bg-slate-50/50 border border-slate-200 rounded-xl p-3 text-sm focus:bg-white focus:border-indigo-300 outline-none resize-none"
                                rows={2}
                              />
                            </div>
                            <div className="space-y-1">
                              <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest pl-1">Phẩm chất</span>
                              <textarea
                                value={res.nx_pham_chat}
                                onChange={(e) => updateResult(i, 'nx_pham_chat', e.target.value)}
                                className="w-full bg-slate-50/50 border border-slate-200 rounded-xl p-3 text-sm focus:bg-white focus:border-indigo-300 outline-none resize-none"
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

      <footer className="mt-12 text-center text-slate-400 text-xs px-4 pb-8">
        <p className="max-w-md mx-auto leading-relaxed opacity-70 font-bold uppercase">
          &copy; TRƯỜNG PTDTBT TH GIÀNG CHU PHÌN &copy;
        </p>
      </footer>
    </div>
  );
};

export default App;
