import { useEffect, useState, useCallback } from 'react';
import Head from 'next/head';
import type { GetStaticProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import Link from 'next/link';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { getFirebaseAuth } from '@/firebase/config';
import {
  multiFactor,
  TotpMultiFactorGenerator,
  TotpSecret,
  MultiFactorInfo,
} from 'firebase/auth';
import { toast } from 'react-hot-toast';
import QRCode from 'qrcode';

type EnrollmentStep = 'idle' | 'generating' | 'scan' | 'verifying';

export default function AdminSecurityPage() {
  const { currentUser } = useAuth();

  // Enrollment state
  const [enrollmentStep, setEnrollmentStep] = useState<EnrollmentStep>('idle');
  const [totpSecret, setTotpSecret] = useState<TotpSecret | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [enrolling, setEnrolling] = useState(false);

  // Enrolled factors
  const [enrolledFactors, setEnrolledFactors] = useState<MultiFactorInfo[]>([]);
  const [loadingFactors, setLoadingFactors] = useState(true);
  const [unenrolling, setUnenrolling] = useState<string | null>(null);

  const loadEnrolledFactors = useCallback(() => {
    if (!currentUser) {
      setLoadingFactors(false);
      return;
    }
    try {
      const mfaUser = multiFactor(currentUser);
      setEnrolledFactors(mfaUser.enrolledFactors);
    } catch {
      setEnrolledFactors([]);
    } finally {
      setLoadingFactors(false);
    }
  }, [currentUser]);

  useEffect(() => {
    loadEnrolledFactors();
  }, [loadEnrolledFactors]);

  const hasTotpEnrolled = enrolledFactors.some(
    (f) => f.factorId === TotpMultiFactorGenerator.FACTOR_ID
  );

  const startEnrollment = async () => {
    if (!currentUser) return;
    setEnrollmentStep('generating');
    setVerificationCode('');

    try {
      const mfaUser = multiFactor(currentUser);
      const mfaSession = await mfaUser.getSession();
      const secret = await TotpMultiFactorGenerator.generateSecret(mfaSession);
      setTotpSecret(secret);

      // Generate QR code URL — use account email and app name
      const accountName = currentUser.email || 'admin';
      const issuer = 'Legaliseringstjanst Admin';
      const otpUri = secret.generateQrCodeUrl(accountName, issuer);

      // Generate QR code as data URL
      const dataUrl = await QRCode.toDataURL(otpUri, {
        width: 256,
        margin: 2,
        color: { dark: '#000000', light: '#ffffff' },
      });
      setQrDataUrl(dataUrl);
      setEnrollmentStep('scan');
    } catch (err: any) {
      const msg = err?.message || 'Could not start TOTP enrollment';
      toast.error(msg);
      setEnrollmentStep('idle');
    }
  };

  const confirmEnrollment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !totpSecret) return;
    setEnrolling(true);

    try {
      const assertion = TotpMultiFactorGenerator.assertionForEnrollment(
        totpSecret,
        verificationCode.trim()
      );
      await multiFactor(currentUser).enroll(assertion, 'Authenticator App');
      toast.success('Two-factor authentication enabled');
      setEnrollmentStep('idle');
      setTotpSecret(null);
      setQrDataUrl(null);
      setVerificationCode('');
      loadEnrolledFactors();
    } catch (err: any) {
      const msg =
        err?.code === 'auth/invalid-verification-code'
          ? 'Invalid code. Please check and try again.'
          : err?.message || 'Enrollment failed';
      toast.error(msg);
    } finally {
      setEnrolling(false);
    }
  };

  const cancelEnrollment = () => {
    setEnrollmentStep('idle');
    setTotpSecret(null);
    setQrDataUrl(null);
    setVerificationCode('');
  };

  const handleUnenroll = async (factor: MultiFactorInfo) => {
    if (!currentUser) return;
    const confirmed = window.confirm(
      'Are you sure you want to remove two-factor authentication? This will make your account less secure.'
    );
    if (!confirmed) return;

    setUnenrolling(factor.uid);
    try {
      await multiFactor(currentUser).unenroll(factor);
      toast.success('Two-factor authentication removed');
      loadEnrolledFactors();
    } catch (err: any) {
      const msg = err?.message || 'Could not remove factor';
      toast.error(msg);
    } finally {
      setUnenrolling(null);
    }
  };

  const formatDate = (timestamp: string | undefined) => {
    if (!timestamp) return 'Unknown';
    try {
      return new Date(timestamp).toLocaleDateString('sv-SE', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return timestamp;
    }
  };

  return (
    <ProtectedRoute>
      <Head>
        <title>Security | Admin</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <div className="bg-gray-100 min-h-screen">
        <div className="container mx-auto px-4 py-8">
          {/* Back link */}
          <div className="max-w-xl mx-auto mb-4">
            <Link href="/admin" className="text-sm text-primary-600 hover:text-primary-500">
              &larr; Back to Admin Panel
            </Link>
          </div>

          <div className="bg-white rounded-lg shadow p-6 max-w-xl mx-auto">
            <h1 className="text-2xl font-semibold mb-2">Security</h1>
            <p className="text-sm text-gray-600 mb-6">
              Manage two-factor authentication for your admin account.
            </p>

            {/* Current MFA status */}
            <div className="mb-8">
              <h2 className="text-lg font-medium text-gray-900 mb-3">
                Two-factor authentication (TOTP)
              </h2>

              {loadingFactors ? (
                <div className="text-gray-500 text-sm">Loading...</div>
              ) : enrolledFactors.length === 0 ? (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                  <div className="flex items-start">
                    <svg className="h-5 w-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    <div>
                      <p className="text-sm font-medium text-yellow-800">
                        Two-factor authentication is not enabled
                      </p>
                      <p className="text-sm text-yellow-700 mt-1">
                        Protect your account by enabling TOTP with an authenticator app
                        such as Google Authenticator or Microsoft Authenticator.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {enrolledFactors.map((factor) => (
                    <div
                      key={factor.uid}
                      className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center justify-between"
                    >
                      <div className="flex items-start">
                        <svg className="h-5 w-5 text-green-600 mt-0.5 mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                        <div>
                          <p className="text-sm font-medium text-green-800">
                            {factor.displayName || 'Authenticator App'}
                          </p>
                          <p className="text-xs text-green-700 mt-0.5">
                            Enrolled: {formatDate(factor.enrollmentTime)}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleUnenroll(factor)}
                        disabled={unenrolling === factor.uid}
                        className="text-sm text-red-600 hover:text-red-800 font-medium disabled:opacity-50"
                      >
                        {unenrolling === factor.uid ? 'Removing...' : 'Remove'}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Enrollment flow */}
            {!hasTotpEnrolled && enrollmentStep === 'idle' && (
              <button
                onClick={startEnrollment}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                Enable two-factor authentication
              </button>
            )}

            {enrollmentStep === 'generating' && (
              <div className="text-center py-6">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mb-3"></div>
                <p className="text-sm text-gray-600">Generating secret...</p>
              </div>
            )}

            {enrollmentStep === 'scan' && qrDataUrl && (
              <div className="border border-gray-200 rounded-lg p-6">
                <h3 className="text-md font-medium text-gray-900 mb-2">
                  Step 1: Scan QR code
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Open your authenticator app (Google Authenticator, Microsoft Authenticator, etc.)
                  and scan the QR code below.
                </p>

                <div className="flex justify-center mb-4">
                  <img
                    src={qrDataUrl}
                    alt="TOTP QR Code"
                    width={256}
                    height={256}
                    className="border border-gray-200 rounded"
                  />
                </div>

                {/* Manual entry fallback */}
                {totpSecret && (
                  <details className="mb-6">
                    <summary className="text-sm text-primary-600 cursor-pointer hover:text-primary-500">
                      Cannot scan? Enter key manually
                    </summary>
                    <div className="mt-2 bg-gray-50 rounded p-3">
                      <p className="text-xs text-gray-500 mb-1">Secret key:</p>
                      <code className="text-sm font-mono text-gray-800 break-all select-all">
                        {totpSecret.secretKey}
                      </code>
                    </div>
                  </details>
                )}

                <h3 className="text-md font-medium text-gray-900 mb-2">
                  Step 2: Enter verification code
                </h3>
                <p className="text-sm text-gray-600 mb-3">
                  Enter the 6-digit code shown in your authenticator app to confirm setup.
                </p>

                <form onSubmit={confirmEnrollment} className="space-y-4">
                  <div>
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={6}
                      autoComplete="one-time-code"
                      autoFocus
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                      placeholder="000000"
                      className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm text-center text-lg tracking-widest"
                    />
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={cancelEnrollment}
                      className="flex-1 py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={enrolling || verificationCode.length !== 6}
                      className="flex-1 flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
                    >
                      {enrolling ? (
                        <span className="flex items-center">
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Verifying...
                        </span>
                      ) : (
                        'Confirm & Enable'
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const i18nConfig = {
    i18n: { defaultLocale: 'sv', locales: ['sv', 'en'], localeDetection: false as const },
  };
  return {
    props: {
      ...(await serverSideTranslations('en', ['common'], i18nConfig)),
    },
  };
};
