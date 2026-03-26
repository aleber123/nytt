import Document, { Html, Head, Main, NextScript, DocumentContext } from 'next/document';

class MyDocument extends Document {
  static async getInitialProps(ctx: DocumentContext) {
    const initialProps = await Document.getInitialProps(ctx);
    return initialProps;
  }

  render() {
    const locale = (this.props as any)?.locale || (this.props as any)?.__NEXT_DATA__?.locale || 'sv';
    return (
      <Html lang={locale}>
        <Head>
          {/* Favicon - DOX Box logo */}
          <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
          <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
          <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
          
          {/* PWA Manifest */}
          <link rel="manifest" href="/manifest.json" />
          <meta name="theme-color" content="#1e3a5f" />
          <meta name="mobile-web-app-capable" content="yes" />
          <meta name="apple-mobile-web-app-capable" content="yes" />
          <meta name="apple-mobile-web-app-status-bar-style" content="default" />
          <meta name="apple-mobile-web-app-title" content="DOX Visumpartner" />
          
          {/* Preload LCP hero image */}
          <link rel="preload" as="image" href="/images/hero-bg.jpg" />

          {/* DNS Prefetch for performance */}
          <link rel="dns-prefetch" href="//www.googletagmanager.com" />
          <link rel="dns-prefetch" href="//www.google-analytics.com" />
          <link rel="dns-prefetch" href="//firebasestorage.googleapis.com" />
          <link rel="preconnect" href="https://www.googletagmanager.com" crossOrigin="anonymous" />
          
          {/* Fallback Open Graph tags — ensures crawlers (LinkedIn etc.) see proper data */}
          <meta property="og:type" content="website" />
          <meta property="og:site_name" content="DOX Visumpartner AB" />
          <meta property="og:title" content="DOX Visumpartner — Legalisering, Apostille & Visum" />
          <meta property="og:description" content="Sveriges ledande byrå för dokumentlegalisering och visumtjänster. Apostille, UD-legalisering, ambassadlegalisering och visum. Snabb och professionell service i Stockholm. Betjänar kunder i hela Norden." />
          <meta property="og:url" content="https://doxvl.se" />
          <meta property="og:image" content="https://doxvl.se/og-image-v2.png" />
          <meta property="og:image:width" content="1280" />
          <meta property="og:image:height" content="800" />
          <meta property="og:image:alt" content="DOX Visumpartner — Dokumentlegalisering och visumtjänster i Sverige" />
          <meta property="og:locale" content={locale === 'en' ? 'en_GB' : 'sv_SE'} />

          {/* Twitter / X card fallback */}
          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:title" content="DOX Visumpartner — Legalisering, Apostille & Visum" />
          <meta name="twitter:description" content="Sveriges ledande byrå för dokumentlegalisering och visumtjänster. Apostille, UD-legalisering, ambassadlegalisering och visum. Snabb och professionell service i Stockholm." />
          <meta name="twitter:image" content="https://doxvl.se/og-image-v2.png" />
          <meta name="twitter:image:alt" content="DOX Visumpartner — Dokumentlegalisering och visumtjänster i Sverige" />

          {/* Google Search Console verification */}
          <meta name="google-site-verification" content="7OSyvk6IivZWVTe4j94YGTyQopmMkCiQbmR2NhljTHw" />
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}

export default MyDocument;