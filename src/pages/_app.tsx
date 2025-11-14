import '@/styles/globals.css';
import type { AppProps } from 'next/app';
import { appWithTranslation } from 'next-i18next';
import { useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from '@/contexts/AuthContext';
import { ErrorBoundary } from '@/components/error';
import CookieBanner from '@/components/CookieBanner';
import Layout from '@/components/layout/Layout';

function MyApp({ Component, pageProps }: AppProps) {
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
