'use client'

import { useEffect, useState } from 'react'
import { Tab, TabGroup, TabList, TabPanel, TabPanels } from '@headlessui/react'
import clsx from 'clsx'

import { Container } from '@/components/Container'
import { BRAND, SERVICE_WORDING } from '@/lib/brand'
import {
  ArchiveBoxIcon,
  CpuChipIcon,
  DocumentTextIcon,
  WrenchScrewdriverIcon,
} from '@heroicons/react/24/outline'

const features = [
  {
    title: 'OTT Chip',
    titleKo: 'OTT칩',
    description:
      '10분 설치, 50만원. 플러그앤플레이 방식으로 기존 설비에 바로 연결됩니다. MES 대비 99% 비용 절감으로 중소 제조기업도 스마트팩토리를 시작할 수 있습니다.',
    icon: WrenchScrewdriverIcon,
    stats: [
      { label: '설치 시간', value: '10분' },
      { label: '비용', value: '50만원' },
      { label: 'MES 대비', value: '-99%' },
    ],
  },
  {
    title: 'AI Predictive',
    titleKo: 'AI 예지보전',
    description:
      '72시간 전 고장 예측. 설비 데이터를 실시간 분석하여 고장과 불량을 미리 예측합니다. 갑작스런 라인 정지를 80% 줄이고, 불량률을 30% 감소시킵니다.',
    icon: CpuChipIcon,
    stats: [
      { label: '예측 시점', value: '72h 전' },
      { label: '정지 감소', value: '-80%' },
      { label: '불량 감소', value: '-30%' },
    ],
  },
  {
    title: SERVICE_WORDING.evidenceRegistry.name,
    titleKo: SERVICE_WORDING.evidenceRegistry.nameKo,
    description:
      'Gov ZIP 패키지로 변조 탐지 가능한 증빙을 자동 생성합니다. MANIFEST v1.2 표준으로 정부 제출 서류의 신뢰성을 보장하고, 감사 시 즉시 검증 가능합니다.',
    icon: ArchiveBoxIcon,
    stats: [
      { label: '포맷', value: 'Gov ZIP' },
      { label: '표준', value: 'v1.2' },
      { label: '보안', value: '변조 탐지' },
    ],
  },
  {
    title: SERVICE_WORDING.documentSkills.name,
    titleKo: SERVICE_WORDING.documentSkills.nameKo,
    description:
      '제안서, 견적서, 발표자료를 AI가 자동 생성합니다. DOCX, XLSX, PPTX 형식으로 바로 활용 가능하며, 입찰 공고에 맞춤 최적화된 문서를 몇 분 만에 완성합니다.',
    icon: DocumentTextIcon,
    stats: [
      { label: '제안서', value: 'DOCX' },
      { label: '견적서', value: 'XLSX' },
      { label: '발표자료', value: 'PPTX' },
    ],
  },
]

