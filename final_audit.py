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

# 7월 및 8월 로우데이터 로드
raw7_agri = pd.read_excel(f7, sheet_name='①농산물raw', skiprows=4)
raw8_agri = pd.read_excel(f8, sheet_name='①농산물raw', skiprows=4)
raw7_org = pd.read_excel(f7, sheet_name='②유기농raw', skiprows=4)
raw8_org = pd.read_excel(f8, sheet_name='②유기농raw', skiprows=4)

for df in [raw7_agri, raw8_agri, raw7_org, raw8_org]:
    df.columns = [c.strip() for c in df.columns]
    df['clean_biz'] = df['사업자번호'].apply(clean_biz)
    df['clean_prod'] = df['상품명'].apply(clean_str)

# 8월 전체 로우데이터 합본
raw8_all = pd.concat([raw8_agri, raw8_org])

# 알려진 상품명 리뉴얼/변경 패턴 매핑
# (7월 상품 -> 8월 상품 매핑 딕셔너리 또는 규칙)
renamed_patterns = {
    '참식품주식회사': '전국김치품평회 4회수상',
    '농업회사법인 나무컴퍼니 주식회사': '25년산 -> 26년산 연도 변경 및 호라산밀 리뉴얼',
    '땅끝사랑농원': '땅끝사랑농원 브랜드명 및 당일수확 문구 리뉴얼',
    '풀무리농장': '풀무리농장 당일수확 친환경 유기농토마토',
}

