import '../styles/globals.css';
import type { AppProps } from 'next/app';
import { appWithTranslation } from 'next-i18next';
import type { UserConfig } from 'next-i18next';
import { Toaster } from 'react-hot-toast';
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import Script from 'next/script';
import dynamic from 'next/dynamic';
import * as gtag from '../../lib/analytics';
import { AuthProvider } from '@/contexts/AuthContext';
import { ErrorBoundary } from '@/components/error';
import Layout from '@/components/layout/Layout';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GoogleReCaptchaProvider } from 'react-google-recaptcha-v3';

const CookieBanner = dynamic(() => import('@/components/CookieBanner'), {
  ssr: false,
});

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

  const clarityId = process.env.NEXT_PUBLIC_CLARITY_ID;

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

      {/* Google Tag Manager – loaded after page is interactive */}
      <Script
        src="https://www.googletagmanager.com/gtag/js?id=G-0LMELBW76W"
        strategy="afterInteractive"
      />
      <Script id="gtag-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-0LMELBW76W');
          gtag('config', 'AW-1001886627');
          gtag('config', 'AW-940620817');
          gtag('event', 'conversion', {
            'send_to': 'AW-1001886627/K9N_CL7tv-EbEKOn3t0D'
          });
          function gtag_report_conversion(url) {
            var callback = function () {
              if (typeof(url) != 'undefined') { window.location = url; }
            };
            gtag('event', 'conversion', {
              'send_to': 'AW-1001886627/mL9jCNbbuu8bEKOn3t0D',
              'event_callback': callback
            });
            return false;
          }
        `}
      </Script>

      {/* Microsoft Clarity – loaded lazily */}
      {clarityId && (
        <Script id="ms-clarity" strategy="lazyOnload">
          {`
            (function(c,l,a,r,i,t,y){
              c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
              t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
              y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
            })(window, document, "clarity", "script", "${clarityId}");
          `}
        </Script>
      )}
    </GoogleReCaptchaProvider>
  );
}

export default appWithTranslation(MyApp, i18nConfig);