export function PrimaryFeatures() {
  const [tabOrientation, setTabOrientation] = useState<'horizontal' | 'vertical'>(
    'horizontal',
  )

  useEffect(() => {
    const lgMediaQuery = window.matchMedia('(min-width: 1024px)')

    function onMediaQueryChange({ matches }: { matches: boolean }) {
      setTabOrientation(matches ? 'vertical' : 'horizontal')
    }

    onMediaQueryChange(lgMediaQuery)
    lgMediaQuery.addEventListener('change', onMediaQueryChange)

    return () => {
      lgMediaQuery.removeEventListener('change', onMediaQueryChange)
    }
  }, [])

  return (
    <section
      id="features"
      aria-label="Qetta 핵심 기능"
      className="relative overflow-hidden bg-blue-600 pt-20 pb-28 sm:py-32"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-blue-700 to-blue-900" />
      <Container className="relative">
        <div className="max-w-2xl md:mx-auto md:text-center xl:max-w-none">
          <h2 className="font-display text-3xl tracking-tight text-white sm:text-4xl md:text-5xl">
            제조 데이터에서 정부 증빙까지
          </h2>
          <p className="mt-6 text-lg tracking-tight text-blue-100">
            {BRAND.tagline}
            <br />
            AI가 자동으로 처리하는 완전한 파이프라인
          </p>
        </div>
        <TabGroup
          className="mt-16 grid grid-cols-1 items-center gap-y-2 pt-10 sm:gap-y-6 md:mt-20 lg:grid-cols-12 lg:pt-0"
          vertical={tabOrientation === 'vertical'}
        >
          {({ selectedIndex }) => (
            <>
              <div className="-mx-4 flex overflow-x-auto pb-4 sm:mx-0 sm:overflow-visible sm:pb-0 lg:col-span-5">
                <TabList className="relative z-10 flex gap-x-4 px-4 whitespace-nowrap sm:mx-auto sm:px-0 lg:mx-0 lg:block lg:gap-x-0 lg:gap-y-1 lg:whitespace-normal">
                  {features.map((feature, featureIndex) => (
                    <div
                      key={feature.title}
                      className={clsx(
                        'group relative rounded-full px-4 py-1 lg:rounded-l-xl lg:rounded-r-none lg:p-6',
                        selectedIndex === featureIndex
                          ? 'bg-white lg:bg-white/10 lg:ring-1 lg:ring-white/10 lg:ring-inset'
                          : 'hover:bg-white/10 lg:hover:bg-white/5',
                      )}
                    >
                      <h3>
                        <Tab
                          className={clsx(
                            'font-display text-lg data-selected:not-data-focus:outline-hidden',
                            selectedIndex === featureIndex
                              ? 'text-blue-600 lg:text-white'
                              : 'text-blue-100 hover:text-white lg:text-white',
                          )}
                        >
                          <span className="absolute inset-0 rounded-full lg:rounded-l-xl lg:rounded-r-none" />
                          {feature.titleKo}
                        </Tab>
                      </h3>
                      <p
                        className={clsx(
                          'mt-2 hidden text-sm lg:block',
                          selectedIndex === featureIndex
                            ? 'text-white'
                            : 'text-blue-100 group-hover:text-white',
                        )}
                      >
                        {feature.description}
                      </p>
                    </div>
                  ))}
                </TabList>
              </div>
              <TabPanels className="lg:col-span-7">
                {features.map((feature) => (
                  <TabPanel key={feature.title} unmount={false}>
                    <div className="relative sm:px-6 lg:hidden">
                      <div className="absolute -inset-x-4 -top-26 -bottom-17 bg-white/10 ring-1 ring-white/10 ring-inset sm:inset-x-0 sm:rounded-t-xl" />
                      <p className="relative mx-auto max-w-2xl text-base text-white sm:text-center">
                        {feature.description}
                      </p>
                    </div>
                    <div className="mt-10 overflow-hidden rounded-xl bg-white/10 p-8 shadow-xl shadow-blue-900/20 sm:p-12 lg:mt-0">
                      <div className="flex flex-col items-center text-center">
                        <div className="mb-6 rounded-2xl bg-white/20 p-4">
                          <feature.icon className="h-12 w-12 text-white" />
                        </div>
                        <h4 className="text-2xl font-bold text-white mb-2">
                          {feature.title}
                        </h4>
                        <p className="text-blue-100 mb-8 max-w-md">
                          {feature.titleKo}
                        </p>
                        <div className="grid grid-cols-3 gap-4 w-full max-w-sm">
                          {feature.stats.map((stat) => (
                            <div
                              key={stat.label}
                              className="rounded-lg bg-white/10 p-4"
                            >
                              <div className="text-2xl font-bold text-white">
                                {stat.value}
                              </div>
                              <div className="text-xs text-blue-200 mt-1">
                                {stat.label}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </TabPanel>
                ))}
              </TabPanels>
            </>
          )}
        </TabGroup>
      </Container>
    </section>
  )
}
