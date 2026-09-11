import React, { useState } from 'react';
import { UploadCloud, CheckCircle2, AlertCircle, FileSpreadsheet, X } from 'lucide-react';
import { parseAndAggregateRawExcel } from '../utils/excelEngine';

export default function UploaderModal({ isOpen, onClose, onDataAdded, currentData }) {
  const [isDragging, setIsDragging] = useState(false);
  const [newMonthLabel, setNewMonthLabel] = useState('9월');
  const [file, setFile] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [successInfo, setSuccessInfo] = useState(null);

  if (!isOpen) return null;

  const handleFile = (uploadedFile) => {
    if (!uploadedFile) return;
    if (!uploadedFile.name.endsWith('.xlsx') && !uploadedFile.name.endsWith('.xls')) {
      setErrorMsg('엑셀 파일(.xlsx, .xls)만 업로드 가능합니다.');
      return;
    }
    setFile(uploadedFile);
    setErrorMsg('');
  };

  const handleProcess = async () => {
    if (!file) {
      setErrorMsg('분석할 엑셀 파일을 선택해주세요.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    try {
      const buffer = await file.arrayBuffer();
      const { newMonthData } = parseAndAggregateRawExcel(buffer, currentData, newMonthLabel);
      
      onDataAdded(newMonthLabel, newMonthData);
      setSuccessInfo({
        month: newMonthLabel,
        sales: newMonthData.table3["총 계"],
        coupon: newMonthData.table2["총 계"],
        count: newMonthData.table4["총 계"]
      });
    } catch (err) {
      console.error(err);
      setErrorMsg('파일 파싱 중 오류가 발생했습니다. ①농산물raw 시트 양식을 확인해주세요.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-base">누적 로우데이터 자동 집계 & 차감</h3>
              <p className="text-xs text-slate-500">누적 파일에서 이전 누적분을 차감하여 신규 월 실적을 산출합니다.</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {successInfo ? (
          <div className="py-6 text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <h4 className="font-bold text-slate-900 text-lg mb-1">{successInfo.month} 실적 차감 집계 완료!</h4>
            <p className="text-xs text-slate-500 mb-4">대시보드 표 및 그래프에 실시간으로 성공적으로 반영되었습니다.</p>
            <div className="bg-slate-50 rounded-xl p-4 text-left text-sm space-y-2 mb-6 border border-slate-200">
              <div className="flex justify-between">
                <span className="text-slate-500">산출된 {successInfo.month} 순수 매출액:</span>
                <span className="font-bold text-slate-900">{successInfo.sales.toLocaleString()}원</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">산출된 {successInfo.month} 쿠폰 사용액:</span>
                <span className="font-bold text-slate-900">{successInfo.coupon.toLocaleString()}원</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">산출된 {successInfo.month} 판매 건수:</span>
                <span className="font-bold text-slate-900">{successInfo.count.toLocaleString()}건</span>
              </div>
            </div>
            <button
              onClick={() => { setSuccessInfo(null); setFile(null); onClose(); }}
              className="w-full py-2.5 bg-slate-900 text-white font-semibold rounded-xl hover:bg-slate-800 transition-colors"
            >
              대시보드 확인하기
            </button>
          </div>
        ) : (
          <div className="py-4 space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">추가할 월 라벨</label>
              <input
                type="text"
                value={newMonthLabel}
                onChange={e => setNewMonthLabel(e.target.value)}
                placeholder="예: 9월"
                className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
              />
            </div>

            <div
              onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={e => { e.preventDefault(); setIsDragging(false); handleFile(e.dataTransfer.files[0]); }}
              onClick={() => document.getElementById('file-upload-input').click()}
              className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
                isDragging ? 'border-emerald-500 bg-emerald-50/50' : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
              }`}
            >
              <input
                type="file"
                id="file-upload-input"
                accept=".xlsx,.xls"
                className="hidden"
                onChange={e => handleFile(e.target.files[0])}
              />
              <UploadCloud className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              {file ? (
                <div>
                  <span className="text-sm font-bold text-slate-800">{file.name}</span>
                  <p className="text-xs text-emerald-600 mt-1">파일이 선택되었습니다. 클릭하여 변경</p>
                </div>
              ) : (
                <div>
                  <span className="text-sm font-semibold text-slate-700">새로운 누적 로우데이터 엑셀 업로드</span>
                  <p className="text-xs text-slate-400 mt-1">이곳에 파일을 끌어다 놓거나 클릭하여 선택하세요</p>
                </div>
              )}
            </div>

            {errorMsg && (
              <div className="flex items-center gap-2 p-3 bg-red-50 text-red-600 rounded-lg text-xs font-semibold">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="p-3 bg-amber-50 rounded-lg text-amber-800 text-xs leading-relaxed">
              💡 <strong>차감 자동화 원리:</strong> 누적 엑셀 내 <code>①농산물raw</code> 시트의 전체 데이터를 집계한 후, 기 집계된 전월 누적 데이터를 자동으로 차감하여 해당 월만의 순수 실적을 산출합니다.
            </div>

            <button
              onClick={handleProcess}
              disabled={loading}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-sm hover:shadow transition-all disabled:opacity-50"
            >
              {loading ? '데이터 분석 및 차감 계산 중...' : '자동 집계 및 대시보드 반영'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
