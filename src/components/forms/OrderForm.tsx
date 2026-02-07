import React, { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'next-i18next';

interface OrderFormProps {
  initialData: any;
  onSubmit: (data: any) => void;
  onBack: () => void;
}

const OrderForm: React.FC<OrderFormProps> = ({ initialData, onSubmit, onBack }) => {
  const { t } = useTranslation('common');
  const { register, handleSubmit, formState: { errors }, watch, setValue } = useForm({
    defaultValues: initialData
  });
  const selectedDeliveryMethod = watch('deliveryMethod');
  const isPickupSelected = selectedDeliveryMethod === 'pickup';

  const [isGoogleLoaded, setIsGoogleLoaded] = useState(false);
  const addressInputRef = useRef<HTMLInputElement | null>(null);

  const addressRegister = register('customerInfo.address', { required: !isPickupSelected });

  // Load Google Maps JavaScript API with Places library on the client
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const w = window as any;

    if (w.google?.maps?.places) {
      setIsGoogleLoaded(true);
      return;
    }

    const existingScript = document.getElementById('google-maps-js');
    if (existingScript) {
      existingScript.addEventListener('load', () => setIsGoogleLoaded(true));
      return;
    }

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      // API key not configured
      return;
    }

    const script = document.createElement('script');
    script.id = 'google-maps-js';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&language=sv`;
    script.async = true;
    script.defer = true;
    script.onload = () => setIsGoogleLoaded(true);
    document.head.appendChild(script);
  }, []);

  // Attach Places Autocomplete to the address field and map components to form fields
  useEffect(() => {
    if (!isGoogleLoaded) return;
    if (!addressInputRef.current) return;
    if (typeof window === 'undefined') return;

    const w = window as any;
    if (!w.google?.maps?.places) return;

    const autocomplete = new w.google.maps.places.Autocomplete(addressInputRef.current, {
      types: ['address'],
      fields: ['address_components', 'formatted_address']
    });

    const listener = autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace();
      if (!place || !place.address_components) return;

      let street = '';
      let postalCode = '';
      let city = '';
      let countryCode = '';

      (place.address_components || []).forEach((component: any) => {
        const types = component.types || [];
        if (types.includes('street_number')) {
          street = street ? `${street} ${component.long_name}` : component.long_name;
        }
        if (types.includes('route')) {
          street = street ? `${component.long_name} ${street}` : component.long_name;
        }
        if (types.includes('postal_code')) {
          postalCode = component.long_name;
        }
        if (types.includes('locality') || types.includes('postal_town')) {
          city = component.long_name;
        }
        if (types.includes('country')) {
          countryCode = component.short_name;
        }
      });

      if (street) {
        setValue('customerInfo.address', street, { shouldValidate: true, shouldDirty: true });
      }
      if (postalCode) {
        setValue('customerInfo.postalCode', postalCode, { shouldValidate: true, shouldDirty: true });
      }
      if (city) {
        setValue('customerInfo.city', city, { shouldValidate: true, shouldDirty: true });
      }
      if (countryCode) {
        setValue('country', countryCode, { shouldValidate: true, shouldDirty: true });
      }
    });

    return () => {
      if (listener) {
        listener.remove();
      }
    };
  }, [isGoogleLoaded, setValue]);

  const countries = [
    // Afrika (54 länder)
    { code: 'DZ', name: 'Algeriet' },
    { code: 'AO', name: 'Angola' },
    { code: 'BJ', name: 'Benin' },
    { code: 'BW', name: 'Botswana' },
    { code: 'BF', name: 'Burkina Faso' },
    { code: 'BI', name: 'Burundi' },
    { code: 'CV', name: 'Kap Verde' },
    { code: 'CM', name: 'Kamerun' },
    { code: 'CF', name: 'Centralafrikanska republiken' },
    { code: 'TD', name: 'Tchad' },
    { code: 'KM', name: 'Komorerna' },
    { code: 'CG', name: 'Kongo-Brazzaville' },
    { code: 'CD', name: 'Kongo-Kinshasa' },
    { code: 'CI', name: 'Elfenbenskusten' },
    { code: 'DJ', name: 'Djibouti' },
    { code: 'EG', name: 'Egypten' },
    { code: 'GQ', name: 'Ekvatorialguinea' },
    { code: 'ER', name: 'Eritrea' },
    { code: 'SZ', name: 'Eswatini' },
    { code: 'ET', name: 'Etiopien' },
    { code: 'GA', name: 'Gabon' },
    { code: 'GM', name: 'Gambia' },
    { code: 'GH', name: 'Ghana' },
    { code: 'GN', name: 'Guinea' },
    { code: 'GW', name: 'Guinea-Bissau' },
    { code: 'KE', name: 'Kenya' },
    { code: 'LS', name: 'Lesotho' },
    { code: 'LR', name: 'Liberia' },
    { code: 'LY', name: 'Libyen' },
    { code: 'MG', name: 'Madagaskar' },
    { code: 'MW', name: 'Malawi' },
    { code: 'ML', name: 'Mali' },
    { code: 'MR', name: 'Mauretanien' },
    { code: 'MU', name: 'Mauritius' },
    { code: 'MA', name: 'Marocko' },
    { code: 'MZ', name: 'Moçambique' },
    { code: 'NA', name: 'Namibia' },
    { code: 'NE', name: 'Niger' },
    { code: 'NG', name: 'Nigeria' },
    { code: 'RW', name: 'Rwanda' },
    { code: 'ST', name: 'São Tomé och Príncipe' },
    { code: 'SN', name: 'Senegal' },
    { code: 'SC', name: 'Seychellerna' },
    { code: 'SL', name: 'Sierra Leone' },
    { code: 'SO', name: 'Somalia' },
    { code: 'ZA', name: 'Sydafrika' },
    { code: 'SS', name: 'Sydsudan' },
    { code: 'SD', name: 'Sudan' },
    { code: 'TZ', name: 'Tanzania' },
    { code: 'TG', name: 'Togo' },
    { code: 'TN', name: 'Tunisien' },
    { code: 'UG', name: 'Uganda' },
    { code: 'ZM', name: 'Zambia' },
    { code: 'ZW', name: 'Zimbabwe' },

    // Asien (48 länder)
    { code: 'AF', name: 'Afghanistan' },
    { code: 'AM', name: 'Armenien' },
    { code: 'AZ', name: 'Azerbajdzjan' },
    { code: 'BH', name: 'Bahrain' },
    { code: 'BD', name: 'Bangladesh' },
    { code: 'BT', name: 'Bhutan' },
    { code: 'BN', name: 'Brunei' },
    { code: 'KH', name: 'Kambodja' },
    { code: 'CN', name: 'Kina' },
    { code: 'CY', name: 'Cypern' },
    { code: 'GE', name: 'Georgien' },
    { code: 'IN', name: 'Indien' },
    { code: 'ID', name: 'Indonesien' },
    { code: 'IR', name: 'Iran' },
    { code: 'IQ', name: 'Irak' },
    { code: 'IL', name: 'Israel' },
    { code: 'JP', name: 'Japan' },
    { code: 'JO', name: 'Jordanien' },
    { code: 'KZ', name: 'Kazakstan' },
    { code: 'KW', name: 'Kuwait' },
    { code: 'KG', name: 'Kirgizistan' },
    { code: 'LA', name: 'Laos' },
    { code: 'LB', name: 'Libanon' },
    { code: 'MY', name: 'Malaysia' },
    { code: 'MV', name: 'Maldiverna' },
    { code: 'MN', name: 'Mongoliet' },
    { code: 'MM', name: 'Myanmar' },
    { code: 'NP', name: 'Nepal' },
    { code: 'KP', name: 'Nordkorea' },
    { code: 'OM', name: 'Oman' },
    { code: 'PK', name: 'Pakistan' },
    { code: 'PS', name: 'Palestina' },
    { code: 'PH', name: 'Filippinerna' },
    { code: 'QA', name: 'Qatar' },
    { code: 'SA', name: 'Saudiarabien' },
    { code: 'SG', name: 'Singapore' },
    { code: 'KR', name: 'Sydkorea' },
    { code: 'LK', name: 'Sri Lanka' },
    { code: 'SY', name: 'Syrien' },
    { code: 'TW', name: 'Taiwan' },
    { code: 'TJ', name: 'Tadzjikistan' },
    { code: 'TH', name: 'Thailand' },
    { code: 'TL', name: 'Östtimor' },
    { code: 'TR', name: 'Turkiet' },
    { code: 'TM', name: 'Turkmenistan' },
    { code: 'AE', name: 'Förenade Arabemiraten' },
    { code: 'UZ', name: 'Uzbekistan' },
    { code: 'VN', name: 'Vietnam' },
    { code: 'YE', name: 'Jemen' },

    // Europa (44 länder)
    { code: 'AL', name: 'Albanien' },
    { code: 'AD', name: 'Andorra' },
    { code: 'AT', name: 'Österrike' },
    { code: 'BY', name: 'Vitryssland' },
    { code: 'BE', name: 'Belgien' },
    { code: 'BA', name: 'Bosnien och Hercegovina' },
    { code: 'BG', name: 'Bulgarien' },
    { code: 'HR', name: 'Kroatien' },
    { code: 'CY', name: 'Cypern' },
    { code: 'CZ', name: 'Tjeckien' },
    { code: 'DK', name: 'Danmark' },
    { code: 'EE', name: 'Estland' },
    { code: 'FI', name: 'Finland' },
    { code: 'FR', name: 'Frankrike' },
    { code: 'DE', name: 'Tyskland' },
    { code: 'GR', name: 'Grekland' },
    { code: 'HU', name: 'Ungern' },
    { code: 'IS', name: 'Island' },
    { code: 'IE', name: 'Irland' },
    { code: 'IT', name: 'Italien' },
    { code: 'LV', name: 'Lettland' },
    { code: 'LI', name: 'Liechtenstein' },
    { code: 'LT', name: 'Litauen' },
    { code: 'LU', name: 'Luxemburg' },
    { code: 'MT', name: 'Malta' },
    { code: 'MD', name: 'Moldavien' },
    { code: 'MC', name: 'Monaco' },
    { code: 'ME', name: 'Montenegro' },
    { code: 'NL', name: 'Nederländerna' },
    { code: 'MK', name: 'Nordmakedonien' },
    { code: 'NO', name: 'Norge' },
    { code: 'PL', name: 'Polen' },
    { code: 'PT', name: 'Portugal' },
    { code: 'RO', name: 'Rumänien' },
    { code: 'RU', name: 'Ryssland' },
    { code: 'SM', name: 'San Marino' },
    { code: 'RS', name: 'Serbien' },
    { code: 'SK', name: 'Slovakien' },
    { code: 'SI', name: 'Slovenien' },
    { code: 'ES', name: 'Spanien' },
    { code: 'SE', name: 'Sverige' },
    { code: 'CH', name: 'Schweiz' },
    { code: 'UA', name: 'Ukraina' },
    { code: 'GB', name: 'Storbritannien' },
    { code: 'VA', name: 'Vatikanstaten' },

    // Nordamerika (23 länder)
    { code: 'AG', name: 'Antigua och Barbuda' },
    { code: 'BS', name: 'Bahamas' },
    { code: 'BB', name: 'Barbados' },
    { code: 'BZ', name: 'Belize' },
    { code: 'CA', name: 'Kanada' },
    { code: 'CR', name: 'Costa Rica' },
    { code: 'CU', name: 'Kuba' },
    { code: 'DM', name: 'Dominica' },
    { code: 'DO', name: 'Dominikanska republiken' },
    { code: 'SV', name: 'El Salvador' },
    { code: 'GD', name: 'Grenada' },
    { code: 'GT', name: 'Guatemala' },
    { code: 'HT', name: 'Haiti' },
    { code: 'HN', name: 'Honduras' },
    { code: 'JM', name: 'Jamaica' },
    { code: 'MX', name: 'Mexiko' },
    { code: 'NI', name: 'Nicaragua' },
    { code: 'PA', name: 'Panama' },
    { code: 'KN', name: 'Saint Kitts och Nevis' },
    { code: 'LC', name: 'Saint Lucia' },
    { code: 'VC', name: 'Saint Vincent och Grenadinerna' },
    { code: 'TT', name: 'Trinidad och Tobago' },
    { code: 'US', name: 'USA' },

    // Sydamerika (12 länder)
    { code: 'AR', name: 'Argentina' },
    { code: 'BO', name: 'Bolivia' },
    { code: 'BR', name: 'Brasilien' },
    { code: 'CL', name: 'Chile' },
    { code: 'CO', name: 'Colombia' },
    { code: 'EC', name: 'Ecuador' },
    { code: 'GY', name: 'Guyana' },
    { code: 'PY', name: 'Paraguay' },
    { code: 'PE', name: 'Peru' },
    { code: 'SR', name: 'Surinam' },
    { code: 'UY', name: 'Uruguay' },
    { code: 'VE', name: 'Venezuela' },

    // Oceanien (14 länder)
    { code: 'AU', name: 'Australien' },
    { code: 'FJ', name: 'Fiji' },
    { code: 'KI', name: 'Kiribati' },
    { code: 'MH', name: 'Marshallöarna' },
    { code: 'FM', name: 'Mikronesiska federationen' },
    { code: 'NR', name: 'Nauru' },
    { code: 'NZ', name: 'Nya Zeeland' },
    { code: 'PW', name: 'Palau' },
    { code: 'PG', name: 'Papua Nya Guinea' },
    { code: 'WS', name: 'Samoa' },
    { code: 'SB', name: 'Salomonöarna' },
    { code: 'TO', name: 'Tonga' },
    { code: 'TV', name: 'Tuvalu' },
    { code: 'VU', name: 'Vanuatu' }
  ];

  const documentTypes = [
    { id: 'birth-certificate', name: t('documents.birthCertificate') },
    { id: 'marriage-certificate', name: t('documents.marriageCertificate') },
    { id: 'diploma', name: t('documents.diploma') },
    { id: 'commercial-documents', name: t('documents.commercialDocuments') },
    { id: 'power-of-attorney', name: t('documents.powerOfAttorney') },
    { id: 'other', name: t('documents.other') },
  ];

  const onFormSubmit = (data: any) => {
    onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-8" noValidate>
      <div>
        <h2 className="text-xl font-semibold mb-6">{t('order.form.documentDetails')}</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="documentType" className="block text-sm font-medium text-gray-700 mb-1">
              {t('order.form.documentType')} <span className="text-red-500">*</span>
            </label>
            <select
              id="documentType"
              {...register('documentType', { required: true })}
              className={`mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md ${
                errors.documentType ? 'border-red-500' : ''
              }`}
              aria-describedby={errors.documentType ? 'documentType-error' : undefined}
              aria-invalid={errors.documentType ? 'true' : 'false'}
            >
              <option value="">{t('order.form.selectDocumentType')}</option>
              {documentTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </select>
            {errors.documentType && (
              <p id="documentType-error" className="mt-2 text-sm text-red-600">
                {t('order.form.errors.documentTypeRequired')}
              </p>
            )}
          </div>
          
          <div>
            <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-1">
              {t('order.form.country')} <span className="text-red-500">*</span>
            </label>
            <select
              id="country"
              {...register('country', { required: true })}
              className={`mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md ${
                errors.country ? 'border-red-500' : ''
              }`}
              aria-describedby={errors.country ? 'country-error' : undefined}
              aria-invalid={errors.country ? 'true' : 'false'}
            >
              <option value="">{t('order.form.selectCountry')}</option>
              {countries.map((country) => (
                <option key={country.code} value={country.code}>
                  {country.name}
                </option>
              ))}
            </select>
            {errors.country && (
              <p id="country-error" className="mt-2 text-sm text-red-600">
                {t('order.form.errors.countryRequired')}
              </p>
            )}
          </div>
          
          <div>
            <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-1">
              {t('order.form.quantity')} <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              id="quantity"
              min="1"
              max="100"
              {...register('quantity', { required: true, min: 1, max: 100 })}
              className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm ${
                errors.quantity ? 'border-red-500' : ''
              }`}
              aria-describedby={errors.quantity ? 'quantity-error' : undefined}
              aria-invalid={errors.quantity ? 'true' : 'false'}
            />
            {errors.quantity && (
              <p id="quantity-error" className="mt-2 text-sm text-red-600">
                {t('order.form.errors.quantityRequired')}
              </p>
            )}
          </div>
          
          <div className="flex items-center h-full pt-6">
            <input
              id="expedited"
              type="checkbox"
              {...register('expedited')}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <label htmlFor="expedited" className="ml-2 block text-sm text-gray-700">
              {t('order.form.expedited')}
            </label>
          </div>
        </div>
      </div>
      
      <div>
        <h2 className="text-xl font-semibold mb-6">{t('order.form.customerInfo')}</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
              {t('order.form.firstName')} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="firstName"
              {...register('customerInfo.firstName', { required: true })}
              className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm ${
                (errors as any).customerInfo?.firstName ? 'border-red-500' : ''
              }`}
              aria-describedby={(errors as any).customerInfo?.firstName ? 'firstName-error' : undefined}
              aria-invalid={(errors as any).customerInfo?.firstName ? 'true' : 'false'}
            />
            {(errors as any).customerInfo?.firstName && (
              <p id="firstName-error" className="mt-2 text-sm text-red-600">
                {t('order.form.errors.firstNameRequired')}
              </p>
            )}
          </div>
          
          <div>
            <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
              {t('order.form.lastName')} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="lastName"
              {...register('customerInfo.lastName', { required: true })}
              className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm ${
                (errors as any).customerInfo?.lastName ? 'border-red-500' : ''
              }`}
              aria-describedby={(errors as any).customerInfo?.lastName ? 'lastName-error' : undefined}
              aria-invalid={(errors as any).customerInfo?.lastName ? 'true' : 'false'}
            />
            {(errors as any).customerInfo?.lastName && (
              <p id="lastName-error" className="mt-2 text-sm text-red-600">
                {t('order.form.errors.lastNameRequired')}
              </p>
            )}
          </div>
          
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              {t('order.form.email')} <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              id="email"
              {...register('customerInfo.email', {
                required: true,
                pattern: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i
              })}
              className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm ${
                (errors as any).customerInfo?.email ? 'border-red-500' : ''
              }`}
              aria-describedby={(errors as any).customerInfo?.email ? 'email-error' : undefined}
              aria-invalid={(errors as any).customerInfo?.email ? 'true' : 'false'}
            />
            {(errors as any).customerInfo?.email && (
              <p id="email-error" className="mt-2 text-sm text-red-600">
                {t('order.form.errors.emailInvalid')}
              </p>
            )}
          </div>
          
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
              {t('order.form.phone')} <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              id="phone"
              {...register('customerInfo.phone', { required: true })}
              className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm ${
                (errors as any).customerInfo?.phone ? 'border-red-500' : ''
              }`}
              aria-describedby={(errors as any).customerInfo?.phone ? 'phone-error' : undefined}
              aria-invalid={(errors as any).customerInfo?.phone ? 'true' : 'false'}
            />
            {(errors as any).customerInfo?.phone && (
              <p id="phone-error" className="mt-2 text-sm text-red-600">
                {t('order.form.errors.phoneRequired')}
              </p>
            )}
          </div>
          
         {!isPickupSelected && (
           <>
             <div className="md:col-span-2">
               <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                 {t('order.form.address')} <span className="text-red-500">*</span>
               </label>
               <input
                 type="text"
                 id="address"
                 {...addressRegister}
                 ref={(el) => {
                   addressRegister.ref(el);
                   addressInputRef.current = el;
                 }}
                 className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm ${
                   (errors as any).customerInfo?.address ? 'border-red-500' : ''
                 }`}
                 aria-describedby={(errors as any).customerInfo?.address ? 'address-error' : undefined}
                 aria-invalid={(errors as any).customerInfo?.address ? 'true' : 'false'}
               />
               {(errors as any).customerInfo?.address && (
                 <p id="address-error" className="mt-2 text-sm text-red-600">
                   {t('order.form.errors.addressRequired')}
                 </p>
               )}
             </div>

             <div>
               <label htmlFor="postalCode" className="block text-sm font-medium text-gray-700 mb-1">
                 {t('order.form.postalCode')} <span className="text-red-500">*</span>
               </label>
               <input
                 type="text"
                 id="postalCode"
                 {...register('customerInfo.postalCode', { required: !isPickupSelected })}
                 className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm ${
                   (errors as any).customerInfo?.postalCode ? 'border-red-500' : ''
                 }`}
                 aria-describedby={(errors as any).customerInfo?.postalCode ? 'postalCode-error' : undefined}
                 aria-invalid={(errors as any).customerInfo?.postalCode ? 'true' : 'false'}
               />
               {(errors as any).customerInfo?.postalCode && (
                 <p id="postalCode-error" className="mt-2 text-sm text-red-600">
                   {t('order.form.errors.postalCodeRequired')}
                 </p>
               )}
             </div>

             <div>
               <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
                 {t('order.form.city')} <span className="text-red-500">*</span>
               </label>
               <input
                 type="text"
                 id="city"
                 {...register('customerInfo.city', { required: !isPickupSelected })}
                 className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm ${
                   (errors as any).customerInfo?.city ? 'border-red-500' : ''
                 }`}
                 aria-describedby={(errors as any).customerInfo?.city ? 'city-error' : undefined}
                 aria-invalid={(errors as any).customerInfo?.city ? 'true' : 'false'}
               />
               {(errors as any).customerInfo?.city && (
                 <p id="city-error" className="mt-2 text-sm text-red-600">
                   {t('order.form.errors.cityRequired')}
                 </p>
               )}
             </div>
           </>
         )}
        </div>
      </div>
      
      <div>
        <h2 className="text-xl font-semibold mb-6">{t('order.form.deliveryMethod')}</h2>
        
        <div className="space-y-4">
          <div className="flex items-center">
            <input
              id="delivery-digital"
              type="radio"
              value="digital"
              {...register('deliveryMethod', { required: true })}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
            />
            <label htmlFor="delivery-digital" className="ml-3 block text-sm font-medium text-gray-700">
              {t('order.form.deliveryDigital')}
            </label>
          </div>
          
          <div className="flex items-center">
            <input
              id="delivery-post"
              type="radio"
              value="post"
              {...register('deliveryMethod', { required: true })}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
            />
            <label htmlFor="delivery-post" className="ml-3 block text-sm font-medium text-gray-700">
              {t('order.form.deliveryPost')}
            </label>
          </div>
          
          <div className="flex items-center">
            <input
              id="delivery-express"
              type="radio"
              value="express"
              {...register('deliveryMethod', { required: true })}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
            />
            <label htmlFor="delivery-express" className="ml-3 block text-sm font-medium text-gray-700">
              {t('order.form.deliveryExpress')}
            </label>
          </div>

          <div className="flex items-center">
            <input
              id="delivery-pickup"
              type="radio"
              value="pickup"
              {...register('deliveryMethod', { required: true })}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
            />
            <label htmlFor="delivery-pickup" className="ml-3 block text-sm font-medium text-gray-700">
              Upphämtning (gratis)
            </label>
          </div>
          
          {errors.deliveryMethod && (
            <p className="mt-2 text-sm text-red-600">
              {t('order.form.errors.deliveryMethodRequired')}
            </p>
          )}
        </div>
      </div>
      
      <div className="flex justify-between pt-5">
        <button
          type="button"
          onClick={onBack}
          className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          {t('common.back')}
        </button>
        <button
          type="submit"
          className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          {t('common.continue')}
        </button>
      </div>
    </form>
  );
};

export default OrderForm;
