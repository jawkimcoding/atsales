import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';
import { CHANNELS, CATEGORIES } from '../data/initialData';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

export default function ChartsSection({ currentMonth, data }) {
  const salesByChannel = CHANNELS.map(ch => data.table3[currentMonth]?.[ch] || 0);
  const couponByChannel = CHANNELS.map(ch => data.table2[currentMonth]?.[ch] || 0);

  const barData = {
    labels: CHANNELS,
    datasets: [
      {
        label: '매출액 (원)',
        data: salesByChannel,
        backgroundColor: 'rgba(16, 185, 129, 0.85)',
        borderRadius: 6
      },
      {
        label: '쿠폰 사용액 (원)',
        data: couponByChannel,
        backgroundColor: 'rgba(245, 158, 11, 0.85)',
        borderRadius: 6
      }
    ]
  };

  const salesByCat = CATEGORIES.map(cat => data.table6[cat]?.[currentMonth]?.["소 계"] || 0);

  const pieData = {
    labels: CATEGORIES,
    datasets: [
      {
        data: salesByCat,
        backgroundColor: ['#10B981', '#F43F5E', '#6366F1'],
        borderWidth: 2,
        borderColor: '#ffffff'
      }
    ]
  };

  const sales7 = CHANNELS.map(ch => data.table3["7월"]?.[ch] || 0);
  const sales8 = CHANNELS.map(ch => data.table3["8월"]?.[ch] || 0);

  const compareBarData = {
    labels: CHANNELS,
    datasets: [
      {
        label: '7월 매출액',
        data: sales7,
        backgroundColor: 'rgba(148, 163, 184, 0.85)',
        borderRadius: 4
      },
      {
        label: '8월 매출액 (신규 순수 실적)',
        data: sales8,
        backgroundColor: 'rgba(59, 130, 246, 0.85)',
        borderRadius: 4
      }
    ]
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
      <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
        <h4 className="font-bold text-slate-800 text-sm mb-4">
          유통사별 실적 현황 ({currentMonth})
        </h4>
        <div className="h-72">
          <Bar
            data={barData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              scales: {
                y: {
                  ticks: {
                    callback: val => (val / 100000000).toFixed(1) + '억'
                  }
                }
              }
            }}
          />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
        <h4 className="font-bold text-slate-800 text-sm mb-4">
          품목별 매출 비중 ({currentMonth})
        </h4>
        <div className="h-72 flex items-center justify-center">
          <Pie
            data={pieData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                tooltip: {
                  callbacks: {
                    label: context => {
                      const val = context.raw || 0;
                      const total = salesByCat.reduce((a, b) => a + b, 0);
                      const pct = total > 0 ? ((val / total) * 100).toFixed(1) : 0;
                      return `${context.label}: ${val.toLocaleString()}원 (${pct}%)`;
                    }
                  }
                }
              }
            }}
          />
        </div>
      </div>

      <div className="lg:col-span-3 bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
        <h4 className="font-bold text-slate-800 text-sm mb-4">
          7월 대비 8월 유통사별 매출 성장 추이 (차감 전후 비교)
        </h4>
        <div className="h-64">
          <Bar
            data={compareBarData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              scales: {
                y: {
                  ticks: {
                    callback: val => (val / 100000000).toFixed(1) + '억'
                  }
                }
              }
            }}
          />
        </div>
      </div>
    </div>
  );
}
