/**
 * Trust Signals Component
 * Displays trust badges, reviews, and social proof to increase conversion
 */

import React from 'react';
import { useTranslation } from 'next-i18next';

export const TrustSignals: React.FC = () => {
  const { t } = useTranslation('common');

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6 shadow-sm">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* SSL Secure */}
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            <svg className="w-10 h-10 text-green-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
            </svg>
          </div>
          <div>
            <div className="font-semibold text-gray-900">SSL Säker</div>
            <div className="text-sm text-gray-600">Krypterad betalning</div>
          </div>
        </div>
        
        {/* Professional Service */}
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            <svg className="w-10 h-10 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
          <div>
            <div className="font-semibold text-gray-900">Professionell service</div>
            <div className="text-sm text-gray-600">Erfarna experter</div>
          </div>
        </div>
        
        {/* Fast Delivery */}
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            <svg className="w-10 h-10 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
              <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
              <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1V5a1 1 0 00-1-1H3zM14 7a1 1 0 00-1 1v6.05A2.5 2.5 0 0115.95 16H17a1 1 0 001-1v-5a1 1 0 00-.293-.707l-2-2A1 1 0 0015 7h-1z" />
            </svg>
          </div>
          <div>
            <div className="font-semibold text-gray-900">Snabb leverans</div>
            <div className="text-sm text-gray-600">2-5 arbetsdagar</div>
          </div>
        </div>
      </div>
      
      {/* Company info */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="flex items-center justify-center space-x-4 text-sm text-gray-600">
          <span>Del av DOX Visumpartner-koncernen</span>
          <span>•</span>
          <a 
            href="https://www.trustpilot.com/review/doxvl.dk" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline flex items-center"
          >
            Se recensioner på Trustpilot
            <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </div>
      </div>

      {/* Additional trust badges */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="flex flex-wrap items-center justify-center gap-6">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span>GDPR-kompatibel</span>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span>Svenskt företag</span>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span>Pengar-tillbaka-garanti</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrustSignals;
