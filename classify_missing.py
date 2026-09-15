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

all_missing = []

for label, sname in [('농산물', '①농산물raw'), ('유기농', '②유기농raw')]:
    r7 = pd.read_excel(f7, sheet_name=sname, skiprows=4)
    r8 = pd.read_excel(f8, sheet_name=sname, skiprows=4)
    r7.columns = [c.strip() for c in r7.columns]
    r8.columns = [c.strip() for c in r8.columns]
    
    r7['clean_biz'] = r7['사업자번호'].apply(clean_biz)
    r7['clean_prod'] = r7['상품명'].apply(clean_str)
    
    r8['clean_biz'] = r8['사업자번호'].apply(clean_biz)
    r8['clean_prod'] = r8['상품명'].apply(clean_str)
    
    # 또한 8월 다른 raw 시트에도 있는지 교차 확인
    other_sname = '②유기농raw' if sname == '①농산물raw' else '①농산물raw'
    r8_other = pd.read_excel(f8, sheet_name=other_sname, skiprows=4)
    r8_other.columns = [c.strip() for c in r8_other.columns]
    r8_other['clean_biz'] = r8_other['사업자번호'].apply(clean_biz)
    r8_other['clean_prod'] = r8_other['상품명'].apply(clean_str)
    
    for idx, row in r7.iterrows():
        biz = row['clean_biz']
        p_clean = row['clean_prod']
        ch = str(row['유통사명']).strip()
        p_orig = str(row['상품명']).strip()
        
        # 1. 8월 동일 시트 내 검색
        c8 = r8[(r8['clean_biz'] == biz) & (r8['유통사명'].str.strip() == ch)]
        
        # 완전 정규화 일치
        if len(c8[c8['clean_prod'] == p_clean]) > 0:
            continue
            
        # 2. 8월 다른 시트 내 검색 (시트 간 이동 여부)
        c8_oth = r8_other[(r8_other['clean_biz'] == biz) & (r8_other['유통사명'].str.strip() == ch)]
        if len(c8_oth[c8_oth['clean_prod'] == p_clean]) > 0:
            continue
            
        # 3. 만약 정규화 일치는 안 되지만 유사한 상품명이 있는가?
        # 예: 핵심 키워드 일치 여부
        c8_all = pd.concat([c8, c8_oth])
        fuzzy_match = None
        for _, crow in c8_all.iterrows():
            c_clean = crow['clean_prod']
            # 공통 부분 확인 (한쪽이 다른 쪽을 70% 이상 포함하는지)
            if len(p_clean) >= 6 and len(c_clean) >= 6:
                if p_clean in c_clean or c_clean in p_clean:
                    fuzzy_match = crow['상품명']
                    break
                    
        all_missing.append({
            '시트': label,
            '유통사': ch,
            '사업자명': row['사업자명'],
            '사업자번호': row['사업자번호'],
            '7월 상품명': p_orig,
            '7월 판매건수': row['판매 건수'],
            '7월 매출액': row['매출액'],
            '7월 판촉액': row['판촉액'],
            '7월 품목분류': row['품목분류'],
            '유사매칭 상품(8월)': fuzzy_match if fuzzy_match else '(대응 상품 전무)',
            '판정': '상품명 변경 추정' if fuzzy_match else '8월 누적 완전 누락'
        })

df_m = pd.DataFrame(all_missing)
print(f"총 불일치 건수: {len(df_m)}건")
print(df_m['판정'].value_counts())
print("\n[유통사별 완전 누락 건수]")
print(df_m[df_m['판정'] == '8월 누적 완전 누락']['유통사'].value_counts())

print("\n[8월 누적 완전 누락 상세 목록]")
completely_missing = df_m[df_m['판정'] == '8월 누적 완전 누락']
for idx, r in completely_missing.iterrows():
    print(f"[{r['시트']}|{r['유통사']}] {r['사업자명']}({r['사업자번호']}) | {r['7월 상품명']} | 매출: {r['7월 매출액']:,}원, 건수: {r['7월 판매건수']}건, 쿠폰: {r['7월 판촉액']:,}원")
