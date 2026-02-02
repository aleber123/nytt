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
          {/* Google Tag (gtag.js) - GA4 + Google Ads */}
          <script
            async
            src="https://www.googletagmanager.com/gtag/js?id=G-0LMELBW76W"
          />
          <script
            dangerouslySetInnerHTML={{
              __html: `
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', 'G-0LMELBW76W');
                gtag('config', 'AW-1001886627');
                gtag('config', 'AW-940620817');
                
                // Page view conversion for Google Ads
                gtag('event', 'conversion', {
                  'send_to': 'AW-1001886627/K9N_CL7tv-EbEKOn3t0D'
                });
              `,
            }}
          />
          {/* Google Ads Conversion - Request Quote */}
          <script
            dangerouslySetInnerHTML={{
              __html: `
                function gtag_report_conversion(url) {
                  var callback = function () {
                    if (typeof(url) != 'undefined') {
                      window.location = url;
                    }
                  };
                  gtag('event', 'conversion', {
                    'send_to': 'AW-1001886627/mL9jCNbbuu8bEKOn3t0D',
                    'event_callback': callback
                  });
                  return false;
                }
              `,
            }}
          />
          
          {/* Microsoft Clarity */}
          {process.env.NEXT_PUBLIC_CLARITY_ID && (
            <script
              dangerouslySetInnerHTML={{
                __html: `
                  (function(c,l,a,r,i,t,y){
                    c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                    t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
                    y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
                  })(window, document, "clarity", "script", "${process.env.NEXT_PUBLIC_CLARITY_ID}");
                `,
              }}
            />
          )}
          
          {/* Favicon - DOX Box logo */}
          <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
          <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
          <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
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