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

def clean_name(val):
    if pd.isna(val): return ''
    s = str(val).strip()
    # 원산지 태그 제거 ex: [원산지:국산...]
    s = re.sub(r'\[원산지:[^\]]+\]', '', s)
    s = re.sub(r'\s+', ' ', s).strip()
    return s

print("=================================================================")
print("1. [업체 시트 비교] 농산물업체(286개) 및 유기농업체(56개)")
print("=================================================================")
for sname in ['농산물업체', '유기농업체']:
    df7 = pd.read_excel(f7, sheet_name=sname, skiprows=1)
    df8 = pd.read_excel(f8, sheet_name=sname, skiprows=1)
    
    biz7 = set(df7['사업자등록번호'].dropna().apply(clean_biz))
    biz8 = set(df8['사업자등록번호'].dropna().apply(clean_biz))
    
    diff7_8 = biz7 - biz8
    diff8_7 = biz8 - biz7
    print(f"[{sname}] 7월 업체수: {len(biz7)}, 8월 업체수: {len(biz8)}")
    print(f"  - 7월에만 있고 8월에 없는 업체: {len(diff7_8)}건 -> {diff7_8}")
    print(f"  - 8월에만 있고 7월에 없는 업체: {len(diff8_7)}건 -> {diff8_7}")

print("\n=================================================================")
print("2. [Raw 데이터 사업자 레벨 비교]")
print("=================================================================")
for label, sname in [('농산물', '①농산물raw'), ('유기농', '②유기농raw')]:
    r7 = pd.read_excel(f7, sheet_name=sname, skiprows=4)
    r8 = pd.read_excel(f8, sheet_name=sname, skiprows=4)
    r7.columns = [c.strip() for c in r7.columns]
    r8.columns = [c.strip() for c in r8.columns]
    
    biz7_raw = set(r7['사업자번호'].dropna().apply(clean_biz))
    biz8_raw = set(r8['사업자번호'].dropna().apply(clean_biz))
    
    diff_biz = biz7_raw - biz8_raw
    print(f"[{label} raw] 7월 실적 사업자수: {len(biz7_raw)}, 8월 누적 실적 사업자수: {len(biz8_raw)}")
    print(f"  - 7월 raw에 있었으나 8월 raw에 사업자번호 자체가 완전히 사라진 업체: {len(diff_biz)}건")
    if diff_biz:
        for b in diff_biz:
            rows = r7[r7['사업자번호'].apply(clean_biz) == b]
            print(f"    * 사업자번호: {b}, 업체명: {rows['사업자명'].iloc[0]}, 유통사: {list(rows['유통사명'].unique())}, 7월 매출: {rows['매출액'].sum():,}")
