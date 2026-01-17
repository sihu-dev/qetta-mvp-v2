import { BRAND } from '@/lib/brand';

export function Logo(props: React.ComponentPropsWithoutRef<'svg'>) {
  return (
    <svg aria-hidden="true" viewBox="0 0 140 40" {...props}>
      {/* Q 아이콘 */}
      <circle cx="20" cy="20" r="16" fill="#9333ea" />
      <circle cx="20" cy="20" r="10" fill="white" />
      <path
        d="M24 24 L32 32"
        stroke="#9333ea"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <circle cx="20" cy="20" r="4" fill="#9333ea" />

      {/* Qetta 텍스트 */}
      <text
        x="44"
        y="27"
        fontFamily="Inter, system-ui, sans-serif"
        fontSize="20"
        fontWeight="700"
        fill="#1f2937"
      >
        Qetta
      </text>
    </svg>
  );
}

export function LogoMark(props: React.ComponentPropsWithoutRef<'svg'>) {
  return (
    <svg aria-hidden="true" viewBox="0 0 40 40" {...props}>
      <circle cx="20" cy="20" r="16" fill="#9333ea" />
      <circle cx="20" cy="20" r="10" fill="white" />
      <path
        d="M24 24 L32 32"
        stroke="#9333ea"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <circle cx="20" cy="20" r="4" fill="#9333ea" />
    </svg>
  );
}

export function LogoWithSlogan(props: React.ComponentPropsWithoutRef<'div'>) {
  return (
    <div {...props} className={`flex flex-col items-center ${props.className || ''}`}>
      <Logo className="h-10 w-auto" />
      <span className="mt-1 text-xs text-gray-500 tracking-wider">
        {BRAND.slogan}
      </span>
    </div>
  );
}
