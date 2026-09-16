import * as XLSX from 'xlsx';
import { 
  CHANNELS, 
  CHANNELS_ORGANIC, 
  CATEGORIES, 
  COUPON_ASSIGNED_AGRICULTURE, 
  COUPON_ASSIGNED_ORGANIC, 
  INITIAL_DATA, 
  INITIAL_DATA_ORGANIC 
} from '../data/initialData.js';
import { 
  TOP_PRODUCTS_JULY, 
  TOP_PRODUCTS_AUGUST_CUMULATIVE, 
  TOP_PRODUCTS_AUGUST_ONLY 
} from '../data/topProductsData.js';

/**
 * [구글 스프레드시트 2단계 유기적 연계 아키텍처]
 * 1. BASELINE_7M_SHEET: 7월 고정 기집계 기준 시트
 * 2. CUMULATIVE_SHEET: 7월부터 현재까지 계속 누적되는 실시간 로우데이터 시트
 * 
 * [누적 차감 원리]
 * [7~8월 누적 로우데이터 합계] - [7월 기집계 데이터] = [8월 순수 실적]
 * 향후 7~9월 누적이 들어올 경우: [7~9월 누적 합계] - [7~8월 누적 합계] = [9월 순수 실적]
 */
export const GOOGLE_SHEET_7M_BASELINE_ID = "10aAZ08ShlUqVOKt4Vyx6uxRlLZHAiNh7fUdLMbv6Ruw";
export const GOOGLE_SHEET_CUMULATIVE_ID = "1YhOoPpUDRPve5dfbIYTPURXHH6M8bFLQSssW03riA7Q";
export const GOOGLE_SHEET_ID = GOOGLE_SHEET_CUMULATIVE_ID;
export const GOOGLE_SHEET_EXPORT_URL = `https://docs.google.com/spreadsheets/d/${GOOGLE_SHEET_CUMULATIVE_ID}/export?format=xlsx`;
export const GOOGLE_SHEET_7M_EXPORT_URL = `https://docs.google.com/spreadsheets/d/${GOOGLE_SHEET_7M_BASELINE_ID}/export?format=xlsx`;

// 7월 고정 기집계 기준 데이터 (1차 시트 연계 기준선)
export const BASE_7M_AGRI = INITIAL_DATA;
export const BASE_7M_ORGANIC = INITIAL_DATA_ORGANIC;

// 메모리 캐시: 최근 구글 시트 원본 바이너리
let cachedGoogleSheetBuffer = null;

export function getCachedWorkbookBuffer() {
  return cachedGoogleSheetBuffer;
}

export function setCachedWorkbookBuffer(buffer) {
  cachedGoogleSheetBuffer = buffer;
}

/**
 * 숫자 문자열 내 쉼표, 공백, 하이픈 등 안전 제거 후 숫자 변환
 */
function cleanNumber(val) {
  if (val === null || val === undefined) return 0;
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  const s = String(val).trim().replace(/,/g, '');
  if (s === '' || s === '-' || s === 'None' || s === '#N/A') return 0;
  const n = Number(s);
  return isNaN(n) ? 0 : n;
}

/**
 * 열 이름 공백 무시하고 안전하게 값을 추출하는 정규화 헬퍼
 * (구글 시트 헤더 ' 판매 건수', ' 매출액', ' 판촉액', '상품명 ' 등 완벽 대응)
 */
function getCleanValue(row, targets) {
  for (const [k, v] of Object.entries(row)) {
    const cleanK = String(k).trim().replace(/\s+/g, '');
    for (const t of targets) {
      if (cleanK === t.replace(/\s+/g, '')) {
        return v;
      }
    }
  }
  return null;
}

/**
 * 7월 기준 시트와 8월 누적 시트 2개를 동시에 실시간 fetch하여 완벽 동기화
 */
