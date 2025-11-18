/**
 * Exit Intent Popup Component
 * Captures users trying to leave with a special offer
 */

import { useState, useEffect, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { useTranslation } from 'next-i18next';

interface ExitIntentPopupProps {
  currentStep: number;
  onClose?: () => void;
}

export const ExitIntentPopup: React.FC<ExitIntentPopupProps> = ({ 
  currentStep,
  onClose 
}) => {
  const { t } = useTranslation('common');
  const [isOpen, setIsOpen] = useState(false);
  const [hasShown, setHasShown] = useState(false);

  useEffect(() => {
    // Only show if user is on step 2 or later and hasn't seen it yet
    if (currentStep < 2 || hasShown) return;

    // Check if already shown in this session
    const shownInSession = sessionStorage.getItem('exitIntentShown');
    if (shownInSession) return;

    const handleMouseLeave = (e: MouseEvent) => {
      // Trigger when mouse leaves viewport from top
      if (e.clientY < 10) {
        setIsOpen(true);
        setHasShown(true);
        sessionStorage.setItem('exitIntentShown', 'true');
      }
    };

    document.addEventListener('mouseleave', handleMouseLeave);
    return () => document.removeEventListener('mouseleave', handleMouseLeave);
  }, [currentStep, hasShown]);

  const handleClose = () => {
    setIsOpen(false);
    onClose?.();
  };

  const handleContinue = () => {
    setIsOpen(false);
    // User continues with order
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={handleClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-30" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-8 text-left align-middle shadow-xl transition-all">
                {/* Close button */}
                <button
                  onClick={handleClose}
                  className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>

                {/* Icon */}
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 mb-4">
                  <span className="text-4xl">🎁</span>
                </div>

                <Dialog.Title
                  as="h3"
                  className="text-2xl font-bold text-gray-900 mb-2 text-center"
                >
                  Vänta!
                </Dialog.Title>

                <p className="text-gray-600 mb-6 text-center">
                  Innan du går - få <strong className="text-custom-button">10% rabatt</strong> på din första beställning!
                </p>

                {/* Discount code */}
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-500 rounded-xl p-6 mb-6">
                  <div className="text-center">
                    <div className="text-xs text-gray-600 mb-2 uppercase tracking-wide">
                      Rabattkod
                    </div>
                    <div className="text-4xl font-bold text-green-600 mb-2 tracking-wider">
                      FIRST10
                    </div>
                    <div className="text-sm text-gray-600">
                      Använd koden vid betalning
                    </div>
                  </div>
                </div>

                {/* Benefits */}
                <div className="space-y-2 mb-6">
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <svg className="w-5 h-5 text-green-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>Gäller alla tjänster</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <svg className="w-5 h-5 text-green-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>Ingen minsta ordervolym</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <svg className="w-5 h-5 text-green-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>Giltigt i 24 timmar</span>
                  </div>
                </div>

                {/* Buttons */}
                <div className="flex flex-col space-y-3">
                  <button
                    onClick={handleContinue}
                    className="w-full px-6 py-3 bg-custom-button text-white rounded-lg hover:bg-custom-button-hover font-semibold transition-colors duration-200 shadow-lg"
                  >
                    Fortsätt beställa med rabatt
                  </button>
                  <button
                    onClick={handleClose}
                    className="w-full px-6 py-2 text-gray-600 hover:text-gray-800 text-sm"
                  >
                    Nej tack, jag vill inte spara pengar
                  </button>
                </div>

                {/* Trust badge */}
                <div className="mt-6 pt-6 border-t border-gray-200 text-center">
                  <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                    </svg>
                    <span>Säker betalning · SSL-krypterad</span>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default ExitIntentPopup;
