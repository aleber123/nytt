import { GetStaticProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import Head from 'next/head';
import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { createOrderWithFiles } from '@/services/hybridOrderService';
import { getCountryPricingRules, getAllActivePricingRules } from '@/firebase/pricingService';
import { toast } from 'react-hot-toast';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import ReCAPTCHA from 'react-google-recaptcha';

interface TestOrderPageProps {}

export default function TestOrderPage({}: TestOrderPageProps) {
  const { t } = useTranslation('common');
  const router = useRouter();
  const currentLocale = router.locale || 'sv';
  const [currentQuestion, setCurrentQuestion] = useState(1);
  const [answers, setAnswers] = useState({
    country: '',
    documentType: '',
    services: [] as string[],
    quantity: 1,
    expedited: false,
    documentSource: '', // 'original' or 'upload'
    pickupService: false, // New: pickup service option
    pickupAddress: { // New: pickup address
      street: '',
      postalCode: '',
      city: ''
    },
    scannedCopies: false, // New: scanned copies option
    returnService: '', // New: return service selection
    premiumDelivery: '', // New: premium delivery option (pre-12, pre-9)
    uploadedFiles: [] as File[],
    customerInfo: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      address: '',
      postalCode: '',
      city: ''
    },
    invoiceReference: '',
    additionalNotes: '',
    paymentMethod: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isInCooldown, setIsInCooldown] = useState(false);
  const submitButtonRef = useRef<HTMLButtonElement>(null);
  const submissionInProgressRef = useRef(false);
  const cooldownTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const recaptchaRef = useRef<ReCAPTCHA>(null);

  // Hague Convention countries (apostille available)
  const hagueConventionCountries = [
    'SE', 'NO', 'DK', 'FI', 'DE', 'GB', 'US', 'FR', 'ES', 'IT', 'NL', 'PL',
    'AT', 'BE', 'CH', 'CZ', 'EE', 'GR', 'HU', 'IE', 'IS', 'LI', 'LT', 'LU',
    'LV', 'MT', 'PT', 'SK', 'SI', 'BG', 'HR', 'CY', 'RO', 'TR', 'AU', 'CA',
    'JP', 'KR', 'MX', 'NZ', 'ZA'
  ];

  // Popular countries sorted by selection frequency (most popular first)
  // Mix of Hague Convention countries (HC) and non-Hague countries (require embassy legalization)
  const popularCountries = [
    { code: 'US', flag: '🇺🇸', popularity: 95 }, // HC
    { code: 'GB', flag: '🇬🇧', popularity: 85 }, // HC
    { code: 'DE', flag: '🇩🇪', popularity: 80 }, // HC
    { code: 'SE', flag: '🇸🇪', popularity: 75 }, // HC
    { code: 'TH', flag: '🇹🇭', popularity: 72 }, // Non-HC (embassy required)
    { code: 'NO', flag: '🇳🇴', popularity: 70 }, // HC
    { code: 'DK', flag: '🇩🇰', popularity: 65 }, // HC
    { code: 'FI', flag: '🇫🇮', popularity: 60 }, // HC
    { code: 'VN', flag: '🇻🇳', popularity: 58 }, // Non-HC (embassy required)
    { code: 'FR', flag: '🇫🇷', popularity: 55 }, // HC
    { code: 'IR', flag: '🇮🇷', popularity: 52 }, // Non-HC (embassy required)
    { code: 'ES', flag: '🇪🇸', popularity: 50 }, // HC
    { code: 'IT', flag: '🇮🇹', popularity: 45 }, // HC
    { code: 'BD', flag: '🇧🇩', popularity: 42 }, // Non-HC (embassy required)
    { code: 'NL', flag: '🇳🇱', popularity: 40 }, // HC
    { code: 'LK', flag: '🇱🇰', popularity: 38 }, // Non-HC (embassy required)
    { code: 'PL', flag: '🇵🇱', popularity: 35 }, // HC
    { code: 'CA', flag: '🇨🇦', popularity: 30 }, // HC
    { code: 'AU', flag: '🇦🇺', popularity: 25 }, // HC
    { code: 'TR', flag: '🇹🇷', popularity: 20 } // HC
  ];

  // Function to get translated country name
  const getCountryName = (countryCode: string) => {
    return t(`countries.names.${countryCode}`, { defaultValue: countryCode });
  };

  const allCountries = [
    // Afrika (54 länder)
    { code: 'DZ', name: 'Algeriet', flag: '🇩🇿' },
    { code: 'AO', name: 'Angola', flag: '🇦🇴' },
    { code: 'BJ', name: 'Benin', flag: '🇧🇯' },
    { code: 'BW', name: 'Botswana', flag: '🇧🇼' },
    { code: 'BF', name: 'Burkina Faso', flag: '🇧🇫' },
    { code: 'BI', name: 'Burundi', flag: '🇧🇮' },
    { code: 'CV', name: 'Kap Verde', flag: '🇨🇻' },
    { code: 'CM', name: 'Kamerun', flag: '🇨🇲' },
    { code: 'CF', name: 'Centralafrikanska republiken', flag: '🇨🇫' },
    { code: 'TD', name: 'Tchad', flag: '🇹🇩' },
    { code: 'KM', name: 'Komorerna', flag: '🇰🇲' },
    { code: 'CG', name: 'Kongo-Brazzaville', flag: '🇨🇬' },
    { code: 'CD', name: 'Kongo-Kinshasa', flag: '🇨🇩' },
    { code: 'CI', name: 'Elfenbenskusten', flag: '🇨🇮' },
    { code: 'DJ', name: 'Djibouti', flag: '🇩🇯' },
    { code: 'EG', name: 'Egypten', flag: '🇪🇬' },
    { code: 'GQ', name: 'Ekvatorialguinea', flag: '🇬🇶' },
    { code: 'ER', name: 'Eritrea', flag: '🇪🇷' },
    { code: 'SZ', name: 'Eswatini', flag: '🇸🇿' },
    { code: 'ET', name: 'Etiopien', flag: '🇪🇹' },
    { code: 'GA', name: 'Gabon', flag: '🇬🇦' },
    { code: 'GM', name: 'Gambia', flag: '🇬🇲' },
    { code: 'GH', name: 'Ghana', flag: '🇬🇭' },
    { code: 'GN', name: 'Guinea', flag: '🇬🇳' },
    { code: 'GW', name: 'Guinea-Bissau', flag: '🇬🇼' },
    { code: 'KE', name: 'Kenya', flag: '🇰🇪' },
    { code: 'LS', name: 'Lesotho', flag: '🇱🇸' },
    { code: 'LR', name: 'Liberia', flag: '🇱🇷' },
    { code: 'LY', name: 'Libyen', flag: '🇱🇾' },
    { code: 'MG', name: 'Madagaskar', flag: '🇲🇬' },
    { code: 'MW', name: 'Malawi', flag: '🇲🇼' },
    { code: 'ML', name: 'Mali', flag: '🇲🇱' },
    { code: 'MR', name: 'Mauretanien', flag: '🇲🇷' },
    { code: 'MU', name: 'Mauritius', flag: '🇲🇺' },
    { code: 'MA', name: 'Marocko', flag: '🇲🇦' },
    { code: 'MZ', name: 'Moçambique', flag: '🇲🇿' },
    { code: 'NA', name: 'Namibia', flag: '🇳🇦' },
    { code: 'NE', name: 'Niger', flag: '🇳🇪' },
    { code: 'NG', name: 'Nigeria', flag: '🇳🇬' },
    { code: 'RW', name: 'Rwanda', flag: '🇷🇼' },
    { code: 'ST', name: 'São Tomé och Príncipe', flag: '🇸🇹' },
    { code: 'SN', name: 'Senegal', flag: '🇸🇳' },
    { code: 'SC', name: 'Seychellerna', flag: '🇸🇨' },
    { code: 'SL', name: 'Sierra Leone', flag: '🇸🇱' },
    { code: 'SO', name: 'Somalia', flag: '🇸🇴' },
    { code: 'ZA', name: 'Sydafrika', flag: '🇿🇦' },
    { code: 'SS', name: 'Sydsudan', flag: '🇸🇸' },
    { code: 'SD', name: 'Sudan', flag: '🇸🇩' },
    { code: 'TZ', name: 'Tanzania', flag: '🇹🇿' },
    { code: 'TG', name: 'Togo', flag: '🇹🇬' },
    { code: 'TN', name: 'Tunisien', flag: '🇹🇳' },
    { code: 'UG', name: 'Uganda', flag: '🇺🇬' },
    { code: 'ZM', name: 'Zambia', flag: '🇿🇲' },
    { code: 'ZW', name: 'Zimbabwe', flag: '🇿🇼' },

    // Asien (48 länder)
    { code: 'AF', name: 'Afghanistan', flag: '🇦🇫' },
    { code: 'AM', name: 'Armenien', flag: '🇦🇲' },
    { code: 'AZ', name: 'Azerbajdzjan', flag: '🇦🇿' },
    { code: 'BH', name: 'Bahrain', flag: '🇧🇭' },
    { code: 'BD', name: 'Bangladesh', flag: '🇧🇩' },
    { code: 'BT', name: 'Bhutan', flag: '🇧🇹' },
    { code: 'BN', name: 'Brunei', flag: '🇧🇳' },
    { code: 'KH', name: 'Kambodja', flag: '🇰🇭' },
    { code: 'CN', name: 'Kina', flag: '🇨🇳' },
    { code: 'CY', name: 'Cypern', flag: '🇨🇾' },
    { code: 'GE', name: 'Georgien', flag: '🇬🇪' },
    { code: 'IN', name: 'Indien', flag: '🇮🇳' },
    { code: 'ID', name: 'Indonesien', flag: '🇮🇩' },
    { code: 'IR', name: 'Iran', flag: '🇮🇷' },
    { code: 'IQ', name: 'Irak', flag: '🇮🇶' },
    { code: 'IL', name: 'Israel', flag: '🇮🇱' },
    { code: 'JP', name: 'Japan', flag: '🇯🇵' },
    { code: 'JO', name: 'Jordanien', flag: '🇯🇴' },
    { code: 'KZ', name: 'Kazakstan', flag: '🇰🇿' },
    { code: 'KW', name: 'Kuwait', flag: '🇰🇼' },
    { code: 'KG', name: 'Kirgizistan', flag: '🇰🇬' },
    { code: 'LA', name: 'Laos', flag: '🇱🇦' },
    { code: 'LB', name: 'Libanon', flag: '🇱🇧' },
    { code: 'MY', name: 'Malaysia', flag: '🇲🇾' },
    { code: 'MV', name: 'Maldiverna', flag: '🇲🇻' },
    { code: 'MN', name: 'Mongoliet', flag: '🇲🇳' },
    { code: 'MM', name: 'Myanmar', flag: '🇲🇲' },
    { code: 'NP', name: 'Nepal', flag: '🇳🇵' },
    { code: 'KP', name: 'Nordkorea', flag: '🇰🇵' },
    { code: 'OM', name: 'Oman', flag: '🇴🇲' },
    { code: 'PK', name: 'Pakistan', flag: '🇵🇰' },
    { code: 'PS', name: 'Palestina', flag: '🇵🇸' },
    { code: 'PH', name: 'Filippinerna', flag: '🇵🇭' },
    { code: 'QA', name: 'Qatar', flag: '🇶🇦' },
    { code: 'SA', name: 'Saudiarabien', flag: '🇸🇦' },
    { code: 'SG', name: 'Singapore', flag: '🇸🇬' },
    { code: 'KR', name: 'Sydkorea', flag: '🇰🇷' },
    { code: 'LK', name: 'Sri Lanka', flag: '🇱🇰' },
    { code: 'SY', name: 'Syrien', flag: '🇸🇾' },
    { code: 'TW', name: 'Taiwan', flag: '🇹🇼' },
    { code: 'TJ', name: 'Tadzjikistan', flag: '🇹🇯' },
    { code: 'TH', name: 'Thailand', flag: '🇹🇭' },
    { code: 'TL', name: 'Östtimor', flag: '🇹🇱' },
    { code: 'TR', name: 'Turkiet', flag: '🇹🇷' },
    { code: 'TM', name: 'Turkmenistan', flag: '🇹🇲' },
    { code: 'AE', name: 'Förenade Arabemiraten', flag: '🇦🇪' },
    { code: 'UZ', name: 'Uzbekistan', flag: '🇺🇿' },
    { code: 'VN', name: 'Vietnam', flag: '🇻🇳' },
    { code: 'YE', name: 'Jemen', flag: '🇾🇪' },

    // Europa (44 länder)
    { code: 'AL', name: 'Albanien', flag: '🇦🇱' },
    { code: 'AD', name: 'Andorra', flag: '🇦🇩' },
    { code: 'AT', name: 'Österrike', flag: '🇦🇹' },
    { code: 'BY', name: 'Vitryssland', flag: '🇧🇾' },
    { code: 'BE', name: 'Belgien', flag: '🇧🇪' },
    { code: 'BA', name: 'Bosnien och Hercegovina', flag: '🇧🇦' },
    { code: 'BG', name: 'Bulgarien', flag: '🇧🇬' },
    { code: 'HR', name: 'Kroatien', flag: '🇭🇷' },
    { code: 'CY', name: 'Cypern', flag: '🇨🇾' },
    { code: 'CZ', name: 'Tjeckien', flag: '🇨🇿' },
    { code: 'DK', name: 'Danmark', flag: '🇩🇰' },
    { code: 'EE', name: 'Estland', flag: '🇪🇪' },
    { code: 'FI', name: 'Finland', flag: '🇫🇮' },
    { code: 'FR', name: 'Frankrike', flag: '🇫🇷' },
    { code: 'DE', name: 'Tyskland', flag: '🇩🇪' },
    { code: 'GR', name: 'Grekland', flag: '🇬🇷' },
    { code: 'HU', name: 'Ungern', flag: '🇭🇺' },
    { code: 'IS', name: 'Island', flag: '🇮🇸' },
    { code: 'IE', name: 'Irland', flag: '🇮🇪' },
    { code: 'IT', name: 'Italien', flag: '🇮🇹' },
    { code: 'LV', name: 'Lettland', flag: '🇱🇻' },
    { code: 'LI', name: 'Liechtenstein', flag: '🇱🇮' },
    { code: 'LT', name: 'Litauen', flag: '🇱🇹' },
    { code: 'LU', name: 'Luxemburg', flag: '🇱🇺' },
    { code: 'MT', name: 'Malta', flag: '🇲🇹' },
    { code: 'MD', name: 'Moldavien', flag: '🇲🇩' },
    { code: 'MC', name: 'Monaco', flag: '🇲🇨' },
    { code: 'ME', name: 'Montenegro', flag: '🇲🇪' },
    { code: 'NL', name: 'Nederländerna', flag: '🇳🇱' },
    { code: 'MK', name: 'Nordmakedonien', flag: '🇲🇰' },
    { code: 'NO', name: 'Norge', flag: '🇳🇴' },
    { code: 'PL', name: 'Polen', flag: '🇵🇱' },
    { code: 'PT', name: 'Portugal', flag: '🇵🇹' },
    { code: 'RO', name: 'Rumänien', flag: '🇷🇴' },
    { code: 'RU', name: 'Ryssland', flag: '🇷🇺' },
    { code: 'SM', name: 'San Marino', flag: '🇸🇲' },
    { code: 'RS', name: 'Serbien', flag: '🇷🇸' },
    { code: 'SK', name: 'Slovakien', flag: '🇸🇰' },
    { code: 'SI', name: 'Slovenien', flag: '🇸🇮' },
    { code: 'ES', name: 'Spanien', flag: '🇪🇸' },
    { code: 'SE', name: 'Sverige', flag: '🇸🇪' },
    { code: 'CH', name: 'Schweiz', flag: '🇨🇭' },
    { code: 'UA', name: 'Ukraina', flag: '🇺🇦' },
    { code: 'GB', name: 'Storbritannien', flag: '🇬🇧' },
    { code: 'VA', name: 'Vatikanstaten', flag: '🇻🇦' },

    // Nordamerika (23 länder)
    { code: 'AG', name: 'Antigua och Barbuda', flag: '🇦🇬' },
    { code: 'BS', name: 'Bahamas', flag: '🇧🇸' },
    { code: 'BB', name: 'Barbados', flag: '🇧🇧' },
    { code: 'BZ', name: 'Belize', flag: '🇧🇿' },
    { code: 'CA', name: 'Kanada', flag: '🇨🇦' },
    { code: 'CR', name: 'Costa Rica', flag: '🇨🇷' },
    { code: 'CU', name: 'Kuba', flag: '🇨🇺' },
    { code: 'DM', name: 'Dominica', flag: '🇩🇲' },
    { code: 'DO', name: 'Dominikanska republiken', flag: '🇩🇴' },
    { code: 'SV', name: 'El Salvador', flag: '🇸🇻' },
    { code: 'GD', name: 'Grenada', flag: '🇬🇩' },
    { code: 'GT', name: 'Guatemala', flag: '🇬🇹' },
    { code: 'HT', name: 'Haiti', flag: '🇭🇹' },
    { code: 'HN', name: 'Honduras', flag: '🇭🇳' },
    { code: 'JM', name: 'Jamaica', flag: '🇯🇲' },
    { code: 'MX', name: 'Mexiko', flag: '🇲🇽' },
    { code: 'NI', name: 'Nicaragua', flag: '🇳🇮' },
    { code: 'PA', name: 'Panama', flag: '🇵🇦' },
    { code: 'KN', name: 'Saint Kitts och Nevis', flag: '🇰🇳' },
    { code: 'LC', name: 'Saint Lucia', flag: '🇱🇨' },
    { code: 'VC', name: 'Saint Vincent och Grenadinerna', flag: '🇻🇨' },
    { code: 'TT', name: 'Trinidad och Tobago', flag: '🇹🇹' },
    { code: 'US', name: 'USA', flag: '🇺🇸' },

    // Sydamerika (12 länder)
    { code: 'AR', name: 'Argentina', flag: '🇦🇷' },
    { code: 'BO', name: 'Bolivia', flag: '🇧🇴' },
    { code: 'BR', name: 'Brasilien', flag: '🇧🇷' },
    { code: 'CL', name: 'Chile', flag: '🇨🇱' },
    { code: 'CO', name: 'Colombia', flag: '🇨🇴' },
    { code: 'EC', name: 'Ecuador', flag: '🇪🇨' },
    { code: 'GY', name: 'Guyana', flag: '🇬🇾' },
    { code: 'PY', name: 'Paraguay', flag: '🇵🇾' },
    { code: 'PE', name: 'Peru', flag: '🇵🇪' },
    { code: 'SR', name: 'Surinam', flag: '🇸🇷' },
    { code: 'UY', name: 'Uruguay', flag: '🇺🇾' },
    { code: 'VE', name: 'Venezuela', flag: '🇻🇪' },

    // Oceanien (14 länder)
    { code: 'AU', name: 'Australien', flag: '🇦🇺' },
    { code: 'FJ', name: 'Fiji', flag: '🇫🇯' },
    { code: 'KI', name: 'Kiribati', flag: '🇰🇮' },
    { code: 'MH', name: 'Marshallöarna', flag: '🇲🇭' },
    { code: 'FM', name: 'Mikronesiska federationen', flag: '🇫🇲' },
    { code: 'NR', name: 'Nauru', flag: '🇳🇷' },
    { code: 'NZ', name: 'Nya Zeeland', flag: '🇳🇿' },
    { code: 'PW', name: 'Palau', flag: '🇵🇼' },
    { code: 'PG', name: 'Papua Nya Guinea', flag: '🇵🇬' },
    { code: 'WS', name: 'Samoa', flag: '🇼🇸' },
    { code: 'SB', name: 'Salomonöarna', flag: '🇸🇧' },
    { code: 'TO', name: 'Tonga', flag: '🇹🇴' },
    { code: 'TV', name: 'Tuvalu', flag: '🇹🇻' },
    { code: 'VU', name: 'Vanuatu', flag: '🇻🇺' },

    // Övriga
    { code: 'other', name: 'Annat land', flag: '🌍' }
  ];

  const [countrySearch, setCountrySearch] = useState('');
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const filteredCountries = allCountries.filter(country => {
    if (!countrySearch.trim()) return false;

    const searchTerm = countrySearch.toLowerCase().trim();
    const countryName = country.name.toLowerCase();
    const countryCode = country.code.toLowerCase();

    // Prioritize countries that START with the search term
    if (countryName.startsWith(searchTerm)) return true;
    if (countryCode.startsWith(searchTerm)) return true;

    // Then include countries that CONTAIN the search term (but with lower priority)
    if (countryName.includes(searchTerm)) return true;
    if (countryCode.includes(searchTerm)) return true;

    return false;
  }).sort((a, b) => {
    const searchTerm = countrySearch.toLowerCase().trim();
    const aName = a.name.toLowerCase();
    const bName = b.name.toLowerCase();
    const aCode = a.code.toLowerCase();
    const bCode = b.code.toLowerCase();

    // Sort by priority: starts with > contains
    const aStartsWith = aName.startsWith(searchTerm) || aCode.startsWith(searchTerm);
    const bStartsWith = bName.startsWith(searchTerm) || bCode.startsWith(searchTerm);

    if (aStartsWith && !bStartsWith) return -1;
    if (!aStartsWith && bStartsWith) return 1;

    // If both start with or both contain, sort alphabetically
    return a.name.localeCompare(b.name);
  });

  const isHagueConventionCountry = (countryCode: string) => {
    return hagueConventionCountries.includes(countryCode);
  };

  const [availableServices, setAvailableServices] = useState<any[]>([]);
  const [loadingServices, setLoadingServices] = useState(false);
  const [returnServices, setReturnServices] = useState<any[]>([]);
  const [loadingReturnServices, setLoadingReturnServices] = useState(false);

  // Load services when country changes
  useEffect(() => {
    if (answers.country) {
      loadAvailableServices(answers.country);
    }
  }, [answers.country]);

  // Load return services on component mount
  useEffect(() => {
    loadReturnServices();
  }, []);

  // Scroll to top when moving between steps
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentQuestion]);

  // Update uploadedFiles array when quantity changes and documentSource is 'upload'
  useEffect(() => {
    if (answers.documentSource === 'upload') {
      setAnswers(prev => {
        const currentLength = prev.uploadedFiles.length;
        if (currentLength !== prev.quantity) {
          // If quantity changed, adjust the uploadedFiles array
          if (currentLength < prev.quantity) {
            // Add null values for new slots
            const newFiles = [...prev.uploadedFiles, ...new Array(prev.quantity - currentLength).fill(null)];
            return { ...prev, uploadedFiles: newFiles };
          } else {
            // Remove excess files
            return { ...prev, uploadedFiles: prev.uploadedFiles.slice(0, prev.quantity) };
          }
        }
        return prev;
      });
    }
  }, [answers.quantity, answers.documentSource]);

  // Disable submit button when submitting or in cooldown
  useEffect(() => {
    if (submitButtonRef.current) {
      submitButtonRef.current.disabled = isSubmitting || submissionInProgressRef.current || isInCooldown;
    }
  }, [isSubmitting, isInCooldown]);

  // Cleanup: reset submission state if component unmounts
  useEffect(() => {
    return () => {
      submissionInProgressRef.current = false;
      if (cooldownTimeoutRef.current) {
        clearTimeout(cooldownTimeoutRef.current);
      }
    };
  }, []);

  const loadAvailableServices = async (countryCode: string) => {
    try {
      setLoadingServices(true);
      const isHagueCountry = isHagueConventionCountry(countryCode);

      // Try to load standard services from Sweden (SE) first
      try {
        const standardPricingRules = await getCountryPricingRules('SE');
        console.log('✅ Loaded standard services from Sweden:', standardPricingRules.length, 'rules');

        // Also try to load country-specific embassy services
        let countrySpecificRules: any[] = [];
        try {
          countrySpecificRules = await getCountryPricingRules(countryCode);
          console.log('✅ Loaded country-specific services:', countrySpecificRules.length, 'rules');
        } catch (countryError) {
          console.log('⚠️ No country-specific services found for', countryCode);
        }

        // Combine standard services with country-specific services, but deduplicate by serviceType
        // Country-specific rules take precedence over standard rules
        const pricingRulesMap = new Map();

        // Add standard rules first
        standardPricingRules.forEach(rule => {
          pricingRulesMap.set(rule.serviceType, rule);
        });

        // Override with country-specific rules
        countrySpecificRules.forEach(rule => {
          pricingRulesMap.set(rule.serviceType, rule);
        });

        const allPricingRules = Array.from(pricingRulesMap.values());

        if (allPricingRules && allPricingRules.length > 0) {
           console.log('🔍 All pricing rules (deduplicated):', allPricingRules.map(r => ({ id: r.id, serviceType: r.serviceType, basePrice: r.basePrice })));

           // Filter services based on country type to ensure logical consistency
           let filteredPricingRules = allPricingRules;

           if (isHagueCountry) {
             // For Hague Convention countries: exclude UD and embassy services
             filteredPricingRules = allPricingRules.filter(rule =>
               !['ud', 'embassy'].includes(rule.serviceType)
             );
             console.log('🌍 Filtered for Hague country (excluded ud, embassy):', filteredPricingRules.length, 'services');
           } else {
             // For non-Hague countries: exclude apostille
             filteredPricingRules = allPricingRules.filter(rule =>
               rule.serviceType !== 'apostille'
             );
             console.log('🏛️ Filtered for non-Hague country (excluded apostille):', filteredPricingRules.length, 'services');
           }

           // Convert pricing rules to service objects
           const servicesFromFirebase = filteredPricingRules.map(rule => {
             // Translation prices vary by document, so show "På förfrågan" instead of fixed price
             const price = rule.serviceType === 'translation' ? 'På förfrågan' : `${rule.basePrice} kr`;

             return {
               id: rule.serviceType,
               name: getServiceName(rule.serviceType),
               description: getServiceDescription(rule.serviceType, isHagueCountry),
               price: price,
               available: true,
               processingTime: rule.processingTime?.standard || 5
             };
           });

           // Sort services by step order: steg 1, steg 2, steg 3, then translation last
           const getStepOrder = (serviceId: string) => {
             const stepOrders: { [key: string]: number } = {
               'chamber': 1,      // Steg 1: Handelskammaren
               'notarization': 1, // Steg 1: Notarisering
               'ud': 2,           // Steg 2: UD Sverige
               'embassy': 3,      // Steg 3: Ambassad
               'apostille': 1,    // Steg 1: Apostille (for Hague countries)
               'translation': 4   // Last: Auktoriserad översättning
             };
             return stepOrders[serviceId] || 99;
           };

           const sortedServices = servicesFromFirebase.sort((a, b) => {
             const stepA = getStepOrder(a.id);
             const stepB = getStepOrder(b.id);
             if (stepA !== stepB) {
               return stepA - stepB;
             }
             // If same step, maintain original order
             return 0;
           });

           console.log('🔄 Services from Firebase (filtered & sorted):', sortedServices.map(s => ({ id: s.id, price: s.price })));

           setAvailableServices(sortedServices);
           return;
         }
      } catch (firebaseError) {
        console.log('⚠️ Firebase pricing failed, using mock data:', firebaseError instanceof Error ? firebaseError.message : String(firebaseError));
      }

      // Fallback to mock pricing service
      console.log('📊 Using mock pricing service');

      // Services based on country type
      let availableServicesList = [];

      if (isHagueCountry) {
        // Hague Convention countries (like Sweden) - only these 3 services
        availableServicesList = [
          {
            id: 'translation',
            name: 'Auktoriserad översättning',
            description: 'Översättning av dokument',
            price: 'På förfrågan',
            available: true
          },
          {
            id: 'notarization',
            name: 'Notarisering',
            description: 'Officiell notarisering av dokument',
            price: '1300 kr',
            available: true
          },
          {
            id: 'apostille',
            name: 'Apostille',
            description: 'För länder som är anslutna till Haagkonventionen',
            price: '950 kr',
            available: true
          }
        ];
      } else {
        // Non-Hague countries - embassy legalization process
        availableServicesList = [
          {
            id: 'translation',
            name: 'Auktoriserad översättning',
            description: 'Översättning av dokument',
            price: 'På förfrågan',
            available: true
          },
          {
            id: 'chamber',
            name: 'Handelskammarens legalisering',
            description: 'Legaliserng av handelsdokument genom Handelskammaren',
            price: '2400 kr',
            available: true
          },
          {
            id: 'notarization',
            name: 'Notarisering',
            description: 'Officiell notarisering av dokument',
            price: '1300 kr',
            available: true
          },
          {
            id: 'ud',
            name: 'Utrikesdepartementet',
            description: 'Legaliserng hos svenska UD för icke-Haagkonventionsländer',
            price: '1750 kr',
            available: true
          },
          {
            id: 'embassy',
            name: 'Ambassadlegalisering',
            description: 'Slutlig legalisering via det valda landets ambassad eller konsulat i Sverige',
            price: 'Från 1295 kr',
            available: true
          }
        ];
      }

      // Sort services by step order: steg 1, steg 2, steg 3, then translation last
      const getStepOrder = (serviceId: string) => {
        const stepOrders: { [key: string]: number } = {
          'chamber': 1,      // Steg 1: Handelskammaren
          'notarization': 1, // Steg 1: Notarisering
          'ud': 2,           // Steg 2: UD Sverige
          'embassy': 3,      // Steg 3: Ambassad
          'apostille': 1,    // Steg 1: Apostille (for Hague countries)
          'translation': 4   // Last: Auktoriserad översättning
        };
        return stepOrders[serviceId] || 99;
      };

      const sortedServicesList = availableServicesList.sort((a, b) => {
        const stepA = getStepOrder(a.id);
        const stepB = getStepOrder(b.id);
        if (stepA !== stepB) {
          return stepA - stepB;
        }
        // If same step, maintain original order
        return 0;
      });

      setAvailableServices(sortedServicesList);

    } catch (error) {
      console.error('❌ Error loading services:', error);
      // Final fallback - ensure core services are always available
      const isHagueCountry = isHagueConventionCountry(countryCode);
      let fallbackServices = [];

      if (isHagueCountry) {
        // Hague Convention countries - only these 3 services
        fallbackServices = [
          { id: 'translation', name: 'Auktoriserad översättning', description: 'Översättning av dokument', price: 'På förfrågan', available: true },
          { id: 'notarization', name: 'Notarisering', description: 'Officiell notarisering av dokument', price: '1300 kr', available: true },
          { id: 'apostille', name: 'Apostille', description: 'För länder som är anslutna till Haagkonventionen', price: '950 kr', available: true }
        ];
      } else {
        // Non-Hague countries - embassy legalization process
        fallbackServices = [
          { id: 'translation', name: 'Auktoriserad översättning', description: 'Översättning av dokument', price: 'På förfrågan', available: true },
          { id: 'chamber', name: 'Handelskammarens legalisering', description: 'Legaliserng av handelsdokument genom Handelskammaren', price: '2400 kr', available: true },
          { id: 'notarization', name: 'Notarisering', description: 'Officiell notarisering av dokument', price: '1300 kr', available: true },
          { id: 'ud', name: 'Utrikesdepartementet', description: 'Legaliserng hos svenska UD för icke-Haagkonventionsländer', price: '1750 kr', available: true },
          { id: 'embassy', name: 'Ambassadlegalisering', description: 'Slutlig legalisering via det valda landets ambassad eller konsulat i Sverige', price: 'Från 1295 kr', available: true }
        ];
      }

      // Sort services by step order: steg 1, steg 2, steg 3, then translation last
      const getStepOrder = (serviceId: string) => {
        const stepOrders: { [key: string]: number } = {
          'chamber': 1,      // Steg 1: Handelskammaren
          'notarization': 1, // Steg 1: Notarisering
          'ud': 2,           // Steg 2: UD Sverige
          'embassy': 3,      // Steg 3: Ambassad
          'apostille': 1,    // Steg 1: Apostille (for Hague countries)
          'translation': 4   // Last: Auktoriserad översättning
        };
        return stepOrders[serviceId] || 99;
      };

      const sortedFallbackServices = fallbackServices.sort((a, b) => {
        const stepA = getStepOrder(a.id);
        const stepB = getStepOrder(b.id);
        if (stepA !== stepB) {
          return stepA - stepB;
        }
        // If same step, maintain original order
        return 0;
      });

      setAvailableServices(sortedFallbackServices);
    } finally {
      setLoadingServices(false);
    }
  };

  const loadReturnServices = async () => {
    try {
      setLoadingReturnServices(true);
      const allRules = await getAllActivePricingRules();

      // Filter to only shipping services (same as admin page)
      const shippingRules = allRules.filter(rule =>
        ['postnord-rek', 'dhl-sweden', 'dhl-europe', 'dhl-worldwide', 'dhl-pre-12', 'dhl-pre-9', 'stockholm-city', 'stockholm-express', 'stockholm-sameday'].includes(rule.serviceType)
      );

      // Convert pricing rules to service objects
      const servicesFromFirebase = shippingRules.map(rule => ({
        id: rule.serviceType,
        name: getShippingServiceName(rule.serviceType),
        description: getShippingServiceDescription(rule.serviceType),
        price: `Från ${rule.basePrice} kr`,
        provider: getShippingProvider(rule.serviceType),
        estimatedDelivery: getShippingDeliveryTime(rule.serviceType),
        available: true
      }));

      // Merge with default services (like admin page does)
      const defaultReturnServices = [
        {
          id: 'postnord-rek',
          name: 'PostNord REK',
          description: 'Rekommenderat brev - spårbart och försäkrat',
          price: 'Från 85 kr',
          provider: 'PostNord',
          estimatedDelivery: '2-5 arbetsdagar',
          available: true
        },
        {
          id: 'dhl-sweden',
          name: 'DHL Sweden',
          description: 'DHL leverans inom Sverige',
          price: 'Från 180 kr',
          provider: 'DHL',
          estimatedDelivery: '1-2 arbetsdagar',
          available: true
        },
        {
          id: 'dhl-europe',
          name: 'DHL Europe',
          description: 'DHL leverans inom Europa',
          price: 'Från 250 kr',
          provider: 'DHL',
          estimatedDelivery: '2-4 arbetsdagar',
          available: true
        },
        {
          id: 'dhl-worldwide',
          name: 'DHL Worldwide',
          description: 'DHL internationell leverans',
          price: 'Från 450 kr',
          provider: 'DHL',
          estimatedDelivery: '3-7 arbetsdagar',
          available: true
        },
        {
          id: 'dhl-pre-12',
          name: 'DHL Pre 12',
          description: 'Leverans före klockan 12:00 nästa arbetsdag',
          price: 'Från 350 kr',
          provider: 'DHL',
          estimatedDelivery: 'Nästa arbetsdag före 12:00',
          available: true
        },
        {
          id: 'dhl-pre-9',
          name: 'DHL Pre 9',
          description: 'Leverans före klockan 09:00 nästa arbetsdag',
          price: 'Från 450 kr',
          provider: 'DHL',
          estimatedDelivery: 'Nästa arbetsdag före 09:00',
          available: true
        },
        {
          id: 'stockholm-city',
          name: 'Stockholm City Courier',
          description: 'Lokal budservice inom Stockholm',
          price: 'Från 120 kr',
          provider: 'Lokal',
          estimatedDelivery: 'Samma dag (före 16:00)',
          available: true
        },
        {
          id: 'stockholm-express',
          name: 'Stockholm Express',
          description: 'Expressleverans inom Stockholm samma dag',
          price: 'Från 180 kr',
          provider: 'Lokal',
          estimatedDelivery: '2-4 timmar',
          available: true
        },
        {
          id: 'stockholm-sameday',
          name: 'Stockholm Same Day',
          description: 'Samma dags leverans inom Stockholm',
          price: 'Från 250 kr',
          provider: 'Lokal',
          estimatedDelivery: 'Inom 2 timmar',
          available: true
        }
      ];

      // Merge Firebase services with defaults, Firebase takes precedence
      const mergedServices = defaultReturnServices.map(defaultService => {
        const existingRule = servicesFromFirebase.find(rule => rule.id === defaultService.id);
        if (existingRule) {
          return existingRule;
        }
        return defaultService;
      });

      setReturnServices(mergedServices);
    } catch (error) {
      console.error('Error loading return services:', error);
      // Use default services if Firebase fails
      const defaultReturnServices = [
        {
          id: 'postnord-rek',
          name: 'PostNord REK',
          description: 'Rekommenderat brev - spårbart och försäkrat',
          price: 'Från 85 kr',
          provider: 'PostNord',
          estimatedDelivery: '2-5 arbetsdagar',
          available: true
        },
        {
          id: 'dhl-sweden',
          name: 'DHL Sweden',
          description: 'DHL leverans inom Sverige',
          price: 'Från 180 kr',
          provider: 'DHL',
          estimatedDelivery: '1-2 arbetsdagar',
          available: true
        }
      ];
      setReturnServices(defaultReturnServices);
    } finally {
      setLoadingReturnServices(false);
    }
  };

  const getServiceName = (serviceType: string) => {
    const names: { [key: string]: string } = {
      apostille: t('services.apostille.title'),
      notarization: t('services.notarization.title'),
      embassy: t('services.embassy.title'),
      ud: t('services.ud.title'),
      translation: t('services.translation.title'),
      chamber: t('services.chamber.title')
    };
    return names[serviceType] || serviceType;
  };

  const getServiceDescription = (serviceType: string, isHagueCountry: boolean) => {
    const descriptions: { [key: string]: string } = {
      apostille: t('services.apostille.description'),
      notarization: t('services.notarization.description'),
      embassy: t('services.embassy.description'),
      ud: t('services.ud.description'),
      translation: t('services.translation.description'),
      chamber: t('services.chamber.title') + ' - ' + t('services.chamber.description')
    };
    return descriptions[serviceType] || '';
  };

  const getShippingServiceName = (serviceType: string) => {
    const names: { [key: string]: string } = {
      'postnord-rek': 'PostNord REK',
      'dhl-sweden': 'DHL Sweden',
      'dhl-europe': 'DHL Europe',
      'dhl-worldwide': 'DHL Worldwide',
      'dhl-pre-12': 'DHL Pre 12',
      'dhl-pre-9': 'DHL Pre 9',
      'stockholm-city': 'Stockholm City Courier',
      'stockholm-express': 'Stockholm Express',
      'stockholm-sameday': 'Stockholm Same Day'
    };
    return names[serviceType] || serviceType;
  };

  const getShippingServiceDescription = (serviceType: string) => {
    const descriptions: { [key: string]: string } = {
      'postnord-rek': 'Rekommenderat brev - spårbart och försäkrat',
      'dhl-sweden': 'DHL leverans inom Sverige',
      'dhl-europe': 'DHL leverans inom Europa',
      'dhl-worldwide': 'DHL internationell leverans',
      'dhl-pre-12': 'Leverans före klockan 12:00 nästa arbetsdag',
      'dhl-pre-9': 'Leverans före klockan 09:00 nästa arbetsdag',
      'stockholm-city': 'Lokal budservice inom Stockholm',
      'stockholm-express': 'Expressleverans inom Stockholm samma dag',
      'stockholm-sameday': 'Samma dags leverans inom Stockholm'
    };
    return descriptions[serviceType] || '';
  };

  const getShippingProvider = (serviceType: string) => {
    const providers: { [key: string]: string } = {
      'postnord-rek': 'PostNord',
      'dhl-sweden': 'DHL',
      'dhl-europe': 'DHL',
      'dhl-worldwide': 'DHL',
      'dhl-pre-12': 'DHL',
      'dhl-pre-9': 'DHL',
      'stockholm-city': 'Lokal',
      'stockholm-express': 'Lokal',
      'stockholm-sameday': 'Lokal'
    };
    return providers[serviceType] || 'Okänd';
  };

  const getShippingDeliveryTime = (serviceType: string) => {
    const deliveryTimes: { [key: string]: string } = {
      'postnord-rek': '2-5 arbetsdagar',
      'dhl-sweden': '1-2 arbetsdagar',
      'dhl-europe': '2-4 arbetsdagar',
      'dhl-worldwide': '3-7 arbetsdagar',
      'dhl-pre-12': 'Nästa arbetsdag före 12:00',
      'dhl-pre-9': 'Nästa arbetsdag före 09:00',
      'stockholm-city': 'Samma dag (före 16:00)',
      'stockholm-express': '2-4 timmar',
      'stockholm-sameday': 'Inom 2 timmar'
    };
    return deliveryTimes[serviceType] || '';
  };

  const getAvailableServices = (countryCode: string) => {
    return availableServices;
  };

  // Handle clicking outside dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowCountryDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCountrySelect = (countryCode: string) => {
    setAnswers(prev => ({ ...prev, country: countryCode }));
    setCountrySearch(getCountryName(countryCode));
    setShowCountryDropdown(false);

    // Track country selection for future popularity ranking
    console.log(`Country selected: ${countryCode}`);

    setCurrentQuestion(2);
  };

  const handleCustomCountrySubmit = () => {
    if (countrySearch.trim() && !answers.country) {
      // Create a custom country entry
      const customCountry = {
        code: 'custom',
        name: countrySearch.trim(),
        flag: '🌍'
      };
      setAnswers(prev => ({ ...prev, country: 'custom' }));
      setShowCountryDropdown(false);
      setCurrentQuestion(2);
    }
  };

  const renderQuestion1 = () => (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          {t('orderFlow.step1.title')}
        </h1>
        <p className="text-lg text-gray-600">
          {t('orderFlow.step1.subtitle')}
        </p>
      </div>

      <div className="space-y-4">
        <div className="relative" ref={dropdownRef}>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('orderFlow.step1.searchLabel')}
          </label>
          <input
            type="text"
            value={countrySearch}
            onChange={(e) => {
              setCountrySearch(e.target.value);
              setShowCountryDropdown(true);
            }}
            onFocus={() => setShowCountryDropdown(true)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && countrySearch.trim() && filteredCountries.length === 0) {
                handleCustomCountrySubmit();
              }
            }}
            placeholder={t('orderFlow.step1.searchPlaceholder')}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-custom-button focus:border-custom-button text-lg"
          />

          {showCountryDropdown && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
              {filteredCountries.length > 0 ? (
                filteredCountries.slice(0, 10).map((country) => (
                  <button
                    key={country.code}
                    onClick={() => {
                      handleCountrySelect(country.code);
                      setCountrySearch(getCountryName(country.code));
                      setShowCountryDropdown(false);
                    }}
                    className="w-full px-4 py-3 text-left hover:bg-gray-50 focus:outline-none focus:bg-gray-50 flex items-center"
                  >
                    <span className="text-2xl mr-3">{country.flag}</span>
                    <span className="text-gray-900">{getCountryName(country.code)}</span>
                    {isHagueConventionCountry(country.code) && (
                      <span className="ml-auto text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                        {t('orderFlow.step1.hagueConvention')}
                      </span>
                    )}
                  </button>
                ))
              ) : countrySearch.trim() ? (
                <button
                  onClick={handleCustomCountrySubmit}
                  className="w-full px-4 py-3 text-left hover:bg-gray-50 focus:outline-none focus:bg-gray-50 flex items-center"
                >
                  <span className="text-2xl mr-3">🌍</span>
                  <span className="text-gray-900">Använd "{countrySearch}" som land</span>
                  <span className="ml-auto text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                    Annat land
                  </span>
                </button>
              ) : null}
            </div>
          )}
        </div>

        {/* Popular countries quick select */}
        {!answers.country && (
          <div className="mt-6">
            <h3 className="text-sm font-medium text-gray-700 mb-3">
              {t('orderFlow.step1.popularCountries')}
            </h3>
            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {popularCountries.map((country) => (
                <button
                  key={country.code}
                  onClick={() => handleCountrySelect(country.code)}
                  className="flex flex-col items-center p-3 border-2 border-gray-200 rounded-lg hover:border-custom-button hover:bg-custom-button-bg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-custom-button focus:border-custom-button"
                >
                  <span className="text-2xl mb-1">{country.flag}</span>
                  <span className="text-xs font-medium text-gray-900 text-center">
                    {getCountryName(country.code)}
                  </span>
                  {isHagueConventionCountry(country.code) && (
                    <span className="text-xs bg-green-100 text-green-800 px-1 py-0.5 rounded mt-1">
                      {t('orderFlow.step1.apostilleAvailable')}
                    </span>
                  )}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {t('orderFlow.step1.apostilleAvailableForHague')}
            </p>
          </div>
        )}

        {answers.country && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center">
              <span className="text-2xl mr-3">
                {allCountries.find(c => c.code === answers.country)?.flag}
              </span>
              <div>
                <div className="font-medium text-green-900">
                  {getCountryName(answers.country)}
                </div>
                <div className="text-sm text-green-700">
                  {isHagueConventionCountry(answers.country)
                    ? t('orderFlow.step1.hagueDescription')
                    : t('orderFlow.step1.embassyDescription')
                  }
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-between">
          <button
            onClick={() => router.push('/')}
            className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            {t('orderFlow.backButton')}
          </button>
          {answers.country && (
            <button
              onClick={() => setCurrentQuestion(2)}
              className="px-6 py-2 bg-custom-button text-white rounded-md hover:bg-custom-button-hover"
            >
              {t('orderFlow.nextButton')}
            </button>
          )}
        </div>
      </div>
    </div>
  );

  const renderQuestion2 = () => (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          {t('orderFlow.step2.title')}
        </h1>
        <p className="text-lg text-gray-600">
          {t('orderFlow.step2.subtitle')}
        </p>
      </div>

      <div className="space-y-4">
        {[
          { id: 'birthCertificate', name: t('orderFlow.step2.birthCertificate') },
          { id: 'marriageCertificate', name: t('orderFlow.step2.marriageCertificate') },
          { id: 'diploma', name: t('orderFlow.step2.diploma') },
          { id: 'commercial', name: t('orderFlow.step2.commercial') },
          { id: 'powerOfAttorney', name: t('orderFlow.step2.powerOfAttorney') },
          { id: 'other', name: t('orderFlow.step2.other') }
        ].map((docType) => (
          <button
            key={docType.id}
            onClick={() => {
              setAnswers(prev => ({ ...prev, documentType: docType.id }));
              setCurrentQuestion(3);
            }}
            className="w-full p-6 border-2 border-gray-200 rounded-lg hover:border-custom-button hover:bg-custom-button-bg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-custom-button focus:border-custom-button text-left"
          >
            <span className="text-lg font-medium text-gray-900">{docType.name}</span>
          </button>
        ))}
      </div>

      <div className="mt-8 flex justify-between">
        <button
          onClick={() => setCurrentQuestion(1)}
          className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
        >
          {t('orderFlow.backToPrevious')}
        </button>
      </div>
    </div>
  );

  const renderQuestion3 = () => (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          {t('orderFlow.step3.title')}
        </h1>
        <p className="text-lg text-gray-600">
          {t('orderFlow.step3.subtitle')}
        </p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-center">
          <span className="text-2xl mr-3">
            {allCountries.find(c => c.code === answers.country)?.flag}
          </span>
          <div>
            <div className="font-medium text-blue-900">
              {t('orderFlow.step3.selectedCountry', { country: allCountries.find(c => c.code === answers.country)?.name })}
            </div>
            <div className="text-sm text-blue-700">
              {t('orderFlow.step3.selectedDocument', {
                document: answers.documentType === 'birthCertificate' ? t('orderFlow.step2.birthCertificate') :
                          answers.documentType === 'marriageCertificate' ? t('orderFlow.step2.marriageCertificate') :
                          answers.documentType === 'diploma' ? t('orderFlow.step2.diploma') :
                          answers.documentType === 'commercial' ? t('orderFlow.step2.commercial') :
                          answers.documentType === 'powerOfAttorney' ? t('orderFlow.step2.powerOfAttorney') : t('orderFlow.step2.other')
              })}
            </div>
          </div>
        </div>
      </div>

      {!isHagueConventionCountry(answers.country) && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
          <div className="flex items-start">
            <span className="text-2xl mr-3">ℹ️</span>
            <div>
              <h4 className="font-medium text-amber-900 mb-2">{t('orderFlow.step3.nonHagueProcess.title')}</h4>
              <div className="text-sm text-amber-800 space-y-1">
                <div><strong>{t('orderFlow.step3.nonHagueProcess.step1')}</strong></div>
                <div><strong>{t('orderFlow.step3.nonHagueProcess.step2')}</strong></div>
                <div><strong>{t('orderFlow.step3.nonHagueProcess.step3')}</strong></div>
              </div>
              <p className="text-xs text-amber-700 mt-2">
                <strong>{t('orderFlow.step3.nonHagueProcess.tip')}</strong> {t('orderFlow.step3.nonHagueProcess.tipText')}
              </p>
              <p className="text-xs text-amber-700 mt-2">
                {t('orderFlow.step3.nonHagueProcess.note')}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {getAvailableServices(answers.country).map((service) => {
          const isSelected = answers.services.includes(service.id);
          return (
            <div
              key={service.id}
              onClick={() => {
                if (isSelected) {
                  setAnswers(prev => ({
                    ...prev,
                    services: prev.services.filter(s => s !== service.id)
                  }));
                } else {
                  setAnswers(prev => ({
                    ...prev,
                    services: [...prev.services, service.id]
                  }));
                }
              }}
              className={`border-2 rounded-lg p-4 cursor-pointer transition-all duration-200 ${
                isSelected
                  ? 'border-custom-button bg-custom-button-bg shadow-md'
                  : 'border-gray-200 hover:border-custom-button-light hover:bg-gray-50'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-medium text-gray-900 mb-1">{service.name}</h3>
                  <p className="text-gray-600 mb-2">{service.description}</p>
                  <span className="text-custom-button font-medium">{service.price}</span>
                  {service.id === 'apostille' && (
                    <div className="mt-2">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                        {t('orderFlow.step3.apostilleRecommended')}
                      </span>
                    </div>
                  )}
                  {service.id === 'chamber' && (
                    <div className="mt-2">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-orange-100 text-orange-800">
                        {t('orderFlow.step3.chamberStep')}
                      </span>
                      <p className="text-xs text-gray-600 mt-1">{t('orderFlow.step3.chamberDescription')}</p>
                    </div>
                  )}
                  {service.id === 'notarization' && (
                    <div className="mt-2">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                        {t('orderFlow.step3.notarizationStep')}
                      </span>
                      <p className="text-xs text-gray-600 mt-1">{t('orderFlow.step3.notarizationDescription')}</p>
                    </div>
                  )}
                  {service.id === 'ud' && (
                    <div className="mt-2">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-800">
                        {t('orderFlow.step3.udStep')}
                      </span>
                    </div>
                  )}
                  {service.id === 'embassy' && (
                    <div className="mt-2">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                        {t('orderFlow.step3.embassyStep')}
                      </span>
                    </div>
                  )}
                </div>
                <div className="ml-4 flex-shrink-0">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={(e) => {
                      // Prevent event bubbling when clicking checkbox directly
                      e.stopPropagation();
                      if (e.target.checked) {
                        setAnswers(prev => ({
                          ...prev,
                          services: [...prev.services, service.id]
                        }));
                      } else {
                        setAnswers(prev => ({
                          ...prev,
                          services: prev.services.filter(s => s !== service.id)
                        }));
                      }
                    }}
                    className="h-5 w-5 accent-custom-button rounded focus:ring-custom-button pointer-events-none"
                    readOnly
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-8 flex justify-between">
        <button
          onClick={() => setCurrentQuestion(2)}
          className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
        >
          {t('orderFlow.backToPrevious')}
        </button>
        <button
          onClick={() => setCurrentQuestion(4)}
          disabled={answers.services.length === 0}
          className={`px-6 py-2 rounded-md font-medium ${
            answers.services.length > 0
              ? 'bg-custom-button text-white hover:bg-custom-button-hover'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          {t('orderFlow.continueButton')}
        </button>
      </div>
    </div>
  );

  const renderQuestion4 = () => (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          {t('orderFlow.step4.title')}
        </h1>
        <p className="text-lg text-gray-600">
          {t('orderFlow.step4.subtitle')}
        </p>
      </div>

      <div className="flex items-center justify-center space-x-4 mb-8">
        <button
          onClick={() => setAnswers(prev => ({ ...prev, quantity: Math.max(1, prev.quantity - 1) }))}
          className="w-12 h-12 rounded-full border-2 border-gray-300 flex items-center justify-center hover:border-primary-500 hover:bg-primary-50"
        >
          <span className="text-2xl">{t('orderFlow.step4.decrease')}</span>
        </button>

        <div className="text-center">
          <div className="text-4xl font-bold text-custom-button mb-2">{answers.quantity}</div>
          <div className="text-gray-600">{t('orderFlow.step4.quantityLabel')}</div>
        </div>

        <button
          onClick={() => setAnswers(prev => ({ ...prev, quantity: Math.min(10, prev.quantity + 1) }))}
          className="w-12 h-12 rounded-full border-2 border-gray-300 flex items-center justify-center hover:border-custom-button hover:bg-custom-button-bg"
        >
          <span className="text-2xl">{t('orderFlow.step4.increase')}</span>
        </button>
      </div>


      <div className="mt-8 flex justify-between">
        <button
          onClick={() => setCurrentQuestion(3)}
          className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
        >
          {t('orderFlow.backToPrevious')}
        </button>
        <button
          onClick={() => setCurrentQuestion(5)}
          className="px-6 py-2 bg-custom-button text-white rounded-md hover:bg-custom-button-hover"
        >
          {t('orderFlow.nextButton')}
        </button>
      </div>
    </div>
  );

  const renderQuestion5 = () => (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          {t('orderFlow.step5.title')}
        </h1>
        <p className="text-lg text-gray-600">
          {t('orderFlow.step5.subtitle')}
        </p>
      </div>

      <div className="space-y-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <span className="text-2xl mr-3">📄</span>
            <div>
              <div className="font-medium text-blue-900">
                {t('orderFlow.step5.selectedQuantity', { quantity: answers.quantity })}
              </div>
              <div className="text-sm text-blue-700">
                {t('orderFlow.step5.quantityNote')}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <button
            onClick={() => {
              setAnswers(prev => ({ ...prev, documentSource: 'original', uploadedFiles: [] }));
              setCurrentQuestion(6);
            }}
            className={`w-full p-6 border-2 rounded-lg hover:border-custom-button transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-custom-button focus:border-custom-button ${
              answers.documentSource === 'original' ? 'border-custom-button bg-custom-button-bg' : 'border-gray-200'
            }`}
          >
            <div className="flex items-center">
              <div className="text-left">
                <div className="text-lg font-medium text-gray-900">{t('orderFlow.step5.originalDocuments')}</div>
                <div className="text-gray-600">{t('orderFlow.step5.originalDescription')}</div>
              </div>
            </div>
          </button>

          <button
            onClick={() => {
              setAnswers(prev => ({
                ...prev,
                documentSource: 'upload',
                uploadedFiles: new Array(prev.quantity).fill(null) // Initialize with null values for each document
              }));
              setCurrentQuestion(6);
            }}
            className={`w-full p-6 border-2 rounded-lg hover:border-custom-button transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-custom-button focus:border-custom-button ${
              answers.documentSource === 'upload' ? 'border-custom-button bg-custom-button-bg' : 'border-gray-200'
            }`}
          >
            <div className="flex items-center">
              <div className="text-left">
                <div className="text-lg font-medium text-gray-900">{t('orderFlow.step5.uploadDocuments')}</div>
                <div className="text-gray-600">{t('orderFlow.step5.uploadDescription')}</div>
              </div>
            </div>
          </button>
        </div>
      </div>

      <div className="mt-8 flex justify-between">
        <button
          onClick={() => setCurrentQuestion(4)}
          className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
        >
          {t('orderFlow.backToPrevious')}
        </button>
        {answers.documentSource && (
          <button
            onClick={() => setCurrentQuestion(6)}
            className="px-6 py-2 bg-custom-button text-white rounded-md hover:bg-custom-button-hover"
          >
            {t('orderFlow.nextButton')}
          </button>
        )}
      </div>
    </div>
  );

  const renderQuestion6 = () => {
    // Only show pickup service step if original documents are selected
    if (answers.documentSource === 'upload') {
      // Skip to return service step for uploaded documents
      setCurrentQuestion(9);
      return null;
    }
    if (answers.documentSource !== 'original') {
      // Skip to return service step for other cases
      setCurrentQuestion(9);
      return null;
    }

    return (
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            {t('orderFlow.step6.title')}
          </h1>
          <p className="text-lg text-gray-600">
            {t('orderFlow.step6.subtitle')}
          </p>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <div>
              <div className="font-medium text-green-900">
                {t('orderFlow.step6.pickupPrice')}
              </div>
              <div className="text-sm text-green-700">
                {t('orderFlow.step6.pickupNote')}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <button
            onClick={() => {
              setAnswers(prev => ({
                ...prev,
                pickupService: false,
                pickupAddress: { street: '', postalCode: '', city: '' }
              }));
              setCurrentQuestion(7);
            }}
            className={`w-full p-6 border-2 rounded-lg hover:border-custom-button transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-custom-button focus:border-custom-button ${
              answers.pickupService === false ? 'border-custom-button bg-custom-button-bg' : 'border-gray-200'
            }`}
          >
            <div className="flex items-center">
              <div className="text-left">
                <div className="text-lg font-medium text-gray-900">{t('orderFlow.step6.noPickup')}</div>
                <div className="text-gray-600">{t('orderFlow.step6.noPickupDescription')}</div>
              </div>
            </div>
          </button>

          <button
            onClick={() => {
              setAnswers(prev => ({ ...prev, pickupService: true }));
              setCurrentQuestion(7); // Go to pickup address step
            }}
            className={`w-full p-6 border-2 rounded-lg hover:border-custom-button transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-custom-button focus:border-custom-button ${
              answers.pickupService === true ? 'border-custom-button bg-custom-button-bg' : 'border-gray-200'
            }`}
          >
            <div className="flex items-center">
              <div className="text-left">
                <div className="text-lg font-medium text-gray-900">{t('orderFlow.step6.yesPickup')}</div>
                <div className="text-gray-600">{t('orderFlow.step6.yesPickupDescription')}</div>
              </div>
            </div>
          </button>
        </div>

        <div className="mt-8 flex justify-between">
          <button
            onClick={() => setCurrentQuestion(9)}
            className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            {t('orderFlow.backToPrevious')}
          </button>
          {answers.pickupService !== undefined && (
            <button
              onClick={() => setCurrentQuestion(7)}
              className="px-6 py-2 bg-custom-button text-white rounded-md hover:bg-custom-button-hover"
            >
              {t('orderFlow.nextButton')}
            </button>
          )}
        </div>
      </div>
    );
  };

  const renderQuestion7 = () => {
    // Show shipping instructions step if customer chose to send documents themselves
    if (!answers.pickupService && answers.documentSource === 'original') {
      return (
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              {t('orderFlow.step7.title')}
            </h1>
            <p className="text-lg text-gray-600">
              {t('orderFlow.step7.subtitle')}
            </p>
          </div>

          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-red-900 mb-2">
                  {t('orderFlow.step7.shippingAddressTitle')}
                </h3>
                <div className="bg-white border border-red-200 rounded-lg p-4 mb-3" id="shipping-address">
                  <div className="font-medium text-gray-900 mb-1">{t('orderFlow.step7.companyName')}</div>
                  <div className="text-gray-700">{t('orderFlow.step7.attention')}</div>
                  <div className="text-gray-700">{t('orderFlow.step7.street')}</div>
                  <div className="text-gray-700">{t('orderFlow.step7.postalCode')} {t('orderFlow.step7.city')}</div>
                  <div className="text-gray-700">{t('orderFlow.step7.country')}</div>
                </div>
              </div>
              <div className="ml-4">
                <button
                  onClick={() => {
                    // Create a print-specific window with only the address
                    const printWindow = window.open('', '_blank', 'width=600,height=400');
                    if (printWindow) {
                      printWindow.document.write(`
                        <html>
                          <head>
                            <title>LegaliseringsTjänst AB - Leveransadress</title>
                            <style>
                              body {
                                font-family: Arial, sans-serif;
                                margin: 40px;
                                text-align: center;
                              }
                              .address {
                                border: 2px solid #dc2626;
                                padding: 20px;
                                border-radius: 8px;
                                background: #fef2f2;
                                display: inline-block;
                                margin: 20px 0;
                              }
                              .company {
                                font-weight: bold;
                                font-size: 18px;
                                color: #1f2937;
                                margin-bottom: 8px;
                              }
                              .address-line {
                                color: #374151;
                                margin: 4px 0;
                              }
                              @media print {
                                body { margin: 20px; }
                              }
                            </style>
                          </head>
                          <body>
                            <h2>${t('orderFlow.step7.shippingAddressTitle')}</h2>
                            <div class="address">
                              <div class="company">${t('orderFlow.step7.companyName')}</div>
                              <div class="address-line">${t('orderFlow.step7.attention')}</div>
                              <div class="address-line">${t('orderFlow.step7.street')}</div>
                              <div class="address-line">${t('orderFlow.step7.postalCode')} ${t('orderFlow.step7.city')}</div>
                              <div class="address-line">${t('orderFlow.step7.country')}</div>
                            </div>
                          </body>
                        </html>
                      `);
                      printWindow.document.close();
                      printWindow.focus();
                      setTimeout(() => {
                        printWindow.print();
                        printWindow.close();
                      }, 250);
                    }
                  }}
                  className="flex items-center justify-center w-12 h-12 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition-colors duration-200"
                  title={t('orderFlow.step7.printAddress')}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          <div className="mt-8 flex justify-between">
            <button
              onClick={() => setCurrentQuestion(6)}
              className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              {t('orderFlow.backToPrevious')}
            </button>
            <button
              onClick={() => setCurrentQuestion(8)}
              className="px-6 py-2 bg-custom-button text-white rounded-md hover:bg-custom-button-hover"
            >
              {t('orderFlow.nextButton')}
            </button>
          </div>
        </div>
      );
    }

    // For uploaded documents, skip this step entirely and go to return service selection
    if (answers.documentSource === 'upload') {
      setCurrentQuestion(9);
      return null;
    }

    // Only show pickup address step if pickup service is selected
    if (!answers.pickupService) {
      // Skip to return service step
      setCurrentQuestion(9);
      return null;
    }

    return (
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            {t('orderFlow.pickupAddress.title')}
          </h1>
          <p className="text-lg text-gray-600">
            {t('orderFlow.pickupAddress.subtitle')}
          </p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <span className="text-2xl mr-3">🚚</span>
            <div>
              <div className="font-medium text-blue-900">
                {t('orderFlow.step9.pickupOrdered')}
              </div>
              <div className="text-sm text-blue-700">
                {t('orderFlow.step9.pickupContact')}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('orderFlow.pickupAddress.street')} {t('orderFlow.step9.requiredField')}
            </label>
            <input
              type="text"
              value={answers.pickupAddress.street}
              onChange={(e) => setAnswers(prev => ({
                ...prev,
                pickupAddress: { ...prev.pickupAddress, street: e.target.value }
              }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-custom-button"
              placeholder={t('orderFlow.pickupAddress.streetPlaceholder')}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('orderFlow.pickupAddress.postalCode')} {t('orderFlow.step9.requiredField')}
              </label>
              <input
                type="text"
                value={answers.pickupAddress.postalCode}
                onChange={(e) => setAnswers(prev => ({
                  ...prev,
                  pickupAddress: { ...prev.pickupAddress, postalCode: e.target.value }
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-custom-button"
                placeholder={t('orderFlow.pickupAddress.postalCodePlaceholder')}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('orderFlow.pickupAddress.city')} {t('orderFlow.step9.requiredField')}
              </label>
              <input
                type="text"
                value={answers.pickupAddress.city}
                onChange={(e) => setAnswers(prev => ({
                  ...prev,
                  pickupAddress: { ...prev.pickupAddress, city: e.target.value }
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-custom-button"
                placeholder={t('orderFlow.pickupAddress.cityPlaceholder')}
              />
            </div>
          </div>
        </div>

        <div className="mt-8 flex justify-between">
          <button
            onClick={() => setCurrentQuestion(6)}
            className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            {t('orderFlow.backToPrevious')}
          </button>
          <button
            onClick={() => setCurrentQuestion(8)}
            disabled={!answers.pickupAddress.street || !answers.pickupAddress.postalCode || !answers.pickupAddress.city}
            className={`px-6 py-2 rounded-md font-medium ${
              answers.pickupAddress.street && answers.pickupAddress.postalCode && answers.pickupAddress.city
                ? 'bg-custom-button text-white hover:bg-custom-button-hover'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {t('orderFlow.nextButton')}
          </button>
        </div>
      </div>
    );
  };

  const renderQuestion8 = () => {
    // Show scanned copies step for all document sources

    return (
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            {t('orderFlow.step8.title')}
          </h1>
          <p className="text-lg text-gray-600">
            {t('orderFlow.step8.subtitle')}
          </p>
        </div>


        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <span className="text-2xl mr-3">📄</span>
            <div>
              <div className="font-medium text-blue-900">
                {t('orderFlow.step8.selectedQuantity', { quantity: answers.quantity })}
              </div>
              <div className="text-sm text-blue-700">
                {t('orderFlow.step8.scannedCopiesPrice')}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <button
            onClick={() => {
              setAnswers(prev => ({ ...prev, scannedCopies: false }));
              setCurrentQuestion(9); // Go to return service selection
            }}
            className={`w-full p-6 border-2 rounded-lg hover:border-custom-button transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-custom-button focus:border-custom-button ${
              answers.scannedCopies === false ? 'border-custom-button bg-custom-button-bg' : 'border-gray-200'
            }`}
          >
            <div className="flex items-center">
              <div className="text-left">
                <div className="text-lg font-medium text-gray-900">{t('orderFlow.step8.noCopies')}</div>
                <div className="text-gray-600">{t('orderFlow.step8.noCopiesDescription')}</div>
              </div>
            </div>
          </button>

          <button
            onClick={() => {
              setAnswers(prev => ({ ...prev, scannedCopies: true }));
              setCurrentQuestion(9); // Go to return service selection
            }}
            className={`w-full p-6 border-2 rounded-lg hover:border-custom-button transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-custom-button focus:border-custom-button ${
              answers.scannedCopies === true ? 'border-custom-button bg-custom-button-bg' : 'border-gray-200'
            }`}
          >
            <div className="flex items-center">
              <div className="text-left">
                <div className="text-lg font-medium text-gray-900">{t('orderFlow.step8.yesCopies')}</div>
                <div className="text-gray-600">{t('orderFlow.step8.yesCopiesDescription')}</div>
              </div>
            </div>
          </button>
        </div>

        <div className="mt-8 flex justify-between">
          <button
            onClick={() => {
              // Go back to step 7 if pickup service, otherwise step 6 if original documents, otherwise step 5
              if (answers.pickupService) {
                setCurrentQuestion(7);
              } else if (answers.documentSource === 'original') {
                setCurrentQuestion(6);
              } else {
                setCurrentQuestion(5);
              }
            }}
            className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            {t('orderFlow.backToPrevious')}
          </button>
          {answers.scannedCopies !== undefined && (
            <button
              onClick={() => setCurrentQuestion(9)} // Go to return service selection
              className="px-6 py-2 bg-custom-button text-white rounded-md hover:bg-custom-button-hover"
            >
              {t('orderFlow.continueButton')}
            </button>
          )}
        </div>
      </div>
    );
  };

  const renderQuestion9 = () => (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          {t('orderFlow.step9.title')}
        </h1>
        <p className="text-lg text-gray-600">
          {t('orderFlow.step9.subtitle')}
        </p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-center">
          <span className="text-2xl mr-3">📦</span>
          <div>
            <div className="font-medium text-blue-900">
              {t('orderFlow.step9.returnNote')}
            </div>
            <div className="text-sm text-blue-700">
              {t('orderFlow.step9.returnDescription')}
            </div>
          </div>
        </div>
      </div>

      {loadingReturnServices ? (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">{t('orderFlow.step10.loadingServices')}</span>
        </div>
      ) : (
        <div className="space-y-4">
          {returnServices
            .filter(service => !['dhl-pre-12', 'dhl-pre-9', 'stockholm-express', 'stockholm-sameday'].includes(service.id)) // Filter out premium delivery options
            .map((service) => (
            <div key={service.id}>
              <button
                onClick={() => {
                  setAnswers(prev => ({
                    ...prev,
                    returnService: service.id,
                    premiumDelivery: '' // Reset premium delivery when changing base service
                  }));
                  // Don't automatically advance - let user select premium options first
                }}
                className={`w-full p-6 border-2 rounded-lg hover:border-custom-button transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-custom-button focus:border-custom-button ${
                  answers.returnService === service.id ? 'border-custom-button bg-custom-button-bg' : 'border-gray-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="text-left">
                      <div className="text-lg font-medium text-gray-900">{service.name}</div>
                      <div className="text-gray-600">{service.description}</div>
                      <div className="text-sm text-gray-500 mt-1">Leveranstid: {service.estimatedDelivery}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-semibold text-custom-button">{service.price}</div>
                    <div className="text-xs text-gray-500">{service.provider}</div>
                  </div>
                </div>
              </button>

              {/* Show premium delivery options for DHL services */}
              {answers.returnService === service.id && ['dhl-sweden', 'dhl-europe', 'dhl-worldwide'].includes(service.id) && (
                <div className="mt-4 ml-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="text-sm font-medium text-blue-900 mb-3">🚀 Premiumleverans (valfritt)</h4>
                  <div className="space-y-3">
                    {returnServices
                      .filter(premium => ['dhl-pre-12', 'dhl-pre-9'].includes(premium.id))
                      .map((premium) => (
                        <label key={premium.id} className="flex items-center space-x-3 cursor-pointer">
                          <input
                            type="radio"
                            name="premium-delivery"
                            value={premium.id}
                            checked={answers.premiumDelivery === premium.id}
                            onChange={(e) => setAnswers(prev => ({ ...prev, premiumDelivery: e.target.value }))}
                            className="h-4 w-4 text-custom-button focus:ring-custom-button border-gray-300"
                          />
                          <div className="flex-1">
                            <div className="text-sm font-medium text-gray-900">{premium.name}</div>
                            <div className="text-xs text-gray-600">{premium.description}</div>
                            <div className="text-xs text-gray-500">Leveranstid: {premium.estimatedDelivery}</div>
                          </div>
                          <div className="text-sm font-semibold text-custom-button">{premium.price}</div>
                        </label>
                      ))}
                  </div>
                </div>
              )}

              {/* Show premium delivery options for Stockholm City Courier */}
              {answers.returnService === service.id && service.id === 'stockholm-city' && (
                <div className="mt-4 ml-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <h4 className="text-sm font-medium text-green-900 mb-3">⚡ Expressleverans (valfritt)</h4>
                  <div className="space-y-3">
                    {returnServices
                      .filter(premium => ['stockholm-express', 'stockholm-sameday'].includes(premium.id))
                      .map((premium) => (
                        <label key={premium.id} className="flex items-center space-x-3 cursor-pointer">
                          <input
                            type="radio"
                            name="premium-delivery"
                            value={premium.id}
                            checked={answers.premiumDelivery === premium.id}
                            onChange={(e) => setAnswers(prev => ({ ...prev, premiumDelivery: e.target.value }))}
                            className="h-4 w-4 text-custom-button focus:ring-custom-button border-gray-300"
                          />
                          <div className="flex-1">
                            <div className="text-sm font-medium text-gray-900">{premium.name}</div>
                            <div className="text-xs text-gray-600">{premium.description}</div>
                            <div className="text-xs text-gray-500">Leveranstid: {premium.estimatedDelivery}</div>
                          </div>
                          <div className="text-sm font-semibold text-custom-button">{premium.price}</div>
                        </label>
                      ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Disclaimer for variable pricing */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mt-6 mb-6">
        <div className="flex items-start">
          <span className="text-2xl mr-3">⚠️</span>
          <div>
            <h4 className="font-medium text-amber-900 mb-1">Observera: Priserna kan variera</h4>
            <p className="text-sm text-amber-800">
              De angivna priserna är från-priser och kan variera beroende på vikt, storlek och destinationsadress.
              Det slutgiltiga priset bekräftas vid leverans.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-8 flex justify-between">
        <button
          onClick={() => setCurrentQuestion(8)}
          className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
        >
          {t('orderFlow.backToPrevious')}
        </button>
        {answers.returnService && (
          <button
            onClick={() => setCurrentQuestion(10)}
            className="px-6 py-2 bg-custom-button text-white rounded-md hover:bg-custom-button-hover"
          >
            {t('orderFlow.continueButton')}
          </button>
        )}
      </div>
    </div>
  );

  const renderQuestion10 = () => (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          {t('orderFlow.step10.title')}
        </h1>
        <p className="text-lg text-gray-600">
          {t('orderFlow.step10.subtitle')}
        </p>
      </div>

      {/* Final Order Summary */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
        <h3 className="text-lg font-semibold text-green-900 mb-4">
          {t('orderFlow.step10.summaryTitle')}
        </h3>

        <div className="space-y-3">
          {/* Country and Document Type */}
          <div className="flex justify-between items-center py-2 border-b border-green-200">
            <span className="text-gray-700">{t('orderFlow.step10.country')}:</span>
            <span className="font-medium text-gray-900">
              {allCountries.find(c => c.code === answers.country)?.name} {allCountries.find(c => c.code === answers.country)?.flag}
            </span>
          </div>

          <div className="flex justify-between items-center py-2 border-b border-green-200">
            <span className="text-gray-700">{t('orderFlow.step10.documentType')}:</span>
            <span className="font-medium text-gray-900">
              {answers.documentType === 'birthCertificate' ? t('orderFlow.step2.birthCertificate') :
               answers.documentType === 'marriageCertificate' ? t('orderFlow.step2.marriageCertificate') :
               answers.documentType === 'diploma' ? t('orderFlow.step2.diploma') :
               answers.documentType === 'commercial' ? t('orderFlow.step2.commercial') :
               answers.documentType === 'powerOfAttorney' ? t('orderFlow.step2.powerOfAttorney') : t('orderFlow.step2.other')}
            </span>
          </div>

          <div className="flex justify-between items-center py-2 border-b border-green-200">
            <span className="text-gray-700">{t('orderFlow.step10.quantity')}:</span>
            <span className="font-medium text-gray-900">{answers.quantity} st</span>
          </div>

          {/* Selected Services */}
          <div className="py-2">
            <span className="text-gray-700 font-medium">{t('orderFlow.step10.services')}:</span>
            <div className="mt-2 space-y-1">
              {answers.services.map((serviceId) => {
                const service = availableServices.find(s => s.id === serviceId);
                return service ? (
                  <div key={serviceId} className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">• {service.name}</span>
                    <span className="font-medium text-gray-900">{service.price}</span>
                  </div>
                ) : null;
              })}
            </div>
          </div>

          {/* Additional Services */}
          {answers.expedited && (
            <div className="flex justify-between items-center py-2 border-b border-green-200">
              <span className="text-gray-700">{t('orderFlow.step10.expedited')}:</span>
              <span className="font-medium text-gray-900">500 kr</span>
            </div>
          )}

          {answers.pickupService && (
            <div className="flex justify-between items-center py-2 border-b border-green-200">
              <span className="text-gray-700">{t('orderFlow.step10.pickup')}:</span>
              <span className="font-medium text-gray-900">Från 450 kr</span>
            </div>
          )}

          {answers.scannedCopies && (
            <div className="flex justify-between items-center py-2 border-b border-green-200">
              <span className="text-gray-700">{t('orderFlow.step10.scannedCopies', { quantity: answers.quantity })}:</span>
              <span className="font-medium text-gray-900">{200 * answers.quantity} kr</span>
            </div>
          )}

          {answers.returnService && (
            <div className="flex justify-between items-center py-2 border-b border-green-200">
              <span className="text-gray-700">{t('orderFlow.step10.returnShipping')}:</span>
              <span className="font-medium text-gray-900">
                {(() => {
                  const returnService = returnServices.find(s => s.id === answers.returnService);
                  let totalReturnCost = 0;

                  if (returnService && returnService.price) {
                    const priceMatch = returnService.price.match(/(\d+)/);
                    if (priceMatch) {
                      totalReturnCost += parseInt(priceMatch[1]);
                    }
                  }

                  // Add premium delivery cost
                  if (answers.premiumDelivery) {
                    const premiumService = returnServices.find(s => s.id === answers.premiumDelivery);
                    if (premiumService && premiumService.price) {
                      const priceMatch = premiumService.price.match(/(\d+)/);
                      if (priceMatch) {
                        totalReturnCost += parseInt(priceMatch[1]);
                      }
                    }
                  }

                  return `${totalReturnCost} kr`;
                })()}
              </span>
            </div>
          )}

          {answers.premiumDelivery && (
            <div className="flex justify-between items-center py-2 border-b border-green-200">
              <span className="text-gray-700">Premiumleverans:</span>
              <span className="font-medium text-gray-900">
                {(() => {
                  const premiumService = returnServices.find(s => s.id === answers.premiumDelivery);
                  if (premiumService && premiumService.price) {
                    const priceMatch = premiumService.price.match(/(\d+)/);
                    return priceMatch ? `${priceMatch[1]} kr` : premiumService.price;
                  }
                  return '0 kr';
                })()}
              </span>
            </div>
          )}

          {/* Total Price */}
          <div className="flex justify-between items-center py-3 border-t-2 border-green-300 bg-green-100 -mx-6 px-6 rounded-b-lg">
            <span className="text-lg font-semibold text-green-900">{t('orderFlow.step10.total')}:</span>
            <span className="text-xl font-bold text-green-900">
              {(() => {
                // Calculate total price using same logic as order submission
                let total = 0;

                // Add service prices using Firebase pricing (same as order submission)
                answers.services.forEach(serviceId => {
                  const service = availableServices.find(s => s.id === serviceId);
                  if (service && service.price) {
                    // Extract numeric value from price string (e.g., "2000 kr" -> 2000)
                    const priceMatch = service.price.match(/(\d+)/);
                    if (priceMatch) {
                      total += parseInt(priceMatch[1]) * answers.quantity;
                    }
                  }
                });

                // Add additional fees (same as order submission)
                if (answers.expedited) total += 500;
                if (answers.pickupService) total += 450; // Updated pickup service base price
                if (answers.scannedCopies) total += 200 * answers.quantity;

                // Add return service cost
                if (answers.returnService) {
                  const returnService = returnServices.find(s => s.id === answers.returnService);
                  if (returnService && returnService.price) {
                    const priceMatch = returnService.price.match(/(\d+)/);
                    if (priceMatch) {
                      total += parseInt(priceMatch[1]);
                    }
                  }
                }

                // Add premium delivery cost
                if (answers.premiumDelivery) {
                  const premiumService = returnServices.find(s => s.id === answers.premiumDelivery);
                  if (premiumService && premiumService.price) {
                    const priceMatch = premiumService.price.match(/(\d+)/);
                    if (priceMatch) {
                      total += parseInt(priceMatch[1]);
                    }
                  }
                }

                return `${total.toLocaleString()} kr`;
              })()}
            </span>
          </div>
        </div>
      </div>

      {answers.documentSource === 'upload' ? (
        <div className="space-y-4">
          {/* File Upload Section - Moved to top */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <span className="text-2xl mr-3">📎</span>
              <div>
                <div className="font-medium text-green-900">
                  Upload {answers.quantity} documents
                </div>
                <div className="text-sm text-green-700">
                  Upload documents in PDF, JPG, PNG format. Files must be clear and readable.
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {Array.from({ length: answers.quantity }, (_, index) => (
              <div key={index} className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-custom-button transition-colors">
                <div className="text-center">
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setAnswers(prev => {
                          const newFiles = [...prev.uploadedFiles];
                          newFiles[index] = file;
                          return { ...prev, uploadedFiles: newFiles };
                        });
                      }
                    }}
                    className="hidden"
                    id={`file-upload-${index}`}
                  />
                  <label
                    htmlFor={`file-upload-${index}`}
                    className="cursor-pointer flex flex-col items-center"
                  >
                    <span className="text-4xl mb-2">📄</span>
                    <span className="text-lg font-medium text-gray-900 mb-1">
                      Document {index + 1}
                    </span>
                    {answers.uploadedFiles[index] ? (
                      <span className="text-sm text-green-600 font-medium">
                        ✓ {answers.uploadedFiles[index].name}
                      </span>
                    ) : (
                      <span className="text-sm text-gray-600">
                        Choose file
                      </span>
                    )}
                  </label>
                </div>
              </div>
            ))}
          </div>


          {/* Terms and Conditions Acceptance */}
          <div className="pt-4">
            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  id="terms-acceptance-original"
                  name="terms-acceptance-original"
                  type="checkbox"
                  className="h-4 w-4 text-custom-button focus:ring-custom-button border-gray-300 rounded"
                  required
                />
              </div>
              <div className="ml-3 text-sm">
                <label htmlFor="terms-acceptance-original" className="text-gray-700">
                  {t('orderFlow.step10.termsAcceptance')}
                </label>
              </div>
            </div>
          </div>

          {/* Customer Information Form */}
          <div className="mt-8 space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Kunduppgifter</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('orderFlow.step10.firstName')} {t('orderFlow.step10.requiredField')}
                </label>
                <input
                  type="text"
                  value={answers.customerInfo.firstName}
                  onChange={(e) => setAnswers(prev => ({
                    ...prev,
                    customerInfo: { ...prev.customerInfo, firstName: e.target.value }
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder={t('orderFlow.step10.firstNamePlaceholder')}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('orderFlow.step10.lastName')} {t('orderFlow.step10.requiredField')}
                </label>
                <input
                  type="text"
                  value={answers.customerInfo.lastName}
                  onChange={(e) => setAnswers(prev => ({
                    ...prev,
                    customerInfo: { ...prev.customerInfo, lastName: e.target.value }
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder={t('orderFlow.step10.lastNamePlaceholder')}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('orderFlow.step10.email')} {t('orderFlow.step10.requiredField')}
              </label>
              <input
                type="email"
                value={answers.customerInfo.email}
                onChange={(e) => setAnswers(prev => ({
                  ...prev,
                  customerInfo: { ...prev.customerInfo, email: e.target.value }
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder={t('orderFlow.step10.emailPlaceholder')}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('orderFlow.step10.phone')} {t('orderFlow.step10.requiredField')}
              </label>
              <input
                type="tel"
                value={answers.customerInfo.phone}
                onChange={(e) => setAnswers(prev => ({
                  ...prev,
                  customerInfo: { ...prev.customerInfo, phone: e.target.value }
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder={t('orderFlow.step10.phonePlaceholder')}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('orderFlow.step10.invoiceReference')}
              </label>
              <input
                type="text"
                value={answers.invoiceReference}
                onChange={(e) => setAnswers(prev => ({
                  ...prev,
                  invoiceReference: e.target.value
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder={t('orderFlow.step10.invoiceReferencePlaceholder')}
              />
              <p className="text-xs text-gray-500 mt-1">{t('orderFlow.step10.invoiceReferenceNote')}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('orderFlow.step10.additionalNotes')}
              </label>
              <textarea
                value={answers.additionalNotes}
                onChange={(e) => setAnswers(prev => ({
                  ...prev,
                  additionalNotes: e.target.value
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder={t('orderFlow.step10.additionalNotesPlaceholder')}
                rows={3}
              />
              <p className="text-xs text-gray-500 mt-1">{t('orderFlow.step10.additionalNotesNote')}</p>
            </div>
          </div>


          {/* reCAPTCHA */}
          <div className="pt-4">
            <ReCAPTCHA
              ref={recaptchaRef}
              sitekey="6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI"
            />
          </div>

          <div className="mt-8 flex justify-between">
            <button
              onClick={() => setCurrentQuestion(5)}
              className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              {t('orderFlow.backToPrevious')}
            </button>
            <button
              ref={submitButtonRef}
              onClick={async (event) => {
                // Check reCAPTCHA
                const recaptchaToken = recaptchaRef.current?.getValue();
                if (!recaptchaToken) {
                  toast.error('Vänligen verifiera att du inte är en robot genom att slutföra reCAPTCHA.');
                  return;
                }

                // Prevent multiple submissions - check ref immediately (more reliable than state)
                if (submissionInProgressRef.current || isSubmitting || isInCooldown) {
                  console.log('🚫 Submission already in progress or in cooldown, ignoring click');
                  event.preventDefault();
                  return;
                }

                // Immediately disable button in DOM to prevent any further clicks
                if (submitButtonRef.current) {
                  submitButtonRef.current.disabled = true;
                  submitButtonRef.current.style.opacity = '0.5';
                  submitButtonRef.current.style.cursor = 'not-allowed';
                }

                console.log('🚀 Starting order submission...');
                submissionInProgressRef.current = true;
                setIsSubmitting(true);

                try {
                  console.log('📤 Submitting final order...');

                  // Calculate pricing using availableServices data for consistent pricing (same as order summary)
                  let totalPrice = 0;
                  const breakdown: any[] = [];

                  for (const serviceId of answers.services) {
                    const service = availableServices.find(s => s.id === serviceId);
                    if (service && service.price) {
                      // Extract numeric value from price string (same as order summary)
                      const priceMatch = service.price.match(/(\d+)/);
                      if (priceMatch) {
                        const unitPrice = parseInt(priceMatch[1]);
                        const servicePrice = unitPrice * answers.quantity;
                        totalPrice += servicePrice;
                        breakdown.push({
                          service: serviceId,
                          basePrice: servicePrice,
                          quantity: answers.quantity,
                          unitPrice: unitPrice
                        });
                      }
                    }
                  }

                  // Add additional fees consistently
                  let additionalFees = 0;

                  // Add scanned copies cost (200 kr per document)
                  if (answers.scannedCopies) {
                    additionalFees += 200 * answers.quantity;
                    breakdown.push({
                      service: 'scanned_copies',
                      fee: 200 * answers.quantity,
                      description: 'Scanned copies'
                    });
                  }

                  // Add return service cost
                  if (answers.returnService) {
                    const returnService = returnServices.find(s => s.id === answers.returnService);
                    if (returnService && returnService.price) {
                      const priceMatch = returnService.price.match(/(\d+)/);
                      if (priceMatch) {
                        const returnCost = parseInt(priceMatch[1]);
                        additionalFees += returnCost;
                        breakdown.push({
                          service: 'return_service',
                          fee: returnCost,
                          description: returnService.name
                        });
                      }
                    }
                  }

                  // Add premium delivery cost
                  if (answers.premiumDelivery) {
                    const premiumService = returnServices.find(s => s.id === answers.premiumDelivery);
                    if (premiumService && premiumService.price) {
                      const priceMatch = premiumService.price.match(/(\d+)/);
                      if (priceMatch) {
                        const premiumCost = parseInt(priceMatch[1]);
                        additionalFees += premiumCost;
                        breakdown.push({
                          service: 'premium_delivery',
                          fee: premiumCost,
                          description: premiumService.name
                        });
                      }
                    }
                  }

                  const pricingResult = {
                    basePrice: totalPrice,
                    additionalFees,
                    totalPrice: totalPrice + additionalFees,
                    breakdown
                  };

                  // Prepare order data
                  console.log('📋 Preparing order data with totalPrice:', pricingResult.totalPrice);
                  const orderData = {
                    country: answers.country,
                    documentType: answers.documentType,
                    services: answers.services,
                    quantity: answers.quantity,
                    expedited: answers.expedited,
                    documentSource: answers.documentSource,
                    scannedCopies: answers.scannedCopies,
                    pickupService: answers.pickupService,
                    pickupAddress: answers.pickupAddress,
                    returnService: answers.returnService,
                    premiumDelivery: answers.premiumDelivery,
                    customerInfo: answers.customerInfo,
                    paymentMethod: 'invoice', // Default to invoice payment
                    totalPrice: pricingResult.totalPrice,
                    pricingBreakdown: pricingResult.breakdown,
                    invoiceReference: answers.invoiceReference,
                    additionalNotes: answers.additionalNotes,
                    recaptchaToken
                  };
                  console.log('📋 Order data prepared:', { ...orderData, uploadedFiles: 'excluded from log' });

                  // Submit order
                  const orderId = await createOrderWithFiles(orderData, answers.uploadedFiles || []);

                  console.log('✅ Order submitted successfully:', orderId);

                  // Send email notification (save to Firestore for external processing, same as contact form)
                  try {
                    const emailData = {
                      name: `Ny beställning - Order #${orderId}`,
                      email: 'noreply@legaliseringstjanst.se',
                      phone: '',
                      subject: `Ny beställning mottagen - Order #${orderId}`,
                      message: `
Ny beställning har mottagits!

Ordernummer: ${orderId}
Kund: ${answers.customerInfo.firstName} ${answers.customerInfo.lastName}
E-post: ${answers.customerInfo.email}
Telefon: ${answers.customerInfo.phone}

Land: ${allCountries.find(c => c.code === answers.country)?.name}
Dokumenttyp: ${answers.documentType === 'birthCertificate' ? 'Födelsebevis' :
              answers.documentType === 'marriageCertificate' ? 'Vigselbevis' :
              answers.documentType === 'diploma' ? 'Examensbevis' :
              answers.documentType === 'commercial' ? 'Handelsdokument' :
              answers.documentType === 'powerOfAttorney' ? 'Fullmakt' : 'Annat dokument'}
Antal dokument: ${answers.quantity}

Valda tjänster: ${answers.services.join(', ')}
Totalbelopp: ${pricingResult.totalPrice} kr

Dokumentkälla: ${answers.documentSource === 'original' ? 'Originaldokument' : 'Uppladdade filer'}
Returfrakt: ${answers.returnService ? returnServices.find(s => s.id === answers.returnService)?.name : 'Ej vald'}
${answers.premiumDelivery ? `Premiumleverans: ${returnServices.find(s => s.id === answers.premiumDelivery)?.name}` : ''}
${answers.premiumDelivery ? `Premiumleverans: ${returnServices.find(s => s.id === answers.premiumDelivery)?.name}` : ''}

${answers.additionalNotes ? `Övriga kommentarer: ${answers.additionalNotes}` : ''}
                      `.trim(),
                      orderId: orderId,
                      createdAt: Timestamp.now(),
                      status: 'unread'
                    };

                    await addDoc(collection(db, 'contactMessages'), emailData);
                    console.log('📧 Email notification queued for order:', orderId);
                  } catch (emailError) {
                    console.error('❌ Failed to queue email notification:', emailError);
                    // Don't block the order flow if email notification fails
                  }

                  // Reset reCAPTCHA
                  recaptchaRef.current?.reset();

                  // Show beautiful success toast
                  toast.success(
                    <div className="text-center">
                      <div className="font-bold text-lg mb-2">{t('orderFlow.orderSubmitted')}</div>
                      <div className="text-sm">
                        <strong>{t('orderFlow.orderNumber', { orderId })}</strong><br/>
                        <span className="text-green-600">{t('orderFlow.documentsReturn')}</span>
                      </div>
                    </div>,
                    {
                      duration: 6000,
                      style: {
                        background: '#10B981',
                        color: 'white',
                        borderRadius: '12px',
                        padding: '16px',
                        fontSize: '16px',
                        maxWidth: '400px'
                      }
                    }
                  );

                  // Redirect to confirmation page after a short delay
                  setTimeout(() => {
                    router.push(`/bekraftelse?orderId=${orderId}`);
                  }, 2000);

                } catch (error) {
                  console.error('❌ Error submitting order:', error);

                  // Show beautiful error toast
                  toast.error(
                    <div className="text-center">
                      <div className="font-bold text-lg mb-2">{t('orderFlow.errorOccurred')}</div>
                      <div className="text-sm">
                        {t('orderFlow.submissionFailed')}<br/>
                        <span className="text-red-200">{t('orderFlow.tryAgainOrContact')}</span>
                      </div>
                    </div>,
                    {
                      duration: 5000,
                      style: {
                        background: '#EF4444',
                        color: 'white',
                        borderRadius: '12px',
                        padding: '16px',
                        fontSize: '16px',
                        maxWidth: '400px'
                      }
                    }
                  );
                } finally {
                  setIsSubmitting(false);
                  submissionInProgressRef.current = false;

                  // Start cooldown period (10 seconds)
                  setIsInCooldown(true);
                  cooldownTimeoutRef.current = setTimeout(() => {
                    setIsInCooldown(false);
                    // Re-enable button in DOM
                    if (submitButtonRef.current) {
                      submitButtonRef.current.disabled = false;
                      submitButtonRef.current.style.opacity = '';
                      submitButtonRef.current.style.cursor = '';
                    }
                  }, 10000); // 10 seconds cooldown
                }
              }}
              disabled={isSubmitting || submissionInProgressRef.current || isInCooldown || answers.uploadedFiles.length !== answers.quantity || answers.uploadedFiles.some(file => !file) || !answers.customerInfo.firstName || !answers.customerInfo.lastName || !answers.customerInfo.email || !answers.customerInfo.phone}
              className={`px-8 py-3 font-semibold text-lg rounded-md transition-all duration-200 ${
                isSubmitting || submissionInProgressRef.current || isInCooldown
                  ? 'bg-gray-400 text-gray-200 cursor-not-allowed opacity-50'
                  : answers.uploadedFiles.length === answers.quantity && answers.uploadedFiles.every(file => file) && answers.customerInfo.firstName && answers.customerInfo.lastName && answers.customerInfo.email && answers.customerInfo.phone
                  ? 'bg-custom-button text-white hover:bg-custom-button-hover'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {isSubmitting || submissionInProgressRef.current ? (
                <div className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {t('orderFlow.submittingOrder')}
                </div>
              ) : isInCooldown ? (
                <div className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M12 2v6m0 0l-4-4m4 4l4-4m-4 14v6m0 0l4-4m-4 4l-4-4"></path>
                  </svg>
                  {t('orderFlow.wait10Seconds')}
                </div>
              ) : (
                t('orderFlow.submitOrder')
              )}
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Address Display for Original Documents */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-red-900 mb-2">
                  {t('orderFlow.step10.shippingAddressTitle')}
                </h3>
                <div className="bg-white border border-red-200 rounded-lg p-4 mb-3" id="shipping-address-final">
                  <div className="font-medium text-gray-900 mb-1">LegaliseringsTjänst AB</div>
                  <div className="text-gray-700">Att: Dokumenthantering</div>
                  <div className="text-gray-700">Kungsgatan 12</div>
                  <div className="text-gray-700">111 43 Stockholm</div>
                  <div className="text-gray-700">Sverige</div>
                </div>
              </div>
              <div className="ml-4">
                <button
                  onClick={() => {
                    // Create a print-specific window with only the address
                    const printWindow = window.open('', '_blank', 'width=600,height=400');
                    if (printWindow) {
                      printWindow.document.write(`
                        <html>
                          <head>
                            <title>LegaliseringsTjänst AB - Leveransadress</title>
                            <style>
                              body {
                                font-family: Arial, sans-serif;
                                margin: 40px;
                                text-align: center;
                              }
                              .address {
                                border: 2px solid #dc2626;
                                padding: 20px;
                                border-radius: 8px;
                                background: #fef2f2;
                                display: inline-block;
                                margin: 20px 0;
                              }
                              .company {
                                font-weight: bold;
                                font-size: 18px;
                                color: #1f2937;
                                margin-bottom: 8px;
                              }
                              .address-line {
                                color: #374151;
                                margin: 4px 0;
                              }
                              @media print {
                                body { margin: 20px; }
                              }
                            </style>
                          </head>
                          <body>
                            <h2>Skicka dina originaldokument till denna adress:</h2>
                            <div class="address">
                              <div class="company">LegaliseringsTjänst AB</div>
                              <div class="address-line">Att: Dokumenthantering</div>
                              <div class="address-line">Kungsgatan 12</div>
                              <div class="address-line">111 43 Stockholm</div>
                              <div class="address-line">Sverige</div>
                            </div>
                          </body>
                        </html>
                      `);
                      printWindow.document.close();
                      printWindow.focus();
                      setTimeout(() => {
                        printWindow.print();
                        printWindow.close();
                      }, 250);
                    }
                  }}
                  className="flex items-center justify-center w-12 h-12 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition-colors duration-200"
                  title="Skriv ut adress"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Customer Information Form */}
          <div className="mt-8 space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Kunduppgifter</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('orderFlow.step10.firstName')} {t('orderFlow.step10.requiredField')}
                </label>
                <input
                  type="text"
                  value={answers.customerInfo.firstName}
                  onChange={(e) => setAnswers(prev => ({
                    ...prev,
                    customerInfo: { ...prev.customerInfo, firstName: e.target.value }
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder={t('orderFlow.step10.firstNamePlaceholder')}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('orderFlow.step10.lastName')} {t('orderFlow.step10.requiredField')}
                </label>
                <input
                  type="text"
                  value={answers.customerInfo.lastName}
                  onChange={(e) => setAnswers(prev => ({
                    ...prev,
                    customerInfo: { ...prev.customerInfo, lastName: e.target.value }
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder={t('orderFlow.step10.lastNamePlaceholder')}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('orderFlow.step10.email')} {t('orderFlow.step10.requiredField')}
              </label>
              <input
                type="email"
                value={answers.customerInfo.email}
                onChange={(e) => setAnswers(prev => ({
                  ...prev,
                  customerInfo: { ...prev.customerInfo, email: e.target.value }
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder={t('orderFlow.step10.emailPlaceholder')}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('orderFlow.step10.phone')} {t('orderFlow.step10.requiredField')}
              </label>
              <input
                type="tel"
                value={answers.customerInfo.phone}
                onChange={(e) => setAnswers(prev => ({
                  ...prev,
                  customerInfo: { ...prev.customerInfo, phone: e.target.value }
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder={t('orderFlow.step10.phonePlaceholder')}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('orderFlow.step10.invoiceReference')}
              </label>
              <input
                type="text"
                value={answers.invoiceReference}
                onChange={(e) => setAnswers(prev => ({
                  ...prev,
                  invoiceReference: e.target.value
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder={t('orderFlow.step10.invoiceReferencePlaceholder')}
              />
              <p className="text-xs text-gray-500 mt-1">{t('orderFlow.step10.invoiceReferenceNote')}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('orderFlow.step10.additionalNotes')}
              </label>
              <textarea
                value={answers.additionalNotes}
                onChange={(e) => setAnswers(prev => ({
                  ...prev,
                  additionalNotes: e.target.value
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder={t('orderFlow.step10.additionalNotesPlaceholder')}
                rows={3}
              />
              <p className="text-xs text-gray-500 mt-1">{t('orderFlow.step10.additionalNotesNote')}</p>
            </div>
          </div>

          {/* Terms and Conditions Acceptance */}
          <div className="pt-4">
            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  id="terms-acceptance-original"
                  name="terms-acceptance-original"
                  type="checkbox"
                  className="h-4 w-4 text-custom-button focus:ring-custom-button border-gray-300 rounded"
                  required
                />
              </div>
              <div className="ml-3 text-sm">
                <label htmlFor="terms-acceptance-original" className="text-gray-700">
                  Jag har läst och godkänner{' '}
                  <Link href="/villkor" target="_blank" className="text-custom-button hover:text-custom-button-hover underline">
                    allmänna villkor
                  </Link>
                  {' '}och{' '}
                  <Link href="/integritetspolicy" target="_blank" className="text-custom-button hover:text-custom-button-hover underline">
                    integritetspolicy
                  </Link>
                  .
                </label>
              </div>
            </div>
          </div>

          {/* reCAPTCHA */}
          <div className="pt-4">
            <ReCAPTCHA
              ref={recaptchaRef}
              sitekey="6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI"
            />
          </div>

          <div className="mt-8 flex justify-between">
            <button
              onClick={() => setCurrentQuestion(9)}
              className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              {t('orderFlow.backToPrevious')}
            </button>
            <button
              ref={submitButtonRef}
              onClick={async (event) => {
                // Check reCAPTCHA
                const recaptchaToken = recaptchaRef.current?.getValue();
                if (!recaptchaToken) {
                  toast.error('Vänligen verifiera att du inte är en robot genom att slutföra reCAPTCHA.');
                  return;
                }

                // Prevent multiple submissions - check ref immediately (more reliable than state)
                if (submissionInProgressRef.current || isSubmitting || isInCooldown) {
                  console.log('🚫 Submission already in progress or in cooldown, ignoring click');
                  event.preventDefault();
                  return;
                }

                // Immediately disable button in DOM to prevent any further clicks
                if (submitButtonRef.current) {
                  submitButtonRef.current.disabled = true;
                  submitButtonRef.current.style.opacity = '0.5';
                  submitButtonRef.current.style.cursor = 'not-allowed';
                }

                console.log('🚀 Starting order submission...');
                submissionInProgressRef.current = true;
                setIsSubmitting(true);

                try {
                  console.log('📤 Submitting final order...');

                  // Calculate pricing using availableServices data for consistent pricing (same as order summary)
                  let totalPrice = 0;
                  const breakdown: any[] = [];

                  for (const serviceId of answers.services) {
                    const service = availableServices.find(s => s.id === serviceId);
                    if (service && service.price) {
                      // Extract numeric value from price string (same as order summary)
                      const priceMatch = service.price.match(/(\d+)/);
                      if (priceMatch) {
                        const unitPrice = parseInt(priceMatch[1]);
                        const servicePrice = unitPrice * answers.quantity;
                        totalPrice += servicePrice;
                        breakdown.push({
                          service: serviceId,
                          basePrice: servicePrice,
                          quantity: answers.quantity,
                          unitPrice: unitPrice
                        });
                      }
                    }
                  }

                  // Add additional fees consistently
                  let additionalFees = 0;

                  // Add scanned copies cost (200 kr per document)
                  if (answers.scannedCopies) {
                    additionalFees += 200 * answers.quantity;
                    breakdown.push({
                      service: 'scanned_copies',
                      fee: 200 * answers.quantity,
                      description: 'Scanned copies'
                    });
                  }

                  // Add return service cost
                  if (answers.returnService) {
                    const returnService = returnServices.find(s => s.id === answers.returnService);
                    if (returnService && returnService.price) {
                      const priceMatch = returnService.price.match(/(\d+)/);
                      if (priceMatch) {
                        const returnCost = parseInt(priceMatch[1]);
                        additionalFees += returnCost;
                        breakdown.push({
                          service: 'return_service',
                          fee: returnCost,
                          description: returnService.name
                        });
                      }
                    }
                  }

                  const pricingResult = {
                    basePrice: totalPrice,
                    additionalFees,
                    totalPrice: totalPrice + additionalFees,
                    breakdown
                  };

                  // Prepare order data
                  console.log('📋 Preparing order data with totalPrice:', pricingResult.totalPrice);
                  const orderData = {
                    country: answers.country,
                    documentType: answers.documentType,
                    services: answers.services,
                    quantity: answers.quantity,
                    expedited: answers.expedited,
                    documentSource: answers.documentSource,
                    scannedCopies: answers.scannedCopies,
                    pickupService: answers.pickupService,
                    pickupAddress: answers.pickupAddress,
                    returnService: answers.returnService,
                    premiumDelivery: answers.premiumDelivery,
                    customerInfo: answers.customerInfo,
                    paymentMethod: 'invoice', // Default to invoice payment
                    totalPrice: pricingResult.totalPrice,
                    pricingBreakdown: pricingResult.breakdown,
                    invoiceReference: answers.invoiceReference,
                    additionalNotes: answers.additionalNotes
                  };
                  console.log('📋 Order data prepared:', { ...orderData, uploadedFiles: 'excluded from log' });

                  // Submit order
                  const orderId = await createOrderWithFiles(orderData, answers.uploadedFiles || []);

                  console.log('✅ Order submitted successfully:', orderId);

                  // Send email notification (save to Firestore for external processing, same as contact form)
                  try {
                    const emailData = {
                      name: 'Order Notification',
                      email: 'noreply@legaliseringstjanst.se',
                      phone: '',
                      subject: `Ny beställning mottagen - Order #${orderId}`,
                      message: `
Ny beställning har mottagits!

Ordernummer: ${orderId}
Kund: ${answers.customerInfo.firstName} ${answers.customerInfo.lastName}
E-post: ${answers.customerInfo.email}
Telefon: ${answers.customerInfo.phone}

Land: ${allCountries.find(c => c.code === answers.country)?.name}
Dokumenttyp: ${answers.documentType === 'birthCertificate' ? 'Födelsebevis' :
              answers.documentType === 'marriageCertificate' ? 'Vigselbevis' :
              answers.documentType === 'diploma' ? 'Examensbevis' :
              answers.documentType === 'commercial' ? 'Handelsdokument' :
              answers.documentType === 'powerOfAttorney' ? 'Fullmakt' : 'Annat dokument'}
Antal dokument: ${answers.quantity}

Valda tjänster: ${answers.services.join(', ')}
Totalbelopp: ${pricingResult.totalPrice} kr

Dokumentkälla: ${answers.documentSource === 'original' ? 'Originaldokument' : 'Uppladdade filer'}
Returfrakt: ${answers.returnService ? returnServices.find(s => s.id === answers.returnService)?.name : 'Ej vald'}

${answers.additionalNotes ? `Övriga kommentarer: ${answers.additionalNotes}` : ''}
                      `.trim(),
                      orderId: orderId,
                      createdAt: Timestamp.now(),
                      status: 'unread'
                    };

                    await addDoc(collection(db, 'contactMessages'), emailData);
                    console.log('📧 Email notification queued for order:', orderId);
                  } catch (emailError) {
                    console.error('❌ Failed to queue email notification:', emailError);
                    // Don't block the order flow if email notification fails
                  }

                  // Show beautiful success toast
                  toast.success(
                    <div className="text-center">
                      <div className="font-bold text-lg mb-2">{t('orderFlow.orderSubmitted')}</div>
                      <div className="text-sm">
                        <strong>{t('orderFlow.orderNumber', { orderId })}</strong><br/>
                        <span className="text-green-600">{t('orderFlow.documentsReturn')}</span>
                      </div>
                    </div>,
                    {
                      duration: 6000,
                      style: {
                        background: '#10B981',
                        color: 'white',
                        borderRadius: '12px',
                        padding: '16px',
                        fontSize: '16px',
                        maxWidth: '400px'
                      }
                    }
                  );

                  // Redirect to confirmation page after a short delay
                  setTimeout(() => {
                    router.push(`/bekraftelse?orderId=${orderId}`);
                  }, 2000);

                } catch (error) {
                  console.error('❌ Error submitting order:', error);

                  // Show beautiful error toast
                  toast.error(
                    <div className="text-center">
                      <div className="font-bold text-lg mb-2">❌ Ett fel uppstod</div>
                      <div className="text-sm">
                        Kunde inte skicka beställning.<br/>
                        <span className="text-red-200">Försök igen eller kontakta support</span>
                      </div>
                    </div>,
                    {
                      duration: 5000,
                      style: {
                        background: '#EF4444',
                        color: 'white',
                        borderRadius: '12px',
                        padding: '16px',
                        fontSize: '16px',
                        maxWidth: '400px'
                      }
                    }
                  );
                } finally {
                  setIsSubmitting(false);
                  submissionInProgressRef.current = false;

                  // Start cooldown period (10 seconds)
                  setIsInCooldown(true);
                  cooldownTimeoutRef.current = setTimeout(() => {
                    setIsInCooldown(false);
                    // Re-enable button in DOM
                    if (submitButtonRef.current) {
                      submitButtonRef.current.disabled = false;
                      submitButtonRef.current.style.opacity = '';
                      submitButtonRef.current.style.cursor = '';
                    }
                  }, 10000); // 10 seconds cooldown
                }
              }}
              disabled={isSubmitting || submissionInProgressRef.current || isInCooldown || !answers.customerInfo.firstName || !answers.customerInfo.lastName || !answers.customerInfo.email || !answers.customerInfo.phone}
              className={`px-8 py-3 font-semibold text-lg rounded-md transition-all duration-200 ${
                isSubmitting || submissionInProgressRef.current || isInCooldown
                  ? 'bg-gray-400 text-gray-200 cursor-not-allowed opacity-50'
                  : answers.customerInfo.firstName && answers.customerInfo.lastName && answers.customerInfo.email && answers.customerInfo.phone
                  ? 'bg-custom-button text-white hover:bg-custom-button-hover'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {isSubmitting || submissionInProgressRef.current ? (
                <div className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {t('orderFlow.submittingOrder')}
                </div>
              ) : isInCooldown ? (
                <div className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M12 2v6m0 0l-4-4m4 4l4-4m-4 14v6m0 0l4-4m-4 4l-4-4"></path>
                  </svg>
                  {t('orderFlow.wait10Seconds')}
                </div>
              ) : (
                t('orderFlow.submitOrder')
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );



  return (
    <>
      <Head>
        <title>{t('orderFlow.pageTitle')}</title>
        <meta name="description" content={t('orderFlow.pageDescription')} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <main className="bg-gray-50 py-10 min-h-screen">
        <div className="container mx-auto px-4">
          {/* Progress indicator */}
          <div className="max-w-2xl mx-auto mb-8">
            {/* Desktop: Detailed step indicator */}
            <div className="hidden md:flex items-center justify-center space-x-2">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((step) => (
                <div key={step} className="flex items-center">
                  <button
                    onClick={() => {
                      // Allow navigation to completed steps or current step only
                      if (step <= currentQuestion) {
                        setCurrentQuestion(step);
                      }
                    }}
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-200 ${
                      step < currentQuestion
                        ? 'bg-custom-button text-white hover:bg-custom-button-hover hover:scale-110 cursor-pointer shadow-md'
                        : step === currentQuestion
                        ? 'bg-custom-button text-white ring-2 ring-custom-button-light ring-offset-2 scale-110 shadow-lg'
                        : 'bg-gray-300 text-gray-600 cursor-not-allowed'
                    }`}
                    disabled={step > currentQuestion}
                  >
                    {step < currentQuestion ? '✓' : step}
                  </button>
                  {step < 10 && (
                    <div className={`w-12 h-1 mx-2 transition-colors duration-200 ${
                      step < currentQuestion || (step === 9 && currentQuestion >= 9) ? 'bg-custom-button' : 'bg-gray-300'
                    }`} />
                  )}
                </div>
              ))}
            </div>
  
            {/* Mobile: Simple progress bar */}
            <div className="md:hidden">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Steg {currentQuestion} av 10</span>
                <span className="text-sm text-gray-500">{Math.round((currentQuestion / 10) * 100)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-custom-button h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(currentQuestion / 10) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Render current question */}
          {currentQuestion === 1 && renderQuestion1()}
          {currentQuestion === 2 && renderQuestion2()}
          {currentQuestion === 3 && renderQuestion3()}
          {currentQuestion === 4 && renderQuestion4()}
          {currentQuestion === 5 && renderQuestion5()}
          {currentQuestion === 6 && renderQuestion6()}
          {currentQuestion === 7 && renderQuestion7()}
          {currentQuestion === 8 && renderQuestion8()}
          {currentQuestion === 9 && renderQuestion9()}
          {currentQuestion === 10 && renderQuestion10()}
        </div>
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
