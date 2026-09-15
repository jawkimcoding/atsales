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

r7_agri = pd.read_excel(f7, sheet_name='①농산물raw', skiprows=4)
r8_agri = pd.read_excel(f8, sheet_name='①농산물raw', skiprows=4)
r7_org = pd.read_excel(f7, sheet_name='②유기농raw', skiprows=4)
r8_org = pd.read_excel(f8, sheet_name='②유기농raw', skiprows=4)

for df in [r7_agri, r8_agri, r7_org, r8_org]:
    df.columns = [c.strip() for c in df.columns]
    df['clean_biz'] = df['사업자번호'].apply(clean_biz)

# 8월 파일 전체에서 검색하는 헬퍼 함수
def search_in_8m(pname, biz, ch):
    res_agri = r8_agri[(r8_agri['clean_biz'] == biz)]
    res_org = r8_org[(r8_org['clean_biz'] == biz)]
    return res_agri, res_org

# 체크할 7월 상품들 (detailed_diff에서 누락 의심된 것들)
# 우선 농산물 의심 목록 조사
print("=== 농산물 7월 행 중 8월 대응 관계 전수 점검 ===")
count_missing_agri = 0
missing_list_agri = []

for idx, r7 in r7_agri.iterrows():
    biz = clean_biz(r7['사업자번호'])
    pname = str(r7['상품명']).strip()
    sales7 = r7['매출액'] or 0
    ch = str(r7['유통사명']).strip()
    
    # 8월 농산물 raw에서 해당 사업자 찾기
    c8 = r8_agri[(r8_agri['clean_biz'] == biz) & (r8_agri['유통사명'].str.strip() == ch)]
    
    # 완전히 동일한 상품명이 있는가?
    exact = c8[c8['상품명'].str.strip() == pname]
    if len(exact) > 0:
        continue
        
    # 원산지 제거 후 동일한가?
    pname_no_origin = re.sub(r'\[원산지:[^\]]+\]', '', pname).strip()
    match_no_origin = c8[c8['상품명'].str.strip() == pname_no_origin]
    if len(match_no_origin) > 0:
        continue
        
    # 특수문자/공백 제거 후 동일한가?
    p_norm = re.sub(r'[\s\(\)\[\]\-_,./+]+', '', pname_no_origin).lower()
    c8_norms = c8['상품명'].apply(lambda x: re.sub(r'[\s\(\)\[\]\-_,./+]+', '', re.sub(r'\[원산지:[^\]]+\]', '', str(x)).strip()).lower())
    match_norm = c8[c8_norms == p_norm]
    if len(match_norm) > 0:
        continue
        
    # 유기농 시트로 이동했는가?
    c8_org = r8_org[(r8_org['clean_biz'] == biz)]
    org_norms = c8_org['상품명'].apply(lambda x: re.sub(r'[\s\(\)\[\]\-_,./+]+', '', re.sub(r'\[원산지:[^\]]+\]', '', str(x)).strip()).lower())
    match_org = c8_org[org_norms == p_norm]
    if len(match_org) > 0:
        continue

    # 정말로 8월에 없는가?
    missing_list_agri.append((r7, c8['상품명'].tolist()))

print(f"농산물에서 8월 누적 데이터에 이름 매칭이 전혀 안 되는 7월 상품 건수: {len(missing_list_agri)}건")
for r7, cands in missing_list_agri:
    print(f"\n- 유통사: {r7['유통사명']} | 사업자: {r7['사업자명']}({r7['사업자번호']})")
    print(f"  7월 상품명: {r7['상품명']}")
    print(f"  7월 실적: {r7['판매 건수']}건, 매출: {r7['매출액']:,}원, 쿠폰: {r7['판촉액']:,}원")
    print(f"  8월 해당 사업자의 등록 상품들: {cands[:5]}")
