import sys
import io
import pandas as pd
from final_audit import missing_df

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

print(f"=== 8월 누적 완전 누락 건 총 {len(missing_df)}건 ===")
for idx, r in missing_df.reset_index().iterrows():
    print(f"{idx+1}. [{r['구분']}|{r['유통사']}] {r['사업자명']} | {r['7월 상품명']} | 건수: {r['7월 판매건수']}건 | 매출: {r['7월 매출액']:,}원 | 쿠폰: {r['7월 판촉액']:,}원")
