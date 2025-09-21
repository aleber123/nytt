import React from 'react';
import { useTranslation } from 'next-i18next';
import Testimonials from './Testimonials';

interface TestimonialSectionProps {
  className?: string;
}

const TestimonialSection: React.FC<TestimonialSectionProps> = ({ className = '' }) => {
  const { t } = useTranslation('common');
  
  const testimonials = [
    {
      id: 1,
      name: t('testimonials.person1.name') || 'Anna Johansson',
      role: t('testimonials.person1.role') || 'Företagare',
      content: t('testimonials.person1.content') || 'Fantastisk service! Jag behövde få mina dokument legaliserade snabbt för en affärsresa till Kina och allt gick smidigt och professionellt.',
      rating: 5,
      image: '/images/testimonials/person1.jpg'
    },
    {
      id: 2,
      name: t('testimonials.person2.name') || 'Erik Svensson',
      role: t('testimonials.person2.role') || 'Student',
      content: t('testimonials.person2.content') || 'Jag behövde få mitt examensbevis apostillerat för studier utomlands. Processen var enkel och personalen var mycket hjälpsam med att förklara alla steg.',
      rating: 5,
      image: ''
    },
    {
      id: 3,
      name: t('testimonials.person3.name') || 'Maria Lindgren',
      role: t('testimonials.person3.role') || 'Jurist',
      content: t('testimonials.person3.content') || 'Som jurist uppskattar jag verkligen den noggrannhet och professionalitet som Legaliseringstjänst visar i sitt arbete. Rekommenderas starkt!',
      rating: 4,
      image: '/images/testimonials/person3.jpg'
    }
  ];

  return (
    <section className={`py-16 bg-gray-50 ${className}`}>
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center mb-12">
          <h2 className="text-3xl font-heading font-bold mb-4">
            {t('testimonials.title') || 'Vad våra kunder säger'}
          </h2>
          <p className="text-lg text-gray-600">
            {t('testimonials.subtitle') || 'Vi är stolta över att ha hjälpt hundratals kunder med deras legaliseringsbehov.'}
          </p>
        </div>
        
        <Testimonials 
          title={t('testimonials.title') || 'Vad våra kunder säger'}
          subtitle={t('testimonials.subtitle') || 'Vi är stolta över att ha hjälpt hundratals kunder med deras legaliseringsbehov.'}
          testimonials={testimonials} 
        />
        
        <div className="mt-12 text-center">
          <a 
            href="#"
            className="inline-flex items-center text-primary-600 hover:text-primary-700 font-medium"
          >
            {t('testimonials.readMore') || 'Läs fler omdömen'}
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-5 w-5 ml-1" 
              viewBox="0 0 20 20" 
              fill="currentColor"
            >
              <path 
                fillRule="evenodd" 
                d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" 
                clipRule="evenodd" 
              />
            </svg>
          </a>
        </div>
      </div>
    </section>
  );
};

export default TestimonialSection;
