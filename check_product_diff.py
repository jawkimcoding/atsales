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

def clean_prod(val):
    if pd.isna(val): return ''
    s = str(val).strip()
    # 원산지 태그 제거 ex: [원산지:국산...] 또는 (원산지:...)
    s = re.sub(r'\[원산지:[^\]]+\]', '', s)
    s = re.sub(r'\(원산지:[^\)]+\)', '', s)
    s = re.sub(r'\s+', ' ', s).strip()
    # 괄호 등 세부 정규화
    s = s.replace(' ', '')
    return s

def clean_ch(val):
    if pd.isna(val): return ''
    s = str(val).strip().replace(' ', '')
    if '롯데' in s: return '롯데ON'
    if '네이버' in s: return '네이버'
    if '지마켓' in s or 'G마켓' in s: return '지마켓'
    if '온누리' in s: return '온누리마켓'
    if '농가' in s: return '농가살리기'
    if '오아시스' in s: return '오아시스'
    return s

for label, sname in [('농산물', '①농산물raw'), ('유기농', '②유기농raw')]:
    r7 = pd.read_excel(f7, sheet_name=sname, skiprows=4)
    r8 = pd.read_excel(f8, sheet_name=sname, skiprows=4)
    r7.columns = [c.strip() for c in r7.columns]
    r8.columns = [c.strip() for c in r8.columns]
    
    print(f"\n=================================================================")
    print(f"[{label} ({sname})] 상세 상품 매칭 및 실적 대조 (7월: {len(r7)}행 vs 8월: {len(r8)}행)")
    print(f"=================================================================")
    
    r7['clean_biz'] = r7['사업자번호'].apply(clean_biz)
    r7['clean_prod'] = r7['상품명'].apply(clean_prod)
    r7['clean_ch'] = r7['유통사명'].apply(clean_ch)
    r7['key'] = r7['clean_ch'] + '||' + r7['clean_biz'] + '||' + r7['clean_prod']
    
    r8['clean_biz'] = r8['사업자번호'].apply(clean_biz)
    r8['clean_prod'] = r8['상품명'].apply(clean_prod)
    r8['clean_ch'] = r8['유통사명'].apply(clean_ch)
    r8['key'] = r8['clean_ch'] + '||' + r8['clean_biz'] + '||' + r8['clean_prod']
    
    # 1단계: key 기준 매칭
    keys8 = set(r8['key'])
    unmatched_7 = []
    matched_cases = []
    
    for idx, row in r7.iterrows():
        k = row['key']
        if k in keys8:
            # 8월 행 찾기
            r8_match = r8[r8['key'] == k]
            matched_cases.append((row, r8_match))
        else:
            unmatched_7.append(row)
            
    print(f"1) 완전/정규화 키 일치: {len(r7) - len(unmatched_7)}건 / {len(r7)}건")
    print(f"2) 1차 미매칭(불일치 의심): {len(unmatched_7)}건")
    
    # 2단계: 미매칭 건 중 동일 유통사 + 동일 사업자 내에서 상품명 유사도 매칭 시도
    still_missing = []
    fuzzy_matched = []
    
    for row in unmatched_7:
        ch = row['clean_ch']
        biz = row['clean_biz']
        pname_orig = str(row['상품명']).strip()
        pname_clean = row['clean_prod']
        
        cands = r8[(r8['clean_ch'] == ch) & (r8['clean_biz'] == biz)]
        if len(cands) == 0:
            still_missing.append((row, "동일 유통사/사업자 상품 전무", []))
        else:
            # 부분 문자열 매칭 시도
            found = False
            sim_list = []
            for _, crow in cands.iterrows():
                c_pname_clean = crow['clean_prod']
                # 공통 글자 수 확인 또는 포함 여부
                if pname_clean in c_pname_clean or c_pname_clean in pname_clean:
                    fuzzy_matched.append((row, crow, "부분포함 매칭"))
                    found = True
                    break
                else:
                    sim_list.append(crow['상품명'])
            if not found:
                still_missing.append((row, "유사상품 없음", sim_list))
                
    print(f"   ㄴ 유사/부분포함 매칭 성공: {len(fuzzy_matched)}건")
    print(f"   ㄴ 8월에 전혀 대응 상품이 없는 완전 미매칭: {len(still_missing)}건")
    
    if len(still_missing) > 0:
        print("\n   [*** 8월에서 완전히 누락/사라진 7월 상품 목록 ***]")
        for row, reason, sims in still_missing:
            print(f"   * [{row['유통사명']}] 사업자: {row['사업자명']}({row['사업자번호']})")
            print(f"     7월 상품명: {row['상품명']}")
            print(f"     7월 실적: 판매건수={row['판매 건수']}, 매출액={row['매출액']:,}, 판촉액={row['판촉액']:,}")
            print(f"     사유: {reason}")
            if sims:
                print(f"     (참고: 8월 해당사업자 상품들: {sims[:3]})")
                
    # 3단계: 매칭된 건들 중 8월 누적 실적이 7월보다 줄어든(역전) 건 조사!
    print("\n3) [실적 역전 검사] 7월 실적 > 8월 누적 실적 (누적치가 오히려 감소한 건)")
    reversals = []
    for row, r8_match in matched_cases:
        r8_row = r8_match.iloc[0]
        sales7 = row['매출액'] or 0
        sales8 = r8_row['매출액'] or 0
        qty7 = row['판매 건수'] or 0
        qty8 = r8_row['판매 건수'] or 0
        coupon7 = row['판촉액'] or 0
        coupon8 = r8_row['판촉액'] or 0
        
        if sales8 < sales7 or qty8 < qty7 or coupon8 < coupon7:
            reversals.append({
                '유통사': row['유통사명'],
                '사업자': row['사업자명'],
                '사업자번호': row['사업자번호'],
                '상품명': row['상품명'],
                '7월매출': sales7,
                '8월매출': sales8,
                '매출차이': sales8 - sales7,
                '7월건수': qty7,
                '8월건수': qty8,
                '건수차이': qty8 - qty7,
                '7월쿠폰': coupon7,
                '8월쿠폰': coupon8,
                '쿠폰차이': coupon8 - coupon7
            })
            
    print(f"   ㄴ 역전(마이너스) 발생 건수: {len(reversals)}건")
    for rev in reversals:
        print(f"   * [{rev['유통사']}] {rev['사업자']} | {rev['상품명']}")
        print(f"     매출: 7월 {rev['7월매출']:,} -> 8월누적 {rev['8월매출']:,} (차이: {rev['매출차이']:,})")
        print(f"     건수: 7월 {rev['7월건수']} -> 8월누적 {rev['8월건수']} (차이: {rev['건수차이']})")
        print(f"     쿠폰: 7월 {rev['7월쿠폰']:,} -> 8월누적 {rev['8월쿠폰']:,} (차이: {rev['쿠폰차이']:,})")
