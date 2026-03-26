import { useState } from 'react';
import { GetStaticProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import {
  signInWithEmailAndPassword,
  TotpMultiFactorGenerator,
  getMultiFactorResolver,
  MultiFactorResolver,
} from 'firebase/auth';
import { auth } from '@/firebase/config';
import { toast } from 'react-hot-toast';

export default function AdminLogin() {
  const { t } = useTranslation('common');
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // MFA state
  const [mfaResolver, setMfaResolver] = useState<MultiFactorResolver | null>(null);
  const [totpCode, setTotpCode] = useState('');
  const [mfaLoading, setMfaLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast.success('Login successful');
      router.push('/admin');
    } catch (err: any) {
      if (err?.code === 'auth/multi-factor-auth-required') {
        // MFA is required — show TOTP input
        try {
          const resolver = getMultiFactorResolver(auth, err);
          setMfaResolver(resolver);
          setError(null);
        } catch (resolverErr: any) {
          setError(resolverErr.message || 'Failed to initialize MFA');
          toast.error('MFA initialization failed');
        }
      } else {
        setError(err.message || 'Failed to login');
        toast.error('Login failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleMfaVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mfaResolver) return;
    setMfaLoading(true);
    setError(null);

    try {
      // Find the TOTP factor hint
      const totpHint = mfaResolver.hints.find(
        (hint) => hint.factorId === TotpMultiFactorGenerator.FACTOR_ID
      );

      if (!totpHint) {
        setError('No TOTP factor found for this account');
        setMfaLoading(false);
        return;
      }

      const assertion = TotpMultiFactorGenerator.assertionForSignIn(
        totpHint.uid,
        totpCode.trim()
      );

      await mfaResolver.resolveSignIn(assertion);
      toast.success('Login successful');
      router.push('/admin');
    } catch (err: any) {
      const msg =
        err?.code === 'auth/invalid-verification-code'
          ? 'Invalid verification code. Please try again.'
          : err.message || 'MFA verification failed';
      setError(msg);
      toast.error('Verification failed');
    } finally {
      setMfaLoading(false);
    }
  };

  const handleBackToLogin = () => {
    setMfaResolver(null);
    setTotpCode('');
    setError(null);
  };

  return (
    <>
      <Head>
        <title>Admin Login</title>
        <meta name="description" content="Admin login for Legaliseringstjänst" />
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <div className="min-h-screen bg-gray-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Admin Login
          </h2>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
                {error}
              </div>
            )}

            {!mfaResolver ? (
              /* Standard login form */
              <form className="space-y-6" onSubmit={handleLogin}>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Email address
                  </label>
                  <div className="mt-1">
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                    Password
                  </label>
                  <div className="mt-1">
                    <input
                      id="password"
                      name="password"
                      type="password"
                      autoComplete="current-password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    />
                  </div>
                </div>

                <div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
                  >
                    {loading ? (
                      <span className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Logging in...
                      </span>
                    ) : (
                      'Sign in'
                    )}
                  </button>
                </div>
              </form>
            ) : (
              /* MFA verification form */
              <form className="space-y-6" onSubmit={handleMfaVerify}>
                <div className="text-center mb-2">
                  <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-primary-100 mb-3">
                    <svg className="h-6 w-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Two-factor authentication
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Enter the 6-digit code from your authenticator app.
                  </p>
                </div>

                <div>
                  <label htmlFor="totp-code" className="block text-sm font-medium text-gray-700">
                    Verification code
                  </label>
                  <div className="mt-1">
                    <input
                      id="totp-code"
                      name="totp-code"
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={6}
                      autoComplete="one-time-code"
                      required
                      autoFocus
                      value={totpCode}
                      onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ''))}
                      placeholder="000000"
                      className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm text-center text-lg tracking-widest"
                    />
                  </div>
                </div>

                <div>
                  <button
                    type="submit"
                    disabled={mfaLoading || totpCode.length !== 6}
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
                  >
                    {mfaLoading ? (
                      <span className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Verifying...
                      </span>
                    ) : (
                      'Verify'
                    )}
                  </button>
                </div>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={handleBackToLogin}
                    className="text-sm text-primary-600 hover:text-primary-500"
                  >
                    &larr; Back to login
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  // Admin pages always use English
  const i18nConfig = {
    i18n: { defaultLocale: 'sv', locales: ['sv', 'en'], localeDetection: false as const },
  };
  return {
    props: {
      ...(await serverSideTranslations('en', ['common'], i18nConfig)),
    },
  };
};
