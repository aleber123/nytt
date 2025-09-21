import { GetStaticPaths, GetStaticProps } from 'next';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import Head from 'next/head';
import Link from 'next/link';
import Layout from '../../components/layout/Layout';
import Breadcrumbs from '../../components/ui/Breadcrumbs';
import { DocumentTextIcon, ClockIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

// Sample country data - in a real app, this would come from a database or API
const countries = [
  { 
    id: 'sweden', 
    name: 'Sweden', 
    region: 'europe',
    services: ['apostille', 'notarization', 'translation'],
    requirements: 'Original documents required',
    processingTime: '3-5 business days',
    documentTypes: ['Birth Certificate', 'Marriage Certificate', 'Diploma', 'Commercial Documents'],
    description: 'Sweden is a member of the Hague Convention and accepts apostille for document legalization. For Swedish documents to be used abroad, they typically need to be legalized with an apostille from the Swedish Ministry for Foreign Affairs.',
    apostilleInfo: 'The Swedish Ministry for Foreign Affairs (UD) is responsible for issuing apostilles for Swedish documents. The process is relatively straightforward and can be completed within a few business days.',
    embassyInfo: 'For countries not part of the Hague Convention, documents must be legalized through the specific country\'s embassy or consulate in Sweden after receiving an apostille.',
    translationInfo: 'Many countries require that Swedish documents be translated by an authorized translator. We can assist with authorized translations that are accepted worldwide.'
  },
  { 
    id: 'usa', 
    name: 'USA', 
    region: 'northAmerica',
    services: ['apostille', 'embassy', 'translation'],
    requirements: 'Original documents or certified copies required',
    processingTime: '5-7 business days',
    documentTypes: ['Birth Certificate', 'Marriage Certificate', 'Diploma', 'Commercial Documents', 'Power of Attorney'],
    description: 'The United States is a member of the Hague Convention and accepts apostille for document legalization. For US documents to be used abroad, they typically need to be legalized with an apostille from the Secretary of State in the state where the document was issued.',
    apostilleInfo: 'In the US, apostilles are issued by the Secretary of State in the state where the document was issued. Federal documents are processed by the US Department of State.',
    embassyInfo: 'For countries not part of the Hague Convention, documents must be legalized through the specific country\'s embassy or consulate in the US after receiving an apostille.',
    translationInfo: 'Many countries require that US documents be translated by an authorized translator. We can assist with authorized translations that are accepted worldwide.'
  },
  { 
    id: 'china', 
    name: 'China', 
    region: 'asia',
    services: ['embassy', 'translation'],
    requirements: 'Original documents with notarization required',
    processingTime: '10-14 business days',
    documentTypes: ['Birth Certificate', 'Marriage Certificate', 'Diploma', 'Commercial Documents', 'Power of Attorney'],
    description: 'China is not a member of the Hague Convention, so documents for use in China require embassy legalization. This is a multi-step process that involves notarization, authentication by the Ministry of Foreign Affairs, and finally legalization by the Chinese embassy or consulate.',
    apostilleInfo: 'China does not accept apostille as it is not a member of the Hague Convention.',
    embassyInfo: 'Documents for use in China must go through a three-step process: notarization, authentication by the Ministry of Foreign Affairs, and legalization by the Chinese embassy or consulate.',
    translationInfo: 'All documents in foreign languages must be translated into Chinese by a translation agency recognized by the Chinese authorities.'
  },
  { 
    id: 'germany', 
    name: 'Germany', 
    region: 'europe',
    services: ['apostille', 'translation'],
    requirements: 'Original documents required',
    processingTime: '3-5 business days',
    documentTypes: ['Birth Certificate', 'Marriage Certificate', 'Diploma', 'Commercial Documents'],
    description: 'Germany is a member of the Hague Convention and accepts apostille for document legalization. For German documents to be used abroad, they typically need to be legalized with an apostille from the appropriate German authority.',
    apostilleInfo: 'In Germany, apostilles are issued by various authorities depending on the type of document. For example, court documents are apostilled by the court administration, while civil status documents are handled by local registry offices.',
    embassyInfo: 'For countries not part of the Hague Convention, documents must be legalized through the specific country\'s embassy or consulate in Germany after receiving an apostille.',
    translationInfo: 'Many countries require that German documents be translated by an authorized translator. We can assist with authorized translations that are accepted worldwide.'
  },
  { 
    id: 'brazil', 
    name: 'Brazil', 
    region: 'southAmerica',
    services: ['apostille', 'embassy', 'translation'],
    requirements: 'Original documents with notarization required',
    processingTime: '7-10 business days',
    documentTypes: ['Birth Certificate', 'Marriage Certificate', 'Diploma', 'Commercial Documents'],
    description: 'Brazil is a member of the Hague Convention and accepts apostille for document legalization. For Brazilian documents to be used abroad, they typically need to be legalized with an apostille from the appropriate Brazilian authority.',
    apostilleInfo: 'In Brazil, apostilles are issued by designated notary offices (cartórios) authorized by the National Council of Justice.',
    embassyInfo: 'For countries not part of the Hague Convention, documents must be legalized through the specific country\'s embassy or consulate in Brazil after receiving an apostille.',
    translationInfo: 'Many countries require that Brazilian documents be translated by an authorized translator. We can assist with authorized translations that are accepted worldwide.'
  },
  { 
    id: 'australia', 
    name: 'Australia', 
    region: 'oceania',
    services: ['apostille', 'translation'],
    requirements: 'Original documents required',
    processingTime: '5-7 business days',
    documentTypes: ['Birth Certificate', 'Marriage Certificate', 'Diploma', 'Commercial Documents'],
    description: 'Australia is a member of the Hague Convention and accepts apostille for document legalization. For Australian documents to be used abroad, they typically need to be legalized with an apostille from the Department of Foreign Affairs and Trade (DFAT).',
    apostilleInfo: 'In Australia, apostilles are issued by the Department of Foreign Affairs and Trade (DFAT). The process can be completed within a few business days.',
    embassyInfo: 'For countries not part of the Hague Convention, documents must be legalized through the specific country\'s embassy or consulate in Australia after receiving an apostille.',
    translationInfo: 'Many countries require that Australian documents be translated by an authorized translator. We can assist with authorized translations that are accepted worldwide.'
  },
  { 
    id: 'south-africa', 
    name: 'South Africa', 
    region: 'africa',
    services: ['apostille', 'embassy', 'translation'],
    requirements: 'Original documents required',
    processingTime: '7-10 business days',
    documentTypes: ['Birth Certificate', 'Marriage Certificate', 'Diploma', 'Commercial Documents'],
    description: 'South Africa is a member of the Hague Convention and accepts apostille for document legalization. For South African documents to be used abroad, they typically need to be legalized with an apostille from the Department of International Relations and Cooperation (DIRCO).',
    apostilleInfo: 'In South Africa, apostilles are issued by the Department of International Relations and Cooperation (DIRCO). The process typically takes 7-10 business days.',
    embassyInfo: 'For countries not part of the Hague Convention, documents must be legalized through the specific country\'s embassy or consulate in South Africa after receiving an apostille.',
    translationInfo: 'Many countries require that South African documents be translated by an authorized translator. We can assist with authorized translations that are accepted worldwide.'
  }
];

export default function CountryDetail({ country }: { country: any }) {
  const { t } = useTranslation('common');

  if (!country) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
            Country not found
          </h1>
          <p className="mt-4 text-lg text-gray-500">
            The country you are looking for does not exist in our database.
          </p>
          <div className="mt-8">
            <Link 
              href="/lander"
              className="text-primary-600 hover:text-primary-500"
            >
              &larr; Back to countries
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <Head>
        <title>{country.name} | {t('countries.title')} | Legaliseringstjänst</title>
        <meta name="description" content={`${t('countries.subtitle')} - ${country.name}`} />
      </Head>

      <div className="bg-white">
        <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
          <Breadcrumbs />
          
          <div className="lg:grid lg:grid-cols-3 lg:gap-8">
            <div className="lg:col-span-1">
              <div className="flex justify-between items-start">
                <h1 className="text-3xl font-extrabold text-gray-900">
                  {country.name}
                </h1>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${country.isHagueConvention ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>
                  {country.isHagueConvention ? t('countries.hagueConvention') : t('countries.nonHagueConvention')}
                </span>
              </div>
              
              <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">{t('countries.legalizationProcess')}</h2>
                <p className="mt-2 text-gray-700 font-medium">{country.process}</p>
                <div className="mt-3 flex flex-wrap gap-1">
                  {country.services.includes('notarization') && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      {t('services.notarization.title')}
                    </span>
                  )}
                  {country.services.includes('apostille') && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      {t('services.apostille.title')}
                    </span>
                  )}
                  {country.services.includes('ud') && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                      {t('services.ud.title')}
                    </span>
                  )}
                  {country.services.includes('embassy') && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {t('services.embassy.title')}
                    </span>
                  )}
                  {country.services.includes('translation') && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                      {t('services.translation.title')}
                    </span>
                  )}
                </div>
              </div>
              
              <p className="mt-4 text-lg text-gray-500">
                {country.description}
              </p>
              
              <div className="mt-8">
                <h2 className="text-lg font-medium text-gray-900">{t('countries.requirements')}</h2>
                <div className="mt-2 flex items-center">
                  <CheckCircleIcon className="h-5 w-5 text-green-500" />
                  <span className="ml-2 text-gray-600">{country.requirements}</span>
                </div>
              </div>
              
              <div className="mt-6">
                <h2 className="text-lg font-medium text-gray-900">{t('countries.processingTime')}</h2>
                <div className="mt-2 flex items-center">
                  <ClockIcon className="h-5 w-5 text-blue-500" />
                  <span className="ml-2 text-gray-600">{country.processingTime}</span>
                </div>
              </div>
              
              <div className="mt-6">
                <h2 className="text-lg font-medium text-gray-900">{t('countries.documentTypes')}</h2>
                <ul className="mt-2 space-y-2">
                  {country.documentTypes.map((doc: string) => (
                    <li key={doc} className="flex items-center">
                      <DocumentTextIcon className="h-5 w-5 text-gray-400" />
                      <span className="ml-2 text-gray-600">{doc}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              <div className="mt-8">
                <Link 
                  href="/bestall"
                  className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  {t('order.cta')}
                </Link>
              </div>
            </div>
            
            <div className="mt-12 lg:mt-0 lg:col-span-2">
              <div className="space-y-12">
                {country.services.includes('apostille') && (
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Apostille</h2>
                    <div className="mt-4 prose prose-primary text-gray-500">
                      <p>{country.apostilleInfo}</p>
                    </div>
                  </div>
                )}
                
                {country.services.includes('embassy') && (
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">{t('services.embassy.title')}</h2>
                    <div className="mt-4 prose prose-primary text-gray-500">
                      <p>{country.embassyInfo}</p>
                    </div>
                  </div>
                )}
                
                {country.services.includes('translation') && (
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">{t('services.translation.title')}</h2>
                    <div className="mt-4 prose prose-primary text-gray-500">
                      <p>{country.translationInfo}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export const getStaticPaths: GetStaticPaths = async ({ locales }) => {
  const paths: { params: { id: string }; locale?: string }[] = [];
  
  // Generate paths for each country in each locale
  countries.forEach((country) => {
    if (locales) {
      locales.forEach((locale) => {
        paths.push({
          params: { id: country.id },
          locale,
        });
      });
    } else {
      paths.push({
        params: { id: country.id },
      });
    }
  });
  
  return {
    paths,
    fallback: 'blocking', // Show 404 for non-existent countries
  };
};

export const getStaticProps: GetStaticProps = async ({ params, locale }) => {
  const id = params?.id as string;
  const country = countries.find((c) => c.id === id);
  
  if (!country) {
    return {
      notFound: true,
    };
  }
  
  return {
    props: {
      country,
      ...(await serverSideTranslations(locale || 'sv', ['common'])),
    },
    revalidate: 3600, // Revalidate every hour
  };
};