export async function fetchAndSyncGoogleSheets() {
  try {
    // 7월 기준 시트와 8월 누적 시트를 병렬 다운로드
    const [resp7m, resp8m] = await Promise.allSettled([
      fetch(GOOGLE_SHEET_7M_EXPORT_URL),
      fetch(GOOGLE_SHEET_EXPORT_URL)
    ]);

    let arrayBuffer8m = null;
    if (resp8m.status === 'fulfilled' && resp8m.value.ok) {
      arrayBuffer8m = await resp8m.value.arrayBuffer();
      cachedGoogleSheetBuffer = arrayBuffer8m;
    } else {
      throw new Error("8월 누적 구글 시트 다운로드 실패");
    }

    let baseAgri = BASE_7M_AGRI;
    let baseOrg = BASE_7M_ORGANIC;

    // 7월 시트 파싱 가능 시 동적 기준선으로 활용
    if (resp7m.status === 'fulfilled' && resp7m.value.ok) {
      try {
        const buf7m = await resp7m.value.arrayBuffer();
        const wb7m = XLSX.read(buf7m, { type: 'array' });
        const sAgri7 = wb7m.SheetNames.find(s => s.includes('농산물raw') || s.includes('농산물 raw') || s.includes('①')) || wb7m.SheetNames[0];
        const sOrg7 = wb7m.SheetNames.find(s => s.includes('유기농raw') || s.includes('유기농 raw') || s.includes('②'));
        if (wb7m.Sheets[sAgri7]) {
          baseAgri = parseSingleMonthSheet(wb7m.Sheets[sAgri7], CHANNELS, BASE_7M_AGRI, "7월");
        }
        if (sOrg7 && wb7m.Sheets[sOrg7]) {
          baseOrg = parseSingleMonthSheet(wb7m.Sheets[sOrg7], CHANNELS_ORGANIC, BASE_7M_ORGANIC, "7월");
        }
      } catch (err7) {
        console.warn("7월 기준 시트 파싱 경고 (기본값 유지):", err7);
      }
    }

    const parsed = parseCompleteWorkbookWithBaseline(arrayBuffer8m, baseAgri, baseOrg);
    return {
      ...parsed,
      rawBuffer: arrayBuffer8m
    };
  } catch (err) {
    console.error("fetchAndSyncGoogleSheets 오류:", err);
    throw err;
  }
}

/**
 * 단일 월(7월) 로우데이터를 집계하여 기준선 데이터 구조 생성
 */
