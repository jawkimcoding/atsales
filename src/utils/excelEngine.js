import * as XLSX from 'xlsx';
import { CHANNELS, CHANNELS_ORGANIC, CATEGORIES, COUPON_ASSIGNED_AGRICULTURE, COUPON_ASSIGNED_ORGANIC, INITIAL_DATA, INITIAL_DATA_ORGANIC } from '../data/initialData';

export const GOOGLE_SHEET_ID = "1YhOoPpUDRPve5dfbIYTPURXHH6M8bFLQSssW03riA7Q";
export const GOOGLE_SHEET_EXPORT_URL = `https://docs.google.com/spreadsheets/d/${GOOGLE_SHEET_ID}/export?format=xlsx`;

// 7월 고정 기집계 기준 데이터 (누적 차감용)
const BASE_7M_AGRI = INITIAL_DATA;
const BASE_7M_ORGANIC = INITIAL_DATA_ORGANIC;

// 메모리 캐시: 최근 구글 시트 원본 바이너리
let cachedGoogleSheetBuffer = null;

export function getCachedWorkbookBuffer() {
  return cachedGoogleSheetBuffer;
}

export function setCachedWorkbookBuffer(buffer) {
  cachedGoogleSheetBuffer = buffer;
}

/**
 * 구글 스프레드시트에서 실시간으로 엑셀을 fetch하여 농산물 & 유기농 8월 순수 실적을 자동 산출
 */
export async function fetchAndSyncGoogleSheets() {
  const resp = await fetch(GOOGLE_SHEET_EXPORT_URL);
  if (!resp.ok) {
    throw new Error(`구글 시트 다운로드 실패 (상태 코드: ${resp.status})`);
  }
  const arrayBuffer = await resp.arrayBuffer();
  cachedGoogleSheetBuffer = arrayBuffer;
  const parsed = parseCompleteWorkbook(arrayBuffer);
  return {
    ...parsed,
    rawBuffer: arrayBuffer
  };
}

/**
 * 엑셀 워크북 버퍼를 파싱하여 농산물 및 유기농 데이터 동시 갱신
 */
export function parseCompleteWorkbook(fileBuffer) {
  const workbook = XLSX.read(fileBuffer, { type: 'array' });

  // 1. 농산물 시트 찾기
  let agriSheetName = workbook.SheetNames.find(s => s.includes('농산물raw') || s.includes('농산물 raw') || s.includes('①'));
  if (!agriSheetName) agriSheetName = workbook.SheetNames[0];

  // 2. 유기농 시트 찾기
  let orgSheetName = workbook.SheetNames.find(s => s.includes('유기농raw') || s.includes('유기농 raw') || s.includes('②'));

  // 농산물 파싱
  const agriParsed = parseRawSheet(workbook.Sheets[agriSheetName], CHANNELS, BASE_7M_AGRI, "8월");

  // 유기농 파싱 (시트가 있으면 파싱, 없으면 기존 유지)
  let orgParsed = BASE_7M_ORGANIC;
  if (orgSheetName && workbook.Sheets[orgSheetName]) {
    orgParsed = parseRawSheet(workbook.Sheets[orgSheetName], CHANNELS_ORGANIC, BASE_7M_ORGANIC, "8월");
  }

  return {
    agriData: agriParsed,
    organicData: orgParsed,
    sheetNames: workbook.SheetNames,
    timestamp: new Date()
  };
}

