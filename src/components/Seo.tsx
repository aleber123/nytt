import React from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';

interface SeoProps {
  title: string;
  description: string;
  noindex?: boolean;
}

const Seo: React.FC<SeoProps> = ({ title, description, noindex }) => {
  const router = useRouter();
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://doxvl-51a30.web.app';
  const url = `${baseUrl}${router.asPath || '/'}`;

  return (
    <Head>
      <title>{title}</title>
      <meta name="description" content={description} />
      {noindex && <meta name="robots" content="noindex, nofollow" />}

      {/* Open Graph */}
      <meta property="og:type" content="website" />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
    </Head>
  );
};

export default Seo;
