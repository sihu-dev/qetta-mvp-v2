'use client';

/**
 * CostSavingsCard Component
 * CVP 지표를 시각적으로 표시하는 비용 절감 효과 카드
 */

import {
  ArrowTrendingDownIcon,
  CurrencyDollarIcon,
  WrenchScrewdriverIcon,
  ClockIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';
import { BRAND } from '@/lib/brand';

interface CVPMetric {
  label: string;
  value: string;
  highlight: string;
  Icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  trend: 'down' | 'up';
  color: string;
}

const cvpMetrics: CVPMetric[] = [
  {
    label: 'MES 대비 비용',
    value: '99%',
    highlight: '절감',
    Icon: CurrencyDollarIcon,
    trend: 'down',
    color: 'text-green-600',
  },
  {
    label: '불량률',
    value: '30%',
    highlight: '감소',
    Icon: WrenchScrewdriverIcon,
    trend: 'down',
    color: 'text-blue-600',
  },
  {
    label: '설비 정지',
    value: '80%',
    highlight: '감소',
    Icon: ClockIcon,
    trend: 'down',
    color: 'text-orange-500',
  },
  {
    label: 'ROI',
    value: '0.7',
    highlight: '개월',
    Icon: ChartBarIcon,
    trend: 'up',
    color: 'text-emerald-600',
  },
];

export function CostSavingsCard() {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: BRAND.colors.primary }}
        >
          <ArrowTrendingDownIcon className="h-5 w-5 text-white" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-900">비용 절감 효과</h2>
          <p className="text-sm text-gray-500">Qetta CVP 지표</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {cvpMetrics.map((metric) => (
          <div
            key={metric.label}
            className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors"
          >
            <div className="flex items-center justify-between mb-2">
              <metric.Icon className={`h-5 w-5 ${metric.color}`} />
              {metric.trend === 'down' && (
                <ArrowTrendingDownIcon className="h-4 w-4 text-green-500" />
              )}
            </div>
            <div className="mt-2">
              <div className="flex items-baseline gap-1">
                <span className={`text-3xl font-bold ${metric.color}`}>
                  {metric.value}
                </span>
                <span className="text-sm text-gray-500">{metric.highlight}</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">{metric.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 pt-4 border-t border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">OTT칩 도입 비용</p>
            <p className="text-2xl font-bold" style={{ color: BRAND.colors.primary }}>
              50만원
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">기존 MES 대비</p>
            <p className="text-lg font-semibold text-gray-400 line-through">
              5,000만원+
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CostSavingsCard;
