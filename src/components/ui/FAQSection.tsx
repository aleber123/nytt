import React from 'react';
import { useTranslation } from 'next-i18next';
import FAQ from './FAQ';

interface FAQSectionProps {
  className?: string;
}

const FAQSection: React.FC<FAQSectionProps> = ({ className = '' }) => {
  const { t } = useTranslation('common');
  
  const faqs = [
    {
      id: 1,
      question: t('faq.question1') || 'Vad är skillnaden mellan apostille och ambassadlegalisering?',
      answer: t('faq.answer1') || 'Apostille är en förenklad legaliseringsprocess för länder som är anslutna till Haagkonventionen från 1961. Ambassadlegalisering krävs för länder som inte är anslutna till konventionen och innebär att dokumentet måste legaliseras via det specifika landets ambassad eller konsulat.'
    },
    {
      id: 2,
      question: t('faq.question2') || 'Hur lång tid tar legaliseringsprocessen?',
      answer: t('faq.answer2') || 'Standardprocessen tar vanligtvis 5-7 arbetsdagar för apostille och 7-14 arbetsdagar för ambassadlegalisering. Vi erbjuder även expresstjänster för brådskande ärenden.'
    },
    {
      id: 3,
      question: t('faq.question3') || 'Vilka dokument kan legaliseras?',
      answer: t('faq.answer3') || 'Vi kan hjälpa till med legalisering av de flesta typer av dokument, inklusive akademiska betyg, födelsebevis, äktenskapsbevis, bolagshandlingar, fullmakter och många andra officiella dokument.'
    },
    {
      id: 4,
      question: t('faq.question4') || 'Måste jag skicka originalhandlingar?',
      answer: t('faq.answer4') || 'Ja, för legalisering krävs oftast originaldokument. I vissa fall kan notariellt bestyrkta kopior accepteras. Kontakta oss för specifik rådgivning för ditt ärende.'
    },
    {
      id: 5,
      question: t('faq.question5') || 'Kan jag spåra min beställning?',
      answer: t('faq.answer5') || 'Ja, när din beställning har bekräftats får du ett ordernummer som du kan använda för att spåra status på din beställning via vår orderstatus-sida.'
    }
  ];

  return (
    <section className={`py-16 ${className}`}>
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto">
          <FAQ 
            title={t('faq.title') || 'Vanliga frågor'}
            subtitle={t('faq.subtitle') || 'Hitta svar på de vanligaste frågorna om våra legaliseringstjänster.'}
            items={faqs} 
          />
        </div>
        
        <div className="mt-12 text-center">
          <p className="mb-4 text-gray-600">
            {t('faq.moreQuestions') || 'Hittar du inte svar på din fråga?'}
          </p>
          <a
            href="/kontakt"
            className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-custom-button hover:bg-custom-button/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-custom-button"
          >
            {t('faq.contactUs') || 'Kontakta oss'}
          </a>
        </div>
      </div>
    </section>
  );
};

export default FAQSection;
