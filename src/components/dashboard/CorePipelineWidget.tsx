'use client';

import Link from 'next/link';
import {
  CpuChipIcon,
  ChartBarSquareIcon,
  ShieldCheckIcon,
  DocumentTextIcon,
  PaperAirplaneIcon,
} from '@heroicons/react/24/outline';

interface PipelineStep {
  id: string;
  title: string;
  subtitle: string;
  details: string[];
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  color: string;
}

const pipelineSteps: PipelineStep[] = [
  {
    id: 'ott-chip',
    title: 'OTT칩',
    subtitle: '플러그앤플레이 데이터 수집',
    details: ['10분 설치', '50만원'],
    icon: CpuChipIcon,
    href: '/dashboard/ott',
    color: 'bg-blue-600',
  },
  {
    id: 'ai-prediction',
    title: 'AI 예지보전',
    subtitle: '설비 고장 사전 예측',
    details: ['72h 예측', '고장/불량 감지'],
    icon: ChartBarSquareIcon,
    href: '/dashboard/agi',
    color: 'bg-green-600',
  },
  {
    id: 'evidence-registry',
    title: 'Evidence Registry',
    subtitle: '증빙 자동 보관',
    details: ['Gov ZIP', 'MANIFEST v1.2'],
    icon: ShieldCheckIcon,
    href: '/dashboard/evidence',
    color: 'bg-purple-600',
  },
  {
    id: 'document-skills',
    title: 'Document Skills',
    subtitle: '문서 자동생성',
    details: ['DOCX/XLSX/PPTX'],
    icon: DocumentTextIcon,
    href: '/dashboard/tender',
    color: 'bg-orange-500',
  },
  {
    id: 'gov-submit',
    title: '정부 제출',
    subtitle: '증빙 자동 제출',
    details: ['자동 제출'],
    icon: PaperAirplaneIcon,
    href: '/dashboard/evidence',
    color: 'bg-sky-500',
  },
];

function ArrowConnector() {
  return (
    <div className="hidden md:flex items-center justify-center px-2">
      <svg
        width="32"
        height="24"
        viewBox="0 0 32 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="text-blue-600"
      >
        <path
          d="M2 12H26M26 12L18 4M26 12L18 20"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

function MobileArrowConnector() {
  return (
    <div className="flex md:hidden items-center justify-center py-2">
      <svg
        width="24"
        height="32"
        viewBox="0 0 24 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="text-blue-600"
      >
        <path
          d="M12 2V26M12 26L4 18M12 26L20 18"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

export default function CorePipelineWidget() {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900">Core Pipeline</h2>
        <p className="text-sm text-gray-500 mt-1">
          데이터 수집부터 정부 제출까지 자동화된 파이프라인
        </p>
      </div>

      {/* Desktop Layout */}
      <div className="hidden md:flex items-stretch justify-between">
        {pipelineSteps.map((step, index) => (
          <div key={step.id} className="flex items-center">
            <Link
              href={step.href}
              className="group flex flex-col items-center p-4 rounded-xl hover:bg-gray-50 transition-colors min-w-[140px]"
            >
              <div
                className={`w-14 h-14 ${step.color} rounded-xl flex items-center justify-center mb-3 group-hover:scale-105 transition-transform`}
              >
                <step.icon className="h-7 w-7 text-white" />
              </div>
              <h3 className="font-medium text-gray-900 text-center text-sm">
                {step.title}
              </h3>
              <p className="text-xs text-gray-500 text-center mt-1 max-w-[120px]">
                {step.subtitle}
              </p>
              <div className="mt-2 space-y-1">
                {step.details.map((detail, detailIndex) => (
                  <span
                    key={detailIndex}
                    className="block text-xs text-blue-600 font-medium text-center"
                  >
                    {detail}
                  </span>
                ))}
              </div>
            </Link>
            {index < pipelineSteps.length - 1 && <ArrowConnector />}
          </div>
        ))}
      </div>

      {/* Mobile Layout */}
      <div className="md:hidden space-y-2">
        {pipelineSteps.map((step, index) => (
          <div key={step.id}>
            <Link
              href={step.href}
              className="group flex items-center gap-4 p-4 rounded-xl hover:bg-gray-50 transition-colors"
            >
              <div
                className={`w-12 h-12 ${step.color} rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform`}
              >
                <step.icon className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-gray-900 text-sm">
                  {step.title}
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">{step.subtitle}</p>
                <div className="flex flex-wrap gap-2 mt-1">
                  {step.details.map((detail, detailIndex) => (
                    <span
                      key={detailIndex}
                      className="text-xs text-blue-600 font-medium"
                    >
                      {detail}
                    </span>
                  ))}
                </div>
              </div>
              <svg
                className="h-5 w-5 text-gray-400 group-hover:text-blue-600 transition-colors flex-shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </Link>
            {index < pipelineSteps.length - 1 && <MobileArrowConnector />}
          </div>
        ))}
      </div>
    </div>
  );
}
