import { GetStaticProps, GetStaticPaths } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useRouter } from 'next/router';
import Link from 'next/link';
import VisaCountryPage from '@/components/visa/VisaCountryPage';
import { getVisaCountryBySlug, getAllVisaCountrySlugs } from '@/data/visaCountries';
import type { VisaCountryData } from '@/data/visaCountries';

interface Props {
  countryData: VisaCountryData;
}

export default function VisaCountryRoute({ countryData }: Props) {
  const router = useRouter();

  if (router.isFallback || !countryData) {
    return <div className="min-h-screen flex items-center justify-center">Laddar...</div>;
  }

  // Thailand has extra sections passed as children
  if (countryData.slug === 'thailand') {
    return (
      <VisaCountryPage country={countryData}>
        <ThailandExtraSections accentColor={countryData.accentColor} />
      </VisaCountryPage>
    );
  }

  return <VisaCountryPage country={countryData} />;
}

// Thailand-specific extra sections (pensionärsvisum)
function ThailandExtraSections({ accentColor }: { accentColor: string }) {
  return (
    <section className="py-16 bg-white">
      <div className="max-w-6xl mx-auto px-4">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8">
          Pensionärsvisum till Thailand (Non-Immigrant O-A)
        </h2>
        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-gradient-to-br from-[#A51931]/5 to-[#2D2A4A]/5 p-6 rounded-lg">
            <h3 className="font-semibold text-lg mb-4">Krav för pensionärsvisum:</h3>
            <ul className="space-y-3 text-gray-700">
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                Minst 50 år gammal
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                Pension på minst 65 000 baht/månad (~21 000 kr)
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                Utdrag ur belastningsregistret
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                Läkarintyg på engelska
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                Reseförsäkring med sjukvårdstäckning
              </li>
            </ul>
          </div>
          <div>
            <p className="text-gray-700 mb-4">
              Non-Immigrant O-A är ett populärt visum för svenska pensionärer som vill
              tillbringa längre tid i Thailand. Visumet är giltigt i 1 år och tillåter
              multipla inresor.
            </p>
            <p className="text-gray-700 mb-4">
              Ansökan görs via Thailands ambassad i Stockholm och kräver flera dokument,
              inklusive pensionsintyg och läkarintyg. Vi hjälper dig genom hela processen.
            </p>
            <Link
              href="/kontakt"
              className="inline-block text-white font-semibold px-6 py-3 rounded-lg transition-colors"
              style={{ backgroundColor: accentColor }}
            >
              Få hjälp med pensionärsvisum
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

export const getStaticPaths: GetStaticPaths = async ({ locales }) => {
  const slugs = getAllVisaCountrySlugs();
  const paths: Array<{ params: { country: string }; locale?: string }> = [];

  for (const slug of slugs) {
    if (locales) {
      for (const locale of locales) {
        paths.push({ params: { country: slug }, locale });
      }
    } else {
      paths.push({ params: { country: slug } });
    }
  }

  return {
    paths,
    fallback: false,
  };
};

export const getStaticProps: GetStaticProps<Props> = async ({ params, locale }) => {
  const slug = params?.country as string;
  const countryData = getVisaCountryBySlug(slug);

  if (!countryData) {
    return { notFound: true };
  }

  return {
    props: {
      countryData,
      ...(await serverSideTranslations(locale ?? 'sv', ['common'])),
    },
  };
};
