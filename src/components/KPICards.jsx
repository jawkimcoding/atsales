import React from 'react';
import { DollarSign, ShoppingCart, Ticket, TrendingUp, AlertCircle } from 'lucide-react';

export default function KPICards({ currentMonth, data, couponAssigned }) {
  const sales = data.table3[currentMonth]?.["총 계"] || 0;
  const coupon = data.table2[currentMonth]?.["총 계"] || 0;
  const count = data.table4[currentMonth]?.["총 계"] || 0;
  
  const cumCoupon = data.table2["누적"]?.["총 계"] || 0;
  const assignedTotal = couponAssigned["총 계"];
  const remainCoupon = assignedTotal - cumCoupon;
  const burnRate = ((cumCoupon / assignedTotal) * 100).toFixed(1);

  const prevSales = data.table3["7월"]?.["총 계"] || 0;
  const salesGrowth = prevSales > 0 && currentMonth === "8월" ? (((sales - prevSales) / prevSales) * 100).toFixed(1) : null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            {currentMonth} 총 매출액
          </span>
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl font-black text-slate-900">
            {sales.toLocaleString()} <span className="text-sm font-semibold text-slate-500">원</span>
          </div>
          {salesGrowth && (
            <div className="flex items-center gap-1 mt-1 text-xs font-semibold text-emerald-600">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>전월(7월) 대비 +{salesGrowth}% 성장</span>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            {currentMonth} 쿠폰 사용액
          </span>
          <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
            <Ticket className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl font-black text-slate-900">
            {coupon.toLocaleString()} <span className="text-sm font-semibold text-slate-500">원</span>
          </div>
          <div className="text-xs text-slate-500 mt-1">
            누적 집행액: {cumCoupon.toLocaleString()}원
          </div>
        </div>
      </div>

      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            쿠폰 소진율 & 잔여 예산
          </span>
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <AlertCircle className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-3">
          <div className="flex items-baseline justify-between">
            <div className="text-2xl font-black text-slate-900">
              {burnRate}%
            </div>
            <span className="text-xs font-semibold text-slate-500">
              잔여 {remainCoupon.toLocaleString()}원
            </span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2 mt-2 overflow-hidden">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(burnRate, 100)}%` }}
            />
          </div>
        </div>
      </div>

      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            {currentMonth} 판매 건수
          </span>
          <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <ShoppingCart className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl font-black text-slate-900">
            {count.toLocaleString()} <span className="text-sm font-semibold text-slate-500">건</span>
          </div>
          <div className="text-xs text-slate-500 mt-1">
            누적 판매: {(data.table4["누적"]?.["총 계"] || 0).toLocaleString()}건
          </div>
        </div>
      </div>
    </div>
  );
}
