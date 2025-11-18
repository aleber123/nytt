import '../styles/globals.css';
import type { AppProps } from 'next/app';
import { appWithTranslation } from 'next-i18next';
import { Toaster } from 'react-hot-toast';
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import * as gtag from '../../lib/analytics';
import { AuthProvider } from '@/contexts/AuthContext';
import { ErrorBoundary } from '@/components/error';
import CookieBanner from '@/components/CookieBanner';
import Layout from '@/components/layout/Layout';

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
  );
}

export default appWithTranslation(MyApp);
