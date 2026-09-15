import sys
import io
import pandas as pd

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

f8 = '(aT&KPC) 실적취합양식_2026 aT농산물온라인마케터_분석(8월).xlsx'
f7 = '(aT&KPC) 실적취합양식_2026 aT농산물온라인마케터_분석(7월)_참여업체만 반영_수정(발송).xlsx'

r7 = pd.read_excel(f7, sheet_name='①농산물raw', skiprows=4)
r8 = pd.read_excel(f8, sheet_name='①농산물raw', skiprows=4)
r7.columns = [c.strip() for c in r7.columns]
r8.columns = [c.strip() for c in r8.columns]

print("=== [여주시농협] 7월 상품 목록 ===")
c7 = r7[r7['사업자명'].astype(str).str.contains('여주시농협')]
for idx, r in c7.iterrows():
    print(f"7월: {r['상품명']} | 건수:{r['판매 건수']}, 매출:{r['매출액']:,}, 쿠폰:{r['판촉액']:,}")

print("\n=== [여주시농협] 8월 상품 목록 ===")
c8 = r8[r8['사업자명'].astype(str).str.contains('여주시농협')]
for idx, r in c8.iterrows():
    print(f"8월: {r['상품명']} | 건수:{r['판매 건수']}, 매출:{r['매출액']:,}, 쿠폰:{r['판촉액']:,}")

print("\n=== [별마루농원] 7월 vs 8월 ===")
c7 = r7[r7['사업자명'].astype(str).str.contains('별마루')]
for idx, r in c7.iterrows():
    print(f"7월: {r['상품명']} | 건수:{r['판매 건수']}, 매출:{r['매출액']:,}, 쿠폰:{r['판촉액']:,}")
c8 = r8[r8['사업자명'].astype(str).str.contains('별마루')]
for idx, r in c8.iterrows():
    print(f"8월: {r['상품명']} | 건수:{r['판매 건수']}, 매출:{r['매출액']:,}, 쿠폰:{r['판촉액']:,}")

print("\n=== [운림가] 7월 vs 8월 ===")
c7 = r7[r7['사업자명'].astype(str).str.contains('운림가')]
for idx, r in c7.iterrows():
    print(f"7월: {r['상품명']} | 건수:{r['판매 건수']}, 매출:{r['매출액']:,}, 쿠폰:{r['판촉액']:,}")
c8 = r8[r8['사업자명'].astype(str).str.contains('운림가')]
for idx, r in c8.iterrows():
    print(f"8월: {r['상품명']} | 건수:{r['판매 건수']}, 매출:{r['매출액']:,}, 쿠폰:{r['판촉액']:,}")
