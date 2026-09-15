import sys
import io
import re
import pandas as pd

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

f7 = '(aT&KPC) 실적취합양식_2026 aT농산물온라인마케터_분석(7월)_참여업체만 반영_수정(발송).xlsx'
f8 = '(aT&KPC) 실적취합양식_2026 aT농산물온라인마케터_분석(8월).xlsx'

# 1. 청라 케이스 확인
r7_agri = pd.read_excel(f7, sheet_name='①농산물raw', skiprows=4)
r8_agri = pd.read_excel(f8, sheet_name='①농산물raw', skiprows=4)
r7_agri.columns = [c.strip() for c in r7_agri.columns]
r8_agri.columns = [c.strip() for c in r8_agri.columns]

print("=== [청라] 7월 vs 8월 로우데이터 비교 ===")
print("7월 청라:")
c7 = r7_agri[r7_agri['사업자명'].astype(str).str.contains('청라', na=False)]
for idx, r in c7.iterrows():
    print(f"  7월: {r['유통사명']} | {r['상품명']} | 건수:{r['판매 건수']}, 매출:{r['매출액']:,}, 판촉:{r['판촉액']:,}")

print("8월 청라:")
c8 = r8_agri[r8_agri['사업자명'].astype(str).str.contains('청라', na=False)]
for idx, r in c8.iterrows():
    print(f"  8월: {r['유통사명']} | {r['상품명']} | 건수:{r['판매 건수']}, 매출:{r['매출액']:,}, 판촉:{r['판촉액']:,}")

print("\n=== [초림단지묵] 7월 vs 8월 비교 ===")
print("7월 초림단지묵:")
c7 = r7_agri[r7_agri['사업자명'].astype(str).str.contains('초림단지묵', na=False)]
for idx, r in c7.iterrows():
    print(f"  7월: {r['유통사명']} | {r['상품명']} | 건수:{r['판매 건수']}, 매출:{r['매출액']:,}, 판촉:{r['판촉액']:,}")

print("8월 초림단지묵:")
c8 = r8_agri[r8_agri['사업자명'].astype(str).str.contains('초림단지묵', na=False)]
for idx, r in c8.iterrows():
    print(f"  8월: {r['유통사명']} | {r['상품명']} | 건수:{r['판매 건수']}, 매출:{r['매출액']:,}, 판촉:{r['판촉액']:,}")

print("\n=== [아그데뜰] 7월 vs 8월 비교 ===")
r7_org = pd.read_excel(f7, sheet_name='②유기농raw', skiprows=4)
r8_org = pd.read_excel(f8, sheet_name='②유기농raw', skiprows=4)
r7_org.columns = [c.strip() for c in r7_org.columns]
r8_org.columns = [c.strip() for c in r8_org.columns]

c7 = r7_org[r7_org['사업자명'].astype(str).str.contains('아그데뜰', na=False)]
for idx, r in c7.iterrows():
    print(f"  7월: {r['유통사명']} | {r['상품명']} | 건수:{r['판매 건수']}, 매출:{r['매출액']:,}, 판촉:{r['판촉액']:,}")
c8 = r8_org[r8_org['사업자명'].astype(str).str.contains('아그데뜰', na=False)]
for idx, r in c8.iterrows():
    print(f"  8월: {r['유통사명']} | {r['상품명']} | 건수:{r['판매 건수']}, 매출:{r['매출액']:,}, 판촉:{r['판촉액']:,}")

print("\n=== [새나라] 7월 vs 8월 비교 ===")
c7 = r7_agri[r7_agri['사업자명'].astype(str).str.contains('새나라', na=False)]
for idx, r in c7.iterrows():
    print(f"  7월: {r['유통사명']} | {r['상품명']} | 건수:{r['판매 건수']}, 매출:{r['매출액']:,}, 판촉:{r['판촉액']:,}")
c8 = r8_agri[r8_agri['사업자명'].astype(str).str.contains('새나라', na=False)]
for idx, r in c8.iterrows():
    print(f"  8월: {r['유통사명']} | {r['상품명']} | 건수:{r['판매 건수']}, 매출:{r['매출액']:,}, 판촉:{r['판촉액']:,}")

print("\n=== [가남농원] 7월 vs 8월 비교 ===")
c7 = r7_agri[r7_agri['사업자명'].astype(str).str.contains('가남농원', na=False)]
for idx, r in c7.iterrows():
    print(f"  7월: {r['유통사명']} | {r['상품명']} | 건수:{r['판매 건수']}, 매출:{r['매출액']:,}, 판촉:{r['판촉액']:,}")
c8 = r8_agri[r8_agri['사업자명'].astype(str).str.contains('가남농원', na=False)]
for idx, r in c8.iterrows():
    print(f"  8월: {r['유통사명']} | {r['상품명']} | 건수:{r['판매 건수']}, 매출:{r['매출액']:,}, 판촉:{r['판촉액']:,}")
