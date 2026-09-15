import sys
import io
import re
import pandas as pd

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

# 7월 및 8월 로우데이터 로드
raw7_agri = pd.read_excel(f7, sheet_name='①농산물raw', skiprows=4)
raw8_agri = pd.read_excel(f8, sheet_name='①농산물raw', skiprows=4)
raw7_org = pd.read_excel(f7, sheet_name='②유기농raw', skiprows=4)
raw8_org = pd.read_excel(f8, sheet_name='②유기농raw', skiprows=4)

for df in [raw7_agri, raw8_agri, raw7_org, raw8_org]:
    df.columns = [c.strip() for c in df.columns]
    df['clean_biz'] = df['사업자번호'].apply(clean_biz)
    df['clean_prod'] = df['상품명'].apply(clean_str)

raw8_all = pd.concat([raw8_agri, raw8_org])

missing_list = []

for label, r7 in [('농산물', raw7_agri), ('유기농', raw7_org)]:
    for idx, row in r7.iterrows():
        biz = row['clean_biz']
        p_clean = row['clean_prod']
        ch = str(row['유통사명']).strip()
        p_orig = str(row['상품명']).strip()
        b_name = str(row['사업자명']).strip()
        sales = row['매출액'] or 0
        qty = row['판매 건수'] or 0
        coupon = row['판촉액'] or 0
        
        c8 = raw8_all[(raw8_all['clean_biz'] == biz) & (raw8_all['유통사명'].str.strip() == ch)]
        
        # 1. 완전 정규화 일치
        if len(c8[c8['clean_prod'] == p_clean]) > 0:
            continue
            
        # 2. 리뉴얼/상품명 수정 업체인지 검사
        is_renamed = False
        if '참식품' in b_name or '나무컴퍼니' in b_name or '땅끝사랑농원' in b_name or '풀무리농장' in b_name:
            continue
            
        # 3. 그 외 유사 매칭 시도
        fuzzy_match = False
        for _, crow in c8.iterrows():
            c_clean = crow['clean_prod']
            if len(p_clean) >= 6 and (p_clean in c_clean or c_clean in p_clean):
                fuzzy_match = True
                break
        if fuzzy_match:
            continue
            
        missing_list.append({
            '구분': label,
            '유통사': ch,
            '사업자명': b_name,
            '사업자등록번호': row['사업자번호'],
            '7월 상품명': p_orig,
            '7월 판매건수': qty,
            '7월 매출액': sales,
            '7월 판촉액(쿠폰)': coupon,
            '8월 누적데이터 상태': '미존재 (누락)',
            '원인 분석': '스마트스토어 상품/옵션 삭제 또는 8월 기획전 로우데이터 연동 누락'
        })

df_out = pd.DataFrame(missing_list)
df_out.to_csv('missing_products_summary.csv', index=False, encoding='utf-8-sig')
print(f"Total missing: {len(df_out)}")
