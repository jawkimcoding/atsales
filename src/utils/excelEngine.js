import * as XLSX from 'xlsx';
import { CHANNELS, CATEGORIES, COUPON_ASSIGNED } from '../data/initialData';

export function parseAndAggregateRawExcel(fileBuffer, prevCumulativeData, newMonthLabel = "8월") {
  const workbook = XLSX.read(fileBuffer, { type: 'array' });
  let sheetName = workbook.SheetNames.find(s => s.includes('농산물raw') || s.includes('농산물 raw'));
  if (!sheetName) sheetName = workbook.SheetNames[0];

  const worksheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(worksheet, { range: 4, defval: null });

  const cumData = {
    totalSales: 0,
    totalCoupon: 0,
    totalCount: 0,
    byChannel: {},
    byCatChannel: {}
  };

  CHANNELS.forEach(ch => {
    cumData.byChannel[ch] = { sales: 0, coupon: 0, count: 0, products: 0 };
  });

  CATEGORIES.forEach(cat => {
    cumData.byCatChannel[cat] = {};
    CHANNELS.forEach(ch => {
      cumData.byCatChannel[cat][ch] = { sales: 0, coupon: 0, count: 0 };
    });
  });

  rows.forEach(r => {
    const channelRaw = r['유통사명'] || r['__EMPTY'] || '';
    const channel = String(channelRaw).trim();
    const categoryRaw = r['품목분류'] || r['__EMPTY_1'] || '';
    const category = String(categoryRaw).trim();
    
    const count = Number(r['판매 건수'] || r['판매건수'] || r['__EMPTY_5'] || 0) || 0;
    const sales = Number(r['매출액'] || r['__EMPTY_6'] || 0) || 0;
    const coupon = Number(r['판촉액'] || r['쿠폰사용액'] || r['__EMPTY_7'] || 0) || 0;

    if (CHANNELS.includes(channel)) {
      cumData.byChannel[channel].sales += sales;
      cumData.byChannel[channel].coupon += coupon;
      cumData.byChannel[channel].count += count;
      cumData.byChannel[channel].products += 1;

      cumData.totalSales += sales;
      cumData.totalCoupon += coupon;
      cumData.totalCount += count;

      if (CATEGORIES.includes(category)) {
        cumData.byCatChannel[category][channel].sales += sales;
        cumData.byCatChannel[category][channel].coupon += coupon;
        cumData.byCatChannel[category][channel].count += count;
      }
    }
  });

  const newMonthData = {
    month: newMonthLabel,
    table1: {
      vendor: { "총 계": 285, "네이버": 136, "지마켓": 53, "롯데ON": 47, "온누리마켓": 24, "농가살리기": 9, "오아시스": 16 },
      product: { "총 계": 0 }
    },
    table2: { "총 계": 0 },
    table3: { "총 계": 0 },
    table4: { "총 계": 0 },
    table5: {},
    table6: {},
    table7: {}
  };

  let pureCouponTotal = 0;
  let pureSalesTotal = 0;
  let pureCountTotal = 0;
  let pureProdTotal = 0;

  CHANNELS.forEach(ch => {
    const prevCoupon = prevCumulativeData?.table2?.[ch] || 0;
    const prevSales = prevCumulativeData?.table3?.[ch] || 0;
    const prevCount = prevCumulativeData?.table4?.[ch] || 0;
    const prevProd = prevCumulativeData?.table1?.product?.[ch] || 0;

    const pureCoupon = cumData.byChannel[ch].coupon - prevCoupon;
    const pureSales = cumData.byChannel[ch].sales - prevSales;
    const pureCount = cumData.byChannel[ch].count - prevCount;
    const pureProd = cumData.byChannel[ch].products - prevProd;

    newMonthData.table2[ch] = pureCoupon;
    newMonthData.table3[ch] = pureSales;
    newMonthData.table4[ch] = pureCount;
    newMonthData.table1.product[ch] = pureProd;

    pureCouponTotal += pureCoupon;
    pureSalesTotal += pureSales;
    pureCountTotal += pureCount;
    pureProdTotal += pureProd;
  });

  newMonthData.table2["총 계"] = pureCouponTotal;
  newMonthData.table3["총 계"] = pureSalesTotal;
  newMonthData.table4["총 계"] = pureCountTotal;
  newMonthData.table1.product["총 계"] = pureProdTotal;

  CATEGORIES.forEach(cat => {
    newMonthData.table5[cat] = { "소 계": 0 };
    newMonthData.table6[cat] = { "소 계": 0 };
    newMonthData.table7[cat] = { "소 계": 0 };

    let catCouponSub = 0;
    let catSalesSub = 0;
    let catCountSub = 0;

    CHANNELS.forEach(ch => {
      const prevC = prevCumulativeData?.table5?.[cat]?.[ch] || 0;
      const prevS = prevCumulativeData?.table6?.[cat]?.[ch] || 0;
      const prevCnt = prevCumulativeData?.table7?.[cat]?.[ch] || 0;

      const pureC = cumData.byCatChannel[cat][ch].coupon - prevC;
      const pureS = cumData.byCatChannel[cat][ch].sales - prevS;
      const pureCnt = cumData.byCatChannel[cat][ch].count - prevCnt;

      newMonthData.table5[cat][ch] = pureC;
      newMonthData.table6[cat][ch] = pureS;
      newMonthData.table7[cat][ch] = pureCnt;

      catCouponSub += pureC;
      catSalesSub += pureS;
      catCountSub += pureCnt;
    });

    newMonthData.table5[cat]["소 계"] = catCouponSub;
    newMonthData.table6[cat]["소 계"] = catSalesSub;
    newMonthData.table7[cat]["소 계"] = catCountSub;
  });

  return { cumData, newMonthData };
}

