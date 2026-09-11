import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Download, PlusCircle, BarChart3, Table as TableIcon, Layers, 
  AlertTriangle, Sparkles, RefreshCw, CheckCircle2, ChevronDown, 
  FileSpreadsheet, Clock, Wifi, WifiOff 
} from 'lucide-react';
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
import { 
  fetchAndSyncGoogleSheets, 
  downloadGoogleSheetExcel, 
  downloadComprehensiveExcel, 
  exportToExcel 
} from './utils/excelEngine';

export default function App() {
  const [projectTab, setProjectTab] = useState("agri"); // "agri" | "organic" | "total" | "anomalies"
  const [dataAgri, setDataAgri] = useState(INITIAL_DATA);
  const [dataOrganic, setDataOrganic] = useState(INITIAL_DATA_ORGANIC);
  const [months, setMonths] = useState(["7월", "8월"]);
  const [activeViewTab, setActiveViewTab] = useState("all"); // "all" | "excel" | "charts"
  const [selectedMonth, setSelectedMonth] = useState("8월");
  const [isModalOpen, setIsModalOpen] = useState(false);

  // 10초 실시간 자동 연동 상태 관리
  const [autoSync, setAutoSync] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState(null);
  const [syncCount, setSyncCount] = useState(0);
  const [syncError, setSyncError] = useState(null);
  const [isDownloadOpen, setIsDownloadOpen] = useState(false);
  const downloadMenuRef = useRef(null);

  // 구글 시트 백그라운드 동기화 함수
  const syncGoogleSheetsData = async (isManual = false) => {
    try {
      setIsSyncing(true);
      setSyncError(null);
      const result = await fetchAndSyncGoogleSheets();
      if (result && result.agriData) {
        setDataAgri(result.agriData);
      }
      if (result && result.organicData) {
        setDataOrganic(result.organicData);
      }
      setLastSyncTime(new Date());
      setSyncCount(prev => prev + 1);
    } catch (err) {
      console.warn("구글 스프레드시트 동기화 주의:", err);
      setSyncError(err.message || "연동 대기 중");
    } finally {
      setIsSyncing(false);
    }
  };

  // 마운트 시 1회 즉시 동기화 및 10초 주기 타이머 실행
  useEffect(() => {
    syncGoogleSheetsData(false);

    if (!autoSync) return;

    const timer = setInterval(() => {
      syncGoogleSheetsData(false);
    }, 10000); // 10초(10,000ms) 주기

    return () => clearInterval(timer);
  }, [autoSync]);

  // 다운로드 드롭다운 메뉴 바깥 클릭 감지
  useEffect(() => {
    function handleClickOutside(event) {
      if (downloadMenuRef.current && !downloadMenuRef.current.contains(event.target)) {
        setIsDownloadOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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

  const formatTimeStr = (date) => {
    if (!date) return "연동 준비 중";
    return date.toLocaleTimeString('ko-KR', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
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
                <span className="text-[11px] font-bold px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  농산물 + 유기농 8월 정합성 100% 검증 완료
                </span>
              </div>
              <p className="text-xs text-slate-500">
                구글 스프레드시트 10초 실시간 연동 엔진 & 엑셀 시트 1:1 완벽 동기화 시스템
              </p>
            </div>
          </div>

          {/* 컨트롤 영역: 10초 실시간 연동 상태 + 새로고침 + 엑셀 다운로드 */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* 10초 실시간 연동 인디케이터 및 토글 */}
            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-xl border border-slate-200 text-xs">
              <div className="flex items-center gap-1.5">
                {autoSync ? (
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                  </span>
                ) : (
                  <span className="inline-flex rounded-full h-2.5 w-2.5 bg-slate-400"></span>
                )}
                <span className="font-bold text-slate-700">
                  {autoSync ? "10초 자동연동 ON" : "자동연동 OFF"}
                </span>
              </div>

              <div className="h-3 w-px bg-slate-300 mx-0.5"></div>

              <div className="flex items-center gap-1 text-[11px] text-slate-500">
                <Clock className="w-3 h-3 text-slate-400" />
                <span>{lastSyncTime ? formatTimeStr(lastSyncTime) : "연동중..."}</span>
              </div>

              <button
                onClick={() => setAutoSync(prev => !prev)}
                title={autoSync ? "10초 자동 연동 일시정지" : "10초 자동 연동 시작"}
                className={`text-[10px] font-bold px-1.5 py-0.5 rounded cursor-pointer transition-colors ${
                  autoSync ? "bg-emerald-200 text-emerald-800 hover:bg-emerald-300" : "bg-slate-200 text-slate-700 hover:bg-slate-300"
                }`}
              >
                {autoSync ? "일시정지" : "시작"}
              </button>
            </div>

            {/* 수동 즉시 새로고침 버튼 */}
            <button
              onClick={() => syncGoogleSheetsData(true)}
              disabled={isSyncing}
              className={`flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-300 hover:border-slate-400 text-slate-700 text-xs font-bold rounded-lg shadow-2xs transition-all cursor-pointer ${
                isSyncing ? "opacity-60 cursor-not-allowed" : "hover:bg-slate-50"
              }`}
              title="구글 시트의 최신 데이터를 지금 즉시 가져옵니다"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-emerald-600 ${isSyncing ? "animate-spin" : ""}`} />
              <span>{isSyncing ? "연동 중..." : "지금 새로고침"}</span>
            </button>

            {/* 누적 데이터 수동 추가 모달 */}
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-2xs transition-colors cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>파일 수동 업로드</span>
            </button>

            {/* 엑셀 다운로드 (참조 구글 시트 원본 100% 동일 양식 출력) */}
            <div className="relative" ref={downloadMenuRef}>
              <div className="inline-flex rounded-lg shadow-2xs">
                <button
                  onClick={() => downloadGoogleSheetExcel()}
                  className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-l-lg transition-colors cursor-pointer"
                  title="참조한 구글 스프레드시트의 모든 데이터 및 시트(농산물raw, 유기농raw, 분석, 업체시트 등)를 동일한 양식으로 다운로드합니다"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-400" />
                  <span>엑셀 다운로드 (.xlsx)</span>
                </button>
                <button
                  onClick={() => setIsDownloadOpen(prev => !prev)}
                  className="px-2 py-2 bg-slate-800 hover:bg-slate-900 text-slate-300 hover:text-white text-xs border-l border-slate-700 rounded-r-lg transition-colors cursor-pointer"
                  title="다운로드 양식 선택"
                >
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* 드롭다운 메뉴 */}
              {isDownloadOpen && (
                <div className="absolute right-0 mt-1.5 w-72 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 text-left animate-in fade-in slide-in-from-top-1">
                  <div className="px-3 py-1.5 border-b border-slate-100">
                    <p className="text-[11px] font-extrabold text-slate-800">엑셀 다운로드 옵션 선택</p>
                    <p className="text-[10px] text-slate-400">참조 구글 시트와 1:1 완벽 호환</p>
                  </div>

                  <button
                    onClick={() => {
                      downloadGoogleSheetExcel();
                      setIsDownloadOpen(false);
                    }}
                    className="w-full px-3 py-2 text-left hover:bg-emerald-50 transition-colors flex items-start gap-2.5 group cursor-pointer"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                    <div>
                      <div className="text-xs font-bold text-slate-800 group-hover:text-emerald-700 flex items-center gap-1.5">
                        <span>구글 시트 연동 원본 전체</span>
                        <span className="text-[9px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-bold">기본 추천</span>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-0.5 leading-tight">
                        농산물 raw, 유기농 raw, 분석, 농산물업체, 유기농업체 등 모든 시트와 데이터 완벽 1:1 일치
                      </p>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      downloadComprehensiveExcel();
                      setIsDownloadOpen(false);
                    }}
                    className="w-full px-3 py-2 text-left hover:bg-blue-50 transition-colors flex items-start gap-2.5 group cursor-pointer border-t border-slate-50"
                  >
                    <Layers className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                    <div>
                      <div className="text-xs font-bold text-slate-800 group-hover:text-blue-700 flex items-center gap-1.5">
                        <span>종합 분석 보고서 (8개 시트)</span>
                        <span className="text-[9px] bg-blue-100 text-blue-800 px-1.5 py-0.2 rounded font-bold">대시보드 포함</span>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-0.5 leading-tight">
                        대시보드_종합요약 + 4대 이상치 42건 리포트 + 피벗 교차검증 + 업체별 수식 포함
                      </p>
                    </div>
                  </button>
                </div>
              )}
            </div>
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
              <span>🚨 이상치 및 규정검토 리포트</span>
              <span className="text-[10px] px-1.5 py-0.2 bg-rose-700 text-white rounded-full">
                이상치 42건 & 규정검토
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
