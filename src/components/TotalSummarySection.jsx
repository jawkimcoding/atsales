import React from 'react';
import { DollarSign, Ticket, ShoppingCart, TrendingUp, Layers, CheckCircle2, Building2, Package } from 'lucide-react';
import { Bar } from 'react-chartjs-2';

export default function TotalSummarySection({ agriData, organicData, months }) {
  // 농산물
  const agriSales7 = agriData.table3["7월"]?.["총 계"] || 0;
  const agriSales8 = agriData.table3["8월"]?.["총 계"] || 0;
  const agriSalesCum = agriSales7 + agriSales8;

  const agriCoupon7 = agriData.table2["7월"]?.["총 계"] || 0;
  const agriCoupon8 = agriData.table2["8월"]?.["총 계"] || 0;
  const agriCouponCum = agriCoupon7 + agriCoupon8;
  const agriCouponAssigned = 640000000;

  const agriCount7 = agriData.table4["7월"]?.["총 계"] || 0;
  const agriCount8 = agriData.table4["8월"]?.["총 계"] || 0;
  const agriCountCum = agriCount7 + agriCount8;

  // 유기농
  const orgSales7 = organicData.table3["7월"]?.["총 계"] || 0;
  const orgSales8 = organicData.table3["8월"]?.["총 계"] || 0;
  const orgSalesCum = orgSales7 + orgSales8;

  const orgCoupon7 = organicData.table2["7월"]?.["총 계"] || 0;
  const orgCoupon8 = organicData.table2["8월"]?.["총 계"] || 0;
  const orgCouponCum = orgCoupon7 + orgCoupon8;
  const orgCouponAssigned = 100000000;

  const orgCount7 = organicData.table4["7월"]?.["총 계"] || 0;
  const orgCount8 = organicData.table4["8월"]?.["총 계"] || 0;
  const orgCountCum = orgCount7 + orgCount8;

  // 총 합계
  const totSales7 = agriSales7 + orgSales7;
  const totSales8 = agriSales8 + orgSales8;
  const totSalesCum = agriSalesCum + orgSalesCum;

  const totCoupon7 = agriCoupon7 + orgCoupon7;
  const totCoupon8 = agriCoupon8 + orgCoupon8;
  const totCouponCum = agriCouponCum + orgCouponCum;
  const totCouponAssigned = agriCouponAssigned + orgCouponAssigned;

  const totCount7 = agriCount7 + orgCount7;
  const totCount8 = agriCount8 + orgCount8;
  const totCountCum = agriCountCum + orgCountCum;

  const compareChartData = {
    labels: ['농산물 온라인 마케터', '유기농 기획전', '전체 총 합계'],
    datasets: [
      {
        label: '7월 매출액',
        data: [agriSales7, orgSales7, totSales7],
        backgroundColor: 'rgba(148, 163, 184, 0.85)',
        borderRadius: 6
      },
      {
        label: '8월 순수 매출액',
        data: [agriSales8, orgSales8, totSales8],
        backgroundColor: 'rgba(16, 185, 129, 0.85)',
        borderRadius: 6
      },
      {
        label: '7-8월 누적 매출액',
        data: [agriSalesCum, orgSalesCum, totSalesCum],
        backgroundColor: 'rgba(59, 130, 246, 0.85)',
        borderRadius: 6
      }
    ]
  };

  return (
    <div className="space-y-6">
      {/* 배너 */}
      <div className="bg-emerald-50 border-l-4 border-emerald-600 p-4 rounded-r-xl shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Layers className="w-5 h-5 text-emerald-600 shrink-0" />
          <div>
            <h3 className="font-bold text-slate-900 text-sm">
              2026 aT 기획전 전체 통합 실적 현황 (농산물 마케터 + 유기농 통합)
            </h3>
            <p className="text-xs text-emerald-800">
              엑셀 최상단 "※ 전체 기획전 결과" 수식 정합성 연동 (누적 매출 76.8억원 / 총 판매 75.6만건)
            </p>
          </div>
        </div>
        <span className="text-[11px] font-bold px-2.5 py-1 bg-emerald-200 text-emerald-900 rounded-full">
          전 기획전 집계 완료
        </span>
      </div>

      {/* ※ 전체 기획전 결과: 1. 해당 월 참여 상품 수 및 업체수 (사용자 요청 8월 행 포함 전면 구현) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 overflow-hidden">
        <div className="flex items-center gap-2 mb-3">
          <span className="bg-yellow-300 px-2.5 py-0.5 text-xs font-black text-slate-900 rounded shadow-2xs">
            ※ 전체 기획전 결과
          </span>
          <span className="text-xs font-bold text-slate-700">
            1. 해당 월 참여 상품 수 및 업체수 (7월 vs 8월 누적 중복제거 인입 실적)
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="excel-table w-full border-collapse border border-slate-300 text-xs">
            <thead>
              <tr>
                <th className="excel-border border border-slate-300 bg-slate-100 py-1.5 px-3 text-center font-bold" rowSpan={2}>
                  구분
                </th>
                <th className="excel-border border border-slate-300 bg-slate-100 py-1.5 px-3 text-center font-black" rowSpan={2}>
                  총 계
                </th>
                <th className="excel-border border border-slate-300 bg-[#D9E1F2] py-1.5 px-3 text-center font-black text-slate-800" colSpan={7}>
                  농부가바로팜 (농산물 온라인 마케터)
                </th>
                <th className="excel-border border border-slate-300 bg-[#E2EFDA] py-1.5 px-3 text-center font-black text-slate-800" colSpan={3}>
                  친환경 (유기농 기획전)
                </th>
              </tr>
              <tr>
                {/* 농부가바로팜 7열 */}
                <th className="excel-border border border-slate-300 bg-[#D9E1F2] py-1 px-2 text-center font-bold">소 계</th>
                <th className="excel-border border border-slate-300 bg-[#D9E1F2] py-1 px-2 text-center">네이버</th>
                <th className="excel-border border border-slate-300 bg-[#D9E1F2] py-1 px-2 text-center">지마켓</th>
                <th className="excel-border border border-slate-300 bg-[#D9E1F2] py-1 px-2 text-center">롯데ON</th>
                <th className="excel-border border border-slate-300 bg-[#D9E1F2] py-1 px-2 text-center">온누리마켓</th>
                <th className="excel-border border border-slate-300 bg-[#D9E1F2] py-1 px-2 text-center">농가살리기</th>
                <th className="excel-border border border-slate-300 bg-[#D9E1F2] py-1 px-2 text-center">오아시스</th>
                {/* 친환경 3열 */}
                <th className="excel-border border border-slate-300 bg-[#E2EFDA] py-1 px-2 text-center font-bold">소 계</th>
                <th className="excel-border border border-slate-300 bg-[#E2EFDA] py-1 px-2 text-center">네이버</th>
                <th className="excel-border border border-slate-300 bg-[#E2EFDA] py-1 px-2 text-center">오아시스</th>
              </tr>
            </thead>
            <tbody>
              {/* 업체수 (배정) */}
              <tr>
                <td className="excel-border border border-slate-300 text-center font-bold bg-slate-50">
                  업체수
                </td>
                <td className="excel-border border border-slate-300 text-right font-black bg-slate-50/60">
                  340
                </td>
                <td className="excel-border border border-slate-300 text-right font-bold bg-[#D9E1F2]/20">285</td>
                <td className="excel-border border border-slate-300 text-right">136</td>
                <td className="excel-border border border-slate-300 text-right">53</td>
                <td className="excel-border border border-slate-300 text-right">47</td>
                <td className="excel-border border border-slate-300 text-right">24</td>
                <td className="excel-border border border-slate-300 text-right">9</td>
                <td className="excel-border border border-slate-300 text-right">16</td>
                <td className="excel-border border border-slate-300 text-right font-bold bg-[#E2EFDA]/20">55</td>
                <td className="excel-border border border-slate-300 text-right">26</td>
                <td className="excel-border border border-slate-300 text-right">29</td>
              </tr>

              {/* 7월 실제 인입 (빨간색) */}
              <tr className="bg-rose-50/30">
                <td className="excel-border border border-slate-300 text-center font-black text-rose-600">
                  7월
                </td>
                <td className="excel-border border border-slate-300 text-right font-black text-rose-600 bg-rose-50/50">
                  218
                </td>
                <td className="excel-border border border-slate-300 text-right font-bold text-rose-700 bg-[#D9E1F2]/20">186</td>
                <td className="excel-border border border-slate-300 text-right text-rose-700">82</td>
                <td className="excel-border border border-slate-300 text-right text-rose-700">36</td>
                <td className="excel-border border border-slate-300 text-right text-rose-700">32</td>
                <td className="excel-border border border-slate-300 text-right text-rose-700">17</td>
                <td className="excel-border border border-slate-300 text-right text-rose-700">6</td>
                <td className="excel-border border border-slate-300 text-right text-rose-700">13</td>
                <td className="excel-border border border-slate-300 text-right font-bold text-rose-700 bg-[#E2EFDA]/20">32</td>
                <td className="excel-border border border-slate-300 text-right text-rose-700">16</td>
                <td className="excel-border border border-slate-300 text-right text-rose-700">16</td>
              </tr>

              {/* 8월 누적 로우데이터 중복제거 실제 인입 (신설) */}
              <tr className="bg-blue-50/40 font-bold">
                <td className="excel-border border border-slate-300 text-center font-black text-blue-700">
                  8월 (누적)
                </td>
                <td className="excel-border border border-slate-300 text-right font-black text-blue-700 bg-blue-50/60">
                  242
                </td>
                <td className="excel-border border border-slate-300 text-right font-black text-blue-800 bg-[#D9E1F2]/40">207</td>
                <td className="excel-border border border-slate-300 text-right text-blue-900 font-bold">93</td>
                <td className="excel-border border border-slate-300 text-right text-blue-900 font-bold">41</td>
                <td className="excel-border border border-slate-300 text-right text-blue-900 font-bold">34</td>
                <td className="excel-border border border-slate-300 text-right text-blue-900 font-bold">19</td>
                <td className="excel-border border border-slate-300 text-right text-blue-900 font-bold">7</td>
                <td className="excel-border border border-slate-300 text-right text-blue-900 font-bold">13</td>
                <td className="excel-border border border-slate-300 text-right font-black text-blue-800 bg-[#E2EFDA]/40">35</td>
                <td className="excel-border border border-slate-300 text-right text-blue-900 font-bold">18</td>
                <td className="excel-border border border-slate-300 text-right text-blue-900 font-bold">17</td>
              </tr>

              {/* 상품수 (누적) */}
              <tr>
                <td className="excel-border border border-slate-300 text-center font-bold bg-slate-50">
                  상품수
                </td>
                <td className="excel-border border border-slate-300 text-right font-black bg-slate-50/60 text-emerald-900">
                  1,651
                </td>
                <td className="excel-border border border-slate-300 text-right font-bold bg-[#D9E1F2]/20 text-emerald-800">1,449</td>
                <td className="excel-border border border-slate-300 text-right">614</td>
                <td className="excel-border border border-slate-300 text-right">298</td>
                <td className="excel-border border border-slate-300 text-right">349</td>
                <td className="excel-border border border-slate-300 text-right">71</td>
                <td className="excel-border border border-slate-300 text-right">30</td>
                <td className="excel-border border border-slate-300 text-right">87</td>
                <td className="excel-border border border-slate-300 text-right font-bold bg-[#E2EFDA]/20 text-emerald-800">202</td>
                <td className="excel-border border border-slate-300 text-right">111</td>
                <td className="excel-border border border-slate-300 text-right">91</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* KPI 카드 4종 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
            <span>총 누적 매출액</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">
            {totSalesCum.toLocaleString()} <span className="text-sm font-semibold text-slate-500">원</span>
          </div>
          <div className="text-xs text-emerald-700 font-bold mt-1">
            8월 순수: {totSales8.toLocaleString()}원 (+{(((totSales8 - totSales7) / totSales7) * 100).toFixed(1)}% 성장)
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
            <span>총 쿠폰 누적 소진액</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Ticket className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">
            {totCouponCum.toLocaleString()} <span className="text-sm font-semibold text-slate-500">원</span>
          </div>
          <div className="text-xs text-slate-500 mt-1">
            8월 순수 사용: {totCoupon8.toLocaleString()}원
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
            <span>통합 쿠폰 소진율</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">
            {((totCouponCum / totCouponAssigned) * 100).toFixed(1)}%
          </div>
          <div className="text-xs text-slate-500 mt-1">
            잔여 예산: {(totCouponAssigned - totCouponCum).toLocaleString()}원 (배정 7.4억)
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
            <span>총 누적 판매 건수</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <ShoppingCart className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">
            {totCountCum.toLocaleString()} <span className="text-sm font-semibold text-slate-500">건</span>
          </div>
          <div className="text-xs text-indigo-600 font-semibold mt-1">
            8월 순수: {totCount8.toLocaleString()}건
          </div>
        </div>
      </div>

      {/* 기획전 비교 테이블 */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden p-5">
        <h4 className="font-bold text-slate-800 text-sm mb-3">
          📊 기획전별 실적 종합 비교 분석표
        </h4>
        <div className="overflow-x-auto">
          <table className="excel-table w-full border-collapse border border-slate-300 text-sm">
            <thead>
              <tr className="excel-header">
                <th className="excel-border border border-slate-300">기획전 구분</th>
                <th className="excel-border border border-slate-300">배정액</th>
                <th className="excel-border border border-slate-300">7월 쿠폰</th>
                <th className="excel-border border border-slate-300">8월 순수 쿠폰</th>
                <th className="excel-border border border-slate-300">누적 쿠폰</th>
                <th className="excel-border border border-slate-300">소진율</th>
                <th className="excel-border border border-slate-300">7월 매출액</th>
                <th className="excel-border border border-slate-300">8월 순수 매출액</th>
                <th className="excel-border border border-slate-300">누적 총 매출액</th>
                <th className="excel-border border border-slate-300">누적 판매건수</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="excel-border border border-slate-300 font-bold bg-slate-50 text-center">
                  🌾 농산물 온라인 마케터
                </td>
                <td className="excel-border border border-slate-300 text-right">{agriCouponAssigned.toLocaleString()}</td>
                <td className="excel-border border border-slate-300 text-right">{agriCoupon7.toLocaleString()}</td>
                <td className="excel-border border border-slate-300 text-right">{agriCoupon8.toLocaleString()}</td>
                <td className="excel-border border border-slate-300 text-right font-bold">{agriCouponCum.toLocaleString()}</td>
                <td className="excel-border border border-slate-300 text-right font-bold text-blue-600">
                  {((agriCouponCum / agriCouponAssigned) * 100).toFixed(1)}%
                </td>
                <td className="excel-border border border-slate-300 text-right">{agriSales7.toLocaleString()}</td>
                <td className="excel-border border border-slate-300 text-right text-emerald-700 font-semibold">{agriSales8.toLocaleString()}</td>
                <td className="excel-border border border-slate-300 text-right font-bold">{agriSalesCum.toLocaleString()}</td>
                <td className="excel-border border border-slate-300 text-right">{agriCountCum.toLocaleString()}건</td>
              </tr>
              <tr>
                <td className="excel-border border border-slate-300 font-bold bg-slate-50 text-center">
                  🌿 유기농 기획전
                </td>
                <td className="excel-border border border-slate-300 text-right">{orgCouponAssigned.toLocaleString()}</td>
                <td className="excel-border border border-slate-300 text-right">{orgCoupon7.toLocaleString()}</td>
                <td className="excel-border border border-slate-300 text-right">{orgCoupon8.toLocaleString()}</td>
                <td className="excel-border border border-slate-300 text-right font-bold">{orgCouponCum.toLocaleString()}</td>
                <td className="excel-border border border-slate-300 text-right font-bold text-blue-600">
                  {((orgCouponCum / orgCouponAssigned) * 100).toFixed(1)}%
                </td>
                <td className="excel-border border border-slate-300 text-right">{orgSales7.toLocaleString()}</td>
                <td className="excel-border border border-slate-300 text-right text-emerald-700 font-semibold">{orgSales8.toLocaleString()}</td>
                <td className="excel-border border border-slate-300 text-right font-bold">{orgSalesCum.toLocaleString()}</td>
                <td className="excel-border border border-slate-300 text-right">{orgCountCum.toLocaleString()}건</td>
              </tr>
              <tr className="bg-[#FFFFF2CC] font-bold">
                <td className="excel-border border border-slate-300 text-center font-black">
                  전체 기획전 합계
                </td>
                <td className="excel-border border border-slate-300 text-right">{totCouponAssigned.toLocaleString()}</td>
                <td className="excel-border border border-slate-300 text-right">{totCoupon7.toLocaleString()}</td>
                <td className="excel-border border border-slate-300 text-right">{totCoupon8.toLocaleString()}</td>
                <td className="excel-border border border-slate-300 text-right font-black">{totCouponCum.toLocaleString()}</td>
                <td className="excel-border border border-slate-300 text-right font-black text-blue-700">
                  {((totCouponCum / totCouponAssigned) * 100).toFixed(1)}%
                </td>
                <td className="excel-border border border-slate-300 text-right">{totSales7.toLocaleString()}</td>
                <td className="excel-border border border-slate-300 text-right text-emerald-800 font-black">{totSales8.toLocaleString()}</td>
                <td className="excel-border border border-slate-300 text-right font-black">{totSalesCum.toLocaleString()}</td>
                <td className="excel-border border border-slate-300 text-right font-black">{totCountCum.toLocaleString()}건</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* 기획전 비교 차트 */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        <h4 className="font-bold text-slate-800 text-sm mb-4">
          📈 기획전별 7월 vs 8월 순수 vs 누적 매출 비교
        </h4>
        <div className="h-72">
          <Bar
            data={compareChartData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              scales: {
                y: {
                  ticks: {
                    callback: val => (val / 100000000).toFixed(1) + '억'
                  }
                }
              }
            }}
          />
        </div>
      </div>
    </div>
  );
}
