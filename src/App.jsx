import React, { useState, useMemo } from 'react';
import { Download, PlusCircle, BarChart3, Table as TableIcon, Layers, AlertTriangle, Sparkles } from 'lucide-react';
import {
  INITIAL_DATA,
  INITIAL_DATA_ORGANIC,
  COUPON_ASSIGNED_AGRICULTURE,
  COUPON_ASSIGNED_ORGANIC,
  CHANNELS,
  CHANNELS_ORGANIC,
  CATEGORIES,
  ITEM_ANOMALIES
} from './data/initialData';
import KPICards from './components/KPICards';
import ExcelTableSection from './components/ExcelTableSection';
import ChartsSection from './components/ChartsSection';
import TotalSummarySection from './components/TotalSummarySection';
import AnomalyReportSection from './components/AnomalyReportSection';
import UploaderModal from './components/UploaderModal';
import { exportToExcel } from './utils/excelEngine';

export default function App() {
  const [projectTab, setProjectTab] = useState("agri"); // "agri" | "organic" | "total" | "anomalies"
  const [dataAgri, setDataAgri] = useState(INITIAL_DATA);
  const [dataOrganic, setDataOrganic] = useState(INITIAL_DATA_ORGANIC);
  const [months, setMonths] = useState(["7월", "8월"]);
  const [activeViewTab, setActiveViewTab] = useState("all"); // "all" | "excel" | "charts"
  const [selectedMonth, setSelectedMonth] = useState("8월");
  const [isModalOpen, setIsModalOpen] = useState(false);

  // 농산물 누적 자동 계산
  const computedAgriData = useMemo(() => {
    const full = JSON.parse(JSON.stringify(dataAgri));
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
  }, [dataAgri, months]);

  // 유기농 누적 자동 계산
  const computedOrganicData = useMemo(() => {
    const full = JSON.parse(JSON.stringify(dataOrganic));
    ["table2", "table3", "table4"].forEach(tbl => {
      full[tbl]["누적"] = { "총 계": 0 };
      CHANNELS_ORGANIC.forEach(ch => {
        const sum = months.reduce((acc, m) => acc + (full[tbl][m]?.[ch] || 0), 0);
        full[tbl]["누적"][ch] = sum;
        full[tbl]["누적"]["총 계"] += sum;
      });
    });

    ["table5", "table6", "table7"].forEach(tbl => {
      CATEGORIES.forEach(cat => {
        full[tbl][cat]["누적"] = { "소 계": 0 };
        CHANNELS_ORGANIC.forEach(ch => {
          const sum = months.reduce((acc, m) => acc + (full[tbl][cat]?.[m]?.[ch] || 0), 0);
          full[tbl][cat]["누적"][ch] = sum;
          full[tbl][cat]["누적"]["소 계"] += sum;
        });
      });
    });
    return full;
  }, [dataOrganic, months]);

  const currentData = projectTab === "organic" ? computedOrganicData : computedAgriData;
  const currentChannels = projectTab === "organic" ? CHANNELS_ORGANIC : CHANNELS;
  const currentCouponAssigned = projectTab === "organic" ? COUPON_ASSIGNED_ORGANIC : COUPON_ASSIGNED_AGRICULTURE;

  const handleAddMonthData = (newMonthLabel, newMonthData) => {
    if (!months.includes(newMonthLabel)) {
      setMonths(prev => [...prev, newMonthLabel]);
    }
    setDataAgri(prev => {
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
      {/* 최상단 헤더 */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black text-lg shadow-sm">
              aT
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-extrabold text-slate-900 text-lg">
                  2026 aT 온라인 판로지원 실적 종합 대시보드
                </h1>
                <span className="text-[11px] font-bold px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full">
                  농산물 + 유기농 8월 정합성 100% 검증 완료
                </span>
              </div>
              <p className="text-xs text-slate-500">
                로우데이터 누적 차감 자동화 엔진 & 엑셀 분석 시트 1:1 동기화 시스템
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
              onClick={() => exportToExcel(computedAgriData)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>엑셀 다운로드 (.xlsx)</span>
            </button>
          </div>
        </div>

        {/* 1차 네비게이션: 기획전 선택 탭 */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between border-t border-slate-100 pt-2 pb-1 overflow-x-auto gap-2">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setProjectTab("agri")}
              className={`px-3.5 py-2 rounded-lg font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer ${
                projectTab === "agri"
                  ? "bg-emerald-700 text-white shadow-sm"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              <span>🌾 농산물 온라인 마케터</span>
              <span className="text-[10px] px-1.5 py-0.2 bg-emerald-800 text-emerald-100 rounded-full">6개 채널</span>
            </button>

            <button
              onClick={() => setProjectTab("organic")}
              className={`px-3.5 py-2 rounded-lg font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer ${
                projectTab === "organic"
                  ? "bg-lime-700 text-white shadow-sm"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              <span>🌿 유기농 기획전</span>
              <span className="text-[10px] px-1.5 py-0.2 bg-lime-800 text-lime-100 rounded-full">네이버·오아시스</span>
            </button>

            <button
              onClick={() => setProjectTab("total")}
              className={`px-3.5 py-2 rounded-lg font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer ${
                projectTab === "total"
                  ? "bg-slate-900 text-white shadow-sm"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>📊 전체 기획전 통합 합계</span>
            </button>

            <button
              onClick={() => setProjectTab("anomalies")}
              className={`px-3.5 py-2 rounded-lg font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer ${
                projectTab === "anomalies"
                  ? "bg-rose-600 text-white shadow-sm"
                  : "bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200"
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>🚨 품목분류 변경 리포트</span>
              <span className="text-[10px] px-1.5 py-0.2 bg-rose-700 text-white rounded-full">
                {ITEM_ANOMALIES.length}건
              </span>
            </button>
          </div>
        </div>

        {/* 2차 네비게이션: 세부 뷰 모드 및 기준월 (agri/organic 탭에서만 활성) */}
        {(projectTab === "agri" || projectTab === "organic") && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row sm:items-center justify-between py-2 border-t border-slate-100 text-xs gap-2">
            <div className="flex items-center gap-1">
              <button
                onClick={() => setActiveViewTab("all")}
                className={`px-3 py-1.5 rounded-lg font-bold transition-colors flex items-center gap-1.5 cursor-pointer ${
                  activeViewTab === "all" ? "bg-slate-800 text-white" : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>전체 뷰 (요약+테이블+차트)</span>
              </button>
              <button
                onClick={() => setActiveViewTab("excel")}
                className={`px-3 py-1.5 rounded-lg font-bold transition-colors flex items-center gap-1.5 cursor-pointer ${
                  activeViewTab === "excel" ? "bg-slate-800 text-white" : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <TableIcon className="w-3.5 h-3.5" />
                <span>엑셀 원본 표 (표 1~7)</span>
              </button>
              <button
                onClick={() => setActiveViewTab("charts")}
                className={`px-3 py-1.5 rounded-lg font-bold transition-colors flex items-center gap-1.5 cursor-pointer ${
                  activeViewTab === "charts" ? "bg-slate-800 text-white" : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span>시각화 차트</span>
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
        )}
      </header>

      {/* 메인 컨텐츠 영역 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {projectTab === "total" && (
          <TotalSummarySection
            agriData={computedAgriData}
            organicData={computedOrganicData}
            months={months}
          />
        )}

        {projectTab === "anomalies" && (
          <AnomalyReportSection />
        )}

        {(projectTab === "agri" || projectTab === "organic") && (
          <>
            <KPICards
              currentMonth={selectedMonth}
              data={currentData}
              couponAssigned={currentCouponAssigned}
            />

            {(activeViewTab === "all" || activeViewTab === "charts") && (
              <ChartsSection
                currentMonth={selectedMonth === "누적" ? "8월" : selectedMonth}
                data={currentData}
                channels={currentChannels}
              />
            )}

            {(activeViewTab === "all" || activeViewTab === "excel") && (
              <ExcelTableSection
                data={currentData}
                months={months}
                channels={currentChannels}
                couponAssigned={currentCouponAssigned}
                sectionTitle={projectTab === "organic" ? "※ 유기농 기획전" : "※ 농산물 온라인 마케터"}
                badgeBg={projectTab === "organic" ? "bg-lime-300" : "bg-yellow-300"}
              />
            )}
          </>
        )}
      </main>

      <UploaderModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onDataAdded={handleAddMonthData}
        currentData={currentData}
      />
    </div>
  );
}
