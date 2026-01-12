import { GetStaticProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import CountryFlag from '@/components/ui/CountryFlag';
import Head from 'next/head';
import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { createOrderWithFiles } from '@/services/hybridOrderService';
import * as gtag from '../../lib/analytics';
import { OrderSEO } from '@/components/SEO/OrderSEO';
import { ProgressIndicator } from '@/components/order/ProgressIndicator';
import { getCountryPricingRules, getAllActivePricingRules, getPricingRule, calculateOrderPrice } from '@/firebase/pricingService';
import { getCustomerByEmailDomain } from '@/firebase/customerService';
import { toast } from 'react-hot-toast';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useGoogleReCaptcha } from 'react-google-recaptcha-v3';
import { printShippingLabel } from '@/services/shippingLabelService';
import { useOrderPersistence } from '@/hooks/useOrderPersistence';
import type { OrderAnswers } from '@/components/order/types';

// Import extracted step components
import Step1CountrySelection from '@/components/order/steps/Step1CountrySelection';
import Step2DocumentType from '@/components/order/steps/Step2DocumentType';
import Step3ServicesSelection from '@/components/order/steps/Step3ServicesSelection';
import Step4Quantity from '@/components/order/steps/Step4Quantity';
import Step5DocumentSource from '@/components/order/steps/Step5DocumentSource';
import { Step6PickupService } from '@/components/order/steps/Step6PickupService';
import Step7ShippingOrPickup from '@/components/order/steps/Step7ShippingOrPickup';
import Step8ScannedCopies from '@/components/order/steps/Step8ScannedCopies';
import Step9ReturnService from '@/components/order/steps/Step9ReturnService';
import Step9bReturnAddress from '@/components/order/steps/Step9bReturnAddress';
import Step10ReviewSubmit from '@/components/order/steps/Step10ReviewSubmit';
import OrderSummary from '@/components/order/OrderSummary';
import { ALL_COUNTRIES } from '@/components/order/data/countries';

interface TestOrderPageProps {}

