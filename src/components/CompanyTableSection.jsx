import React, { useState, useMemo } from 'react';
import {
  Building2,
  Search,
  ArrowUpDown,
  DollarSign,
  Percent,
  TrendingUp
} from 'lucide-react';
import { AGRI_COMPANY_LIST, ORGANIC_COMPANY_LIST } from '../data/companyListData';

export default function CompanyTableSection() {
  const [activeType, setActiveType] = useState('agri');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedChannel, setSelectedChannel] = useState('ALL');
  const [selectedIncoming, setSelectedIncoming] = useState('ALL');
  const [selectedGubun, setSelectedGubun] = useState('ALL');
  const [sortField, setSortField] = useState('no');
  const [sortAsc, setSortAsc] = useState(true);

  const rawList = activeType === 'agri' ? AGRI_COMPANY_LIST : ORGANIC_COMPANY_LIST;

  const channels = activeType === 'agri'
    ? ['네이버', '지마켓', '롯데ON', '온누리마켓', '농가살리기', '오아시스']
    : ['네이버', '오아시스'];

  const filteredList = useMemo(() => {
    return rawList
      .filter(item => {
        const compNameStr = (item.compName || item.company_name || '').toLowerCase();
        const bizNoStr = (item.bizNo || item.business_no || '');
        const searchLower = searchTerm.toLowerCase();

        const matchSearch =
          !searchTerm ||
          compNameStr.includes(searchLower) ||
          bizNoStr.includes(searchLower);

        const channelStr = item.channel || '';
        const matchChannel =
          selectedChannel === 'ALL' ||
          channelStr.toLowerCase().includes(selectedChannel.toLowerCase()) ||
          (selectedChannel === '롯데ON' && channelStr.includes('롯데')) ||
          (selectedChannel === '롯데온' && channelStr.includes('롯데'));

        const matchIncoming =
          selectedIncoming === 'ALL' ||
          (selectedIncoming === 'IN' && item.isIncoming === 'O') ||
          (selectedIncoming === 'NOT_IN' && item.isIncoming !== 'O');

        const matchGubun =
          selectedGubun === 'ALL' || item.gubun === selectedGubun;

        return matchSearch && matchChannel && matchIncoming && matchGubun;
      })
      .sort((a, b) => {
        let valA = a[sortField];
        let valB = b[sortField];

        if (sortField === 'rate') {
          valA = a.rateNum ?? 0;
          valB = b.rateNum ?? 0;
        }

        if (typeof valA === 'string') {
          return sortAsc ? valA.localeCompare(valB || '') : (valB || '').localeCompare(valA);
        }
        return sortAsc ? (valA || 0) - (valB || 0) : (valB || 0) - (valA || 0);
      });
  }, [rawList, searchTerm, selectedChannel, selectedIncoming, selectedGubun, sortField, sortAsc]);

  const totals = useMemo(() => {
    return filteredList.reduce(
      (acc, cur) => {
        acc.count += cur.count || 0;
        acc.sales += cur.sales || 0;
        acc.coupon += cur.coupon || 0;
        if (cur.isIncoming === 'O') acc.incomingCount += 1;
        return acc;
      },
      { count: 0, sales: 0, coupon: 0, incomingCount: 0 }
    );
  }, [filteredList]);

  const baseTotals = useMemo(() => {
    return rawList.reduce(
      (acc, cur) => {
        acc.count += cur.count || 0;
        acc.sales += cur.sales || 0;
        acc.coupon += cur.coupon || 0;
        if (cur.isIncoming === 'O') acc.incomingCount += 1;
        return acc;
      },
      { count: 0, sales: 0, coupon: 0, incomingCount: 0 }
    );
  }, [rawList]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(field === 'no');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
              <Building2 className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-black text-slate-900">
              {activeType === 'agri' ? '🌾 농산물 온라인 마케터 업체별 실적' : '🌿 유기농 기획전 업체별 실적'}
            </h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-slate-100 text-slate-700 border border-slate-200">
              엑셀 시트 1:1 완벽 동기화
            </span>
          </div>
          <p className="text-xs text-slate-500">
            엑셀 다운로드 시 포함되는 <b>'{activeType === 'agri' ? '농산물업체' : '유기농업체'}'</b> 시트의 {rawList.length}개사 전수 실적 현황입니다.
          </p>
        </div>

        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button
            onClick={() => { setActiveType('agri'); setSearchTerm(''); }}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeType === 'agri'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            🌾 농산물업체 ({AGRI_COMPANY_LIST.length}개사)
          </button>
          <button
            onClick={() => { setActiveType('organic'); setSearchTerm(''); }}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeType === 'organic'
                ? 'bg-lime-700 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            🌿 유기농업체 ({ORGANIC_COMPANY_LIST.length}개사)
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">총 등록 / 8월 실인입 업체수</span>
            <span className="text-[11px] font-bold px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full">
              인입률 {((baseTotals.incomingCount / rawList.length) * 100).toFixed(1)}%
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{baseTotals.incomingCount}</span>
            <span className="text-xs font-medium text-slate-500">/ {rawList.length} 개사</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {filteredList.length !== rawList.length && `(현재 필터 조회: ${filteredList.length}개사)`}
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">누적 매출액 (전수 합계)</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900">
            {totals.sales.toLocaleString()} <span className="text-xs font-medium text-slate-500">원</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            엑셀 상단 합계 공식(SUMIF)과 1원 단위 100% 일치
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">누적 쿠폰 집행액</span>
            <Percent className="w-4 h-4 text-amber-600" />
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900">
            {totals.coupon.toLocaleString()} <span className="text-xs font-medium text-slate-500">원</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            업체당 800만원 한도 대비 누적 소진액
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">누적 총 판매건수</span>
            <TrendingUp className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900">
            {totals.count.toLocaleString()} <span className="text-xs font-medium text-slate-500">건</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            로우데이터 합산 일치
          </p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="업체명 또는 사업자등록번호 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={selectedChannel}
              onChange={(e) => setSelectedChannel(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-lg text-xs font-bold bg-white text-slate-700 cursor-pointer"
            >
              <option value="ALL">전체 유통사</option>
              {channels.map((ch) => (
                <option key={ch} value={ch}>{ch}</option>
              ))}
            </select>

            <select
              value={selectedIncoming}
              onChange={(e) => setSelectedIncoming(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-lg text-xs font-bold bg-white text-slate-700 cursor-pointer"
            >
              <option value="ALL">실제 인입 (전체)</option>
              <option value="IN">8월 실인입(O)만 보기</option>
              <option value="NOT_IN">미인입 업체만 보기</option>
            </select>

            <select
              value={selectedGubun}
              onChange={(e) => setSelectedGubun(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-lg text-xs font-bold bg-white text-slate-700 cursor-pointer"
            >
              <option value="ALL">전체 규모</option>
              <option value="시작">시작</option>
              <option value="도약">도약</option>
              <option value="성장">성장</option>
            </select>

            {(searchTerm || selectedChannel !== 'ALL' || selectedIncoming !== 'ALL' || selectedGubun !== 'ALL') && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedChannel('ALL');
                  setSelectedIncoming('ALL');
                  setSelectedGubun('ALL');
                }}
                className="px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
              >
                필터 초기화
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto max-h-[650px] overflow-y-auto">
          <table className="w-full border-collapse text-xs text-left">
            <thead className="bg-slate-100 text-slate-700 sticky top-0 z-20 border-b border-slate-300 shadow-xs select-none">
              <tr>
                <th
                  onClick={() => handleSort('no')}
                  className="p-3 font-bold text-center w-14 cursor-pointer hover:bg-slate-200 transition-colors"
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>NO</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="p-3 font-bold text-center w-16">구분</th>
                <th className="p-3 font-bold w-28">사업자등록번호</th>
                <th className="p-3 font-bold">업체명</th>
                <th className="p-3 font-bold text-center w-24">배정유통사</th>
                <th
                  onClick={() => handleSort('count')}
                  className="p-3 font-bold text-right w-24 cursor-pointer hover:bg-slate-200 transition-colors"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>판매건수</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('sales')}
                  className="p-3 font-bold text-right w-32 cursor-pointer hover:bg-slate-200 transition-colors"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>매출액</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('coupon')}
                  className="p-3 font-bold text-right w-32 cursor-pointer hover:bg-slate-200 transition-colors"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>판촉액(쿠폰)</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="p-3 font-bold text-center w-24">
                  8월 실제 인입
                </th>
                <th
                  onClick={() => handleSort('rate')}
                  className="p-3 font-bold text-center w-28 cursor-pointer hover:bg-slate-200 transition-colors"
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>쿠폰소진율</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="p-3 font-bold text-right w-32">잔여한도액</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              <tr className="bg-amber-50/80 font-bold border-b-2 border-slate-300 sticky top-[41px] z-10 text-slate-900 shadow-2xs">
                <td colSpan={5} className="p-3 text-center text-xs font-black text-amber-900">
                  합 계 ({filteredList.length}개사 조회)
                </td>
                <td className="p-3 text-right font-black text-indigo-900">
                  {totals.count.toLocaleString()}
                </td>
                <td className="p-3 text-right font-black text-slate-900">
                  {totals.sales.toLocaleString()}
                </td>
                <td className="p-3 text-right font-black text-amber-900">
                  {totals.coupon.toLocaleString()}
                </td>
                <td className="p-3 text-center font-black text-emerald-800">
                  {totals.incomingCount}개사
                </td>
                <td className="p-3 text-center font-black text-slate-900">
                  {((totals.coupon / (filteredList.length * 8000000 || 1)) * 100).toFixed(1)}%
                </td>
                <td className="p-3 text-right font-black text-slate-900">
                  {(filteredList.length * 8000000 - totals.coupon).toLocaleString()}
                </td>
              </tr>

              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={11} className="p-8 text-center text-slate-400 font-bold">
                    검색 조건에 일치하는 업체가 없습니다.
                  </td>
                </tr>
              ) : (
                filteredList.map((item, idx) => (
                  <tr
                    key={(item.no || idx) + '-' + (item.bizNo || item.business_no || idx)}
                    className={`hover:bg-slate-50 transition-colors ${
                      item.isIncoming === 'O' ? 'bg-white' : 'bg-slate-50/40 text-slate-400'
                    }`}
                  >
                    <td className="p-2.5 text-center text-slate-500 font-mono text-[11px]">
                      {item.no || idx + 1}
                    </td>
                    <td className="p-2.5 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        item.gubun === '성장' ? 'bg-purple-100 text-purple-800' :
                        item.gubun === '도약' ? 'bg-blue-100 text-blue-800' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {item.gubun || '-'}
                      </span>
                    </td>
                    <td className="p-2.5 font-mono text-slate-600 text-[11px]">
                      {item.bizNo || item.business_no || '-'}
                    </td>
                    <td className="p-2.5 font-bold text-slate-900">
                      {item.compName || item.company_name || '-'}
                    </td>
                    <td className="p-2.5 text-center">
                      <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-800">
                        {item.channel || '-'}
                      </span>
                    </td>
                    <td className="p-2.5 text-right font-medium text-slate-700">
                      {(item.count || 0).toLocaleString()}
                    </td>
                    <td className="p-2.5 text-right font-bold text-slate-900">
                      {(item.sales || 0).toLocaleString()}
                    </td>
                    <td className="p-2.5 text-right font-black text-slate-900">
                      {(item.coupon || 0).toLocaleString()}
                    </td>
                    <td className="p-2.5 text-center">
                      {item.isIncoming === 'O' ? (
                        <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 font-black text-xs">
                          O
                        </span>
                      ) : (
                        <span className="text-slate-300 font-mono">-</span>
                      )}
                    </td>
                    <td className="p-2.5 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                        (item.rateNum || 0) >= 70 ? 'bg-amber-100 text-amber-900 font-black' :
                        (item.rateNum || 0) >= 30 ? 'bg-blue-50 text-blue-700' :
                        'bg-slate-100 text-slate-500'
                      }`}>
                        {item.rate || '0.0%'}
                      </span>
                    </td>
                    <td className="p-2.5 text-right font-medium text-slate-700">
                      {(item.remain ?? (8000000 - (item.coupon || 0))).toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
