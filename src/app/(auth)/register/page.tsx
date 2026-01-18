'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/Button';
import { SelectField, TextField } from '@/components/Fields';
import { Logo } from '@/components/Logo';
import { SlimLayout } from '@/components/SlimLayout';
import { BRAND } from '@/lib/brand';
import { supabase } from '@/lib/supabase/client';

export default function Register() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    companyName: '',
    contactName: '',
    email: '',
    password: '',
    interest: '스마트공장 (설비 데이터 수집)',
    referralSource: '검색 (구글, 네이버)',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            display_name: formData.contactName,
            company_name: formData.companyName,
            interest: formData.interest,
            referral_source: formData.referralSource,
          },
        },
      });

      if (signUpError) {
        if (signUpError.message.includes('already registered')) {
          setError('이미 등록된 이메일입니다. 로그인을 시도해주세요.');
        } else if (signUpError.message.includes('password')) {
          setError('비밀번호는 최소 6자 이상이어야 합니다.');
        } else {
          setError(signUpError.message);
        }
        return;
      }

      setSuccess(true);
      // Wait a bit then redirect
      setTimeout(() => {
        router.push('/dashboard');
        router.refresh();
      }, 2000);
    } catch {
      setError('회원가입 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <SlimLayout>
        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">가입 완료!</h2>
          <p className="text-sm text-gray-600 mb-4">
            {BRAND.name}에 오신 것을 환영합니다.
            <br />
            잠시 후 대시보드로 이동합니다...
          </p>
          <div className="animate-pulse text-blue-600">
            <svg className="w-6 h-6 animate-spin" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
        </div>
      </SlimLayout>
    );
  }

  return (
    <SlimLayout>
      <div className="flex">
        <Link href="/" aria-label="Home">
          <Logo className="h-10 w-auto" />
        </Link>
      </div>
      <h2 className="mt-20 text-lg font-semibold text-gray-900">무료로 시작하세요</h2>
      <p className="mt-2 text-sm text-gray-700">
        이미 계정이 있으신가요?{' '}
        <Link href="/login" className="font-medium text-blue-600 hover:underline">
          로그인
        </Link>
        하세요.
      </p>

      {error && (
        <div className="mt-4 p-3 rounded-lg bg-red-50 border border-red-200">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-10 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-2">
        <TextField
          label="회사명"
          name="companyName"
          type="text"
          autoComplete="organization"
          required
          value={formData.companyName}
          onChange={handleChange}
        />
        <TextField
          label="담당자명"
          name="contactName"
          type="text"
          autoComplete="name"
          required
          value={formData.contactName}
          onChange={handleChange}
        />
        <TextField
          className="col-span-full"
          label="이메일 주소"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={formData.email}
          onChange={handleChange}
        />
        <TextField
          className="col-span-full"
          label="비밀번호"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          value={formData.password}
          onChange={handleChange}
        />
        <SelectField
          className="col-span-full"
          label="관심 분야"
          name="interest"
          value={formData.interest}
          onChange={handleChange}
        >
          <option>스마트공장 (설비 데이터 수집)</option>
          <option>AI 예지보전 (고장/불량 예측)</option>
          <option>입찰 분석 (나라장터, UN 등)</option>
          <option>증빙 자동화 (Gov ZIP)</option>
          <option>문서 자동생성 (제안서, 견적서)</option>
        </SelectField>
        <SelectField
          className="col-span-full"
          label="가입 경로"
          name="referralSource"
          value={formData.referralSource}
          onChange={handleChange}
        >
          <option>검색 (구글, 네이버)</option>
          <option>지인 추천</option>
          <option>정부 지원사업 안내</option>
          <option>전시회/세미나</option>
          <option>기타</option>
        </SelectField>
        <div className="col-span-full">
          <Button
            type="submit"
            variant="solid"
            color="blue"
            className="w-full"
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                가입 중...
              </span>
            ) : (
              <span>
                회원가입 <span aria-hidden="true">&rarr;</span>
              </span>
            )}
          </Button>
        </div>
      </form>

      <div className="mt-8 text-center">
        <p className="text-xs text-gray-500">
          가입 시{' '}
          <Link href="/terms" className="text-blue-600 hover:underline">
            이용약관
          </Link>
          과{' '}
          <Link href="/privacy" className="text-blue-600 hover:underline">
            개인정보처리방침
          </Link>
          에 동의하게 됩니다.
        </p>
      </div>
    </SlimLayout>
  );
}
