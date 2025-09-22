import '@/styles/globals.css';
import type { AppProps } from 'next/app';
import { appWithTranslation } from 'next-i18next';
import Layout from '@/components/layout/Layout';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from '@/contexts/AuthContext';
import { ErrorBoundary } from '@/components/error';
import CookieBanner from '@/components/CookieBanner';
import '../i18n'; // Import i18n configuration

function MyApp({ Component, pageProps }: AppProps) {
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
