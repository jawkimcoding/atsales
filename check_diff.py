import sys
import io
import pandas as pd

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

f7 = '(aT&KPC) 실적취합양식_2026 aT농산물온라인마케터_분석(7월)_참여업체만 반영_수정(발송).xlsx'
f8 = '(aT&KPC) 실적취합양식_2026 aT농산물온라인마케터_분석(8월).xlsx'

def clean_str(val):
    if pd.isna(val):
        return ''
    return str(val).strip().replace(' ', '').replace('-', '')

for name, sname in [('농산물', '①농산물raw'), ('유기농', '②유기농raw')]:
    r7 = pd.read_excel(f7, sheet_name=sname, skiprows=4)
    r8 = pd.read_excel(f8, sheet_name=sname, skiprows=4)
    
    r7.columns = [c.strip() for c in r7.columns]
    r8.columns = [c.strip() for c in r8.columns]
    
    print(f'================ {name} ({sname}) ================')
    
    # 1. key: 유통사 + 사업자번호 + 상품명
    r7['clean_biz'] = r7['사업자번호'].apply(clean_str)
    r7['clean_prod'] = r7['상품명'].apply(clean_str)
    r7['clean_ch'] = r7['유통사명'].apply(clean_str)
    r7['key'] = r7['clean_ch'] + '||' + r7['clean_biz'] + '||' + r7['clean_prod']
    
    r8['clean_biz'] = r8['사업자번호'].apply(clean_str)
    r8['clean_prod'] = r8['상품명'].apply(clean_str)
    r8['clean_ch'] = r8['유통사명'].apply(clean_str)
    r8['key'] = r8['clean_ch'] + '||' + r8['clean_biz'] + '||' + r8['clean_prod']
    
    keys7 = set(r7['key'])
    keys8 = set(r8['key'])
    
    diff = keys7 - keys8
    print(f'7월 고유키 수: {len(keys7)}, 8월 고유키 수: {len(keys8)}')
    print(f'7월에는 있지만 8월에는 없는 키 개수: {len(diff)}')
    
    if len(diff) > 0:
        missing_df = r7[r7['key'].isin(diff)]
        print(f'--- [7월에는 있지만 8월에 정확히 매칭 안 되는 행들: 총 {len(missing_df)}건] ---')
        for idx, row in missing_df.iterrows():
            print(f"유통사: {row['유통사명']} | 사업자: {row['사업자명']}({row['사업자번호']}) | 상품명: {row['상품명']} | 매출: {row['매출액']} | 건수: {row['판매 건수']}")
            
            # 8월에 유사한 상품이 있는지 검색
            cand = r8[(r8['clean_ch'] == row['clean_ch']) & (r8['clean_biz'] == row['clean_biz'])]
            if len(cand) > 0:
                print(f"   ㄴ [8월 동일 사업자 상품 목록 ({len(cand)}건)]:")
                for _, crow in cand.iterrows():
                    print(f"      - {crow['상품명']} (매출: {crow['매출액']}, 건수: {crow['판매 건수']}, 분류: {crow['품목분류']})")
            else:
                # 사업자명으로 검색
                cand2 = r8[r8['사업자명'] == row['사업자명']]
                if len(cand2) > 0:
                    print(f"   ㄴ [8월 동일 사업자명(번호다름) 검색 ({len(cand2)}건)]:")
                    for _, crow in cand2.iterrows():
                        print(f"      - {crow['상품명']} ({crow['사업자번호']})")
                else:
                    print(f"   ㄴ [8월에 사업자 자체를 찾을 수 없음]")
