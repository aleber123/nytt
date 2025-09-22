import React from 'react';
import Link from 'next/link';

interface HeroSectionProps {
  title: string;
  subtitle: string;
  ctaText: string;
  ctaLink: string;
}

const HeroSection: React.FC<HeroSectionProps> = ({ title, subtitle, ctaText, ctaLink }) => {
  return (
    <section className="relative overflow-hidden bg-cover bg-center bg-no-repeat" style={{ backgroundImage: 'url(/images/hero-background.jpg)' }}>
      {/* Mörkt overlay för bättre textläsbarhet */}
      <div className="absolute inset-0 bg-black bg-opacity-50"></div>
      
      <div className="container mx-auto px-4 py-16 md:py-24 lg:py-32 relative z-10">
        <div className="max-w-3xl mx-auto text-center">
          <h1
            className="text-3xl md:text-4xl lg:text-5xl font-heading font-bold text-white mb-6"
            aria-label={title}
          >
            {title}
          </h1>

          <p className="text-lg md:text-xl text-white/80 mb-10">
            {subtitle}
          </p>
          
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link
              href={ctaLink}
              className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-custom-button hover:bg-custom-button/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-custom-button"
              aria-label={ctaText}
            >
              {ctaText}
            </Link>
            
            <Link
              href="/tjanster"
              className="inline-flex items-center justify-center px-6 py-3 border border-white text-base font-medium rounded-md text-white hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white"
              aria-label="Läs mer om våra tjänster"
            >
              Läs mer om våra tjänster
            </Link>
          </div>
        </div>
      </div>
      
      {/* Vågform i botten för visuellt intresse */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M0 120L48 105C96 90 192 60 288 50C384 40 480 50 576 55C672 60 768 60 864 65C960 70 1056 80 1152 75C1248 70 1344 50 1392 40L1440 30V120H1392C1344 120 1248 120 1152 120C1056 120 960 120 864 120C768 120 672 120 576 120C480 120 384 120 288 120C192 120 96 120 48 120H0Z" fill="white"/>
        </svg>
      </div>
    </section>
  );
};

export default HeroSection;
