/**
 * Visa Step 2: Nationality Selection
 */

import React, { useState, useMemo, useCallback } from 'react';
import { useTranslation } from 'next-i18next';
import { StepContainer } from '../shared/StepContainer';
import { VisaOrderAnswers } from './types';
import CountryFlag from '@/components/ui/CountryFlag';

interface Props {
  answers: VisaOrderAnswers;
  onUpdate: (updates: Partial<VisaOrderAnswers>) => void;
  onNext: () => void;
  onBack: () => void;
}

// Popular nationalities shown first
const POPULAR_NATIONALITIES = [
  { code: 'SE', name: 'Svensk', nameEn: 'Swedish' },
  { code: 'NO', name: 'Norsk', nameEn: 'Norwegian' },
  { code: 'DK', name: 'Dansk', nameEn: 'Danish' },
  { code: 'FI', name: 'Finsk', nameEn: 'Finnish' },
  { code: 'DE', name: 'Tysk', nameEn: 'German' },
  { code: 'GB', name: 'Brittisk', nameEn: 'British' },
  { code: 'US', name: 'Amerikansk', nameEn: 'American' },
  { code: 'FR', name: 'Fransk', nameEn: 'French' },
];

// Comprehensive list of all nationalities
const ALL_NATIONALITIES = [
  // Popular (Nordic + major)
  { code: 'SE', name: 'Svensk', nameEn: 'Swedish' },
  { code: 'NO', name: 'Norsk', nameEn: 'Norwegian' },
  { code: 'DK', name: 'Dansk', nameEn: 'Danish' },
  { code: 'FI', name: 'Finsk', nameEn: 'Finnish' },
  { code: 'DE', name: 'Tysk', nameEn: 'German' },
  { code: 'GB', name: 'Brittisk', nameEn: 'British' },
  { code: 'US', name: 'Amerikansk', nameEn: 'American' },
  { code: 'FR', name: 'Fransk', nameEn: 'French' },
  // Europe
  { code: 'NL', name: 'Nederländsk', nameEn: 'Dutch' },
  { code: 'IT', name: 'Italiensk', nameEn: 'Italian' },
  { code: 'ES', name: 'Spansk', nameEn: 'Spanish' },
  { code: 'PL', name: 'Polsk', nameEn: 'Polish' },
  { code: 'AT', name: 'Österrikisk', nameEn: 'Austrian' },
  { code: 'CH', name: 'Schweizisk', nameEn: 'Swiss' },
  { code: 'BE', name: 'Belgisk', nameEn: 'Belgian' },
  { code: 'PT', name: 'Portugisisk', nameEn: 'Portuguese' },
  { code: 'IE', name: 'Irländsk', nameEn: 'Irish' },
  { code: 'GR', name: 'Grekisk', nameEn: 'Greek' },
  { code: 'CZ', name: 'Tjeckisk', nameEn: 'Czech' },
  { code: 'HU', name: 'Ungersk', nameEn: 'Hungarian' },
  { code: 'RO', name: 'Rumänsk', nameEn: 'Romanian' },
  { code: 'BG', name: 'Bulgarisk', nameEn: 'Bulgarian' },
  { code: 'HR', name: 'Kroatisk', nameEn: 'Croatian' },
  { code: 'SK', name: 'Slovakisk', nameEn: 'Slovak' },
  { code: 'SI', name: 'Slovensk', nameEn: 'Slovenian' },
  { code: 'RS', name: 'Serbisk', nameEn: 'Serbian' },
  { code: 'BA', name: 'Bosnisk', nameEn: 'Bosnian' },
  { code: 'AL', name: 'Albansk', nameEn: 'Albanian' },
  { code: 'MK', name: 'Nordmakedonsk', nameEn: 'North Macedonian' },
  { code: 'ME', name: 'Montenegrinsk', nameEn: 'Montenegrin' },
  { code: 'XK', name: 'Kosovoalbansk', nameEn: 'Kosovar' },
  { code: 'LT', name: 'Litauisk', nameEn: 'Lithuanian' },
  { code: 'LV', name: 'Lettisk', nameEn: 'Latvian' },
  { code: 'EE', name: 'Estnisk', nameEn: 'Estonian' },
  { code: 'IS', name: 'Isländsk', nameEn: 'Icelandic' },
  { code: 'LU', name: 'Luxemburgsk', nameEn: 'Luxembourgish' },
  { code: 'MT', name: 'Maltesisk', nameEn: 'Maltese' },
  { code: 'CY', name: 'Cypriotisk', nameEn: 'Cypriot' },
  { code: 'UA', name: 'Ukrainsk', nameEn: 'Ukrainian' },
  { code: 'BY', name: 'Belarusisk', nameEn: 'Belarusian' },
  { code: 'MD', name: 'Moldavisk', nameEn: 'Moldovan' },
  { code: 'RU', name: 'Rysk', nameEn: 'Russian' },
  // Asia
  { code: 'CN', name: 'Kinesisk', nameEn: 'Chinese' },
  { code: 'JP', name: 'Japansk', nameEn: 'Japanese' },
  { code: 'KR', name: 'Sydkoreansk', nameEn: 'South Korean' },
  { code: 'IN', name: 'Indisk', nameEn: 'Indian' },
  { code: 'PK', name: 'Pakistansk', nameEn: 'Pakistani' },
  { code: 'BD', name: 'Bangladeshisk', nameEn: 'Bangladeshi' },
  { code: 'LK', name: 'Srilankesisk', nameEn: 'Sri Lankan' },
  { code: 'NP', name: 'Nepalesisk', nameEn: 'Nepalese' },
  { code: 'TH', name: 'Thailändsk', nameEn: 'Thai' },
  { code: 'VN', name: 'Vietnamesisk', nameEn: 'Vietnamese' },
  { code: 'ID', name: 'Indonesisk', nameEn: 'Indonesian' },
  { code: 'MY', name: 'Malaysisk', nameEn: 'Malaysian' },
  { code: 'SG', name: 'Singaporiansk', nameEn: 'Singaporean' },
  { code: 'PH', name: 'Filippinsk', nameEn: 'Filipino' },
  { code: 'MM', name: 'Burmesisk', nameEn: 'Burmese' },
  { code: 'KH', name: 'Kambodjansk', nameEn: 'Cambodian' },
  { code: 'LA', name: 'Laotisk', nameEn: 'Laotian' },
  { code: 'TW', name: 'Taiwanesisk', nameEn: 'Taiwanese' },
  { code: 'HK', name: 'Hongkongkinesisk', nameEn: 'Hong Kong' },
  { code: 'MN', name: 'Mongolisk', nameEn: 'Mongolian' },
  { code: 'KZ', name: 'Kazakstansk', nameEn: 'Kazakh' },
  { code: 'UZ', name: 'Uzbekisk', nameEn: 'Uzbek' },
  { code: 'TM', name: 'Turkmensk', nameEn: 'Turkmen' },
  { code: 'KG', name: 'Kirgizisk', nameEn: 'Kyrgyz' },
  { code: 'TJ', name: 'Tadzjikisk', nameEn: 'Tajik' },
  { code: 'AF', name: 'Afghansk', nameEn: 'Afghan' },
  // Middle East
  { code: 'TR', name: 'Turkisk', nameEn: 'Turkish' },
  { code: 'IR', name: 'Iransk', nameEn: 'Iranian' },
  { code: 'IQ', name: 'Irakisk', nameEn: 'Iraqi' },
  { code: 'SA', name: 'Saudiarabisk', nameEn: 'Saudi Arabian' },
  { code: 'AE', name: 'Emiratisk', nameEn: 'Emirati' },
  { code: 'QA', name: 'Qatarisk', nameEn: 'Qatari' },
  { code: 'KW', name: 'Kuwaitisk', nameEn: 'Kuwaiti' },
  { code: 'BH', name: 'Bahrainsk', nameEn: 'Bahraini' },
  { code: 'OM', name: 'Omansk', nameEn: 'Omani' },
  { code: 'YE', name: 'Jemenitisk', nameEn: 'Yemeni' },
  { code: 'JO', name: 'Jordansk', nameEn: 'Jordanian' },
  { code: 'LB', name: 'Libanesisk', nameEn: 'Lebanese' },
  { code: 'SY', name: 'Syrisk', nameEn: 'Syrian' },
  { code: 'IL', name: 'Israelisk', nameEn: 'Israeli' },
  { code: 'PS', name: 'Palestinsk', nameEn: 'Palestinian' },
  { code: 'EG', name: 'Egyptisk', nameEn: 'Egyptian' },
  // Africa
  { code: 'ZA', name: 'Sydafrikansk', nameEn: 'South African' },
  { code: 'NG', name: 'Nigeriansk', nameEn: 'Nigerian' },
  { code: 'KE', name: 'Kenyansk', nameEn: 'Kenyan' },
  { code: 'ET', name: 'Etiopisk', nameEn: 'Ethiopian' },
  { code: 'GH', name: 'Ghanansk', nameEn: 'Ghanaian' },
  { code: 'TZ', name: 'Tanzanisk', nameEn: 'Tanzanian' },
  { code: 'UG', name: 'Ugandisk', nameEn: 'Ugandan' },
  { code: 'MA', name: 'Marockansk', nameEn: 'Moroccan' },
  { code: 'DZ', name: 'Algerisk', nameEn: 'Algerian' },
  { code: 'TN', name: 'Tunisisk', nameEn: 'Tunisian' },
  { code: 'LY', name: 'Libysk', nameEn: 'Libyan' },
  { code: 'SD', name: 'Sudanesisk', nameEn: 'Sudanese' },
  { code: 'AO', name: 'Angolansk', nameEn: 'Angolan' },
  { code: 'CD', name: 'Kongolesisk', nameEn: 'Congolese' },
  { code: 'CM', name: 'Kamerunsk', nameEn: 'Cameroonian' },
  { code: 'CI', name: 'Ivoriansk', nameEn: 'Ivorian' },
  { code: 'SN', name: 'Senegalesisk', nameEn: 'Senegalese' },
  { code: 'ZW', name: 'Zimbabwisk', nameEn: 'Zimbabwean' },
  { code: 'ZM', name: 'Zambisk', nameEn: 'Zambian' },
  { code: 'MZ', name: 'Moçambikisk', nameEn: 'Mozambican' },
  { code: 'RW', name: 'Rwandisk', nameEn: 'Rwandan' },
  { code: 'ER', name: 'Eritreansk', nameEn: 'Eritrean' },
  { code: 'SO', name: 'Somalisk', nameEn: 'Somali' },
  // Americas
  { code: 'CA', name: 'Kanadensisk', nameEn: 'Canadian' },
  { code: 'MX', name: 'Mexikansk', nameEn: 'Mexican' },
  { code: 'BR', name: 'Brasiliansk', nameEn: 'Brazilian' },
  { code: 'AR', name: 'Argentinsk', nameEn: 'Argentine' },
  { code: 'CO', name: 'Colombiansk', nameEn: 'Colombian' },
  { code: 'CL', name: 'Chilensk', nameEn: 'Chilean' },
  { code: 'PE', name: 'Peruansk', nameEn: 'Peruvian' },
  { code: 'VE', name: 'Venezuelansk', nameEn: 'Venezuelan' },
  { code: 'EC', name: 'Ecuadoriansk', nameEn: 'Ecuadorian' },
  { code: 'BO', name: 'Boliviansk', nameEn: 'Bolivian' },
  { code: 'UY', name: 'Uruguayansk', nameEn: 'Uruguayan' },
  { code: 'PY', name: 'Paraguayansk', nameEn: 'Paraguayan' },
  { code: 'CU', name: 'Kubansk', nameEn: 'Cuban' },
  { code: 'DO', name: 'Dominikansk', nameEn: 'Dominican' },
  { code: 'GT', name: 'Guatemalansk', nameEn: 'Guatemalan' },
  { code: 'HN', name: 'Honduransk', nameEn: 'Honduran' },
  { code: 'SV', name: 'Salvadoriansk', nameEn: 'Salvadoran' },
  { code: 'NI', name: 'Nicaraguansk', nameEn: 'Nicaraguan' },
  { code: 'CR', name: 'Costaricansk', nameEn: 'Costa Rican' },
  { code: 'PA', name: 'Panamansk', nameEn: 'Panamanian' },
  { code: 'JM', name: 'Jamaicansk', nameEn: 'Jamaican' },
  { code: 'HT', name: 'Haitisk', nameEn: 'Haitian' },
  // Oceania
  { code: 'AU', name: 'Australisk', nameEn: 'Australian' },
  { code: 'NZ', name: 'Nyzeeländsk', nameEn: 'New Zealand' },
  { code: 'FJ', name: 'Fijiansk', nameEn: 'Fijian' },
].sort((a, b) => a.name.localeCompare(b.name, 'sv'));

