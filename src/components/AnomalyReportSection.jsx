import React, { useState, useMemo } from 'react';
import { AlertTriangle, Search, Filter, ArrowRight, Info, CheckCircle2 } from 'lucide-react';
import { ITEM_ANOMALIES } from '../data/initialData';

export default function AnomalyReportSection() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedChannel, setSelectedChannel] = useState('ALL');
  const [selectedChangeType, setSelectedChangeType] = useState('ALL');

  const filteredItems = useMemo(() => {
    return ITEM_ANOMALIES.filter(item => {
      const matchSearch =
        item.bizName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.bizNo.includes(searchTerm);

      const matchChannel = selectedChannel === 'ALL' || item.channel === selectedChannel;

      let matchType = true;
      if (selectedChangeType === 'AGRI_MEAT') {
        matchType = (item.cat7 === '농산물' && item.cat8 === '축산물') || (item.cat7 === '축산물' && item.cat8 === '농산물');
      } else if (selectedChangeType === 'AGRI_PROC') {
        matchType = (item.cat7 === '농산물' && item.cat8 === '가공식품') || (item.cat7 === '가공식품' && item.cat8 === '농산물');
      } else if (selectedChangeType === 'MEAT_PROC') {
        matchType = (item.cat7 === '축산물' && item.cat8 === '가공식품') || (item.cat7 === '가공식품' && item.cat8 === '축산물');
      }

      return matchSearch && matchChannel && matchType;
    });
  }, [searchTerm, selectedChannel, selectedChangeType]);

  const stats = useMemo(() => {
    const totalCount = ITEM_ANOMALIES.length;
    const gmarketCount = ITEM_ANOMALIES.filter(i => i.channel === '지마켓').length;
    const lotteCount = ITEM_ANOMALIES.filter(i => i.channel === '롯데ON').length;
    const totalSales7 = ITEM_ANOMALIES.reduce((acc, i) => acc + i.sales7, 0);
    const totalSales8Pure = ITEM_ANOMALIES.reduce((acc, i) => acc + i.pureSales8, 0);

    return { totalCount, gmarketCount, lotteCount, totalSales7, totalSales8Pure };
  }, []);

  const getBadgeColor = (cat) => {
    switch (cat) {
      case '농산물':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case '축산물':
        return 'bg-rose-100 text-rose-800 border-rose-300';
      case '가공식품':
        return 'bg-indigo-100 text-indigo-800 border-indigo-300';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-300';
    }
  };

  return (
    <div className="space-y-6">
      {/* 안내 배너 */}
      <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-xl shadow-xs">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-900 space-y-1">
            <p className="font-bold text-sm">
              ※ 농가 및 유통사의 품목 자의적 분류 변경 감지 보고서 (총 {stats.totalCount}건)
            </p>
            <p className="text-amber-800">
              <span className="font-semibold underline">사용자 요청 지침 준수</span>: 대시보드 통계 및 엑셀 수치에는 임의로 수정/보정하지 않고 <b>8월 제출 원본 로우데이터 기준</b>으로 정상 집계하였습니다. 본 리포트는 7월 대비 8월 로우데이터 간 <b>동일 사업자·동일 상품의 품목 분류가 자의적으로 변경된 이상 내역</b>을 파악할 수 있도록 별도 제공되는 전수 검증 보고서입니다.
            </p>
          </div>
        </div>
      </div>

      {/* 요약 통계 카드 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500 font-medium">총 감지 건수</div>
          <div className="text-2xl font-black text-rose-600 mt-1">{stats.totalCount}건</div>
          <div className="text-[11px] text-slate-400 mt-1">지마켓 {stats.gmarketCount}건 / 롯데ON {stats.lotteCount}건</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500 font-medium">가장 빈번한 변환 유형</div>
          <div className="text-base font-bold text-slate-800 mt-1">가공식품 ↔ 농산물</div>
          <div className="text-[11px] text-slate-400 mt-1">토마토, 고구마, 묵, 참깨 등</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500 font-medium">관련 상품 7월 매출합</div>
          <div className="text-2xl font-black text-slate-900 mt-1">{stats.totalSales7.toLocaleString()}원</div>
          <div className="text-[11px] text-slate-400 mt-1">대패삼겹살 등 주요 매출품 포함</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500 font-medium">관련 상품 8월 순수매출합</div>
          <div className="text-2xl font-black text-emerald-700 mt-1">{stats.totalSales8Pure.toLocaleString()}원</div>
          <div className="text-[11px] text-slate-400 mt-1">8월 제출 로우데이터 기준 분류 적용</div>
        </div>
      </div>

      {/* 대표 이상 사례 분석 안내 */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
        <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2 mb-3">
          <Info className="w-4 h-4 text-blue-600" />
          <span>주요 품목분류 이상 사례 분석 요약</span>
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <div className="font-bold text-slate-800 mb-1">🥩 대패삼겹살 (두원식품 / 지마켓)</div>
            <div className="text-slate-600">
              7월에는 <b>농산물</b>(5,179만원)로 등록되었으나, 8월에는 <b>축산물</b>(누적 5,505만원)로 변경됨. 돼지고기 삼겹살이므로 본래 축산물이 맞으나, 7월에 농산물로 오등록되었다가 8월에 정상화되면서 8월 품목별 차감 시 농산물 매출 왜곡 원인이 될 수 있음.
            </div>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <div className="font-bold text-slate-800 mb-1">🧄 남해 통마늘 (다모아영농조합법인 / 지마켓)</div>
            <div className="text-slate-600">
              7월에는 <b>축산물</b>로 오등록되어 집계되었으나, 8월에는 <b>농산물</b>(누적 70만원)로 변경됨. 마늘은 농산물이 맞으므로 7월 데이터가 축산물로 오분류되었던 사례임.
            </div>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <div className="font-bold text-slate-800 mb-1">🍅 완숙토마토 & 🍠 꿀고구마 (팜팜, 늘해랑 / 지마켓)</div>
            <div className="text-slate-600">
              생물 농산물임에도 7월에는 <b>가공식품</b>으로 등록되었다가 8월에는 <b>농산물</b>로 변경 등록됨.
            </div>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <div className="font-bold text-slate-800 mb-1">🥣 도토리묵 & 청국장가루 & 참깨 (초림단지묵, 태안식품, 신선식품)</div>
            <div className="text-slate-600">
              가공식품류에 해당하는 제품들이 7월에는 <b>농산물</b> 또는 <b>축산물</b>로 분류되었다가 8월에는 <b>가공식품</b>으로 변경됨.
            </div>
          </div>
        </div>
      </div>

      {/* 필터 및 검색 바 */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="업체명, 상품명, 사업자번호 검색..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="text-xs text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              초기화
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs">
            <span className="text-[11px] font-semibold text-slate-500 px-1">채널:</span>
            {['ALL', '지마켓', '롯데ON'].map(ch => (
              <button
                key={ch}
                onClick={() => setSelectedChannel(ch)}
                className={`px-2 py-1 rounded text-xs font-semibold cursor-pointer ${
                  selectedChannel === ch ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {ch === 'ALL' ? '전체' : ch}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs">
            <span className="text-[11px] font-semibold text-slate-500 px-1">유형:</span>
            {[
              { id: 'ALL', label: '전체' },
              { id: 'AGRI_MEAT', label: '농산↔축산' },
              { id: 'AGRI_PROC', label: '농산↔가공' },
              { id: 'MEAT_PROC', label: '축산↔가공' }
            ].map(t => (
              <button
                key={t.id}
                onClick={() => setSelectedChangeType(t.id)}
                className={`px-2 py-1 rounded text-xs font-semibold cursor-pointer ${
                  selectedChangeType === t.id ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 이상 내역 테이블 */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs font-semibold text-slate-700">
          <span>검색 및 필터 결과: 총 {filteredItems.length}건</span>
          <span className="text-slate-500 text-[11px]">* 단위: 원</span>
        </div>
        <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead className="bg-slate-100 text-slate-700 sticky top-0 z-10 border-b border-slate-200">
              <tr>
                <th className="p-2.5 font-bold text-center">No</th>
                <th className="p-2.5 font-bold text-center">유통사</th>
                <th className="p-2.5 font-bold">사업자명</th>
                <th className="p-2.5 font-bold">사업자번호</th>
                <th className="p-2.5 font-bold min-w-[200px]">상품명</th>
                <th className="p-2.5 font-bold text-center">7월 분류</th>
                <th className="p-2.5 font-bold text-center">8월 변경분류</th>
                <th className="p-2.5 font-bold text-right">7월 매출</th>
                <th className="p-2.5 font-bold text-right">8월 누적매출</th>
                <th className="p-2.5 font-bold text-right">8월 순수매출</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredItems.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                  <td className="p-2.5 text-center text-slate-400 font-medium">{idx + 1}</td>
                  <td className="p-2.5 text-center">
                    <span className="px-2 py-0.5 rounded font-semibold text-[11px] bg-slate-100 text-slate-800">
                      {item.channel}
                    </span>
                  </td>
                  <td className="p-2.5 font-bold text-slate-800">{item.bizName}</td>
                  <td className="p-2.5 font-mono text-slate-500 text-[11px]">{item.bizNo}</td>
                  <td className="p-2.5 text-slate-900 font-medium">{item.productName}</td>
                  <td className="p-2.5 text-center">
                    <span className={`px-2 py-0.5 rounded-full font-bold text-[11px] border ${getBadgeColor(item.cat7)}`}>
                      {item.cat7}
                    </span>
                  </td>
                  <td className="p-2.5 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <ArrowRight className="w-3 h-3 text-slate-400" />
                      <span className={`px-2 py-0.5 rounded-full font-bold text-[11px] border ${getBadgeColor(item.cat8)}`}>
                        {item.cat8}
                      </span>
                    </div>
                  </td>
                  <td className="p-2.5 text-right font-medium text-slate-600">
                    {item.sales7.toLocaleString()}
                  </td>
                  <td className="p-2.5 text-right font-medium text-slate-700">
                    {item.sales8.toLocaleString()}
                  </td>
                  <td className="p-2.5 text-right font-bold text-emerald-700 bg-emerald-50/30">
                    {item.pureSales8.toLocaleString()}
                  </td>
                </tr>
              ))}
              {filteredItems.length === 0 && (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-slate-400">
                    조건에 맞는 이상 내역이 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