analysis_records = []

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
        
        # 8월 해당 사업자 & 유통사 상품들
        c8 = raw8_all[(raw8_all['clean_biz'] == biz) & (raw8_all['유통사명'].str.strip() == ch)]
        
        # 1. 완전 정규화 일치 여부
        exact_match = c8[c8['clean_prod'] == p_clean]
        if len(exact_match) > 0:
            m = exact_match.iloc[0]
            if m['매출액'] < sales or m['판매 건수'] < qty or m['판촉액'] < coupon:
                analysis_records.append({
                    '구분': label,
                    '유형': '실적 역전 (누적 감소)',
                    '유통사': ch,
                    '사업자명': b_name,
                    '사업자번호': row['사업자번호'],
                    '7월 상품명': p_orig,
                    '8월 누적 상품명': m['상품명'],
                    '7월 판매건수': qty,
                    '7월 매출액': sales,
                    '7월 판촉액': coupon,
                    '8월 누적매출': m['매출액'],
                    '차이(매출)': m['매출액'] - sales,
                    '원인 분석': '누적 집계 시 주문취소/반품/정산 차감 반영'
                })
            continue
            
        # 2. 리뉴얼/상품명 수정 업체인지 검사
        is_renamed = False
        renamed_reason = ''
        target_m = None
        
        if '참식품' in b_name:
            # 포기김치, 백김치, 깍두기 규격 매칭
            for _, crow in c8.iterrows():
                # 용량(1kg, 3kg, 5kg, 10kg) 및 종류(포기, 백김치, 깍두기) 일치 여부
                for kind in ['포기김치', '백김치', '깍두기']:
                    for weight in ['1kg', '3kg', '5kg', '10kg']:
                        if (kind in p_orig and weight in p_orig) and (kind in crow['상품명'] and weight in crow['상품명']):
                            is_renamed = True
                            renamed_reason = '상품명 리뉴얼([전국김치품평회 4회수상] 문구 추가)'
                            target_m = crow
                            break
        elif '나무컴퍼니' in b_name:
            for _, crow in c8.iterrows():
                # 품목 키워드 비교 (호라산밀/귀리/현미/기장/찰보리 등)
                for grain in ['호라산밀', '귀리', '현미', '기장', '찰보리', '서리태', '바나듐', '흑미', '찹쌀', '강황', '수수', '차조', '오트밀', '즉석밥']:
                    if grain in p_clean and grain in crow['clean_prod']:
                        is_renamed = True
                        renamed_reason = '연도 표기 변경(25년산->26년산) 및 규격 리뉴얼'
                        target_m = crow
                        break
        elif '땅끝사랑농원' in b_name:
            for _, crow in c8.iterrows():
                for weight in ['1k', '2k', '3k', '4k']:
                    if weight in p_clean and weight in crow['clean_prod']:
                        is_renamed = True
                        renamed_reason = '상품명 리뉴얼(당일수확 문구 및 브랜드명 정비)'
                        target_m = crow
                        break
        elif '풀무리농장' in b_name:
            is_renamed = True
            renamed_reason = '유기농토마토 규격/옵션 정비'
            target_m = c8.iloc[0] if len(c8) > 0 else None
            
        if is_renamed and target_m is not None:
            analysis_records.append({
                '구분': label,
                '유형': '상품명 수정 (실적 누적 지속)',
                '유통사': ch,
                '사업자명': b_name,
                '사업자번호': row['사업자번호'],
                '7월 상품명': p_orig,
                '8월 누적 상품명': target_m['상품명'],
                '7월 판매건수': qty,
                '7월 매출액': sales,
                '7월 판촉액': coupon,
                '8월 누적매출': target_m['매출액'],
                '차이(매출)': target_m['매출액'] - sales,
                '원인 분석': renamed_reason
            })
            continue
            
        # 3. 그 외 유사 매칭 시도
        fuzzy_match = None
        for _, crow in c8.iterrows():
            c_clean = crow['clean_prod']
            if len(p_clean) >= 6 and (p_clean in c_clean or c_clean in p_clean):
                fuzzy_match = crow
                break
                
        if fuzzy_match is not None:
            analysis_records.append({
                '구분': label,
                '유형': '상품명 표기 미세수정',
                '유통사': ch,
                '사업자명': b_name,
                '사업자번호': row['사업자번호'],
                '7월 상품명': p_orig,
                '8월 누적 상품명': fuzzy_match['상품명'],
                '7월 판매건수': qty,
                '7월 매출액': sales,
                '7월 판촉액': coupon,
                '8월 누적매출': fuzzy_match['매출액'],
                '차이(매출)': fuzzy_match['매출액'] - sales,
                '원인 분석': '특수문자/띄어쓰기/원산지 표기 차이'
            })
        else:
            # 4. 정말로 8월에 없는 상품 (완전 누락 / 판매 중단 / 옵션 삭제)
            analysis_records.append({
                '구분': label,
                '유형': '8월 누적에서 완전 누락 (미존재)',
                '유통사': ch,
                '사업자명': b_name,
                '사업자번호': row['사업자번호'],
                '7월 상품명': p_orig,
                '8월 누적 상품명': '(8월 로우데이터 미존재)',
                '7월 판매건수': qty,
                '7월 매출액': sales,
                '7월 판촉액': coupon,
                '8월 누적매출': 0,
                '차이(매출)': -sales,
                '원인 분석': '스마트스토어 단품 삭제/품절 또는 기획전 연동 제외로 8월 취합 누락'
            })

df_final = pd.DataFrame(analysis_records)
print("=== 최종 분석 결과 요약 ===")
print(df_final['유형'].value_counts())

print("\n=== [1] 8월 누적 완전 누락 건 (총 목록) ===")
missing_df = df_final[df_final['유형'] == '8월 누적에서 완전 누락 (미존재)']
print(f"건수: {len(missing_df)}건")
print(missing_df[['구분', '유통사', '사업자명', '7월 상품명', '7월 판매건수', '7월 매출액', '7월 판촉액', '원인 분석']].to_string())

print("\n=== [2] 실적 역전 건 ===")
rev_df = df_final[df_final['유형'] == '실적 역전 (누적 감소)']
print(f"건수: {len(rev_df)}건")
print(rev_df[['구분', '유통사', '사업자명', '7월 상품명', '7월 매출액', '8월 누적매출', '차이(매출)']].to_string())
