import sys
import io
import re
import pandas as pd

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

f7 = '(aT&KPC) 실적취합양식_2026 aT농산물온라인마케터_분석(7월)_참여업체만 반영_수정(발송).xlsx'
f8 = '(aT&KPC) 실적취합양식_2026 aT농산물온라인마케터_분석(8월).xlsx'

def clean_biz(val):
    if pd.isna(val): return ''
    return str(val).strip().replace('-', '').replace(' ', '')

# 89개 누락 후보 품목을 정밀 분석
df_m = pd.read_csv('missing_products_summary.csv', encoding='utf-8-sig')

r8_agri = pd.read_excel(f8, sheet_name='①농산물raw', skiprows=4)
r8_org = pd.read_excel(f8, sheet_name='②유기농raw', skiprows=4)
r8_all = pd.concat([r8_agri, r8_org])
r8_all.columns = [c.strip() for c in r8_all.columns]
r8_all['clean_biz'] = r8_all['사업자번호'].apply(clean_biz)

truly_missing = []
renamed_success = []

for idx, r in df_m.iterrows():
    biz = clean_biz(r['사업자등록번호'])
    pname7 = r['7월 상품명']
    ch = r['유통사']
    sales7 = r['7월 매출액']
    qty7 = r['7월 판매건수']
    coupon7 = r['7월 판촉액(쿠폰)']
    
    # 8월 해당 사업자의 상품들
    c8 = r8_all[(r8_all['clean_biz'] == biz) & (r8_all['유통사명'].str.strip() == ch)]
    
    # 쿠폰액이 정확히 일치하거나, 상품 핵심 단어가 일치하는 상품 찾기
    best_match = None
    match_reason = ''
    
    for _, c_row in c8.iterrows():
        pname8 = str(c_row['상품명']).strip()
        sales8 = c_row['매출액'] or 0
        qty8 = c_row['판매 건수'] or 0
        coupon8 = c_row['판촉액'] or 0
        
        # 1) 쿠폰액이 0이 아니면서 정확히 일치하고 매출/건수가 증가한 경우 (결정적 증거!)
        if coupon7 > 0 and coupon8 == coupon7 and sales8 >= sales7:
            best_match = c_row
            match_reason = f"쿠폰 사용액 100% 일치 ({coupon7:,}원) 및 실적 누적 증가"
            break
            
        # 2) 핵심 명사 일치 검사 (여주쌀, 복숭아, 총각김치, 파김치 등)
        keywords = ['여주쌀', '신비복숭아', '복숭아', '알타리', '총각김치', '쪽파김치', '파김치', '고시히카리', '삼겹살', '목살', '자두', '토마토', '유정란', '그릭요거트', '수박', '감식초', '곶감']
        matched_kw = [kw for kw in keywords if kw in pname7 and kw in pname8]
        if matched_kw and sales8 >= sales7:
            best_match = c_row
            match_reason = f"핵심 키워드('{matched_kw[0]}') 일치 및 실적 승계"
            break
            
    if best_match is not None:
        renamed_success.append({
            '구분': r['구분'],
            '유통사': ch,
            '사업자명': r['사업자명'],
            '사업자등록번호': r['사업자등록번호'],
            '7월 상품명': pname7,
            '8월 변경 상품명': best_match['상품명'],
            '7월 매출': sales7,
            '8월 누적매출': best_match['매출액'],
            '7월 건수': qty7,
            '8월 누적건수': best_match['판매 건수'],
            '7월 쿠폰': coupon7,
            '8월 누적쿠폰': best_match['판촉액'],
            '식별 근거': match_reason
        })
    else:
        truly_missing.append({
            '구분': r['구분'],
            '유통사': ch,
            '사업자명': r['사업자명'],
            '사업자등록번호': r['사업자등록번호'],
            '7월 상품명': pname7,
            '7월 매출': sales7,
            '7월 건수': qty7,
            '7월 쿠폰': coupon7,
            '8월 사업자 타 상품수': len(c8),
            '사유': '상품 단종/품절 또는 8월 기획전 로우데이터에서 제외'
        })

df_renamed = pd.DataFrame(renamed_success)
df_truly = pd.DataFrame(truly_missing)

print("=================================================================")
print(f"1. [상품명 변경으로 실적 승계 확인된 품목]: {len(df_renamed)}건")
print(f"   - 7월 매출: {df_renamed['7월 매출'].sum():,}원 | 8월 누적: {df_renamed['8월 누적매출'].sum():,}원")
print("=================================================================")
print(f"2. [진짜 8월 누적에서 제외/단종된 완전 누락 품목]: {len(df_truly)}건")
print(f"   - 7월 매출: {df_truly['7월 매출'].sum():,}원 | 건수: {df_truly['7월 건수'].sum():,}건 | 쿠폰: {df_truly['7월 쿠폰'].sum():,}원")
print("=================================================================")

print("\n[진짜 완전 누락 품목 전체 목록]")
for idx, (_, r) in enumerate(df_truly.iterrows(), 1):
    print(f"{idx:2d}. [{r['유통사']}] {r['사업자명']} | {r['7월 상품명']} | 매출: {r['7월 매출']:,}원 | 건수: {r['7월 건수']}건 | 쿠폰: {r['7월 쿠폰']:,}원")
