import React, { useState, useMemo } from 'react';
import { Download, PlusCircle, BarChart3, Table as TableIcon, Layers } from 'lucide-react';
import { INITIAL_DATA, COUPON_ASSIGNED, CHANNELS, CATEGORIES } from './data/initialData';
import KPICards from './components/KPICards';
import ExcelTableSection from './components/ExcelTableSection';
import ChartsSection from './components/ChartsSection';
import UploaderModal from './components/UploaderModal';
import { exportToExcel } from './utils/excelEngine';

export default function App() {
  const [data, setData] = useState(INITIAL_DATA);
  const [months, setMonths] = useState(["7월", "8월"]);
  const [activeTab, setActiveTab] = useState("all");
  const [selectedMonth, setSelectedMonth] = useState("8월");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const computedData = useMemo(() => {
    const full = JSON.parse(JSON.stringify(data));

    ["table2", "table3", "table4"].forEach(tbl => {
      full[tbl]["누적"] = { "총 계": 0 };
      CHANNELS.forEach(ch => {
        const sum = months.reduce((acc, m) => acc + (full[tbl][m]?.[ch] || 0), 0);
        full[tbl]["누적"][ch] = sum;
        full[tbl]["누적"]["총 계"] += sum;
      });
    });

    ["table5", "table6", "table7"].forEach(tbl => {
      CATEGORIES.forEach(cat => {
        full[tbl][cat]["누적"] = { "소 계": 0 };
        CHANNELS.forEach(ch => {
          const sum = months.reduce((acc, m) => acc + (full[tbl][cat]?.[m]?.[ch] || 0), 0);
          full[tbl][cat]["누적"][ch] = sum;
          full[tbl][cat]["누적"]["소 계"] += sum;
        });
      });
    });

    return full;
  }, [data, months]);

  const handleAddMonthData = (newMonthLabel, newMonthData) => {
    if (!months.includes(newMonthLabel)) {
      setMonths(prev => [...prev, newMonthLabel]);
    }
    setData(prev => {
      const updated = JSON.parse(JSON.stringify(prev));
      updated.table1[newMonthLabel] = newMonthData.table1;
      updated.table2[newMonthLabel] = newMonthData.table2;
      updated.table3[newMonthLabel] = newMonthData.table3;
      updated.table4[newMonthLabel] = newMonthData.table4;

      CATEGORIES.forEach(cat => {
        updated.table5[cat][newMonthLabel] = newMonthData.table5[cat];
        updated.table6[cat][newMonthLabel] = newMonthData.table6[cat];
        updated.table7[cat][newMonthLabel] = newMonthData.table7[cat];
      });

      return updated;
    });
    setSelectedMonth(newMonthLabel);
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-16">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black text-lg shadow-sm">
              aT
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-extrabold text-slate-900 text-lg">
                  2026 aT 농산물 온라인 마케터 실적 대시보드
                </h1>
                <span className="text-[11px] font-bold px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full">
                  7-8월 누적 차감 정합성 검증 완료
                </span>
              </div>
              <p className="text-xs text-slate-500">
                로우데이터 누적 차감 자동화 엔진 & 엑셀 원본 양식 동기화 시스템
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>누적 로우데이터 추가 & 차감</span>
            </button>
            <button
              onClick={() => exportToExcel(computedData)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>엑셀 다운로드 (.xlsx)</span>
            </button>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row sm:items-center justify-between pt-1 pb-2 border-t border-slate-100 text-xs gap-2">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setActiveTab("all")}
              className={`px-3 py-1.5 rounded-lg font-bold transition-colors flex items-center gap-1.5 cursor-pointer ${
                activeTab === "all" ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>전체 보기 (요약+테이블+차트)</span>
            </button>
            <button
              onClick={() => setActiveTab("excel")}
              className={`px-3 py-1.5 rounded-lg font-bold transition-colors flex items-center gap-1.5 cursor-pointer ${
                activeTab === "excel" ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span>엑셀 원본 표 뷰어 (표 1~7)</span>
            </button>
            <button
              onClick={() => setActiveTab("charts")}
              className={`px-3 py-1.5 rounded-lg font-bold transition-colors flex items-center gap-1.5 cursor-pointer ${
                activeTab === "charts" ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>시각화 차트 분석</span>
            </button>
          </div>

          <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg self-start sm:self-auto">
            <span className="text-[11px] font-semibold text-slate-500 px-2">지표 기준월:</span>
            {months.map(m => (
              <button
                key={m}
                onClick={() => setSelectedMonth(m)}
                className={`px-2.5 py-1 rounded-md font-bold text-xs transition-all cursor-pointer ${
                  selectedMonth === m ? "bg-white text-emerald-700 shadow-xs" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {m} 순수 실적
              </button>
            ))}
            <button
              onClick={() => setSelectedMonth("누적")}
              className={`px-2.5 py-1 rounded-md font-bold text-xs transition-all cursor-pointer ${
                selectedMonth === "누적" ? "bg-white text-emerald-700 shadow-xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              누적 전체
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <KPICards
          currentMonth={selectedMonth}
          data={computedData}
          couponAssigned={COUPON_ASSIGNED}
        />

        {(activeTab === "all" || activeTab === "charts") && (
          <ChartsSection
            currentMonth={selectedMonth === "누적" ? "8월" : selectedMonth}
            data={computedData}
          />
        )}

        {(activeTab === "all" || activeTab === "excel") && (
          <ExcelTableSection
            data={computedData}
            months={months}
          />
        )}
      </main>

      <UploaderModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onDataAdded={handleAddMonthData}
        currentData={computedData}
      />
    </div>
  );
}
