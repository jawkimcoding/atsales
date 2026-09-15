import sys
import io
import pandas as pd

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

f7 = '(aT&KPC) 실적취합양식_2026 aT농산물온라인마케터_분석(7월)_참여업체만 반영_수정(발송).xlsx'
f8 = '(aT&KPC) 실적취합양식_2026 aT농산물온라인마케터_분석(8월).xlsx'

r7 = pd.read_excel(f7, sheet_name='②유기농raw', skiprows=4)
r8 = pd.read_excel(f8, sheet_name='②유기농raw', skiprows=4)
r7.columns = [c.strip() for c in r7.columns]
r8.columns = [c.strip() for c in r8.columns]

print('=== [참식품주식회사] 7월 상품 목록 ===')
for idx, r in r7[r7['사업자명'].astype(str).str.contains('참식품')].iterrows():
    print(f"  7월: {r['상품명']} | 건수:{r['판매 건수']}, 매출:{r['매출액']:,}")

print('\n=== [참식품주식회사] 8월 상품 목록 ===')
for idx, r in r8[r8['사업자명'].astype(str).str.contains('참식품')].iterrows():
    print(f"  8월: {r['상품명']} | 건수:{r['판매 건수']}, 매출:{r['매출액']:,}")

print('\n=== [나무컴퍼니] 7월 상품 목록 ===')
for idx, r in r7[r7['사업자명'].astype(str).str.contains('나무컴퍼니')].iterrows():
    print(f"  7월: {r['상품명']} | 건수:{r['판매 건수']}, 매출:{r['매출액']:,}")

print('\n=== [나무컴퍼니] 8월 상품 목록 ===')
for idx, r in r8[r8['사업자명'].astype(str).str.contains('나무컴퍼니')].iterrows():
    print(f"  8월: {r['상품명']} | 건수:{r['판매 건수']}, 매출:{r['매출액']:,}")
