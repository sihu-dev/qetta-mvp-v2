'use client'

import { Tab, TabGroup, TabList, TabPanel, TabPanels } from '@headlessui/react'
import clsx from 'clsx'

import { Container } from '@/components/Container'
import { SERVICE_WORDING, INTELLIGENCE_TIERS } from '@/lib/brand'
import {
  MagnifyingGlassIcon,
  BoltIcon,
  CircleStackIcon,
  BellAlertIcon,
} from '@heroicons/react/24/outline'

interface Feature {
  name: React.ReactNode
  summary: string
  description: string
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
  stats?: { label: string; value: string }[]
}

const features: Array<Feature> = [
  {
    name: 'Tender Analysis',
    summary: '입찰 공고 자동 수집 및 적합도 분석',
    description:
      '나라장터, UN, SAM.gov 등 국내외 입찰 공고를 자동 수집합니다. AI가 귀사의 역량과 공고를 매칭하여 적합도를 A~F 등급으로 분석하고, 맞춤 제안서를 자동 생성합니다.',
    icon: MagnifyingGlassIcon,
    stats: [
      { label: SERVICE_WORDING.tender.sources.g2b, value: 'G2B' },
      { label: SERVICE_WORDING.tender.sources.ungm, value: 'UN' },
      { label: SERVICE_WORDING.tender.sources.sam, value: 'SAM' },
    ],
  },
  {
    name: '3-Tier Intelligence',
    summary: '95% 규칙 기반, 4% ML, 1% Claude API',
    description:
      `${INTELLIGENCE_TIERS.rule.percentage}%는 무료 규칙 기반으로 처리하고, ${INTELLIGENCE_TIERS.ml.percentage}%는 pgvector ML로, 복잡한 ${INTELLIGENCE_TIERS.claude.percentage}%만 Claude API를 사용합니다. 연간 AI 비용을 ${INTELLIGENCE_TIERS.claude.cost} 이하로 억제하면서 최고 수준의 분석을 제공합니다.`,
    icon: BoltIcon,
    stats: [
      { label: INTELLIGENCE_TIERS.rule.name, value: `${INTELLIGENCE_TIERS.rule.percentage}%` },
      { label: INTELLIGENCE_TIERS.ml.name, value: `${INTELLIGENCE_TIERS.ml.percentage}%` },
      { label: INTELLIGENCE_TIERS.claude.name, value: `${INTELLIGENCE_TIERS.claude.percentage}%` },
    ],
  },
  {
    name: 'Vector Memory',
    summary: 'pgvector 기반 의미론적 검색',
    description:
      'Supabase PostgreSQL + pgvector로 문서와 이력을 벡터화하여 저장합니다. 유사한 입찰 공고, 과거 성공 사례, 관련 기술 문서를 의미 기반으로 빠르게 검색하여 제안서 품질을 높입니다.',
    icon: CircleStackIcon,
    stats: [
      { label: 'DB', value: 'Supabase' },
      { label: 'Vector', value: 'pgvector' },
      { label: '검색', value: '의미론적' },
    ],
  },
  {
    name: 'Real-time Alert',
    summary: '카카오, 슬랙, 이메일 실시간 알림',
    description:
      '설비 이상, 새 입찰 공고, 마감 임박 등 중요한 이벤트를 실시간으로 알려드립니다. 카카오톡, 슬랙, 이메일 중 선호하는 채널로 알림을 받을 수 있습니다.',
    icon: BellAlertIcon,
    stats: [
      { label: '카카오', value: 'Talk' },
      { label: '슬랙', value: 'Bot' },
      { label: '이메일', value: 'SMTP' },
    ],
  },
]

function Feature({
  feature,
  isActive,
  className,
  ...props
}: React.ComponentPropsWithoutRef<'div'> & {
  feature: Feature
  isActive: boolean
}) {
  return (
    <div
      className={clsx(className, !isActive && 'opacity-75 hover:opacity-100')}
      {...props}
    >
      <div
        className={clsx(
          'w-9 h-9 rounded-lg flex items-center justify-center',
          isActive ? 'bg-blue-600' : 'bg-slate-500',
        )}
      >
        <feature.icon className="h-5 w-5 text-white" />
      </div>
      <h3
        className={clsx(
          'mt-6 text-sm font-medium',
          isActive ? 'text-blue-600' : 'text-slate-600',
        )}
      >
        {feature.name}
      </h3>
      <p className="mt-2 font-display text-xl text-slate-900">
        {feature.summary}
      </p>
      <p className="mt-4 text-sm text-slate-600">{feature.description}</p>
    </div>
  )
}

