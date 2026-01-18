import Image from 'next/image'

import { Container } from '@/components/Container'
import { BRAND } from '@/lib/brand'
import avatarImage1 from '@/images/avatars/avatar-1.png'
import avatarImage2 from '@/images/avatars/avatar-2.png'
import avatarImage3 from '@/images/avatars/avatar-3.png'
import avatarImage4 from '@/images/avatars/avatar-4.png'
import avatarImage5 from '@/images/avatars/avatar-5.png'

const testimonials = [
  [
    {
      content:
        'OTT칩 설치 후 설비 데이터가 자동으로 수집되니까 월말 보고서 작성 시간이 80% 줄었습니다. 정부 제출 서류도 버튼 하나로 끝나요.',
      author: {
        name: '김정훈',
        role: '대표, 한진정밀 (CNC 가공업)',
        image: avatarImage1,
      },
    },
    {
      content:
        '스마트공장 기초 단계 인증 받을 때 증빙 준비가 가장 힘들었는데, Qetta 덕분에 다음 고도화 단계는 훨씬 수월하게 준비하고 있습니다.',
      author: {
        name: '이수진',
        role: '공장장, 서울금형',
        image: avatarImage4,
      },
    },
  ],
  [
    {
      content:
        'AI 예지보전 덕분에 CNC 스핀들 교체 시기를 72시간 전에 알 수 있게 됐어요. 갑작스런 라인 정지가 확 줄었습니다.',
      author: {
        name: '박민수',
        role: '생산팀장, 동아테크',
        image: avatarImage5,
      },
    },
    {
      content:
        'MES 도입하려면 수천만원 들었을 텐데, 50만원짜리 OTT칩으로 핵심 기능을 다 쓰고 있습니다. 중소기업에 딱입니다.',
      author: {
        name: '최영희',
        role: 'CEO, 영진기계',
        image: avatarImage2,
      },
    },
  ],
  [
    {
      content:
        '입찰 공고 분석 기능이 정말 좋아요. 우리 회사에 맞는 공고만 골라서 보여주니까 제안서 작성에 집중할 수 있습니다.',
      author: {
        name: '정태영',
        role: '영업본부장, 미래시스템즈',
        image: avatarImage3,
      },
    },
    {
      content:
        '증빙 패키지의 변조 탐지 기능 덕분에 감사 때 서류 진위 문제로 고생한 적이 없습니다. 정부 담당자분도 신뢰하시더라고요.',
      author: {
        name: '한지민',
        role: '경영지원팀장, 코리아로봇',
        image: avatarImage4,
      },
    },
  ],
]

function QuoteIcon(props: React.ComponentPropsWithoutRef<'svg'>) {
  return (
    <svg aria-hidden="true" width={105} height={78} {...props}>
      <path d="M25.086 77.292c-4.821 0-9.115-1.205-12.882-3.616-3.767-2.561-6.78-6.102-9.04-10.622C1.054 58.534 0 53.411 0 47.686c0-5.273.904-10.396 2.712-15.368 1.959-4.972 4.746-9.567 8.362-13.786a59.042 59.042 0 0 1 12.43-11.3C28.325 3.917 33.599 1.507 39.324 0l11.074 13.786c-6.479 2.561-11.677 5.951-15.594 10.17-3.767 4.219-5.65 7.835-5.65 10.848 0 1.356.377 2.863 1.13 4.52.904 1.507 2.637 3.089 5.198 4.746 3.767 2.41 6.328 4.972 7.684 7.684 1.507 2.561 2.26 5.5 2.26 8.814 0 5.123-1.959 9.19-5.876 12.204-3.767 3.013-8.588 4.52-14.464 4.52Zm54.24 0c-4.821 0-9.115-1.205-12.882-3.616-3.767-2.561-6.78-6.102-9.04-10.622-2.11-4.52-3.164-9.643-3.164-15.368 0-5.273.904-10.396 2.712-15.368 1.959-4.972 4.746-9.567 8.362-13.786a59.042 59.042 0 0 1 12.43-11.3C82.565 3.917 87.839 1.507 93.564 0l11.074 13.786c-6.479 2.561-11.677 5.951-15.594 10.17-3.767 4.219-5.65 7.835-5.65 10.848 0 1.356.377 2.863 1.13 4.52.904 1.507 2.637 3.089 5.198 4.746 3.767 2.41 6.328 4.972 7.684 7.684 1.507 2.561 2.26 5.5 2.26 8.814 0 5.123-1.959 9.19-5.876 12.204-3.767 3.013-8.588 4.52-14.464 4.52Z" />
    </svg>
  )
}

export function Testimonials() {
  return (
    <section
      id="testimonials"
      aria-label="고객 후기"
      className="bg-slate-50 py-20 sm:py-32"
    >
      <Container>
        <div className="mx-auto max-w-2xl md:text-center">
          <h2 className="font-display text-3xl tracking-tight text-slate-900 sm:text-4xl">
            제조 현장에서 검증된 솔루션
          </h2>
          <p className="mt-4 text-lg tracking-tight text-slate-700">
            {BRAND.cvp.cost}. {BRAND.cvp.downtime}. {BRAND.cvp.roi}.
            <br />
            실제 고객들의 이야기를 들어보세요.
          </p>
        </div>
        <ul
          role="list"
          className="mx-auto mt-16 grid max-w-2xl grid-cols-1 gap-6 sm:gap-8 lg:mt-20 lg:max-w-none lg:grid-cols-3"
        >
          {testimonials.map((column, columnIndex) => (
            <li key={columnIndex}>
              <ul role="list" className="flex flex-col gap-y-6 sm:gap-y-8">
                {column.map((testimonial, testimonialIndex) => (
                  <li key={testimonialIndex}>
                    <figure className="relative rounded-2xl bg-white p-6 shadow-xl shadow-slate-900/10">
                      <QuoteIcon className="absolute top-6 left-6 fill-slate-100" />
                      <blockquote className="relative">
                        <p className="text-lg tracking-tight text-slate-900">
                          {testimonial.content}
                        </p>
                      </blockquote>
                      <figcaption className="relative mt-6 flex items-center justify-between border-t border-slate-100 pt-6">
                        <div>
                          <div className="font-display text-base text-slate-900">
                            {testimonial.author.name}
                          </div>
                          <div className="mt-1 text-sm text-slate-500">
                            {testimonial.author.role}
                          </div>
                        </div>
                        <div className="overflow-hidden rounded-full bg-slate-50">
                          <Image
                            className="h-14 w-14 object-cover"
                            src={testimonial.author.image}
                            alt=""
                            width={56}
                            height={56}
                          />
                        </div>
                      </figcaption>
                    </figure>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  )
}
