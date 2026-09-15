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

def normalize_text(text):
    if pd.isna(text): return ''
    s = str(text).strip()
    # 원산지 태그 제거
    s = re.sub(r'\[원산지:[^\]]+\]', '', s)
    s = re.sub(r'\(원산지:[^\)]+\)', '', s)
    # 특수문자 및 공백 제거
    s = re.sub(r'[\s\(\)\[\]\-_,./+]+', '', s)
    return s.lower()

results = []

for label, sname in [('농산물', '①농산물raw'), ('유기농', '②유기농raw')]:
    r7 = pd.read_excel(f7, sheet_name=sname, skiprows=4)
    r8 = pd.read_excel(f8, sheet_name=sname, skiprows=4)
    r7.columns = [c.strip() for c in r7.columns]
    r8.columns = [c.strip() for c in r8.columns]
    
    r7['clean_biz'] = r7['사업자번호'].apply(clean_biz)
    r7['norm_name'] = r7['상품명'].apply(normalize_text)
    
    r8['clean_biz'] = r8['사업자번호'].apply(clean_biz)
    r8['norm_name'] = r8['상품명'].apply(normalize_text)
    
    for idx, row in r7.iterrows():
        ch = str(row['유통사명']).strip()
        biz = row['clean_biz']
        pname = str(row['상품명']).strip()
        norm_p = row['norm_name']
        sales7 = row['매출액'] or 0
        qty7 = row['판매 건수'] or 0
        coupon7 = row['판촉액'] or 0
        cat7 = str(row['품목분류']).strip()
        
        # 8월에서 동일 사업자 + 동일 채널 필터링
        cand = r8[(r8['clean_biz'] == biz) & (r8['유통사명'].str.strip() == ch)]
        
        # 1) 완전 정규화 일치
        match = cand[cand['norm_name'] == norm_p]
        
        if len(match) > 0:
            m_row = match.iloc[0]
            cat8 = str(m_row['품목분류']).strip()
            sales8 = m_row['매출액'] or 0
            qty8 = m_row['판매 건수'] or 0
            coupon8 = m_row['판촉액'] or 0
            
            # 실적 역전 체크
            if sales8 < sales7 or qty8 < qty7 or coupon8 < coupon7:
                results.append({
                    '시트': label,
                    '유형': '실적 역전 (누적 감소)',
                    '유통사': ch,
                    '사업자명': row['사업자명'],
                    '사업자번호': row['사업자번호'],
                    '7월 상품명': pname,
                    '8월 매칭 상품명': m_row['상품명'],
                    '7월 매출': sales7,
                    '8월 누적매출': sales8,
                    '차이(매출)': sales8 - sales7,
                    '7월 건수': qty7,
                    '8월 누적건수': qty8,
                    '7월 쿠폰': coupon7,
                    '8월 누적쿠폰': coupon8,
                    '비고': '8월 누적 실적이 7월보다 감소함 (환불/정산 반영)'
                })
            elif cat7 != cat8:
                results.append({
                    '시트': label,
                    '유형': '품목분류 변경',
                    '유통사': ch,
                    '사업자명': row['사업자명'],
                    '사업자번호': row['사업자번호'],
                    '7월 상품명': pname,
                    '8월 매칭 상품명': m_row['상품명'],
                    '7월 매출': sales7,
                    '8월 누적매출': sales8,
                    '차이(매출)': sales8 - sales7,
                    '7월 건수': qty7,
                    '8월 누적건수': qty8,
                    '7월 쿠폰': coupon7,
                    '8월 누적쿠폰': coupon8,
                    '비고': f"분류 변경: {cat7} -> {cat8}"
                })
        else:
            # 2) 부분 일치 또는 유사도 체크
            fuzzy_found = False
            for _, crow in cand.iterrows():
                c_norm = crow['norm_name']
                # 한쪽이 다른 쪽에 포함되거나 긴 공통 부분
                if norm_p in c_norm or c_norm in norm_p:
                    fuzzy_found = True
                    cat8 = str(crow['품목분류']).strip()
                    sales8 = crow['매출액'] or 0
                    qty8 = crow['판매 건수'] or 0
                    coupon8 = crow['판촉액'] or 0
                    
                    if sales8 < sales7:
                        results.append({
                            '시트': label,
                            '유형': '상품명변경+실적역전',
                            '유통사': ch,
                            '사업자명': row['사업자명'],
                            '사업자번호': row['사업자번호'],
                            '7월 상품명': pname,
                            '8월 매칭 상품명': crow['상품명'],
                            '7월 매출': sales7,
                            '8월 누적매출': sales8,
                            '차이(매출)': sales8 - sales7,
                            '7월 건수': qty7,
                            '8월 누적건수': qty8,
                            '7월 쿠폰': coupon7,
                            '8월 누적쿠폰': coupon8,
                            '비고': f"상품명 부분 변경 및 실적 역전"
                        })
                    else:
                        results.append({
                            '시트': label,
                            '유형': '상품명 표기 변경 (동일 상품 추정)',
                            '유통사': ch,
                            '사업자명': row['사업자명'],
                            '사업자번호': row['사업자번호'],
                            '7월 상품명': pname,
                            '8월 매칭 상품명': crow['상품명'],
                            '7월 매출': sales7,
                            '8월 누적매출': sales8,
                            '차이(매출)': sales8 - sales7,
                            '7월 건수': qty7,
                            '8월 누적건수': qty8,
                            '7월 쿠폰': coupon7,
                            '8월 누적쿠폰': coupon8,
                            '비고': f"상품명 변경: '{pname}' -> '{crow['상품명']}'"
                        })
                    break
            
            if not fuzzy_found:
                # 3) 완전히 매칭되지 않음 (누락 / 8월 데이터에서 증발)
                results.append({
                    '시트': label,
                    '유형': '8월 누적에서 완전 누락 (미존재)',
                    '유통사': ch,
                    '사업자명': row['사업자명'],
                    '사업자번호': row['사업자번호'],
                    '7월 상품명': pname,
                    '8월 매칭 상품명': '(없음)',
                    '7월 매출': sales7,
                    '8월 누적매출': 0,
                    '차이(매출)': -sales7,
                    '7월 건수': qty7,
                    '8월 누적건수': 0,
                    '7월 쿠폰': coupon7,
                    '8월 누적쿠폰': 0,
                    '비고': '7월에는 실적이 있었으나 8월 누적 로우데이터에서 상품 자체가 누락됨'
                })

df_res = pd.DataFrame(results)
print(f"총 검토 건수: {len(df_res)}")
print(df_res['유형'].value_counts())

print("\n=== [1] 8월 누적에서 완전 누락된 상품 목록 ===")
missing = df_res[df_res['유형'] == '8월 누적에서 완전 누락 (미존재)']
print(f"누락 건수: {len(missing)}건")
for idx, r in missing.iterrows():
    print(f"[{r['시트']}|{r['유통사']}] {r['사업자명']}({r['사업자번호']}) | {r['7월 상품명']} | 7월매출: {r['7월 매출']:,}원, {r['7월 건수']}건, 쿠폰: {r['7월 쿠폰']:,}원")

print("\n=== [2] 실적 역전 건 목록 ===")
revs = df_res[df_res['유형'].str.contains('역전')]
for idx, r in revs.iterrows():
    print(f"[{r['시트']}|{r['유통사']}] {r['사업자명']} | {r['7월 상품명']} -> 7월: {r['7월 매출']:,}원 / 8월누적: {r['8월 누적매출']:,}원 (차이: {r['차이(매출)']:,}원)")
