import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useTranslation } from 'next-i18next';
import { ChevronLeftIcon, ChevronRightIcon, XMarkIcon } from '@heroicons/react/24/outline';

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
  const [showServiceModal, setShowServiceModal] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);
  
  const safeT = (key: string, fallback: string) => {
    const value = t(key);
    return value === key ? fallback : value;
  };

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

  // Touch handlers for swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    
    const diff = touchStartX.current - touchEndX.current;
    const minSwipeDistance = 50;
    
    if (Math.abs(diff) > minSwipeDistance) {
      if (diff > 0) {
        nextSlide(); // Swipe left = next
      } else {
        prevSlide(); // Swipe right = prev
      }
    }
    
    touchStartX.current = null;
    touchEndX.current = null;
  };

  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      nextSlide();
    }, 10000);

    return () => clearInterval(interval);
  }, [isPaused, nextSlide]);

  const currentSlideData = slides[currentSlide];

  return (
    <>
    <section 
      className="relative overflow-hidden bg-cover bg-center bg-no-repeat touch-pan-y"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
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
              <button
                onClick={() => setShowServiceModal(true)}
                className="inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-custom-button hover:bg-custom-button/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-custom-button transition-colors"
              >
                {safeT('hero.cta', 'Kom igång')}
              </button>
            </div>
          </div>
        </div>

        {/* Navigation arrows - hidden on mobile, visible on md+ */}
        <button
          onClick={prevSlide}
          className="hidden md:block absolute left-4 lg:left-8 top-1/2 -translate-y-1/2 p-2 lg:p-3 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors focus:outline-none focus:ring-2 focus:ring-white"
          aria-label={t('heroCarousel.prevSlide', 'Föregående')}
        >
          <ChevronLeftIcon className="h-6 w-6 lg:h-8 lg:w-8" />
        </button>
        
        <button
          onClick={nextSlide}
          className="hidden md:block absolute right-4 lg:right-8 top-1/2 -translate-y-1/2 p-2 lg:p-3 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors focus:outline-none focus:ring-2 focus:ring-white"
          aria-label={t('heroCarousel.nextSlide', 'Nästa')}
        >
          <ChevronRightIcon className="h-6 w-6 lg:h-8 lg:w-8" />
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

      {/* Service Selection Modal */}
      {showServiceModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center"
          onClick={() => setShowServiceModal(false)}
        >
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          
          <div 
            className="relative bg-white rounded-2xl shadow-2xl p-8 max-w-lg w-full mx-4 transform transition-all"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowServiceModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
              aria-label={safeT('accessibility.closeMenu', 'Stäng')}
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
            
            <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">
              {safeT('serviceModal.title', 'Vad vill du beställa?')}
            </h2>
            <p className="text-gray-600 text-center mb-8">
              {safeT('serviceModal.subtitle', 'Välj den tjänst du behöver')}
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Link
                href="/bestall"
                onClick={() => setShowServiceModal(false)}
                className="group flex flex-col items-center p-6 border-2 border-gray-200 rounded-xl hover:border-custom-button hover:bg-custom-button/5 transition-all duration-200"
              >
                <div className="w-16 h-16 bg-custom-button/10 rounded-full flex items-center justify-center mb-4 group-hover:bg-custom-button/20 transition-colors">
                  <svg className="w-8 h-8 text-custom-button" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  {safeT('serviceModal.legalization', 'Legalisering')}
                </h3>
                <p className="text-sm text-gray-500 text-center">
                  {safeT('serviceModal.legalizationDesc', 'Apostille, UD, ambassad & notarius')}
                </p>
                <ChevronRightIcon className="w-5 h-5 text-custom-button mt-3 opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
              
              <Link
                href="/visum/bestall"
                onClick={() => setShowServiceModal(false)}
                className="group flex flex-col items-center p-6 border-2 border-gray-200 rounded-xl hover:border-custom-button hover:bg-custom-button/5 transition-all duration-200"
              >
                <div className="w-16 h-16 bg-custom-button/10 rounded-full flex items-center justify-center mb-4 group-hover:bg-custom-button/20 transition-colors">
                  <svg className="w-8 h-8 text-custom-button" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  {safeT('serviceModal.visa', 'Visum')}
                </h3>
                <p className="text-sm text-gray-500 text-center">
                  {safeT('serviceModal.visaDesc', 'Ansök om visum till alla länder')}
                </p>
                <ChevronRightIcon className="w-5 h-5 text-custom-button mt-3 opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default HeroCarousel;