export function exportToExcel(dashboardData) {
  const wb = XLSX.utils.book_new();
  const summaryRows = [
    ["※ 농산물 온라인 마케터 실적 분석 대시보드 추출"],
    [],
    ["[1. 유통사 별 쿠폰 사용액]"],
    ["구분", "총 계", ...CHANNELS],
    ["7월", dashboardData.table2["7월"]["총 계"], ...CHANNELS.map(ch => dashboardData.table2["7월"][ch])],
    ["8월", dashboardData.table2["8월"]["총 계"], ...CHANNELS.map(ch => dashboardData.table2["8월"][ch])],
    ["누적 총계", dashboardData.table2["누적"]["총 계"], ...CHANNELS.map(ch => dashboardData.table2["누적"][ch])],
    ["쿠폰 배정액", COUPON_ASSIGNED["총 계"], ...CHANNELS.map(ch => COUPON_ASSIGNED[ch])],
    ["잔여금액", COUPON_ASSIGNED["총 계"] - dashboardData.table2["누적"]["총 계"], ...CHANNELS.map(ch => COUPON_ASSIGNED[ch] - dashboardData.table2["누적"][ch])],
    [],
    ["[2. 유통사 별 매출 분석]"],
    ["구분", "총 계", ...CHANNELS],
    ["7월", dashboardData.table3["7월"]["총 계"], ...CHANNELS.map(ch => dashboardData.table3["7월"][ch])],
    ["8월", dashboardData.table3["8월"]["총 계"], ...CHANNELS.map(ch => dashboardData.table3["8월"][ch])],
    ["누적 총계", dashboardData.table3["누적"]["총 계"], ...CHANNELS.map(ch => dashboardData.table3["누적"][ch])],
    [],
    ["[3. 유통사 별 판매 건수]"],
    ["구분", "총 계", ...CHANNELS],
    ["7월", dashboardData.table4["7월"]["총 계"], ...CHANNELS.map(ch => dashboardData.table4["7월"][ch])],
    ["8월", dashboardData.table4["8월"]["총 계"], ...CHANNELS.map(ch => dashboardData.table4["8월"][ch])],
    ["누적 총계", dashboardData.table4["누적"]["총 계"], ...CHANNELS.map(ch => dashboardData.table4["누적"][ch])]
  ];

  const ws = XLSX.utils.aoa_to_sheet(summaryRows);
  XLSX.utils.book_append_sheet(wb, ws, "실적분석_요약");
  XLSX.writeFile(wb, "aT_농산물온라인마케터_실적집계_대시보드.xlsx");
}
