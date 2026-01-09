import '../styles/globals.css';
import type { AppProps } from 'next/app';
import { appWithTranslation } from 'next-i18next';
import type { UserConfig } from 'next-i18next';
import { Toaster } from 'react-hot-toast';
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import * as gtag from '../../lib/analytics';
import { AuthProvider } from '@/contexts/AuthContext';
import { ErrorBoundary } from '@/components/error';
import CookieBanner from '@/components/CookieBanner';
import Layout from '@/components/layout/Layout';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GoogleReCaptchaProvider } from 'react-google-recaptcha-v3';

// Inline i18n config to avoid Firebase deployment issues with external config file
const i18nConfig: UserConfig = {
  i18n: {
    defaultLocale: 'sv',
    locales: ['sv', 'en'],
    localeDetection: false,
  },
};

// Create React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime in v4)
      refetchOnWindowFocus: false,
      retry: 2,
    },
  },
});

function MyApp({ Component, pageProps }: AppProps) {
  const router = useRouter();

  // Track page views with GA4
  useEffect(() => {
    const handleRouteChange = (url: string) => {
      gtag.pageview(url);
    };
    
    router.events.on('routeChangeComplete', handleRouteChange);
    return () => {
      router.events.off('routeChangeComplete', handleRouteChange);
    };
  }, [router.events]);

  // Add a class to the body when the component mounts
  useEffect(() => {
    document.body.classList.add('loaded');
    return () => {
      document.body.classList.remove('loaded');
    };
  }, []);

  return (
    <GoogleReCaptchaProvider
      reCaptchaKey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || ''}
      scriptProps={{
        async: true,
        defer: true,
        appendTo: 'head',
      }}
    >
      <QueryClientProvider client={queryClient}>
        <ErrorBoundary>
          <AuthProvider>
            <Layout>
              <Component {...pageProps} />
              <Toaster
                position="top-center"
                toastOptions={{
                  duration: 4000,
                  style: {
                    borderRadius: '12px',
                    fontSize: '16px',
                    maxWidth: '500px',
                  },
                }}
              />
            </Layout>
            <CookieBanner />
          </AuthProvider>
        </ErrorBoundary>
      </QueryClientProvider>
    </GoogleReCaptchaProvider>
  );
}

export default appWithTranslation(MyApp, i18nConfig);