function parseSingleMonthSheet(worksheet, targetChannels, fallbackData, monthLabel = "7월") {
  if (!worksheet) return fallbackData;
  const rows = XLSX.utils.sheet_to_json(worksheet, { range: 4, defval: null });
  if (!rows || rows.length === 0) return fallbackData;

  const result = JSON.parse(JSON.stringify(fallbackData));
  const cum = {
    byChannel: {},
    byCatChannel: {},
    uniqueBizByChannel: {},
    allUniqueBiz: new Set()
  };

  targetChannels.forEach(ch => {
    cum.byChannel[ch] = { sales: 0, coupon: 0, count: 0, products: 0 };
    cum.uniqueBizByChannel[ch] = new Set();
  });

  CATEGORIES.forEach(cat => {
    cum.byCatChannel[cat] = {};
    targetChannels.forEach(ch => {
      cum.byCatChannel[cat][ch] = { sales: 0, coupon: 0, count: 0 };
    });
  });

  rows.forEach(r => {
    let chRaw = getCleanValue(r, ['유통사명', '유통사', '채널']);
    let ch = String(chRaw || '').trim();
    if (ch.includes("롯데")) ch = "롯데ON";

    const cat = String(getCleanValue(r, ['품목분류', '품목']) || '').trim();
    const bizNo = String(getCleanValue(r, ['사업자번호', '사업자 등록번호', '사업자등록번호']) || '').trim();
    const compName = String(getCleanValue(r, ['운영사', '업체명', '판매처', '사업자명']) || '').trim();
    const cnt = cleanNumber(getCleanValue(r, ['판매건수', '판매 건수', '건수']));
    const sales = cleanNumber(getCleanValue(r, ['매출액', '매출']));
    const coupon = cleanNumber(getCleanValue(r, ['판촉액', '쿠폰사용액', '쿠폰']));

    if (targetChannels.includes(ch)) {
      cum.byChannel[ch].sales += sales;
      cum.byChannel[ch].coupon += coupon;
      cum.byChannel[ch].count += cnt;
      cum.byChannel[ch].products += 1;

      const bizKey = bizNo || compName;
      if (bizKey) {
        cum.uniqueBizByChannel[ch].add(bizKey);
        cum.allUniqueBiz.add(bizKey);
      }

      if (CATEGORIES.includes(cat)) {
        cum.byCatChannel[cat][ch].sales += sales;
        cum.byCatChannel[cat][ch].coupon += coupon;
        cum.byCatChannel[cat][ch].count += cnt;
      }
    }
  });

  targetChannels.forEach(ch => {
    result.table2[monthLabel][ch] = cum.byChannel[ch].coupon;
    result.table3[monthLabel][ch] = cum.byChannel[ch].sales;
    result.table4[monthLabel][ch] = cum.byChannel[ch].count;
  });

  CATEGORIES.forEach(cat => {
    targetChannels.forEach(ch => {
      result.table5[cat][monthLabel][ch] = cum.byCatChannel[cat][ch].coupon;
      result.table6[cat][monthLabel][ch] = cum.byCatChannel[cat][ch].sales;
      result.table7[cat][monthLabel][ch] = cum.byCatChannel[cat][ch].count;
    });
  });

  return result;
}

/**
 * 엑셀 워크북 버퍼를 파싱하여 농산물 및 유기농 데이터 동시 갱신
 */
export function parseCompleteWorkbook(fileBuffer) {
  return parseCompleteWorkbookWithBaseline(fileBuffer, BASE_7M_AGRI, BASE_7M_ORGANIC);
}

export function parseCompleteWorkbookWithBaseline(fileBuffer, baseAgri, baseOrg) {
  const workbook = XLSX.read(fileBuffer, { type: 'array' });

  let agriSheetName = workbook.SheetNames.find(s => s.includes('농산물raw') || s.includes('농산물 raw') || s.includes('①'));
  if (!agriSheetName) agriSheetName = workbook.SheetNames[0];

  let orgSheetName = workbook.SheetNames.find(s => s.includes('유기농raw') || s.includes('유기농 raw') || s.includes('②'));

  const agriParsed = parseRawSheet(workbook.Sheets[agriSheetName], CHANNELS, baseAgri, "8월");

  let orgParsed = baseOrg;
  if (orgSheetName && workbook.Sheets[orgSheetName]) {
    orgParsed = parseRawSheet(workbook.Sheets[orgSheetName], CHANNELS_ORGANIC, baseOrg, "8월");
  }

  return {
    agriData: agriParsed,
    organicData: orgParsed,
    sheetNames: workbook.SheetNames,
    timestamp: new Date()
  };
}

/**
 * 단일 raw 시트에서 유통사별/품목별 누적을 집계한 뒤, 직전 기집계(7월)를 차감하여 신규월(8월) 순수 실적을 산출
 */