function parseRawSheet(worksheet, targetChannels, base7mData, newMonthLabel = "8월") {
  if (!worksheet) return base7mData;
  
  // Row 5 is header, so range starts from row 4 (0-indexed)
  const rows = XLSX.utils.sheet_to_json(worksheet, { range: 4, defval: null });

  const cumData = {
    byChannel: {},
    byCatChannel: {}
  };

  targetChannels.forEach(ch => {
    cumData.byChannel[ch] = { sales: 0, coupon: 0, count: 0, products: 0 };
  });

  CATEGORIES.forEach(cat => {
    cumData.byCatChannel[cat] = {};
    targetChannels.forEach(ch => {
      cumData.byCatChannel[cat][ch] = { sales: 0, coupon: 0, count: 0 };
    });
  });

  rows.forEach(r => {
    const channelRaw = r['유통사명'] || r['유통사'] || r['__EMPTY'] || '';
    const channel = String(channelRaw).trim();
    const categoryRaw = r['품목분류'] || r['품목'] || r['__EMPTY_1'] || '';
    const category = String(categoryRaw).trim();

    const count = Number(r['판매 건수'] || r['판매건수'] || r['__EMPTY_5'] || 0) || 0;
    const sales = Number(r['매출액'] || r['__EMPTY_6'] || 0) || 0;
    const coupon = Number(r['판촉액'] || r['쿠폰사용액'] || r['__EMPTY_7'] || 0) || 0;

    if (targetChannels.includes(channel)) {
      cumData.byChannel[channel].sales += sales;
      cumData.byChannel[channel].coupon += coupon;
      cumData.byChannel[channel].count += count;
      cumData.byChannel[channel].products += 1;

      if (CATEGORIES.includes(category)) {
        cumData.byCatChannel[category][channel].sales += sales;
        cumData.byCatChannel[category][channel].coupon += coupon;
        cumData.byCatChannel[category][channel].count += count;
      }
    }
  });

  // Calculate pure newMonth data by subtracting 7월
  const updatedData = JSON.parse(JSON.stringify(base7mData));

  // 1. Table 2 (쿠폰), Table 3 (매출), Table 4 (건수)
  let totPureCoupon = 0;
  let totPureSales = 0;
  let totPureCount = 0;
  let totPureProd = 0;

  updatedData.table2[newMonthLabel] = {};
  updatedData.table3[newMonthLabel] = {};
  updatedData.table4[newMonthLabel] = {};
  updatedData.table1[newMonthLabel] = {
    vendor: base7mData.table1["7월"]?.vendor || 0,
    product: { "총 계": 0 }
  };

  targetChannels.forEach(ch => {
    const c7 = base7mData.table2["7월"]?.[ch] || 0;
    const s7 = base7mData.table3["7월"]?.[ch] || 0;
    const cnt7 = base7mData.table4["7월"]?.[ch] || 0;
    const p7 = base7mData.table1["7월"]?.product?.[ch] || 0;

    const pureCoupon = cumData.byChannel[ch].coupon - c7;
    const pureSales = cumData.byChannel[ch].sales - s7;
    const pureCount = cumData.byChannel[ch].count - cnt7;
    const pureProd = Math.max(0, cumData.byChannel[ch].products - p7);

    updatedData.table2[newMonthLabel][ch] = pureCoupon;
    updatedData.table3[newMonthLabel][ch] = pureSales;
    updatedData.table4[newMonthLabel][ch] = pureCount;
    updatedData.table1[newMonthLabel].product[ch] = pureProd;

    totPureCoupon += pureCoupon;
    totPureSales += pureSales;
    totPureCount += pureCount;
    totPureProd += pureProd;
  });

  updatedData.table2[newMonthLabel]["총 계"] = totPureCoupon;
  updatedData.table3[newMonthLabel]["총 계"] = totPureSales;
  updatedData.table4[newMonthLabel]["총 계"] = totPureCount;
  updatedData.table1[newMonthLabel].product["총 계"] = totPureProd;

  // 2. Table 5 (품목 쿠폰), Table 6 (품목 매출), Table 7 (품목 건수)
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

      const pureC = cumData.byCatChannel[cat][ch].coupon - c7;
      const pureS = cumData.byCatChannel[cat][ch].sales - s7;
      const pureCnt = cumData.byCatChannel[cat][ch].count - cnt7;

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
 * 참조한 구글 스프레드시트의 모든 데이터 및 시트(농산물 raw, 유기농 raw, 분석, 업체시트 등)를
 * 100% 동일한 서식과 수식 그대로 완벽하게 다운로드
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
 * 종합 대시보드 요약, 이상치 42건 검토, 피벗 교차검증 등이 모두 포함된 8개 시트 풀버전 보고서 다운로드
 */
export function downloadComprehensiveExcel(fileName = "2026_aT_온라인마케터_실적종합보고서(8월_대시보드포함).xlsx") {
  const a = document.createElement('a');
  a.style.display = 'none';
  a.href = `./2026_aT_온라인마케터_실적종합보고서(8월_대시보드포함).xlsx`;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
  }, 100);
}

/**
 * 엑셀 다운로드 기본 진입점: 구글 시트 원본 전체를 우선 다운로드
 */
export async function exportToExcel(data, fileName = "2026_aT_온라인마케터_실적집계(구글시트_전체동기화).xlsx") {
  await downloadGoogleSheetExcel(fileName);
}
