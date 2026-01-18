'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

import { Button } from '@/components/Button';
import { TextField } from '@/components/Fields';
import { Logo } from '@/components/Logo';
import { SlimLayout } from '@/components/SlimLayout';
import { BRAND } from '@/lib/brand';
import { supabase } from '@/lib/supabase/client';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect') || '/dashboard';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        if (signInError.message.includes('Invalid login')) {
          setError('이메일 또는 비밀번호가 올바르지 않습니다.');
        } else {
          setError(signInError.message);
        }
        return;
      }

      router.push(redirectTo);
      router.refresh();
    } catch {
      setError('로그인 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SlimLayout>
      <div className="flex">
        <Link href="/" aria-label="Home">
          <Logo className="h-10 w-auto" />
        </Link>
      </div>
      <h2 className="mt-20 text-lg font-semibold text-gray-900">로그인</h2>
      <p className="mt-2 text-sm text-gray-700">
        아직 계정이 없으신가요?{' '}
        <Link href="/register" className="font-medium text-blue-600 hover:underline">
          무료로 시작하기
        </Link>
      </p>

      {error && (
        <div className="mt-4 p-3 rounded-lg bg-red-50 border border-red-200">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-10 grid grid-cols-1 gap-y-8">
        <TextField
          label="이메일 주소"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <TextField
          label="비밀번호"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <input
              id="remember-me"
              name="remember-me"
              type="checkbox"
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-600"
            />
            <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
              로그인 상태 유지
            </label>
          </div>
          <div className="text-sm">
            <Link href="/forgot-password" className="font-medium text-blue-600 hover:underline">
              비밀번호 찾기
            </Link>
          </div>
        </div>
        <div>
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
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                로그인 중...
              </span>
            ) : (
              <span>
                로그인 <span aria-hidden="true">&rarr;</span>
              </span>
            )}
          </Button>
        </div>
      </form>

      <div className="mt-8 text-center">
        <p className="text-xs text-gray-500">
          {BRAND.name} · {BRAND.tagline}
        </p>
      </div>
    </SlimLayout>
  );
}

export default function Login() {
  return (
    <Suspense
      fallback={
        <SlimLayout>
          <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        </SlimLayout>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
