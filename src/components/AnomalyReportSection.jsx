import React, { useState, useMemo } from 'react';
import {
  AlertTriangle,
  Search,
  ArrowRight,
  Info,
  CheckCircle2,
  TrendingDown,
  ShieldCheck,
  Award,
  AlertCircle
} from 'lucide-react';
import {
  ITEM_ANOMALIES,
  DECREASED_ANOMALIES,
  TOP_COUPON_VENDORS,
  COMPLIANCE_RULES
} from '../data/initialData';

export default function AnomalyReportSection() {
  const [subTab, setSubTab] = useState('category'); // 'category' | 'decreased' | 'compliance' | 'top_vendors'
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedChannel, setSelectedChannel] = useState('ALL');
  const [selectedChangeType, setSelectedChangeType] = useState('ALL');

  // 품목분류 필터링
  const filteredCategoryItems = useMemo(() => {
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
      {/* 상단 탭 네비게이션 */}
      <div className="bg-white p-2 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center gap-1.5">
        <button
          onClick={() => setSubTab('category')}
          className={`px-3.5 py-2 rounded-lg font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer ${
            subTab === 'category'
              ? 'bg-rose-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
          <span>1. 품목분류 변경 이상건 ({ITEM_ANOMALIES.length}건)</span>
        </button>

        <button
          onClick={() => setSubTab('decreased')}
          className={`px-3.5 py-2 rounded-lg font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer ${
            subTab === 'decreased'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <TrendingDown className="w-4 h-4" />
          <span>2. 누적 실적 역전/감소 이상치 ({DECREASED_ANOMALIES.length}건)</span>
        </button>

        <button
          onClick={() => setSubTab('compliance')}
          className={`px-3.5 py-2 rounded-lg font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer ${
            subTab === 'compliance'
              ? 'bg-emerald-700 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>3. 사업 규정 준수 전수 검토 (3대 규정 100% 준수)</span>
        </button>

        <button
          onClick={() => setSubTab('top_vendors')}
          className={`px-3.5 py-2 rounded-lg font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer ${
            subTab === 'top_vendors'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>4. 쿠폰 800만 한도 상위 소진 업체 (Top 10)</span>
        </button>
      </div>

      {/* 1. 품목분류 변경 이상건 탭 */}
      {subTab === 'category' && (
        <div className="space-y-6">
          <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-xl shadow-xs">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-xs text-amber-900 space-y-1">
                <p className="font-bold text-sm">
                  ※ 농가 및 유통사의 품목 자의적 분류 변경 감지 보고서 (총 {ITEM_ANOMALIES.length}건)
                </p>
                <p className="text-amber-800">
                  <span className="font-semibold underline">사용자 요청 지침 준수</span>: 대시보드 통계 및 엑셀 수치에는 임의로 보정하지 않고 <b>8월 제출 원본 로우데이터 기준</b>으로 정상 집계하였습니다. 본 리포트는 7월 대비 8월 로우데이터 간 <b>동일 사업자·동일 상품의 품목 분류가 자의적으로 변경된 이상 내역</b>을 파악할 수 있도록 별도 제공되는 전수 검증 보고서입니다.
                </p>
              </div>
            </div>
          </div>

          {/* 필터 및 검색 */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="업체명, 상품명, 사업자번호 검색..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
              <span>검색 및 필터 결과: 총 {filteredCategoryItems.length}건</span>
              <span className="text-slate-500 text-[11px]">* 단위: 원</span>
            </div>
            <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
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
                  {filteredCategoryItems.map((item, idx) => (
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
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 2. 누적 실적 역전/감소 이상치 탭 */}
      {subTab === 'decreased' && (
        <div className="space-y-6">
          <div className="bg-rose-50 border-l-4 border-rose-500 p-4 rounded-r-xl shadow-xs">
            <div className="flex items-start gap-3">
              <TrendingDown className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div className="text-xs text-rose-900 space-y-1">
                <p className="font-bold text-sm">
                  ⚠️ 7월 실적 대비 8월 누적 실적 감소(역전) 이상치 분석 (총 {DECREASED_ANOMALIES.length}건)
                </p>
                <p className="text-rose-800">
                  누적 데이터는 7월 실적이 포함되어 있으므로 <b>8월 누적 ≥ 7월 실적</b>이어야 정상입니다. 그러나 아래 4건은 8월 누적 데이터가 7월보다 줄어들어, 8월 순수 실적 계산 시 <b>음수(마이너스) 실적</b>이 발생하거나 쿠폰 사용액이 감소한 원인 분석입니다.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {DECREASED_ANOMALIES.map((item, idx) => (
              <div key={idx} className="bg-white p-4 rounded-xl border border-rose-200 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-rose-100 text-rose-800 font-bold text-xs rounded">
                      {item.type}
                    </span>
                    <span className="font-bold text-slate-900 text-sm">{item.bizName}</span>
                    <span className="text-xs text-slate-400 font-mono">({item.bizNo})</span>
                    <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-700 rounded font-semibold">
                      {item.channel}
                    </span>
                  </div>
                  <div className="text-xs font-bold text-rose-600 bg-rose-50 px-2.5 py-1 rounded-md">
                    증감 결과: {item.diff}
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="p-2.5 bg-slate-50 rounded-lg">
                    <div className="font-semibold text-slate-700 mb-1">대상 상품 / 항목</div>
                    <div className="text-slate-900 font-medium">{item.productName}</div>
                    <div className="mt-2 text-slate-500">
                      <div>• 7월 실적: {item.item7}</div>
                      <div>• 8월 누적: {item.item8}</div>
                    </div>
                  </div>
                  <div className="p-2.5 bg-amber-50/60 rounded-lg border border-amber-200">
                    <div className="font-semibold text-amber-900 mb-1 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                      <span>원인 분석 및 조치 제언</span>
                    </div>
                    <div className="text-amber-800 leading-relaxed">
                      {item.cause}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. 사업 규정 준수 검토 탭 */}
      {subTab === 'compliance' && (
        <div className="space-y-6">
          <div className="bg-emerald-50 border-l-4 border-emerald-600 p-4 rounded-r-xl shadow-xs">
            <div className="flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div className="text-xs text-emerald-900 space-y-1">
                <p className="font-bold text-sm">
                  ✅ 사업 3대 핵심 규정 전수 검증 완료: 100% 정상 준수
                </p>
                <p className="text-emerald-800">
                  농산물 온라인 마케터 및 유기농 기획전 <b>전체 1,651개 로우데이터 행</b>을 대상으로 업체당 쿠폰한도(800만원), 쿠폰할인율(최대 20%), 건당 쿠폰상한(10,000원)을 전수 교차 검증한 결과입니다.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {COMPLIANCE_RULES.map((rule, idx) => (
              <div key={idx} className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 text-sm">{rule.title}</span>
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold text-xs rounded-full flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>{rule.status}</span>
                    </span>
                  </div>
                  <div className="mt-2 text-xs text-slate-500 font-medium">
                    기준: {rule.standard}
                  </div>
                  <div className="mt-3 p-2.5 bg-slate-50 rounded-lg text-xs font-bold text-emerald-800 border border-slate-100">
                    검토 결과: {rule.result}
                  </div>
                  <div className="mt-2 text-xs text-slate-600 leading-relaxed">
                    {rule.detail}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. 쿠폰 800만 한도 상위 소진 업체 탭 */}
      {subTab === 'top_vendors' && (
        <div className="space-y-6">
          <div className="bg-blue-50 border-l-4 border-blue-600 p-4 rounded-r-xl shadow-xs">
            <div className="flex items-start gap-3">
              <Award className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
              <div className="text-xs text-blue-900 space-y-1">
                <p className="font-bold text-sm">
                  📊 업체당 쿠폰 한도 800만원 대비 소진율 상위 Top 10 업체 모니터링
                </p>
                <p className="text-blue-800">
                  전체 참여 사업자 중 800만원 한도를 초과한 업체는 없으나, <b>소진율 60% 이상에 도달하여 잔여 예산 모니터링이 필요한 상위 10개 업체</b>의 실적 현황입니다.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead className="bg-slate-100 text-slate-700 sticky top-0 z-10 border-b border-slate-200">
                  <tr>
                    <th className="p-3 font-bold text-center">순위</th>
                    <th className="p-3 font-bold">사업자명</th>
                    <th className="p-3 font-bold">사업자번호</th>
                    <th className="p-3 font-bold text-center">주요 채널</th>
                    <th className="p-3 font-bold text-right">누적 매출액</th>
                    <th className="p-3 font-bold text-right">누적 쿠폰사용액</th>
                    <th className="p-3 font-bold text-center">한도(800만) 소진율</th>
                    <th className="p-3 font-bold text-right">잔여 한도액</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {TOP_COUPON_VENDORS.map((v) => (
                    <tr key={v.rank} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3 text-center font-bold text-slate-500">{v.rank}</td>
                      <td className="p-3 font-bold text-slate-900">{v.bizName}</td>
                      <td className="p-3 font-mono text-slate-500 text-[11px]">{v.bizNo}</td>
                      <td className="p-3 text-center">
                        <span className="px-2 py-0.5 rounded font-semibold text-[11px] bg-slate-100 text-slate-800">
                          {v.channel}
                        </span>
                      </td>
                      <td className="p-3 text-right font-medium text-slate-700">
                        {v.sales.toLocaleString()}원
                      </td>
                      <td className="p-3 text-right font-black text-slate-900">
                        {v.coupon.toLocaleString()}원
                      </td>
                      <td className="p-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full font-bold text-[11px] ${
                          v.rate >= 70 ? 'bg-amber-100 text-amber-900 border border-amber-300' : 'bg-blue-100 text-blue-900 border border-blue-300'
                        }`}>
                          {v.rate}%
                        </span>
                      </td>
                      <td className="p-3 text-right font-semibold text-emerald-700">
                        {v.remain.toLocaleString()}원
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
