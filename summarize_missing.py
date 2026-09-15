import sys
import io
import pandas as pd

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

df = pd.read_csv('missing_products_summary.csv', encoding='utf-8-sig')

print("=================================================================")
print("1. [유통사별 누락 건수 및 실적 합계]")
print("=================================================================")
grouped = df.groupby('유통사').agg(
    품목수=('7월 상품명', 'count'),
    판매수량=('7월 판매건수', 'sum'),
    매출액=('7월 매출액', 'sum'),
    쿠폰액=('7월 판촉액(쿠폰)', 'sum')
)
grouped.loc['합 계'] = grouped.sum()
for col in ['품목수', '판매수량', '매출액', '쿠폰액']:
    grouped[col] = grouped[col].map('{:,.0f}'.format)
print(grouped)

print("\n=================================================================")
print("2. [매출액 기준 상위 누락 품목 (Top 20)]")
print("=================================================================")
top20 = df.sort_values(by='7월 매출액', ascending=False).head(20)
for idx, (_, r) in enumerate(top20.iterrows(), 1):
    print(f"{idx:2d}. [{r['유통사']}] {r['사업자명']} ({r['사업자등록번호']})")
    print(f"    - 7월 상품명: {r['7월 상품명']}")
    print(f"    - 7월 실적: {r['7월 판매건수']}건 | 매출액: {r['7월 매출액']:,}원 | 판촉액: {r['7월 판촉액(쿠폰)']:,}원")

print("\n=================================================================")
print("3. [매출액 0원(미발생) 단순 등록 누락 품목]")
print("=================================================================")
zero_sales = df[df['7월 매출액'] == 0]
print(f"7월 매출 0원인 단순 상품 누락: {len(zero_sales)}건")
print(f"7월 실제 매출/실적 발생 누락 품목: {len(df) - len(zero_sales)}건")
print(f"  -> 실제 매출 발생 누락 품목의 총 매출액: {df[df['7월 매출액'] > 0]['7월 매출액'].sum():,}원")
print(f"  -> 실제 매출 발생 누락 품목의 총 쿠폰액: {df[df['7월 매출액'] > 0]['7월 판촉액(쿠폰)'].sum():,}원")
print(f"  -> 실제 매출 발생 누락 품목의 총 판매건수: {df[df['7월 매출액'] > 0]['7월 판매건수'].sum():,}건")
