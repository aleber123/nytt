import { GetStaticProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import Head from 'next/head';
import Link from 'next/link';
import HeroSection from '@/components/ui/HeroSection';
import ServiceCard from '@/components/ui/ServiceCard';
import ProcessSteps from '@/components/ui/ProcessSteps';
import TestimonialSection from '@/components/ui/TestimonialSection';
import FAQSection from '@/components/ui/FAQSection';

export default function Home() {
  const { t } = useTranslation('common');
  
  const services = [
    {
      id: 'apostille',
      title: t('services.apostille.title'),
      description: t('services.apostille.description'),
      icon: 'document-check',
      link: '/tjanster/apostille'
    },
    {
      id: 'notarisering',
      title: t('services.notarization.title'),
      description: t('services.notarization.description'),
      icon: 'seal',
      link: '/tjanster/notarisering'
    },
    {
      id: 'ambassad',
      title: t('services.embassy.title'),
      description: t('services.embassy.description'),
      icon: 'building',
      link: '/tjanster/ambassadlegalisering'
    },
    {
      id: 'oversattning',
      title: t('services.translation.title'),
      description: t('services.translation.description'),
      icon: 'language',
      link: '/tjanster/oversattning'
    },
    {
      id: 'ud',
      title: 'Utrikesdepartementet',
      description: 'Legalisering av dokument hos Utrikesdepartementet för internationell användning',
      icon: 'government',
      link: '/tjanster/utrikesdepartementet'
    }
  ];

  const steps = [
    {
      id: 1,
      title: t('process.step1.title'),
      description: t('process.step1.description'),
      icon: 'form'
    },
    {
      id: 2,
      title: t('process.step2.title'),
      description: t('process.step2.description'),
      icon: 'payment'
    },
    {
      id: 3,
      title: t('process.step3.title'),
      description: t('process.step3.description'),
      icon: 'document'
    },
    {
      id: 4,
      title: t('process.step4.title'),
      description: t('process.step4.description'),
      icon: 'delivery'
    }
  ];

  return (
    <>
      <Head>
        <title>{t('home.title')} | Legaliseringstjänst</title>
        <meta name="description" content={t('home.description')} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main>
        <HeroSection 
          title={t('hero.title')}
          subtitle={t('hero.subtitle')}
          ctaText={t('hero.cta')}
          ctaLink="/bestall"
        />

        <section className="py-12 bg-white">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-heading font-bold text-center mb-12">
              {t('home.servicesTitle')}
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {services.map((service) => (
                <ServiceCard
                  key={service.id}
                  title={service.title}
                  description={service.description}
                  icon={service.icon}
                  link={service.link}
                  id={service.id}
                />
              ))}
            </div>
            
            <div className="text-center mt-10">
              <Link href="/tjanster" className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
                {t('home.allServices')}
              </Link>
            </div>
          </div>
        </section>

        <ProcessSteps 
          title={t('home.processTitle')}
          subtitle={t('home.processSubtitle')}
          steps={steps}
        />

        <TestimonialSection />

        <FAQSection />

        <section className="py-16 bg-primary-700">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-heading font-bold text-white mb-6">
              {t('home.ctaTitle')}
            </h2>
            <p className="text-xl text-white/80 mb-8 max-w-2xl mx-auto">
              {t('home.ctaText')}
            </p>
            <Link href="/bestall" className="inline-flex items-center justify-center px-8 py-4 border border-transparent text-lg font-medium rounded-md text-primary-700 bg-white hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white">
              {t('home.ctaButton')}
            </Link>
          </div>
        </section>
      </main>
    </>
  );
}

export const getStaticProps: GetStaticProps = async ({ locale }) => {
  return {
    props: {
      ...(await serverSideTranslations(locale || 'sv', ['common'])),
    },
  };
};