function FeaturesMobile() {
  return (
    <div className="-mx-4 mt-20 flex flex-col gap-y-10 overflow-hidden px-4 sm:-mx-6 sm:px-6 lg:hidden">
      {features.map((feature) => (
        <div key={feature.summary}>
          <Feature feature={feature} className="mx-auto max-w-2xl" isActive />
          <div className="relative mt-10 pb-10">
            <div className="absolute -inset-x-4 top-8 bottom-0 bg-slate-200 sm:-inset-x-6" />
            <div className="relative mx-auto overflow-hidden rounded-xl bg-white p-6 shadow-lg ring-1 shadow-slate-900/5 ring-slate-500/10">
              <div className="grid grid-cols-3 gap-4">
                {feature.stats?.map((stat) => (
                  <div key={stat.label} className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {stat.value}
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function FeaturesDesktop() {
  return (
    <TabGroup className="hidden lg:mt-20 lg:block">
      {({ selectedIndex }) => (
        <>
          <TabList className="grid grid-cols-4 gap-x-8">
            {features.map((feature, featureIndex) => (
              <Feature
                key={feature.summary}
                feature={{
                  ...feature,
                  name: (
                    <Tab className="data-selected:not-data-focus:outline-hidden">
                      <span className="absolute inset-0" />
                      {feature.name}
                    </Tab>
                  ),
                }}
                isActive={featureIndex === selectedIndex}
                className="relative"
              />
            ))}
          </TabList>
          <TabPanels className="relative mt-20 overflow-hidden rounded-4xl bg-slate-200 px-14 py-16 xl:px-16">
            <div className="-mx-5 flex">
              {features.map((feature, featureIndex) => (
                <TabPanel
                  static
                  key={feature.summary}
                  className={clsx(
                    'px-5 transition duration-500 ease-in-out data-selected:not-data-focus:outline-hidden w-full',
                    featureIndex !== selectedIndex && 'opacity-60',
                  )}
                  style={{ transform: `translateX(-${selectedIndex * 100}%)` }}
                  aria-hidden={featureIndex !== selectedIndex}
                >
                  <div className="overflow-hidden rounded-xl bg-white p-8 shadow-lg ring-1 shadow-slate-900/5 ring-slate-500/10">
                    <div className="flex items-center gap-6 mb-6">
                      <div className="w-16 h-16 rounded-2xl bg-blue-100 flex items-center justify-center">
                        <feature.icon className="h-8 w-8 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="text-xl font-bold text-slate-900">
                          {typeof feature.name === 'string' ? feature.name : features[featureIndex].name}
                        </h4>
                        <p className="text-sm text-slate-500">{feature.summary}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-6">
                      {feature.stats?.map((stat) => (
                        <div
                          key={stat.label}
                          className="rounded-lg bg-slate-50 p-6 text-center"
                        >
                          <div className="text-3xl font-bold text-blue-600">
                            {stat.value}
                          </div>
                          <div className="text-sm text-slate-600 mt-2">
                            {stat.label}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </TabPanel>
              ))}
            </div>
            <div className="pointer-events-none absolute inset-0 rounded-4xl ring-1 ring-slate-900/10 ring-inset" />
          </TabPanels>
        </>
      )}
    </TabGroup>
  )
}

export function SecondaryFeatures() {
  return (
    <section
      id="secondary-features"
      aria-label="Qetta 부가 기능"
      className="pt-20 pb-14 sm:pt-32 sm:pb-20 lg:pb-32"
    >
      <Container>
        <div className="mx-auto max-w-2xl md:text-center">
          <h2 className="font-display text-3xl tracking-tight text-slate-900 sm:text-4xl">
            더 많은 기회를 발견하세요
          </h2>
          <p className="mt-4 text-lg tracking-tight text-slate-700">
            입찰 분석부터 실시간 알림까지,
            <br />
            비즈니스 성장을 위한 스마트한 도구들
          </p>
        </div>
        <FeaturesMobile />
        <FeaturesDesktop />
      </Container>
    </section>
  )
}
