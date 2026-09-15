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

def clean_str(val):
    if pd.isna(val): return ''
    s = str(val).strip()
    s = re.sub(r'\[원산지:[^\]]+\]', '', s)
    s = re.sub(r'\(원산지:[^\)]+\)', '', s)
    s = re.sub(r'[\s\(\)\[\]\-_,./+~]+', '', s).lower()
    return s

r7_agri = pd.read_excel(f7, sheet_name='①농산물raw', skiprows=4)
r8_agri = pd.read_excel(f8, sheet_name='①농산물raw', skiprows=4)
r7_org = pd.read_excel(f7, sheet_name='②유기농raw', skiprows=4)
r8_org = pd.read_excel(f8, sheet_name='②유기농raw', skiprows=4)

for df in [r7_agri, r8_agri, r7_org, r8_org]:
    df.columns = [c.strip() for c in df.columns]
    df['clean_biz'] = df['사업자번호'].apply(clean_biz)
    df['clean_prod'] = df['상품명'].apply(clean_str)

# 완전 누락 조사
def find_truly_missing(r7, r8, label):
    missing_rows = []
    for idx, row in r7.iterrows():
        biz = row['clean_biz']
        p_clean = row['clean_prod']
        ch = str(row['유통사명']).strip()
        p_orig = str(row['상품명']).strip()
        sales = row['매출액'] or 0
        qty = row['판매 건수'] or 0
        coupon = row['판촉액'] or 0
        
        c8 = r8[(r8['clean_biz'] == biz) & (r8['유통사명'].str.strip() == ch)]
        
        # 1) 정확한 일치
        if len(c8[c8['clean_prod'] == p_clean]) > 0:
            continue
            
        # 2) 핵심 키워드 매칭 여부 (변경인지 누락인지)
        # 만약 8월 상품들 중 핵심 키워드가 겹치는 상품이 있는지 조사
        matched_cand = None
        for _, crow in c8.iterrows():
            c_clean = crow['clean_prod']
            # 글자 길이 기반 공통 부분 검사
            # 김치, 무화과, 호라산밀 등 동일 카테고리 상품이 있으면 이름 변경으로 분류 가능
            if p_clean in c_clean or c_clean in p_clean:
                matched_cand = crow['상품명']
                break
                
        missing_rows.append({
            '시트': label,
            '유통사': ch,
            '사업자명': row['사업자명'],
            '사업자번호': row['사업자번호'],
            '7월 상품명': p_orig,
            '7월 건수': qty,
            '7월 매출액': sales,
            '7월 쿠폰액': coupon,
            '8월 유사상품': matched_cand,
            '판정': '상품명 변경(누적 반영)' if matched_cand else '8월 누적 완전 누락'
        })
    return pd.DataFrame(missing_rows)

df_agri_m = find_truly_missing(r7_agri, r8_agri, '농산물')
df_org_m = find_truly_missing(r7_org, r8_org, '유기농')

df_all = pd.concat([df_agri_m, df_org_m])
really_missing = df_all[df_all['판정'] == '8월 누적 완전 누락']

print(f"=== 완전 누락 건수: {len(really_missing)}건 ===")
print(really_missing[['시트', '유통사', '사업자명', '7월 상품명', '7월 건수', '7월 매출액', '7월 쿠폰액']].to_string())
print(f"완전 누락 총 매출액: {really_missing['7월 매출액'].sum():,}원, 건수: {really_missing['7월 건수'].sum()}건, 쿠폰: {really_missing['7월 쿠폰액'].sum():,}원")
