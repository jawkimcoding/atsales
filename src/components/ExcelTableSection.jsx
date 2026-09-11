import React from 'react';
import { CHANNELS, CATEGORIES, COUPON_ASSIGNED } from '../data/initialData';

export default function ExcelTableSection({ data, months }) {
  const cumCoupons = data.table2["누적"] || {};
  const remainCoupons = {};
  CHANNELS.forEach(ch => {
    remainCoupons[ch] = (COUPON_ASSIGNED[ch] || 0) - (cumCoupons[ch] || 0);
  });
  remainCoupons["총 계"] = COUPON_ASSIGNED["총 계"] - (cumCoupons["총 계"] || 0);

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <span className="inline-block px-3 py-1 bg-yellow-300 font-bold text-slate-900 text-sm rounded shadow-sm">
          ※ 농산물 온라인 마케터
        </span>
        <span className="text-xs text-slate-500 font-medium">
          (엑셀 원본 분석 시트와 100% 동일한 양식 및 누적 차감 집계 수식 적용)
        </span>
      </div>

      {/* 1. 월별 참여 업체 및 상품 수 */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 overflow-x-auto">
        <h3 className="font-bold text-slate-800 text-sm mb-3">1. 월별 참여 업체 및 상품 수</h3>
        <table className="excel-table w-full border-collapse border border-slate-300 text-sm">
          <thead>
            <tr className="excel-header">
              <th className="excel-border border border-slate-300" colSpan={2}>구분</th>
              <th className="excel-border border border-slate-300">총 계</th>
              {CHANNELS.map(ch => (
                <th key={ch} className="excel-border border border-slate-300">{ch}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {months.map(m => (
              <React.Fragment key={m}>
                <tr>
                  <td className="excel-border border border-slate-300 font-bold text-center bg-slate-50" rowSpan={2}>
                    {m}
                  </td>
                  <td className="excel-border border border-slate-300 text-center">업체수</td>
                  <td className="excel-border border border-slate-300 text-right font-medium">
                    {data.table1[m]?.vendor?.["총 계"]?.toLocaleString()}
                  </td>
                  {CHANNELS.map(ch => (
                    <td key={ch} className="excel-border border border-slate-300 text-right font-medium">
                      {data.table1[m]?.vendor?.[ch]?.toLocaleString()}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="excel-border border border-slate-300 text-center">상품수</td>
                  <td className="excel-border border border-slate-300 text-right font-medium text-emerald-700 bg-emerald-50/40">
                    {data.table1[m]?.product?.["총 계"]?.toLocaleString()}
                  </td>
                  {CHANNELS.map(ch => (
                    <td key={ch} className="excel-border border border-slate-300 text-right font-medium text-emerald-700 bg-emerald-50/40">
                      {data.table1[m]?.product?.[ch]?.toLocaleString()}
                    </td>
                  ))}
                </tr>
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {/* 2. 유통사 별 쿠폰 사용액 */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 overflow-x-auto">
        <h3 className="font-bold text-slate-800 text-sm mb-3">2. 유통사 별 쿠폰 사용액</h3>
        <table className="excel-table w-full border-collapse border border-slate-300 text-sm">
          <thead>
            <tr className="excel-header">
              <th className="excel-border border border-slate-300" colSpan={2}>구분</th>
              <th className="excel-border border border-slate-300">총 계</th>
              {CHANNELS.map(ch => (
                <th key={ch} className="excel-border border border-slate-300">{ch}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr className="bg-[#FFFFF2CC] font-bold">
              <td className="excel-border border border-slate-300 text-center" colSpan={2}>총 계 (누적)</td>
              <td className="excel-border border border-slate-300 text-right">
                {data.table2["누적"]?.["총 계"]?.toLocaleString()}
              </td>
              {CHANNELS.map(ch => (
                <td key={ch} className="excel-border border border-slate-300 text-right">
                  {data.table2["누적"]?.[ch]?.toLocaleString()}
                </td>
              ))}
            </tr>
            {months.map(m => (
              <tr key={m}>
                <td className="excel-border border border-slate-300 text-center font-bold bg-slate-50" colSpan={2}>
                  {m}
                </td>
                <td className="excel-border border border-slate-300 text-right font-semibold">
                  {data.table2[m]?.["총 계"]?.toLocaleString()}
                </td>
                {CHANNELS.map(ch => (
                  <td key={ch} className="excel-border border border-slate-300 text-right">
                    {data.table2[m]?.[ch]?.toLocaleString()}
                  </td>
                ))}
              </tr>
            ))}
            <tr className="font-bold text-slate-700 bg-slate-50">
              <td className="excel-border border border-slate-300 text-center" colSpan={2}>쿠폰 배정액</td>
              <td className="excel-border border border-slate-300 text-right">
                {COUPON_ASSIGNED["총 계"]?.toLocaleString()}
              </td>
              {CHANNELS.map(ch => (
                <td key={ch} className="excel-border border border-slate-300 text-right">
                  {COUPON_ASSIGNED[ch]?.toLocaleString()}
                </td>
              ))}
            </tr>
            <tr className="font-bold text-blue-800 bg-blue-50/50">
              <td className="excel-border border border-slate-300 text-center" colSpan={2}>잔여금액</td>
              <td className="excel-border border border-slate-300 text-right">
                {remainCoupons["총 계"]?.toLocaleString()}
              </td>
              {CHANNELS.map(ch => (
                <td key={ch} className="excel-border border border-slate-300 text-right">
                  {remainCoupons[ch]?.toLocaleString()}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      {/* 3. 유통사 별 매출 분석 */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 overflow-x-auto">
        <h3 className="font-bold text-slate-800 text-sm mb-3">3. 유통사 별 매출 분석</h3>
        <table className="excel-table w-full border-collapse border border-slate-300 text-sm">
          <thead>
            <tr className="excel-header">
              <th className="excel-border border border-slate-300" colSpan={2}>구분</th>
              <th className="excel-border border border-slate-300">총 계</th>
              {CHANNELS.map(ch => (
                <th key={ch} className="excel-border border border-slate-300">{ch}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr className="bg-[#FFFFF2CC] font-bold">
              <td className="excel-border border border-slate-300 text-center" colSpan={2}>총 계 (누적)</td>
              <td className="excel-border border border-slate-300 text-right text-emerald-800">
                {data.table3["누적"]?.["총 계"]?.toLocaleString()}
              </td>
              {CHANNELS.map(ch => (
                <td key={ch} className="excel-border border border-slate-300 text-right text-emerald-800">
                  {data.table3["누적"]?.[ch]?.toLocaleString()}
                </td>
              ))}
            </tr>
            {months.map(m => (
              <tr key={m}>
                <td className="excel-border border border-slate-300 text-center font-bold bg-slate-50" colSpan={2}>
                  {m}
                </td>
                <td className="excel-border border border-slate-300 text-right font-semibold">
                  {data.table3[m]?.["총 계"]?.toLocaleString()}
                </td>
                {CHANNELS.map(ch => (
                  <td key={ch} className="excel-border border border-slate-300 text-right">
                    {data.table3[m]?.[ch]?.toLocaleString()}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 4. 유통사 별 판매 건수 */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 overflow-x-auto">
        <h3 className="font-bold text-slate-800 text-sm mb-3">4. 유통사 별 판매 건수</h3>
        <table className="excel-table w-full border-collapse border border-slate-300 text-sm">
          <thead>
            <tr className="excel-header">
              <th className="excel-border border border-slate-300" colSpan={2}>구분</th>
              <th className="excel-border border border-slate-300">총 계</th>
              {CHANNELS.map(ch => (
                <th key={ch} className="excel-border border border-slate-300">{ch}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr className="bg-[#FFFFF2CC] font-bold">
              <td className="excel-border border border-slate-300 text-center" colSpan={2}>총 계 (누적)</td>
              <td className="excel-border border border-slate-300 text-right">
                {data.table4["누적"]?.["총 계"]?.toLocaleString()}
              </td>
              {CHANNELS.map(ch => (
                <td key={ch} className="excel-border border border-slate-300 text-right">
                  {data.table4["누적"]?.[ch]?.toLocaleString()}
                </td>
              ))}
            </tr>
            {months.map(m => (
              <tr key={m}>
                <td className="excel-border border border-slate-300 text-center font-bold bg-slate-50" colSpan={2}>
                  {m}
                </td>
                <td className="excel-border border border-slate-300 text-right font-semibold">
                  {data.table4[m]?.["총 계"]?.toLocaleString()}
                </td>
                {CHANNELS.map(ch => (
                  <td key={ch} className="excel-border border border-slate-300 text-right">
                    {data.table4[m]?.[ch]?.toLocaleString()}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 5, 6, 7. 품목별 세부 분석 */}
      {[
        { title: "5. 유통사별 품목별 쿠폰 사용액", tableKey: "table5" },
        { title: "6. 유통사별 품목별 매출 분석", tableKey: "table6" },
        { title: "7. 유통사별 품목별 판매 건수", tableKey: "table7" }
      ].map(({ title, tableKey }) => {
        const tableData = data[tableKey];
        const cumTotal = {};
        CHANNELS.forEach(ch => {
          cumTotal[ch] = CATEGORIES.reduce((sum, cat) => sum + (tableData[cat]?.["누적"]?.[ch] || 0), 0);
        });
        const cumGrandTotal = CATEGORIES.reduce((sum, cat) => sum + (tableData[cat]?.["누적"]?.["소 계"] || 0), 0);

        return (
          <div key={tableKey} className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 overflow-x-auto">
            <h3 className="font-bold text-slate-800 text-sm mb-3">{title}</h3>
            <table className="excel-table w-full border-collapse border border-slate-300 text-sm">
              <thead>
                <tr className="excel-header">
                  <th className="excel-border border border-slate-300">품목</th>
                  <th className="excel-border border border-slate-300">구분</th>
                  <th className="excel-border border border-slate-300">총 계</th>
                  {CHANNELS.map(ch => (
                    <th key={ch} className="excel-border border border-slate-300">{ch}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr className="bg-[#FFFFF2CC] font-bold">
                  <td className="excel-border border border-slate-300 text-center" colSpan={2}>총 계 (누적)</td>
                  <td className="excel-border border border-slate-300 text-right">
                    {cumGrandTotal.toLocaleString()}
                  </td>
                  {CHANNELS.map(ch => (
                    <td key={ch} className="excel-border border border-slate-300 text-right">
                      {cumTotal[ch]?.toLocaleString()}
                    </td>
                  ))}
                </tr>
                {CATEGORIES.map(cat => {
                  const catData = tableData[cat] || {};
                  return (
                    <React.Fragment key={cat}>
                      <tr className="font-bold bg-slate-50/80">
                        <td
                          className="excel-border border border-slate-300 font-bold text-center align-middle bg-slate-100"
                          rowSpan={months.length + 1}
                        >
                          {cat}
                        </td>
                        <td className="excel-border border border-slate-300 text-center">소 계</td>
                        <td className="excel-border border border-slate-300 text-right">
                          {catData["누적"]?.["소 계"]?.toLocaleString()}
                        </td>
                        {CHANNELS.map(ch => (
                          <td key={ch} className="excel-border border border-slate-300 text-right">
                            {catData["누적"]?.[ch]?.toLocaleString()}
                          </td>
                        ))}
                      </tr>
                      {months.map(m => (
                        <tr key={m} className="hover:bg-slate-50/50">
                          <td className="excel-border border border-slate-300 text-center text-slate-600 font-medium">
                            {m}
                          </td>
                          <td className="excel-border border border-slate-300 text-right font-medium">
                            {catData[m]?.["소 계"]?.toLocaleString()}
                          </td>
                          {CHANNELS.map(ch => (
                            <td key={ch} className="excel-border border border-slate-300 text-right text-slate-700">
                              {catData[m]?.[ch]?.toLocaleString()}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        );
      })}
    </div>
  );
}