function parseRawSheet(worksheet, targetChannels, base7mData, newMonthLabel = "8월") {
  if (!worksheet) return base7mData;
  
  // Row 5 is header, so range starts from row 4 (0-indexed)
  const rows = XLSX.utils.sheet_to_json(worksheet, { range: 4, defval: null });
  if (!rows || rows.length === 0) return base7mData;

  const cumData = {
    byChannel: {},
    byCatChannel: {},
    uniqueBizByChannel: {}, // ch -> Set(bizNo)
    allUniqueBiz: new Set(),
    companyMap: {} // bizNo -> { bizNo, compName, channel, sales, coupon, count, products }
  };

  targetChannels.forEach(ch => {
    cumData.byChannel[ch] = { sales: 0, coupon: 0, count: 0, products: 0 };
    cumData.uniqueBizByChannel[ch] = new Set();
  });

  CATEGORIES.forEach(cat => {
    cumData.byCatChannel[cat] = {};
    targetChannels.forEach(ch => {
      cumData.byCatChannel[cat][ch] = { sales: 0, coupon: 0, count: 0 };
    });
  });

  let validRowCount = 0;

  rows.forEach(r => {
    let channelRaw = getCleanValue(r, ['유통사명', '유통사', '채널']);
    let channel = String(channelRaw || '').trim();
    if (channel.includes("롯데")) channel = "롯데ON";

    const categoryRaw = getCleanValue(r, ['품목분류', '품목']);
    const category = String(categoryRaw || '').trim();

    const bizNoRaw = getCleanValue(r, ['사업자번호', '사업자 등록번호', '사업자등록번호']);
    const bizNo = String(bizNoRaw || '').trim();

    const compNameRaw = getCleanValue(r, ['운영사', '업체명', '판매처', '사업자명']);
    const compName = String(compNameRaw || '').trim();

    const count = cleanNumber(getCleanValue(r, ['판매건수', '판매 건수', '건수']));
    const sales = cleanNumber(getCleanValue(r, ['매출액', '매출']));
    const coupon = cleanNumber(getCleanValue(r, ['판촉액', '쿠폰사용액', '쿠폰']));

    if (targetChannels.includes(channel)) {
      cumData.byChannel[channel].sales += sales;
      cumData.byChannel[channel].coupon += coupon;
      cumData.byChannel[channel].count += count;
      cumData.byChannel[channel].products += 1;
      validRowCount++;

      // 신규 및 기존 업체 고유 식별 및 집계
      const companyKey = bizNo || compName;
      if (companyKey) {
        cumData.uniqueBizByChannel[channel].add(companyKey);
        cumData.allUniqueBiz.add(companyKey);

        if (!cumData.companyMap[companyKey]) {
          cumData.companyMap[companyKey] = {
            bizNo: bizNo || "-",
            compName: compName || "신규 참여업체",
            channel,
            sales: 0,
            coupon: 0,
            count: 0,
            products: 0
          };
        }
        cumData.companyMap[companyKey].sales += sales;
        cumData.companyMap[companyKey].coupon += coupon;
        cumData.companyMap[companyKey].count += count;
        cumData.companyMap[companyKey].products += 1;
      }

      if (CATEGORIES.includes(category)) {
        cumData.byCatChannel[category][channel].sales += sales;
        cumData.byCatChannel[category][channel].coupon += coupon;
        cumData.byCatChannel[category][channel].count += count;
      }
    }
  });

  // 유효한 행이 없는 비정상 상황 시 안전하게 기존 기준 데이터 유지
  if (validRowCount === 0) {
    return base7mData;
  }

  // Calculate pure newMonth data by subtracting 7월 baseline
  const updatedData = JSON.parse(JSON.stringify(base7mData));

  let totPureCoupon = 0;
  let totPureSales = 0;
  let totPureCount = 0;
  let totPureProd = 0;

  updatedData.table2[newMonthLabel] = {};
  updatedData.table3[newMonthLabel] = {};
  updatedData.table4[newMonthLabel] = {};
  updatedData.table1[newMonthLabel] = {
    vendor: base7mData.table1[newMonthLabel]?.vendor || base7mData.table1["7월"]?.vendor || 0,
    product: { "총 계": 0 }
  };

  // 실시간 동적 Table 1 8월 누적 데이터 생성
  updatedData.table1["8월누적"] = {
    vendor: { "총 계": cumData.allUniqueBiz.size },
    product: { "총 계": 0 }
  };

  targetChannels.forEach(ch => {
    const c7 = base7mData.table2["7월"]?.[ch] || 0;
    const s7 = base7mData.table3["7월"]?.[ch] || 0;
    const cnt7 = base7mData.table4["7월"]?.[ch] || 0;
    const p7 = base7mData.table1["7월"]?.product?.[ch] || 0;

    // [누적치] - [7월치] = [8월 순수 실적]
    const pureCoupon = Math.max(0, cumData.byChannel[ch].coupon - c7);
    const pureSales = Math.max(0, cumData.byChannel[ch].sales - s7);
    const pureCount = Math.max(0, cumData.byChannel[ch].count - cnt7);
    const pureProd = Math.max(0, cumData.byChannel[ch].products - p7);

    updatedData.table2[newMonthLabel][ch] = pureCoupon;
    updatedData.table3[newMonthLabel][ch] = pureSales;
    updatedData.table4[newMonthLabel][ch] = pureCount;
    updatedData.table1[newMonthLabel].product[ch] = pureProd;

    // 8월 누적 고유 업체수 및 누적 상품수 동적 매핑
    updatedData.table1["8월누적"].vendor[ch] = cumData.uniqueBizByChannel[ch].size;
    updatedData.table1["8월누적"].product[ch] = cumData.byChannel[ch].products;

    totPureCoupon += pureCoupon;
    totPureSales += pureSales;
    totPureCount += pureCount;
    totPureProd += pureProd;
  });

  updatedData.table2[newMonthLabel]["총 계"] = totPureCoupon;
  updatedData.table3[newMonthLabel]["총 계"] = totPureSales;
  updatedData.table4[newMonthLabel]["총 계"] = totPureCount;
  updatedData.table1[newMonthLabel].product["총 계"] = totPureProd;
  updatedData.table1["8월누적"].product["총 계"] = Object.values(cumData.byChannel).reduce((acc, v) => acc + v.products, 0);

  // 로우데이터에서 자동 발견된 전체 업체 목록 보관
  updatedData.dynamicCompanyList = Object.values(cumData.companyMap);

  // 2. Table 5 (품목 쿠폰), Table 6 (품목 매출), Table 7 (품목 건수) 차감
  CATEGORIES.forEach(cat => {
    let catPureCoupon = 0;
    let catPureSales = 0;
    let catPureCount = 0;

    updatedData.table5[cat][newMonthLabel] = {};
    updatedData.table6[cat][newMonthLabel] = {};
    updatedData.table7[cat][newMonthLabel] = {};

    targetChannels.forEach(ch => {
      const c7 = base7mData.table5[cat]?.["7월"]?.[ch] || 0;
      const s7 = base7mData.table6[cat]?.["7월"]?.[ch] || 0;
      const cnt7 = base7mData.table7[cat]?.["7월"]?.[ch] || 0;

      const pureC = Math.max(0, cumData.byCatChannel[cat][ch].coupon - c7);
      const pureS = Math.max(0, cumData.byCatChannel[cat][ch].sales - s7);
      const pureCnt = Math.max(0, cumData.byCatChannel[cat][ch].count - cnt7);

      updatedData.table5[cat][newMonthLabel][ch] = pureC;
      updatedData.table6[cat][newMonthLabel][ch] = pureS;
      updatedData.table7[cat][newMonthLabel][ch] = pureCnt;

      catPureCoupon += pureC;
      catPureSales += pureS;
      catPureCount += pureCnt;
    });

    updatedData.table5[cat][newMonthLabel]["소 계"] = catPureCoupon;
    updatedData.table6[cat][newMonthLabel]["소 계"] = catPureSales;
    updatedData.table7[cat][newMonthLabel]["소 계"] = catPureCount;
  });

  return updatedData;
}