interface Nationality {
  code: string;
  name: string;
  nameEn: string;
}

const VisaStep2Nationality: React.FC<Props> = ({ answers, onUpdate, onNext, onBack }) => {
  const { t, i18n } = useTranslation('common');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAllNationalities, setShowAllNationalities] = useState(false);

  const isSwedish = i18n.language === 'sv';

  // Stable reference to onNext to avoid stale closures
  const stableOnNext = useCallback(() => onNext(), [onNext]);

  const filteredNationalities = useMemo(() => {
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return ALL_NATIONALITIES.filter(
        (n) => n.name.toLowerCase().includes(term) || n.nameEn.toLowerCase().includes(term)
      );
    }
    return showAllNationalities ? ALL_NATIONALITIES : POPULAR_NATIONALITIES;
  }, [searchTerm, showAllNationalities]);

  const handleSelect = (nationality: Nationality) => {
    onUpdate({
      nationality: isSwedish ? nationality.name : nationality.nameEn,
      nationalityCode: nationality.code,
    });

    // Auto-advance to next step immediately (like legalization flow)
    onNext();
  };

  const isSelected = (code: string) => answers.nationalityCode === code;

  return (
    <StepContainer
      title={t('visaOrder.step2.title', 'Vilken nationalitet har du?')}
      subtitle={t('visaOrder.step2.subtitle', 'Välj ditt medborgarskap')}
      onNext={onNext}
      onBack={onBack}
      nextDisabled={!answers.nationalityCode}
    >
      {/* Search */}
      <div className="mb-6">
        <input
          type="text"
          placeholder={t('visaOrder.step2.searchPlaceholder', 'Sök nationalitet...')}
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            if (e.target.value) setShowAllNationalities(true);
          }}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-custom-button focus:border-transparent"
        />
      </div>

      {/* Popular label */}
      {!searchTerm && !showAllNationalities && (
        <p className="text-sm text-gray-500 mb-3">
          {t('visaOrder.step2.popularNationalities', 'Vanliga nationaliteter')}
        </p>
      )}

      {/* Nationality grid */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {filteredNationalities.map((nationality) => (
          <button
            key={nationality.code}
            onClick={() => handleSelect(nationality)}
            className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${
              isSelected(nationality.code)
                ? 'border-custom-button bg-custom-button/5'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <CountryFlag code={nationality.code} size={24} />
            <span className="text-sm font-medium text-left">
              {isSwedish ? nationality.name : nationality.nameEn}
            </span>
          </button>
        ))}
      </div>

      {/* Show all nationalities toggle */}
      {!searchTerm && (
        <button
          onClick={() => setShowAllNationalities(!showAllNationalities)}
          className="text-custom-button hover:underline text-sm"
        >
          {showAllNationalities
            ? t('visaOrder.step2.showLess', 'Visa färre')
            : t('visaOrder.step2.showAll', 'Visa alla nationaliteter')}
        </button>
      )}
    </StepContainer>
  );
};

export default VisaStep2Nationality;
