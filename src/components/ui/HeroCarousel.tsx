import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useTranslation } from 'next-i18next';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

interface HeroSlide {
  id: string;
  titleKey: string;
  subtitleKey: string;
  ctaTextKey: string;
  ctaLink: string;
  backgroundImage: string;
}

const HeroCarousel: React.FC = () => {
  const { t } = useTranslation('common');
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const slides: HeroSlide[] = [
    {
      id: 'legalization',
      titleKey: 'hero.title',
      subtitleKey: 'hero.subtitle',
      ctaTextKey: 'hero.cta',
      ctaLink: '/bestall',
      backgroundImage: '/images/AdobeStock_343503546.jpeg',
    },
    {
      id: 'visa',
      titleKey: 'heroCarousel.visa.title',
      subtitleKey: 'heroCarousel.visa.subtitle',
      ctaTextKey: 'heroCarousel.visa.cta',
      ctaLink: '/visum/bestall',
      backgroundImage: '/images/AdobeStock_343503546.jpeg',
    },
  ];

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  }, [slides.length]);

  const prevSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  }, [slides.length]);

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      nextSlide();
    }, 6000);

    return () => clearInterval(interval);
  }, [isPaused, nextSlide]);

  const currentSlideData = slides[currentSlide];

  return (
    <section 
      className="relative overflow-hidden bg-cover bg-center bg-no-repeat"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      aria-roledescription="carousel"
      aria-label={t('heroCarousel.ariaLabel', 'Tjänster karusell')}
    >
      {/* Background with transition */}
      <div 
        className="absolute inset-0 transition-opacity duration-700"
        style={{ 
          backgroundImage: `url(${currentSlideData.backgroundImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />
      
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black bg-opacity-50"></div>
      
      <div className="container mx-auto px-4 py-16 md:py-24 lg:py-32 relative z-10">
        <div className="max-w-3xl mx-auto text-center">
          {/* Content with fade transition */}
          <div 
            key={currentSlideData.id}
            className="animate-fadeIn"
          >
            <h1
              className="text-3xl md:text-4xl lg:text-5xl font-heading font-bold text-white mb-6"
            >
              {t(currentSlideData.titleKey)}
            </h1>

            <p className="text-lg md:text-xl text-white/80 mb-10">
              {t(currentSlideData.subtitleKey)}
            </p>
            
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link
                href={currentSlideData.ctaLink}
                className="inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-custom-button hover:bg-custom-button/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-custom-button transition-colors"
              >
                {t(currentSlideData.ctaTextKey)}
              </Link>
            </div>
          </div>
        </div>

        {/* Navigation arrows */}
        <button
          onClick={prevSlide}
          className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors focus:outline-none focus:ring-2 focus:ring-white"
          aria-label={t('heroCarousel.prevSlide', 'Föregående')}
        >
          <ChevronLeftIcon className="h-6 w-6" />
        </button>
        
        <button
          onClick={nextSlide}
          className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors focus:outline-none focus:ring-2 focus:ring-white"
          aria-label={t('heroCarousel.nextSlide', 'Nästa')}
        >
          <ChevronRightIcon className="h-6 w-6" />
        </button>

        {/* Dots indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-3">
          {slides.map((slide, index) => (
            <button
              key={slide.id}
              onClick={() => goToSlide(index)}
              className={`w-4 h-4 rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black/50 ${
                index === currentSlide 
                  ? 'bg-custom-button border-2 border-custom-button' 
                  : 'bg-transparent border-2 border-custom-button/70 hover:border-custom-button'
              }`}
              aria-label={t('heroCarousel.goToSlide', { number: index + 1, defaultValue: `Gå till slide ${index + 1}` })}
              aria-current={index === currentSlide ? 'true' : 'false'}
            />
          ))}
        </div>
      </div>
      
      {/* Wave shape at bottom */}
      <div className="absolute left-0 right-0" style={{ bottom: '-1px' }}>
        <svg className="block w-full" viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M0 120L48 105C96 90 192 60 288 50C384 40 480 50 576 55C672 60 768 60 864 65C960 70 1056 80 1152 75C1248 70 1344 50 1392 40L1440 30V120H1392C1344 120 1248 120 1152 120C1056 120 960 120 864 120C768 120 672 120 576 120C480 120 384 120 288 120C192 120 96 120 48 120H0Z" fill="white"/>
        </svg>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out;
        }
      `}</style>
    </section>
  );
};

export default HeroCarousel;