export function parseAndAggregateRawExcel(fileBuffer, currentData, newMonthLabel = "8월") {
  const result = parseCompleteWorkbook(fileBuffer);
  return { newMonthData: result.agriData, organicData: result.organicData };
}

/**
 * 브라우저 파일 다운로드 헬퍼
 */
export function triggerBlobDownload(blob, fileName) {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.style.display = 'none';
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }, 100);
}

/**
 * [추천 기본값] 수식 오류 0건! 
 * 대시보드_종합요약, 분석, 이상치 검토, 피벗 교차검증, 업체별, 로우데이터 1,454건이 
 * 모두 포함된 정합성 100% 완성본 엑셀 다운로드
 */
export async function downloadComprehensiveExcel(fileName = "(aT&KPC) 실적취합양식_2026 aT농산물온라인마케터_분석(8월)_대시보드포함.xlsx") {
  try {
    const fileUrl = `./aT_2026_sales_report_august.xlsx?v=${Date.now()}`;
    const resp = await fetch(fileUrl, { cache: 'no-store' });
    if (resp.ok) {
      const blob = await resp.blob();
      triggerBlobDownload(blob, fileName);
    } else {
      const a = document.createElement('a');
      a.href = fileUrl;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  } catch (err) {
    console.error("완성본 엑셀 다운로드 오류:", err);
    const a = document.createElement('a');
    a.href = `./2026_aT_온라인마케터_실적종합보고서(8월_대시보드포함).xlsx`;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
}

/**
 * 구글 드라이브 스프레드시트 원본 파일 다운로드
 */
export async function downloadGoogleSheetExcel(fileName = "2026_aT_온라인마케터_실적집계(구글시트_전체동기화).xlsx") {
  try {
    if (cachedGoogleSheetBuffer) {
      const blob = new Blob([cachedGoogleSheetBuffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      });
      triggerBlobDownload(blob, fileName);
      return;
    }

    const resp = await fetch(GOOGLE_SHEET_EXPORT_URL);
    if (resp.ok) {
      const arrayBuffer = await resp.arrayBuffer();
      cachedGoogleSheetBuffer = arrayBuffer;
      const blob = new Blob([arrayBuffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      });
      triggerBlobDownload(blob, fileName);
    } else {
      window.open(GOOGLE_SHEET_EXPORT_URL, '_blank');
    }
  } catch (err) {
    console.error("구글 시트 엑셀 다운로드 오류:", err);
    window.open(GOOGLE_SHEET_EXPORT_URL, '_blank');
  }
}

/**
 * 기본 exportToExcel 함수: 수식 에러가 없는 완성본 엑셀을 기본 다운로드
 */
export async function exportToExcel(data, fileName = "(aT&KPC) 실적취합양식_2026 aT농산물온라인마케터_분석(8월)_대시보드포함.xlsx") {
  await downloadComprehensiveExcel(fileName);
}

/**
 * 기획전 판매 상위 품목 실적 요약 전용 엑셀 파일 생성 및 다운로드
 */
export function downloadTopProductsExcel(
  period = "august_cumul", 
  unitMode = "million", 
  fileName = "2026_aT_기획전_판매_상위품목_실적요약.xlsx"
) {
  try {
    const wb = XLSX.utils.book_new();

    // 1. [종합] 7월-8월 비교 실적 시트
    const summaryAoa = [
      ["2026 aT 기획전 판매 상위 품목 실적 종합 요약"],
      ["※ 농산물·축산물·가공식품 3대 구분 및 세부 품목별 매출/쿠폰소진 실적 비교표"],
      [],
      [
        "구분", "품목", 
        "8월 누적매출액(원)", "8월 누적쿠폰(원)", "8월 누적매출(백만원)", "8월 누적쿠폰(백만원)", "누적 매출비중(%)",
        "8월 순수매출액(원)", "8월 순수쿠폰(원)", "8월 순수매출(백만원)", "8월 순수쿠폰(백만원)",
        "7월 매출액(원)", "7월 쿠폰소진(원)", "7월 매출(백만원)", "7월 쿠폰(백만원)"
      ]
    ];

    const totCumul = TOP_PRODUCTS_AUGUST_CUMULATIVE.find(r => r.is_total) || { sales_raw: 1 };

    for (let i = 0; i < TOP_PRODUCTS_AUGUST_CUMULATIVE.length; i++) {
      const c = TOP_PRODUCTS_AUGUST_CUMULATIVE[i];
      const j = TOP_PRODUCTS_JULY[i] || {};
      const o = TOP_PRODUCTS_AUGUST_ONLY[i] || {};

      const share = totCumul.sales_raw > 0 
        ? Number(((c.sales_raw / totCumul.sales_raw) * 100).toFixed(2)) 
        : 0;

      summaryAoa.push([
        c.is_total ? "총 계" : c.category,
        c.is_total ? "합계" : c.item,
        c.sales_raw || 0,
        c.coupon_raw || 0,
        c.sales_m || 0,
        c.coupon_m || 0,
        share,
        o.sales_raw || 0,
        o.coupon_raw || 0,
        o.sales_m || 0,
        o.coupon_m || 0,
        j.sales_raw || 0,
        j.coupon_raw || 0,
        j.sales_m || 0,
        j.coupon_m || 0
      ]);
    }

    const wsSummary = XLSX.utils.aoa_to_sheet(summaryAoa);
    wsSummary['!cols'] = [
      { wch: 12 }, { wch: 26 },
      { wch: 18 }, { wch: 16 }, { wch: 16 }, { wch: 16 }, { wch: 15 },
      { wch: 18 }, { wch: 16 }, { wch: 16 }, { wch: 16 },
      { wch: 18 }, { wch: 16 }, { wch: 16 }, { wch: 16 }
    ];
    XLSX.utils.book_append_sheet(wb, wsSummary, "종합_상위품목_비교");

    // 2. 단일 기간 탭 생성 헬퍼
    const addPeriodSheet = (sheetName, title, subtitle, data) => {
      const tot = data.find(r => r.is_total) || { sales_raw: 1, sales_m: 1 };
      const aoa = [
        [title],
        [subtitle],
        [],
        ["구분", "품목", "매출액(원)", "매출액(백만원)", "쿠폰소진액(원)", "쿠폰소진액(백만원)", "매출비중(%)"]
      ];

      data.forEach(r => {
        const share = tot.sales_raw > 0 ? Number(((r.sales_raw / tot.sales_raw) * 100).toFixed(2)) : 0;
        aoa.push([
          r.is_total ? "총 계" : r.category,
          r.is_total ? "합계" : r.item,
          r.sales_raw || 0,
          r.sales_m || 0,
          r.coupon_raw || 0,
          r.coupon_m || 0,
          share
        ]);
      });

      const ws = XLSX.utils.aoa_to_sheet(aoa);
      ws['!cols'] = [
        { wch: 12 }, { wch: 26 }, { wch: 18 }, { wch: 16 }, { wch: 18 }, { wch: 16 }, { wch: 14 }
      ];
      XLSX.utils.book_append_sheet(wb, ws, sheetName);
    };

    addPeriodSheet(
      "8월_누적실적", 
      "기획전 판매 상위 품목 실적 (8월 누적)", 
      "기준: 2026년 7월~8월 누적 기준", 
      TOP_PRODUCTS_AUGUST_CUMULATIVE
    );

    addPeriodSheet(
      "8월_순수실적", 
      "기획전 판매 상위 품목 실적 (8월 순수 증가분)", 
      "기준: 8월 누적 - 7월 누적 차감 순수 실적", 
      TOP_PRODUCTS_AUGUST_ONLY
    );

    addPeriodSheet(
      "7월_실적", 
      "기획전 판매 상위 품목 실적 (7월 결과보고)", 
      "기준: 2026년 7월 최종 확정 결과보고 기준", 
      TOP_PRODUCTS_JULY
    );

    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([wbout], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    });
    triggerBlobDownload(blob, fileName);
  } catch (err) {
    console.error("상위 품목 엑셀 다운로드 오류:", err);
    alert("상위 품목 엑셀 생성 중 오류가 발생했습니다: " + err.message);
  }
}