export default function TestOrderPage({}: TestOrderPageProps) {
  const { t } = useTranslation('common');
  const router = useRouter();
  const currentLocale = router.locale || 'sv';
  const [currentQuestion, setCurrentQuestion] = useState(1);
  const [answers, setAnswers] = useState<OrderAnswers>({
    country: '',
    documentType: '',
    documentTypes: [],
    documentTypeQuantities: {},
    services: [],
    helpMeChooseServices: false,
    notarizationDetails: {
      signature: false,
      signingAuthority: false,
      copy: false,
      unknown: false,
      other: false,
      otherText: ''
    },
    idDocumentFile: null,
    registrationCertFile: null,
    signingAuthorityIdFile: null,
    willSendIdDocumentLater: false,
    willSendRegistrationCertLater: false,
    willSendSigningAuthorityIdLater: false,
    willSendMainDocsLater: false,
    quantity: 1,
    expedited: false,
    documentSource: '', // 'original' or 'upload'
    pickupService: false, // New: pickup service option
    shippingMethod: null,
    pickupMethod: undefined,
    premiumPickup: undefined,
    pickupAddress: {
      name: '',
      company: '',
      street: '',
      postalCode: '',
      city: '',
      country: 'SE'
    },
    pickupDate: undefined,
    pickupTimeWindow: undefined,
    scannedCopies: false,
    returnService: '',
    ownReturnTrackingNumber: '',
    premiumDelivery: '',
    returnDeliveryDate: undefined,
    deliveryAddressType: 'residential', // Default to residential (home address)
    uploadedFiles: [],
    // Customer type: private or company
    customerType: 'private',
    // Return address (where documents should be sent back)
    returnAddress: {
      sameAsPickup: true, // Default to same as pickup if pickup is selected
      firstName: '',
      lastName: '',
      companyName: '',
      street: '',
      addressLine2: '', // c/o, apartment, floor, etc.
      postalCode: '',
      city: '',
      country: 'Sverige',
      countryCode: 'SE',
      phone: '',
      email: ''
    },
    // Billing information
    billingInfo: {
      sameAsReturn: true, // Default to same as return address
      firstName: '',
      lastName: '',
      companyName: '',
      organizationNumber: '',
      vatNumber: '',
      contactPerson: '',
      street: '',
      postalCode: '',
      city: '',
      country: 'Sverige',
      countryCode: 'SE',
      email: '',
      phone: ''
    },
    // Legacy customerInfo - kept for backward compatibility
    customerInfo: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      address: '',
      postalCode: '',
      city: '',
      country: '',
      countryCode: ''
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
  const { executeRecaptcha } = useGoogleReCaptcha();

  // Progress persistence - auto-save and restore order data
  const { clearProgress, getSavedProgressInfo } = useOrderPersistence(
    answers,
    currentQuestion,
    setAnswers,
    setCurrentQuestion
  );

  // Track highest step reached for navigation
  const [highestStepReached, setHighestStepReached] = useState(1);

  // Update highest step when moving forward
  useEffect(() => {
    if (currentQuestion > highestStepReached) {
      setHighestStepReached(currentQuestion);
    }
  }, [currentQuestion, highestStepReached]);

  // Function to navigate to a step (creates browser history entry for back button support)
  const navigateToStep = (step: number) => {
    setCurrentQuestion(step);
    // Update URL and create history entry for proper back button support
    const url = new URL(window.location.href);
    url.searchParams.set('step', step.toString());
    window.history.pushState({}, '', url.toString());
  };

  // Show notification if progress was restored
  useEffect(() => {
    // Check if we've already shown the notification
    const notified = sessionStorage.getItem('orderDraft_notified');
    if (notified) {
      // Clear the flag and show notification
      sessionStorage.removeItem('orderDraft_notified');
      
      const savedInfo = getSavedProgressInfo();
      if (savedInfo.exists && !savedInfo.expired && savedInfo.step && savedInfo.step > 1) {
        toast.success(
          t(
            'orderFlow.restoredDraftMessage',
            'Välkommen tillbaka! Din beställning återställdes från steg {{step}}.',
            { step: savedInfo.step }
          ),
          { duration: 5000, icon: '💾' }
        );
      }
    }
  }, []); // Run once on mount

  // Handle browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      const url = new URL(window.location.href);
      const step = url.searchParams.get('step');
      if (step) {
        const stepNumber = parseInt(step, 10);
        if (stepNumber >= 1 && stepNumber <= 10) {
          setCurrentQuestion(stepNumber);
        }
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Hague Convention countries (apostille available)
  const hagueConventionCountries = [
    'SE', 'NO', 'DK', 'FI', 'DE', 'GB', 'US', 'FR', 'ES', 'IT', 'NL', 'PL',
    'AT', 'BE', 'CH', 'CZ', 'EE', 'GR', 'HU', 'IE', 'IS', 'LI', 'LT', 'LU',
    'LV', 'MT', 'PT', 'SK', 'SI', 'BG', 'HR', 'CY', 'RO', 'TR', 'AU', 'CA',
    'JP', 'KR', 'MX', 'NZ', 'ZA', 'PH', 'CN', 'IN', 'BR', 'AR', 'CL', 'CO',
    'PE', 'EC', 'UY', 'PY', 'BO', 'CR', 'PA', 'DO', 'SV', 'GT', 'HN', 'NI'
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

  // Function to get localized country name using browser Intl API, with i18n fallback
  const getCountryName = (countryCode: string) => {
    try {
      if (countryCode && countryCode.length === 2) {
        const displayNames = new Intl.DisplayNames([currentLocale], { type: 'region' });
        const localized = displayNames.of(countryCode);
        if (localized && typeof localized === 'string') return localized;
      }
    } catch {}
    return t(`countries.names.${countryCode}`, { defaultValue: countryCode });
  };

  // Use imported ALL_COUNTRIES which includes nameEn for English translations
  const allCountries = ALL_COUNTRIES;

  const [countrySearch, setCountrySearch] = useState('');
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const filteredCountries = allCountries.filter(country => {
    if (!countrySearch.trim()) return false;

    const searchTerm = countrySearch.toLowerCase().trim();
    const countryName = country.name.toLowerCase();
    const countryNameEn = (country.nameEn || '').toLowerCase();

    // Search by both Swedish and English country names
    // Prioritize countries that START with the search term
    if (countryName.startsWith(searchTerm) || countryNameEn.startsWith(searchTerm)) return true;

    // Then include countries that CONTAIN the search term (but with lower priority)
    if (countryName.includes(searchTerm) || countryNameEn.includes(searchTerm)) return true;

    return false;
  }).sort((a, b) => {
    const searchTerm = countrySearch.toLowerCase().trim();
    const aName = a.name.toLowerCase();
    const bName = b.name.toLowerCase();

    // Sort by priority: starts with > contains
    const aStartsWith = aName.startsWith(searchTerm);
    const bStartsWith = bName.startsWith(searchTerm);

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
  const [pickupServices, setPickupServices] = useState<any[]>([]);
  const [loadingPickupServices, setLoadingPickupServices] = useState(false);
  const [pricingBreakdown, setPricingBreakdown] = useState<any[]>([]);
  const [loadingPricing, setLoadingPricing] = useState(false);
  const [isSummaryExpanded, setIsSummaryExpanded] = useState(false);
  const [hasUnconfirmedPrices, setHasUnconfirmedPrices] = useState(false);

  // Calculate total price from pricing breakdown (exclude TBC items)
  const totalPrice = pricingBreakdown.reduce((sum, item) => sum + (item.isTBC ? 0 : (item.total || 0)), 0);

  // Load services when country changes
  useEffect(() => {
    if (answers.country) {
      loadAvailableServices(answers.country);
    }
  }, [answers.country]);

  // Load return and pickup services on component mount and when locale changes
  useEffect(() => {
    loadReturnServices();
    loadPickupServices();
  }, [currentLocale]);

  // Calculate pricing breakdown when services change
  useEffect(() => {
    if (answers.helpMeChooseServices) {
      setPricingBreakdown([]);
      return;
    }

    if (answers.services.length > 0 && answers.country) {
      calculatePricingBreakdown();
    } else {
      setPricingBreakdown([]);
    }
  }, [
    answers.services,
    answers.country,
    answers.quantity,
    answers.returnService,
    answers.scannedCopies,
    answers.premiumDelivery,
    answers.helpMeChooseServices,
    answers.customerInfo.email,
    answers.returnAddress.email,
    answers.billingInfo.email,
    returnServices,
    currentLocale
  ]);

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

        // Also try to load country-specific embassy services
        let countrySpecificRules: any[] = [];
        try {
          countrySpecificRules = await getCountryPricingRules(countryCode);
        } catch (countryError) {
          // No country-specific services found
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
           // Filter services based on country type to ensure logical consistency
           let filteredPricingRules = allPricingRules;

           if (isHagueCountry) {
             // For Hague Convention countries: exclude UD and embassy services
             filteredPricingRules = allPricingRules.filter(rule =>
               !['ud', 'embassy'].includes(rule.serviceType)
             );
           } else {
             // For non-Hague countries: exclude apostille
             filteredPricingRules = allPricingRules.filter(rule =>
               rule.serviceType !== 'apostille'
             );
           }

           // Convert pricing rules to service objects
          const servicesFromFirebase = filteredPricingRules.map(rule => {
            const translationOnRequest = t('orderFlow.step3.translationOnRequest', currentLocale === 'en' ? 'On request' : 'På förfrågan');
            const fromPrefix = currentLocale === 'en' ? 'from' : 'från';
            const price = rule.serviceType === 'translation' ? translationOnRequest : `${fromPrefix} ${rule.basePrice} kr`;

            return {
              id: rule.serviceType,
              name: getServiceName(rule.serviceType),
              description: getServiceDescription(rule.serviceType, isHagueCountry),
              price: price,
              available: true,
              processingTime: rule.processingTime?.standard || 5
            };
          });

          // Ensure translation service is always available
          const hasTranslation = servicesFromFirebase.some(s => s.id === 'translation');
          if (!hasTranslation) {
            const translationOnRequest = t('orderFlow.step3.translationOnRequest', currentLocale === 'en' ? 'On request' : 'På förfrågan');
            servicesFromFirebase.push({
              id: 'translation',
              name: getServiceName('translation'),
              description: getServiceDescription('translation', isHagueCountry),
              price: translationOnRequest,
              available: true,
              processingTime: 5
            });
          }

          // For non-Hague countries, make sure UD and Embassy are present even if not in pricing rules
          if (!isHagueCountry) {
            const hasUd = servicesFromFirebase.some(s => s.id === 'ud');
            const hasEmbassy = servicesFromFirebase.some(s => s.id === 'embassy');
            const fallbackFromPrefix = currentLocale === 'en' ? 'from' : 'från';
            if (!hasUd) {
              servicesFromFirebase.push({
                id: 'ud',
                name: getServiceName('ud'),
                description: getServiceDescription('ud', isHagueCountry),
                price: `${fallbackFromPrefix} 795 kr`,
                available: true,
                processingTime: 7
              });
            }
            if (!hasEmbassy) {
              servicesFromFirebase.push({
                id: 'embassy',
                name: getServiceName('embassy'),
                description: getServiceDescription('embassy', isHagueCountry),
                price: `${fallbackFromPrefix} 1295 kr`,
                available: true,
                processingTime: 14
              });
            }
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

           const sortedServices = servicesFromFirebase.sort((a, b) => {
             const stepA = getStepOrder(a.id);
             const stepB = getStepOrder(b.id);
             if (stepA !== stepB) {
               return stepA - stepB;
             }
             // If same step, maintain original order
             return 0;
           });

           setAvailableServices(sortedServices);
           return;
         }
      } catch (firebaseError) {
        // Firebase pricing failed, using fallback
      }

      // Fallback to mock pricing service

      // Services based on country type
      let availableServicesList = [];

      if (isHagueCountry) {
        // Hague Convention countries (like Sweden) - only these 3 services
        availableServicesList = [
          {
            id: 'translation',
            name: 'Auktoriserad översättning',
            description: 'Översättning av dokument',
            price: '0 kr',
            available: true
          },
          {
            id: 'notarization',
            name: 'Notarisering',
            description: 'Officiell notarisering av dokument',
            price: '0 kr',
            available: true
          },
          {
            id: 'apostille',
            name: 'Apostille',
            description: 'För länder som är anslutna till Haagkonventionen',
            price: '0 kr',
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
            price: '0 kr',
            available: true
          },
          {
            id: 'chamber',
            name: 'Handelskammare',
            description: 'Legaliserng av handelsdokument genom Handelskammaren',
            price: '0 kr',
            available: true
          },
          {
            id: 'notarization',
            name: 'Notarisering',
            description: 'Officiell notarisering av dokument',
            price: '0 kr',
            available: true
          },
          {
            id: 'ud',
            name: 'Utrikesdepartementet',
            description: 'Legaliserng hos svenska UD för icke-Haagkonventionsländer',
            price: '0 kr',
            available: true
          },
          {
            id: 'embassy',
            name: 'Ambassadlegalisering',
            description: 'Slutlig legalisering via det valda landets ambassad eller konsulat i Sverige',
            price: '0 kr',
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
          { id: 'translation', name: 'Auktoriserad översättning', description: 'Översättning av dokument', price: '0 kr', available: true },
          { id: 'notarization', name: 'Notarisering', description: 'Officiell notarisering av dokument', price: '0 kr', available: true },
          { id: 'apostille', name: 'Apostille', description: 'För länder som är anslutna till Haagkonventionen', price: '0 kr', available: true }
        ];
      } else {
        // Non-Hague countries - embassy legalization process
        fallbackServices = [
          { id: 'translation', name: 'Auktoriserad översättning', description: 'Översättning av dokument', price: '0 kr', available: true },
          { id: 'chamber', name: 'Handelskammare', description: 'Legaliserng av handelsdokument genom Handelskammaren', price: '0 kr', available: true },
          { id: 'notarization', name: 'Notarisering', description: 'Officiell notarisering av dokument', price: '0 kr', available: true },
          { id: 'ud', name: 'Utrikesdepartementet', description: 'Legaliserng hos svenska UD för icke-Haagkonventionsländer', price: '0 kr', available: true },
          { id: 'embassy', name: 'Ambassadlegalisering', description: 'Slutlig legalisering via det valda landets ambassad eller konsulat i Sverige', price: '0 kr', available: true }
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
        price: `${currentLocale === 'en' ? 'From' : 'Från'} ${rule.basePrice} kr`,
        provider: getShippingProvider(rule.serviceType),
        estimatedDelivery: getShippingDeliveryTime(rule.serviceType),
        available: true
      }));

      // Merge with default services (like admin page does)
      // priceValue is the numeric value used for calculations
      const fromText = currentLocale === 'en' ? 'From' : 'Från';
      const defaultReturnServices = [
        {
          id: 'postnord-rek',
          name: 'PostNord REK',
          description: getShippingServiceDescription('postnord-rek'),
          price: `${fromText} 85 kr`,
          priceValue: 85,
          provider: 'PostNord',
          estimatedDelivery: getShippingDeliveryTime('postnord-rek'),
          available: true
        },
        {
          id: 'dhl-sweden',
          name: 'DHL Sweden',
          description: getShippingServiceDescription('dhl-sweden'),
          price: `${fromText} 180 kr`,
          priceValue: 180,
          provider: 'DHL',
          estimatedDelivery: getShippingDeliveryTime('dhl-sweden'),
          available: true
        },
        {
          id: 'dhl-europe',
          name: 'DHL Europe',
          description: getShippingServiceDescription('dhl-europe'),
          price: `${fromText} 250 kr`,
          priceValue: 250,
          provider: 'DHL',
          estimatedDelivery: getShippingDeliveryTime('dhl-europe'),
          available: true
        },
        {
          id: 'dhl-worldwide',
          name: 'DHL Worldwide',
          description: getShippingServiceDescription('dhl-worldwide'),
          price: `${fromText} 450 kr`,
          priceValue: 450,
          provider: 'DHL',
          estimatedDelivery: getShippingDeliveryTime('dhl-worldwide'),
          available: true
        },
        {
          id: 'dhl-pre-12',
          name: 'DHL Pre 12',
          description: getShippingServiceDescription('dhl-pre-12'),
          price: `${fromText} 350 kr`,
          priceValue: 350,
          provider: 'DHL',
          estimatedDelivery: getShippingDeliveryTime('dhl-pre-12'),
          available: true
        },
        {
          id: 'dhl-pre-9',
          name: 'DHL Pre 9',
          description: getShippingServiceDescription('dhl-pre-9'),
          price: `${fromText} 450 kr`,
          priceValue: 450,
          provider: 'DHL',
          estimatedDelivery: getShippingDeliveryTime('dhl-pre-9'),
          available: true
        },
        {
          id: 'stockholm-city',
          name: 'Stockholm City Courier',
          description: getShippingServiceDescription('stockholm-city'),
          price: `${fromText} 120 kr`,
          priceValue: 120,
          provider: currentLocale === 'en' ? 'Local' : 'Lokal',
          estimatedDelivery: getShippingDeliveryTime('stockholm-city'),
          available: true
        },
        {
          id: 'stockholm-express',
          name: 'Stockholm Express',
          description: getShippingServiceDescription('stockholm-express'),
          price: `${fromText} 180 kr`,
          priceValue: 180,
          provider: currentLocale === 'en' ? 'Local' : 'Lokal',
          estimatedDelivery: getShippingDeliveryTime('stockholm-express'),
          available: true
        },
        {
          id: 'stockholm-sameday',
          name: 'Stockholm Same Day',
          description: getShippingServiceDescription('stockholm-sameday'),
          price: `${fromText} 250 kr`,
          priceValue: 250,
          provider: currentLocale === 'en' ? 'Local' : 'Lokal',
          estimatedDelivery: getShippingDeliveryTime('stockholm-sameday'),
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
      // Use default services if Firebase fails
      const fallbackFromText = currentLocale === 'en' ? 'From' : 'Från';
      const defaultReturnServices = [
        {
          id: 'postnord-rek',
          name: 'PostNord REK',
          description: getShippingServiceDescription('postnord-rek'),
          price: `${fallbackFromText} 85 kr`,
          priceValue: 85,
          provider: 'PostNord',
          estimatedDelivery: getShippingDeliveryTime('postnord-rek'),
          available: true
        },
        {
          id: 'dhl-sweden',
          name: 'DHL Sweden',
          description: getShippingServiceDescription('dhl-sweden'),
          price: `${fallbackFromText} 180 kr`,
          priceValue: 180,
          provider: 'DHL',
          estimatedDelivery: getShippingDeliveryTime('dhl-sweden'),
          available: true
        }
      ];
      setReturnServices(defaultReturnServices);
    } finally {
      setLoadingReturnServices(false);
    }
  };

  const loadPickupServices = async () => {
    try {
      setLoadingPickupServices(true);

      // Default pickup services (fallback om Firebase inte ger regler)
      const isEnglish = currentLocale === 'en';
      const defaultPickupServices = [
        {
          id: 'dhl-sweden',
          name: 'DHL Sweden',
          description: isEnglish ? 'DHL pickup within Sweden' : 'DHL upphämtning inom Sverige',
          price: '0 kr',
          provider: 'DHL',
          estimatedPickup: '',
          available: true
        },
        {
          id: 'dhl-pre-12',
          name: 'DHL Pre 12',
          description: isEnglish ? 'Pickup before 12:00 next business day' : 'Upphämtning före klockan 12:00 nästa arbetsdag',
          price: '0 kr',
          provider: 'DHL',
          estimatedPickup: '',
          available: true
        },
        {
          id: 'dhl-pre-9',
          name: 'DHL Pre 9',
          description: isEnglish ? 'Pickup before 09:00 next business day' : 'Upphämtning före klockan 09:00 nästa arbetsdag',
          price: '0 kr',
          provider: 'DHL',
          estimatedPickup: '',
          available: true
        },
        {
          id: 'dhl-europe',
          name: 'DHL Europe',
          description: isEnglish ? 'DHL pickup within Europe' : 'DHL upphämtning inom Europa',
          price: '0 kr',
          provider: 'DHL',
          estimatedPickup: '',
          available: true
        },
        {
          id: 'dhl-worldwide',
          name: 'DHL Worldwide',
          description: isEnglish ? 'DHL international pickup' : 'DHL internationell upphämtning',
          price: '0 kr',
          provider: 'DHL',
          estimatedPickup: '',
          available: true
        },
        {
          id: 'stockholm-city',
          name: 'Stockholm City Courier',
          description: isEnglish ? 'Local courier service within Stockholm' : 'Lokal budservice inom Stockholm',
          price: '0 kr',
          provider: isEnglish ? 'Local' : 'Lokal',
          estimatedPickup: '',
          available: true
        },
        {
          id: 'stockholm-express',
          name: 'Stockholm Express',
          description: isEnglish ? 'Express pickup within Stockholm same day' : 'Expressupphämtning inom Stockholm samma dag',
          price: '0 kr',
          provider: isEnglish ? 'Local' : 'Lokal',
          estimatedPickup: '',
          available: true
        },
        {
          id: 'stockholm-sameday',
          name: 'Stockholm Same Day',
          description: isEnglish ? 'Same day pickup within Stockholm' : 'Samma dags upphämtning inom Stockholm',
          price: '0 kr',
          provider: isEnglish ? 'Local' : 'Lokal',
          estimatedPickup: '',
          available: true
        }
      ];

      try {
        const allRules = await getAllActivePricingRules();

        // Pickup-tjänster som ska styras via GLOBAL-fraktregler (samma koder som i admin/shipping-services)
        const pickupIds = [
          'dhl-sweden',
          'dhl-europe',
          'dhl-worldwide',
          'dhl-pre-12',
          'dhl-pre-9',
          'stockholm-city',
          'stockholm-express',
          'stockholm-sameday'
        ];

        const pickupRules = allRules.filter((rule: any) =>
          pickupIds.includes(rule.serviceType) && rule.countryCode === 'GLOBAL'
        );

        // Bygg pickup-tjänster direkt från Firebase-reglerna
        const servicesFromFirebase = pickupRules.map((rule: any) => ({
          id: rule.serviceType,
          name: getShippingServiceName(rule.serviceType),
          description: getShippingServiceDescription(rule.serviceType),
          price: `${currentLocale === 'en' ? 'From' : 'Från'} ${rule.basePrice} kr`,
          provider: getShippingProvider(rule.serviceType),
          estimatedPickup: getShippingDeliveryTime(rule.serviceType),
          available: true
        }));

        if (servicesFromFirebase.length > 0) {
          // Sortera pickup-tjänster i en bestämd ordning (så att t.ex. DHL Sweden visas före DHL Europe)
          const pickupOrder = [
            'dhl-sweden',
            'dhl-europe',
            'dhl-worldwide',
            'dhl-pre-12',
            'dhl-pre-9',
            'stockholm-city',
            'stockholm-express',
            'stockholm-sameday'
          ];

          const orderedServices = servicesFromFirebase.sort((a, b) => {
            const indexA = pickupOrder.indexOf(a.id);
            const indexB = pickupOrder.indexOf(b.id);
            const sortA = indexA === -1 ? 99 : indexA;
            const sortB = indexB === -1 ? 99 : indexB;
            return sortA - sortB;
          });

          // När Firebase-regler finns ska de styra helt (inga hårdkodade priser)
          setPickupServices(orderedServices);
        } else {
          // Fallback om inga regler hittas
          setPickupServices(defaultPickupServices);
        }
      } catch (pricingError) {
        setPickupServices(defaultPickupServices);
      }
    } catch (error) {
      console.error('Error loading pickup services:', error);
      setPickupServices([]);
    } finally {
      setLoadingPickupServices(false);
    }
  };

  const calculatePricingBreakdown = async () => {
    try {
      setLoadingPricing(true);

      // Try to match customer by email domain for custom pricing (preview/summary pricing)
      const emailForPricing = (
        answers.billingInfo?.email ||
        answers.returnAddress?.email ||
        answers.customerInfo?.email ||
        ''
      ).trim();

      let customerPricingData = undefined;
      if (emailForPricing) {
        const matchedCustomer = await getCustomerByEmailDomain(emailForPricing);
        if (matchedCustomer) {
          customerPricingData = {
            customPricing: matchedCustomer.customPricing,
            vatExempt: matchedCustomer.vatExempt,
            companyName: matchedCustomer.companyName
          };
        }
      }
      
      // Use the centralized calculateOrderPrice function from pricingService
      const pricingResult = await calculateOrderPrice({
        country: answers.country,
        services: answers.services,
        quantity: answers.quantity,
        expedited: answers.expedited,
        returnService: answers.returnService,
        returnServices: returnServices,
        scannedCopies: answers.scannedCopies,
        pickupService: answers.pickupService,
        pickupMethod: answers.pickupMethod as 'dhl' | 'stockholm_courier' | undefined,
        premiumPickup: answers.premiumPickup,
        premiumDelivery: answers.premiumDelivery,
        customerPricing: customerPricingData
      });

      setPricingBreakdown(pricingResult.breakdown);
      setHasUnconfirmedPrices(pricingResult.hasUnconfirmedPrices || false);
    } catch (error) {
      toast.error('Kunde inte beräkna pris');
    } finally {
      setLoadingPricing(false);
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
    const isEnglish = currentLocale === 'en';
    const descriptions: { [key: string]: string } = {
      'postnord-rek': isEnglish ? 'Registered mail - trackable and insured' : 'Rekommenderat brev - spårbart och försäkrat',
      'dhl-sweden': isEnglish ? 'DHL delivery within Sweden' : 'DHL leverans inom Sverige',
      'dhl-europe': isEnglish ? 'DHL delivery within Europe' : 'DHL leverans inom Europa',
      'dhl-worldwide': isEnglish ? 'DHL international delivery' : 'DHL internationell leverans',
      'dhl-pre-12': isEnglish ? 'Delivery before 12:00 next business day' : 'Leverans före klockan 12:00 nästa arbetsdag',
      'dhl-pre-9': isEnglish ? 'Delivery before 09:00 next business day' : 'Leverans före klockan 09:00 nästa arbetsdag',
      'stockholm-city': isEnglish ? 'Local courier service within Stockholm' : 'Lokal budservice inom Stockholm',
      'stockholm-express': isEnglish ? 'Express delivery within Stockholm same day' : 'Expressleverans inom Stockholm samma dag',
      'stockholm-sameday': isEnglish ? 'Same day delivery within Stockholm' : 'Samma dags leverans inom Stockholm'
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
    const isEnglish = currentLocale === 'en';
    const deliveryTimes: { [key: string]: string } = {
      'postnord-rek': isEnglish ? '2-5 business days' : '2-5 arbetsdagar',
      'dhl-sweden': isEnglish ? '1-2 business days' : '1-2 arbetsdagar',
      'dhl-europe': isEnglish ? '2-4 business days' : '2-4 arbetsdagar',
      'dhl-worldwide': isEnglish ? '3-7 business days' : '3-7 arbetsdagar',
      'dhl-pre-12': isEnglish ? 'Next business day before 12:00' : 'Nästa arbetsdag före 12:00',
      'dhl-pre-9': isEnglish ? 'Next business day before 09:00' : 'Nästa arbetsdag före 09:00',
      'stockholm-city': isEnglish ? 'Same day (before 16:00)' : 'Samma dag (före 16:00)',
      'stockholm-express': isEnglish ? '2-4 hours' : '2-4 timmar',
      'stockholm-sameday': isEnglish ? 'Within 2 hours' : 'Inom 2 timmar'
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

    navigateToStep(2);
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
      navigateToStep(2);
    }
  };

  // Handle order submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSubmitting || submissionInProgressRef.current) {
      return;
    }

    try {
      setIsSubmitting(true);
      submissionInProgressRef.current = true;

      // Verify reCAPTCHA v3
      if (!executeRecaptcha) {
        toast.error('reCAPTCHA är inte redo, vänligen försök igen');
        return;
      }
      const recaptchaToken = await executeRecaptcha('submit_order');
      if (!recaptchaToken) {
        toast.error('Vänligen verifiera att du inte är en robot');
        return;
      }

      // Create order with files
      const result = await createOrderWithFiles({
        ...answers,
        recaptchaToken,
        totalPrice,
        pricingBreakdown,
        hasUnconfirmedPrices
      });

      if (result?.success) {
        toast.success('Beställning mottagen!');
        clearProgress();
        router.push(`/order-confirmation?id=${result.orderId}`);
      } else {
        toast.error(result?.error || 'Något gick fel');
      }
    } catch (error) {
      console.error('Order submission error:', error);
      toast.error('Kunde inte skicka beställning');
    } finally {
      setIsSubmitting(false);
      submissionInProgressRef.current = false;
    }
  };



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
                      // Allow navigation to any step up to the highest reached
                      if (step <= highestStepReached) {
                        navigateToStep(step);
                      }
                    }}
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-200 ${
                      step < currentQuestion
                        ? 'bg-custom-button text-white hover:bg-custom-button-hover hover:scale-110 cursor-pointer shadow-md'
                        : step === currentQuestion
                        ? 'bg-custom-button text-white ring-2 ring-custom-button-light ring-offset-2 scale-110 shadow-lg'
                        : step <= highestStepReached
                        ? 'bg-blue-100 text-blue-700 hover:bg-blue-200 cursor-pointer border-2 border-blue-300'
                        : 'bg-gray-300 text-gray-600 cursor-not-allowed'
                    }`}
                    disabled={step > highestStepReached}
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

          {/* Toggle for summary sidebar */}
          <div className="flex justify-center lg:justify-end mb-6">
            <button
              type="button"
              onClick={() => setIsSummaryExpanded((prev) => !prev)}
              className="inline-flex items-center px-4 py-2 rounded-full border border-gray-300 bg-white text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 transition-colors"
           >
              <span className="mr-2">
                {currentLocale === 'en'
                  ? isSummaryExpanded
                    ? 'Hide summary'
                    : 'Show summary'
                  : isSummaryExpanded
                  ? 'Dölj sammanfattning'
                  : 'Visa sammanfattning'}
              </span>
              <svg
                className={`w-4 h-4 text-gray-500 transform transition-transform ${isSummaryExpanded ? 'rotate-180' : ''}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>

          {/* Mobile summary: show directly under toggle */}
          {isSummaryExpanded && (
            <div className="lg:hidden mb-6">
              <OrderSummary
                answers={answers}
                pricingBreakdown={pricingBreakdown}
                totalPrice={totalPrice}
                allCountries={allCountries}
                returnServices={returnServices}
                pickupServices={pickupServices}
                hasUnconfirmedPrices={hasUnconfirmedPrices}
              />
            </div>
          )}

          {/* Layout: grid that adapts when summary is expanded/collapsed */}
          <div className={`grid grid-cols-1 ${isSummaryExpanded ? 'lg:grid-cols-3' : ''} gap-8 relative`}>
            {/* Main content - Steps */}
            <div
              className={
                isSummaryExpanded
                  ? 'lg:col-span-2 min-h-screen'
                  : 'min-h-screen'
              }
            >
              {/* Render current question */}
              {currentQuestion === 1 && (
                <Step1CountrySelection
                  answers={answers}
                  setAnswers={setAnswers}
                  onNext={() => navigateToStep(2)}
                  onBack={() => {}}
                  currentLocale={currentLocale}
                />
              )}
              {currentQuestion === 2 && (
                <Step2DocumentType
                  answers={answers}
                  setAnswers={setAnswers}
                  onNext={() => navigateToStep(3)}
                  onBack={() => navigateToStep(1)}
                  currentLocale={currentLocale}
                />
              )}
              {currentQuestion === 3 && (
                <Step4Quantity
                  answers={answers}
                  setAnswers={setAnswers}
                  onNext={() => navigateToStep(4)}
                  onBack={() => navigateToStep(2)}
                  currentLocale={currentLocale}
                />
              )}
              {currentQuestion === 4 && (
                <Step3ServicesSelection
                  answers={answers}
                  setAnswers={setAnswers}
                  onNext={() => {
                    if (answers.helpMeChooseServices) {
                      navigateToStep(10);
                    } else {
                      navigateToStep(5);
                    }
                  }}
                  onBack={() => navigateToStep(3)}
                  availableServices={availableServices}
                  loadingServices={loadingServices}
                  currentLocale={currentLocale}
                  allCountries={allCountries}
                />
              )}
              {currentQuestion === 5 && (
                <Step5DocumentSource
                  answers={answers}
                  setAnswers={setAnswers}
                  onNext={() => navigateToStep(6)}
                  onBack={() => navigateToStep(4)}
                  onDocumentSourceSelect={(source) => {
                    if (source === 'upload') {
                      // Skip pickup service step and go to shipping step
                      navigateToStep(8);
                    } else {
                      // Go to pickup service step
                      navigateToStep(6);
                    }
                  }}
                  currentLocale={currentLocale}
                />
              )}
              {currentQuestion === 6 && (
                <Step6PickupService
                  answers={answers}
                  setAnswers={setAnswers}
                  onNext={() => navigateToStep(7)}
                  onBack={() => navigateToStep(5)}
                  pickupServices={pickupServices}
                  loadingPickupServices={loadingPickupServices}
                  currentLocale={currentLocale}
                />
              )}
              {currentQuestion === 7 && (
                <Step7ShippingOrPickup
                  answers={answers}
                  setAnswers={setAnswers}
                  onNext={() => navigateToStep(8)}
                  onBack={() => navigateToStep(6)}
                  onSkip={() => {
                    if (answers.documentSource === 'upload') {
                      navigateToStep(8);
                    } else {
                      navigateToStep(9);
                    }
                  }}
                  currentLocale={currentLocale}
                />
              )}
              {currentQuestion === 8 && (
                <Step8ScannedCopies
                  answers={answers}
                  setAnswers={setAnswers}
                  onNext={() => navigateToStep(9)}
                  onBack={() => {
                    if (answers.documentSource === 'upload') {
                      navigateToStep(5);
                    } else {
                      navigateToStep(7);
                    }
                  }}
                  currentLocale={currentLocale}
                />
              )}
              {currentQuestion === 9 && (
                <Step9ReturnService
                  answers={answers}
                  setAnswers={setAnswers}
                  onNext={() => navigateToStep(9.5)}
                  onBack={() => navigateToStep(8)}
                  returnServices={returnServices}
                  loadingReturnServices={loadingReturnServices}
                />
              )}
              {currentQuestion === 9.5 && (
                <Step9bReturnAddress
                  answers={answers}
                  setAnswers={setAnswers}
                  onNext={() => navigateToStep(10)}
                  onBack={() => navigateToStep(9)}
                  onSkip={() => navigateToStep(10)}
                  currentLocale={currentLocale}
                />
              )}
              {currentQuestion === 10 && (
                <Step10ReviewSubmit
                  answers={answers}
                  setAnswers={setAnswers}
                  onNext={() => {}}
                  onBack={() => {
                    if (answers.helpMeChooseServices) {
                      navigateToStep(4);
                      return;
                    }
                    // Go back to step 9.5 if return address was required, otherwise step 9
                    const requiresReturnAddress = !!answers.returnService && 
                      ['dhl-sweden', 'dhl-europe', 'dhl-worldwide', 'stockholm-city', 'postnord-rek'].includes(answers.returnService);
                    navigateToStep(requiresReturnAddress ? 9.5 : 9);
                  }}
                  allCountries={allCountries}
                  returnServices={returnServices}
                  loadingReturnServices={loadingReturnServices}
                  pricingBreakdown={pricingBreakdown}
                  loadingPricing={loadingPricing}
                  totalPrice={totalPrice}
                  executeRecaptcha={executeRecaptcha}
                  isSubmitting={isSubmitting}
                  onSubmit={handleSubmit}
                  currentLocale={currentLocale}
                />
              )}
            </div>

            {/* Sidebar - Order Summary */}
            {isSummaryExpanded && (
              <div className="hidden lg:block lg:col-span-1 self-start">
                <OrderSummary
                  answers={answers}
                  pricingBreakdown={pricingBreakdown}
                  totalPrice={totalPrice}
                  allCountries={allCountries}
                  returnServices={returnServices}
                  pickupServices={pickupServices}
                  hasUnconfirmedPrices={hasUnconfirmedPrices}
                />
              </div>
            )}
          </div>
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
