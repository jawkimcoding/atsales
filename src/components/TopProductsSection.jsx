import React, { useState } from 'react';
import { 
  Printer, Copy, Check, Download, Layers, Calendar, 
  TrendingUp, Sparkles, ShieldCheck, ArrowUpRight, BarChart2, Info
} from 'lucide-react';
import { 
  TOP_PRODUCTS_JULY, 
  TOP_PRODUCTS_AUGUST_CUMULATIVE, 
  TOP_PRODUCTS_AUGUST_ONLY 
} from '../data/topProductsData';
import { downloadTopProductsExcel, downloadComprehensiveExcel } from '../utils/excelEngine';

export default function TopProductsSection() {
  const [period, setPeriod] = useState("august_cumul"); // "august_cumul" | "july" | "august_only"
  const [unitMode, setUnitMode] = useState("million"); // "million" | "won"
  const [copied, setCopied] = useState(false);

  // 현재 기간 데이터 선택
  const currentData = period === "july" 
    ? TOP_PRODUCTS_JULY 
    : period === "august_only" 
    ? TOP_PRODUCTS_AUGUST_ONLY 
    : TOP_PRODUCTS_AUGUST_CUMULATIVE;

  // 전체 매출 및 쿠폰 합계
  const totalRow = currentData.find(r => r.is_total) || { sales_m: 1, coupon_m: 1, sales_raw: 1, coupon_raw: 1 };

  // 소계들
  const agriSub = currentData.find(r => r.category === "농산물" && r.is_subtotal) || { sales_m: 0, coupon_m: 0 };
  const liveSub = currentData.find(r => r.category === "축산물" && r.is_subtotal) || { sales_m: 0, coupon_m: 0 };
  const procSub = currentData.find(r => r.category === "가공식품" && r.is_subtotal) || { sales_m: 0, coupon_m: 0 };

  // 한글/엑셀 붙여넣기용 클립보드 복사 함수
  const copyTableToClipboard = () => {
    let tsv = "구분\t품목\t매출(백만원)\t쿠폰소진(백만원)\t매출비중(%)\n";
    currentData.forEach(r => {
      const share = totalRow.sales_m > 0 ? ((r.sales_m / totalRow.sales_m) * 100).toFixed(1) + "%" : "-";
      tsv += `${r.category}\t${r.item}\t${r.sales_m.toLocaleString()}\t${r.coupon_m.toLocaleString()}\t${share}\n`;
    });

    navigator.clipboard.writeText(tsv).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  // 인쇄 실행 함수
  const handlePrint = () => {
    window.print();
  };

  // 카테고리별 행 수 계산 (rowSpan용)
  const getCategoryRowCount = (catName) => {
    return currentData.filter(r => r.category === catName).length;
  };

  // 포맷팅 헬퍼
  const formatVal = (valMillion, valRaw) => {
    if (unitMode === "won" && valRaw !== undefined) {
      return (valRaw || 0).toLocaleString() + "원";
    }
    return (valMillion || 0).toLocaleString();
  };

  return (
    <div className="space-y-6">
      {/* 인쇄 전용 스타일 */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body { background: white !important; color: black !important; font-size: 11pt; }
          .no-print { display: none !important; }
          .print-container { width: 100% !important; margin: 0 !important; padding: 0 !important; box-shadow: none !important; }
          table { width: 100% !important; border-collapse: collapse !important; }
          th, td { border: 1px solid #475569 !important; padding: 6px 8px !important; }
          th { background-color: #f1f5f9 !important; -webkit-print-color-adjust: exact; }
          .subtotal-row { background-color: #f8fafc !important; font-weight: bold !important; -webkit-print-color-adjust: exact; }
          .total-row { background-color: #e2e8f0 !important; font-weight: bold !important; border-bottom: 3px double #000 !important; -webkit-print-color-adjust: exact; }
        }
      `}} />

      {/* 상단 컨트롤 영역 (화면 전용, 인쇄 시 숨김) */}
      <div className="no-print bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-amber-100 text-amber-800 rounded-lg">
              <TrendingUp className="w-5 h-5 text-amber-600" />
            </span>
            <h2 className="text-lg font-extrabold text-slate-900">
              기획전 판매 상위 품목 실적 요약 보고서
            </h2>
            <span className="text-[11px] font-bold px-2.5 py-0.5 bg-emerald-100 text-emerald-800 rounded-full">
              보고서 팩터 100% 준수
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            농산물·축산물·가공식품 3대 구분 및 세부 품목별 매출/쿠폰소진 실적을 공문서 보고 양식으로 자동 도출합니다.
          </p>
        </div>

        {/* 버튼군: 기간 선택 + 인쇄 + 표 복사 + 엑셀 */}
        <div className="flex flex-wrap items-center gap-2">
          {/* 기간 토글 */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
            <button
              onClick={() => setPeriod("august_cumul")}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                period === "august_cumul" 
                  ? "bg-emerald-600 text-white shadow-xs" 
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              8월 누적 (최신)
            </button>
            <button
              onClick={() => setPeriod("july")}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                period === "july" 
                  ? "bg-emerald-600 text-white shadow-xs" 
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              7월 결과보고본
            </button>
            <button
              onClick={() => setPeriod("august_only")}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                period === "august_only" 
                  ? "bg-emerald-600 text-white shadow-xs" 
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              8월 순수 증가분
            </button>
          </div>

          {/* 단위 토글 */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
            <button
              onClick={() => setUnitMode("million")}
              className={`px-2.5 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                unitMode === "million" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              백만원
            </button>
            <button
              onClick={() => setUnitMode("won")}
              className={`px-2.5 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                unitMode === "won" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              원(KRW)
            </button>
          </div>

          {/* 인쇄/출력 버튼 (강조) */}
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
            title="A4 보고서 양식으로 바로 인쇄하거나 PDF로 저장합니다"
          >
            <Printer className="w-4 h-4" />
            <span>보고서 인쇄 / PDF 출력</span>
          </button>

          {/* 클립보드 복사 버튼 */}
          <button
            onClick={copyTableToClipboard}
            className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-bold rounded-xl shadow-2xs transition-colors cursor-pointer"
            title="한글(HWP)이나 엑셀 표에 바로 붙여넣을 수 있도록 클립보드에 복사합니다"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-600" />
                <span className="text-emerald-700">복사 완료!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-slate-500" />
                <span>표 복사 (한글/엑셀용)</span>
              </>
            )}
          </button>

          {/* 상위품목 전용 엑셀 다운로드 */}
          <button
            onClick={() => downloadTopProductsExcel(period, unitMode)}
            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
            title="기획전 판매 상위 품목 실적 요약 엑셀 파일을 다운로드합니다 (7월 / 8월 순수 / 8월 누적 전 시트 수록)"
          >
            <Download className="w-3.5 h-3.5 text-white" />
            <span>상위품목 엑셀 다운로드</span>
          </button>
        </div>
      </div>

      {/* 로우데이터 동적 연동 안내 알림 배너 (인쇄 시 숨김) */}
      <div className="no-print bg-linear-to-r from-emerald-50 via-teal-50 to-blue-50 border border-emerald-200 rounded-2xl p-4 shadow-2xs">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-emerald-600 text-white rounded-xl shrink-0 mt-0.5">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="text-xs text-slate-700 space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-emerald-950 text-sm">
                💡 로우데이터(농산물raw·유기농raw) 100% 동적 수식 연동 체계 완비
              </span>
              <span className="text-[10px] font-bold px-2 py-0.2 bg-emerald-200 text-emerald-900 rounded-md">
                실시간 자동 재계산
              </span>
            </div>
            <p className="text-slate-600 leading-relaxed">
              본 표는 엑셀 파일 내 신설된 <strong>『※ 판매상위품목_실적요약』</strong> 탭과 1:1로 동일하며, 
              <strong>『①농산물raw』</strong> 및 <strong>『②유기농raw』</strong> 시트의 <strong>B열(품목분류)</strong>과 <strong>I열(세부품목)</strong>을 
              직접 참조하는 <code>SUMIFS</code> 동적 수식으로 구축되어 있습니다.
            </p>
            <p className="text-emerald-800 font-medium">
              👉 향후 사용자가 가공식품/축산물 오분류 건의 품목분류나 품목명을 수정하면, <strong>상위 품목 표의 매출 및 쿠폰소진 숫자가 자동으로 즉시 재계산</strong>됩니다.
            </p>
          </div>
        </div>
      </div>

      {/* 핵심 지표 미니 카드 (인쇄 시 숨김) */}
      <div className="no-print grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">🌾 농산물 매출</span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 bg-emerald-100 text-emerald-800 rounded">
              비중 {totalRow.sales_m > 0 ? ((agriSub.sales_m / totalRow.sales_m) * 100).toFixed(1) : 0}%
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-xl font-black text-slate-900">{agriSub.sales_m.toLocaleString()}</span>
            <span className="text-xs text-slate-500">백만원</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">쿠폰소진: {agriSub.coupon_m.toLocaleString()}백만원</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">🥩 축산물 매출</span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 bg-amber-100 text-amber-800 rounded">
              비중 {totalRow.sales_m > 0 ? ((liveSub.sales_m / totalRow.sales_m) * 100).toFixed(1) : 0}%
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-xl font-black text-slate-900">{liveSub.sales_m.toLocaleString()}</span>
            <span className="text-xs text-slate-500">백만원</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">쿠폰소진: {liveSub.coupon_m.toLocaleString()}백만원</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">🥫 가공식품 매출</span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 bg-blue-100 text-blue-800 rounded">
              비중 {totalRow.sales_m > 0 ? ((procSub.sales_m / totalRow.sales_m) * 100).toFixed(1) : 0}%
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-xl font-black text-slate-900">{procSub.sales_m.toLocaleString()}</span>
            <span className="text-xs text-slate-500">백만원</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">쿠폰소진: {procSub.coupon_m.toLocaleString()}백만원</p>
        </div>

        <div className="bg-slate-900 text-white p-4 rounded-xl shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300">📊 총 합계</span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 bg-emerald-500/20 text-emerald-300 rounded">
              {period === "july" ? "7월 확정" : period === "august_only" ? "8월 당월" : "8월 누적"}
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-xl font-black text-white">{totalRow.sales_m.toLocaleString()}</span>
            <span className="text-xs text-slate-300">백만원</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">쿠폰소진 합계: {totalRow.coupon_m.toLocaleString()}백만원</p>
        </div>
      </div>

      {/* 인쇄 및 화면 메인 보고서 컨테이너 */}
      <div className="print-container bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs">
        {/* 공문서 보고서 헤딩 (인쇄 시 표출) */}
        <div className="border-b border-slate-200 pb-4 mb-4">
          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
            <h3 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
              <span>□ 기획전 판매 상위 품목 실적 요약</span>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200">
                {period === "july" ? "7월 최종 결과보고 기준" : period === "august_only" ? "8월 순수 당월 실적" : "8월 누적 집계 기준"}
              </span>
            </h3>
            <span className="text-xs font-semibold text-slate-500 self-end sm:self-auto">
              단위 : {unitMode === "won" ? "원 (KRW)" : "백만원"}
            </span>
          </div>

          {/* 한글 문서 보고서 서술 문구 */}
          <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-xs text-slate-700 leading-relaxed">
            {period === "july" ? (
              <p>
                <strong>○ 기획전 판매 상위 품목 :</strong> 제철 농산물인 <strong>복숭아(231백만원)</strong>, <strong>사과(192백만원)</strong>, <strong>채소류(241백만원)</strong> 등 농산물 매출이 높았으며, 상위 품목의 매출이 전체 매출의 약 <strong>71%</strong>를 차지함.
              </p>
            ) : period === "august_only" ? (
              <p>
                <strong>○ 8월 당월 주요 변동 품목 :</strong> 8월 제철 수확기 진입에 따라 <strong>쌀·잡곡류(+947백만원)</strong>, <strong>김치류(+869백만원)</strong>, <strong>채소류(+404백만원)</strong>, <strong>한돈(+272백만원)</strong>의 순수 매출 신장이 두드러지게 집계됨.
              </p>
            ) : (
              <p>
                <strong>○ 기획전 판매 상위 품목 (8월 누적) :</strong> <strong>쌀 및 잡곡류(1,799백만원)</strong>, <strong>김치류(1,545백만원)</strong>, <strong>채소류(744백만원)</strong>, <strong>한돈(405백만원)</strong>, <strong>복숭아(384백만원)</strong>, <strong>사과(372백만원)</strong> 순으로 높은 매출을 기록하며 누적 실적을 견인함.
              </p>
            )}
          </div>
        </div>

        {/* 보고서 데이터 표 */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse border border-slate-300">
            <thead>
              <tr className="bg-slate-100 text-slate-900 border-b border-slate-300 text-center font-bold">
                <th className="py-3 px-3 border border-slate-300 w-24">구분</th>
                <th className="py-3 px-4 border border-slate-300">품목</th>
                <th className="py-3 px-4 border border-slate-300 w-36 text-right">매출</th>
                <th className="py-3 px-4 border border-slate-300 w-32 text-right">쿠폰소진</th>
                <th className="no-print py-3 px-3 border border-slate-300 w-24 text-right">매출 비중</th>
              </tr>
            </thead>
            <tbody>
              {currentData.map((row, idx) => {
                const isSub = row.is_subtotal;
                const isTot = row.is_total;
                
                const isFirstOfCategory = idx === 0 || currentData[idx - 1].category !== row.category;
                const catRowCount = getCategoryRowCount(row.category);
                const sharePercent = totalRow.sales_m > 0 
                  ? ((row.sales_m / totalRow.sales_m) * 100).toFixed(1) + "%" 
                  : "-";

                let trClass = "hover:bg-slate-50/80 transition-colors";
                if (isTot) {
                  trClass = "total-row bg-slate-200 text-slate-900 font-extrabold text-sm border-t-2 border-b-4 border-double border-slate-600";
                } else if (isSub) {
                  trClass = "subtotal-row bg-slate-100 text-slate-900 font-bold border-b border-slate-300";
                }

                return (
                  <tr key={idx} className={trClass}>
                    {/* 구분 (rowSpan 병합) */}
                    {isTot ? (
                      <td 
                        colSpan={2} 
                        className="py-3 px-4 border border-slate-300 text-center font-black"
                      >
                        합 계
                      </td>
                    ) : (
                      isFirstOfCategory && (
                        <td 
                          rowSpan={catRowCount} 
                          className="py-2.5 px-3 border border-slate-300 text-center font-bold align-middle bg-slate-50/50 text-slate-800"
                        >
                          {row.category}
                        </td>
                      )
                    )}

                    {/* 품목 */}
                    {!isTot && (
                      <td className={`py-2 px-4 border border-slate-300 ${isSub ? "text-center font-bold" : "text-slate-800"}`}>
                        {row.item}
                      </td>
                    )}

                    {/* 매출 */}
                    <td className="py-2 px-4 border border-slate-300 text-right font-medium">
                      {formatVal(row.sales_m, row.sales_raw)}
                    </td>

                    {/* 쿠폰소진 */}
                    <td className="py-2 px-4 border border-slate-300 text-right font-medium">
                      {formatVal(row.coupon_m, row.coupon_raw)}
                    </td>

                    {/* 매출 비중 (화면 전용) */}
                    <td className="no-print py-2 px-3 border border-slate-300 text-right text-[11px] text-slate-500 font-mono">
                      {sharePercent}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* 보고서 하단 부가 설명 및 주석 */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between text-[11px] text-slate-500 gap-2">
          <p>
            ※ 집계 기준: 농부가바로팜(농산물raw) + 친환경(유기농raw) 통합 실적 / 반올림 표기
          </p>
          <p className="font-medium text-slate-600">
            한국농수산식품유통공사(aT) & 한국생산성본부(KPC)
          </p>
        </div>
      </div>
    </div>
  );
}
