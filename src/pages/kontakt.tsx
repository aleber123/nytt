import React, { useState, useRef } from 'react';
import { GetStaticProps } from 'next';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import Head from 'next/head';
import Seo from '@/components/Seo';
import { useForm } from 'react-hook-form';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import ReCAPTCHA from 'react-google-recaptcha';

interface ContactFormData {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
}

const ContactPage: React.FC = () => {
  const { t } = useTranslation('common');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const recaptchaRef = useRef<ReCAPTCHA>(null);
  const { register, handleSubmit, formState: { errors } } = useForm<ContactFormData>();

  // reCAPTCHA callback
  const onRecaptchaChange = (token: string | null) => {
    // Token is handled automatically by the component
  };

  const onSubmit = async (data: ContactFormData) => {
    setIsSubmitting(true);
    setSubmitError(null);

    // Check reCAPTCHA
    const recaptchaToken = recaptchaRef.current?.getValue();
    if (!recaptchaToken) {
      setSubmitError('Vänligen verifiera att du inte är en robot genom att slutföra reCAPTCHA.');
      setIsSubmitting(false);
      return;
    }

    try {
      // Save contact message to Firestore
      const contactMessage = {
        ...data,
        recaptchaToken,
        createdAt: Timestamp.now(),
        status: 'unread'
      };

      await addDoc(collection(db, 'contactMessages'), contactMessage);

      console.log('Contact message saved:', contactMessage);
      setIsSubmitted(true);

      // Reset reCAPTCHA
      recaptchaRef.current?.reset();
    } catch (error) {
      console.error('Error saving contact message:', error);
      setSubmitError('Ett fel uppstod när meddelandet skulle skickas. Försök igen senare.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Seo
        title={`${t('contact.pageTitle') || 'Kontakta oss'} | Legaliseringstjänst`}
        description={t('contact.pageDescription') || 'Kontakta oss för frågor om legalisering av dokument. Vi hjälper dig med apostille, notarisering och ambassadlegalisering.'}
      />

      

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto mb-16 text-center">
          <h2 className="text-2xl font-heading font-bold text-gray-900 mb-4">
            Kontakta oss för hjälp med dina dokument
          </h2>
          <p className="text-lg text-gray-600">
            Vi hjälper dig gärna med frågor om legalisering, priser och processer
          </p>
        </div>

        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
            {/* Kontaktinformation */}
            <div className="bg-gray-50 rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-2xl font-heading font-bold text-gray-900 mb-6">
                {t('contact.infoTitle') || 'Kontaktinformation'}
              </h2>

              <div className="space-y-6">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg className="h-6 w-6 text-primary-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-lg font-medium text-gray-900 mb-1">
                      {t('contact.addressTitle') || 'Adress'}
                    </h3>
                    <address className="not-italic text-gray-600">
                      DOX Visumpartner AB<br />
                      Livdjursgatan 4<br />
                      121 62 Johanneshov<br />
                      Sverige
                    </address>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg className="h-6 w-6 text-primary-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-lg font-medium text-gray-900 mb-1">
                      {t('contact.contactTitle') || 'Kontakt'}
                    </h3>
                    <p className="text-gray-600">
                      <strong>Telefon:</strong> 08-123 45 67<br />
                      <strong>E-post:</strong> info@legaliseringstjanst.se
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg className="h-6 w-6 text-primary-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-lg font-medium text-gray-900 mb-1">
                      {t('contact.hoursTitle') || 'Öppettider'}
                    </h3>
                    <p className="text-gray-600">
                      <strong>Måndag-fredag:</strong> 09:00-17:00<br />
                      <strong>Lördag-söndag:</strong> Stängt
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-8">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  {t('contact.findUs') || 'Hitta till oss'}
                </h3>
                <div className="bg-gray-100 rounded-lg overflow-hidden h-64 border border-gray-200">
                  <iframe
                    title="DOX Visumpartner AB location"
                    src="https://www.google.com/maps?q=Livdjursgatan%204%2C%20121%2062%20Johanneshov%2C%20Sverige&output=embed&z=17"
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                </div>
              </div>
            </div>

            {/* Kontaktformulär */}
            <div className="bg-gray-50 rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-2xl font-heading font-bold text-gray-900 mb-6">
                {t('contact.formTitle') || 'Skicka ett meddelande'}
              </h2>

              {isSubmitted ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                  <div className="flex items-center">
                    <svg className="h-6 w-6 text-green-600 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <div>
                      <h3 className="text-lg font-medium text-green-800 mb-1">
                        {t('contact.thankYou') || 'Tack för ditt meddelande!'}
                      </h3>
                      <p className="text-green-700 text-sm">
                        {t('contact.responseMessage') || 'Vi återkommer till dig så snart som möjligt, vanligtvis inom 24 timmar under vardagar.'}
                      </p>
                    </div>
                  </div>
                </div>
              ) : submitError ? (
                <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                  <div className="flex items-center">
                    <svg className="h-6 w-6 text-red-600 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <h3 className="text-lg font-medium text-red-800 mb-1">
                        Ett fel uppstod
                      </h3>
                      <p className="text-red-700 text-sm">
                        {submitError}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                      {t('contact.form.name') || 'Namn'} *
                    </label>
                    <input
                      type="text"
                      id="name"
                      className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-custom-button focus:border-custom-button ${
                        errors.name ? 'border-red-500' : ''
                      }`}
                      placeholder="Ange ditt fullständiga namn"
                      {...register('name', {
                        required: 'Namn är obligatoriskt',
                        minLength: { value: 2, message: 'Namnet måste vara minst 2 tecken' }
                      })}
                      aria-invalid={errors.name ? 'true' : 'false'}
                      aria-describedby={errors.name ? 'name-error' : undefined}
                    />
                    {errors.name && (
                      <p className="mt-2 text-sm text-red-600" id="name-error">
                        {t(`contact.form.${errors.name.type === 'minLength' ? 'nameMinLength' : 'nameRequired'}`) || errors.name.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                      {t('contact.form.email') || 'E-post'} *
                    </label>
                    <input
                      type="email"
                      id="email"
                      className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-custom-button focus:border-custom-button ${
                        errors.email ? 'border-red-500' : ''
                      }`}
                      placeholder="din@email.com"
                      {...register('email', {
                        required: 'E-postadress är obligatorisk',
                        pattern: {
                          value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                          message: 'Ange en giltig e-postadress'
                        }
                      })}
                      aria-invalid={errors.email ? 'true' : 'false'}
                      aria-describedby={errors.email ? 'email-error' : undefined}
                    />
                    {errors.email && (
                      <p className="mt-2 text-sm text-red-600" id="email-error">
                        {t(`contact.form.${errors.email.type === 'pattern' ? 'emailInvalid' : 'emailRequired'}`) || errors.email.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                      {t('contact.form.phone') || 'Telefon'}
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-custom-button focus:border-custom-button"
                      placeholder="+46 70 123 45 67"
                      {...register('phone')}
                    />
                  </div>

                  <div>
                    <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
                      {t('contact.form.subject') || 'Ämne'} *
                    </label>
                    <select
                      id="subject"
                      className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-custom-button focus:border-custom-button ${
                        errors.subject ? 'border-red-500' : ''
                      }`}
                      {...register('subject', { required: 'Välj ett ämne' })}
                      aria-invalid={errors.subject ? 'true' : 'false'}
                      aria-describedby={errors.subject ? 'subject-error' : undefined}
                    >
                      <option value="">{t('contact.form.selectSubject') || 'Välj ämne'}</option>
                      <option value="apostille">{t('services.apostille.title') || 'Apostille'}</option>
                      <option value="notarisering">{t('services.notarization.title') || 'Notarisering'}</option>
                      <option value="ambassad">{t('services.embassy.title') || 'Ambassadlegalisering'}</option>
                      <option value="oversattning">{t('services.translation.title') || 'Auktoriserad översättning'}</option>
                      <option value="other">{t('contact.form.otherSubject') || 'Annat ärende'}</option>
                    </select>
                    {errors.subject && (
                      <p className="mt-2 text-sm text-red-600" id="subject-error">
                        {t('contact.form.subjectRequired') || 'Ämne är obligatoriskt'}
                      </p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                      {t('contact.form.message') || 'Meddelande'} *
                    </label>
                    <textarea
                      id="message"
                      rows={5}
                      className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-custom-button focus:border-custom-button ${
                        errors.message ? 'border-red-500' : ''
                      }`}
                      placeholder="Beskriv ditt ärende och dina frågor..."
                      {...register('message', { required: 'Meddelande är obligatoriskt' })}
                      aria-invalid={errors.message ? 'true' : 'false'}
                      aria-describedby={errors.message ? 'message-error' : undefined}
                    ></textarea>
                    {errors.message && (
                      <p className="mt-2 text-sm text-red-600" id="message-error">
                        {t('contact.form.messageRequired') || 'Meddelande är obligatoriskt'}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex items-start">
                    <div className="flex items-center h-5">
                      <input
                        id="privacy"
                        name="privacy"
                        type="checkbox"
                        className="h-4 w-4 text-custom-button focus:ring-custom-button border-gray-300 rounded"
                        required
                      />
                    </div>
                    <div className="ml-3 text-sm">
                      <label htmlFor="privacy" className="font-medium text-gray-700">
                        {t('contact.form.privacyConsent') || 'Jag godkänner att mina uppgifter behandlas enligt'}{' '}
                        <a href="/integritetspolicy" className="text-custom-button hover:text-custom-button/80">
                          {t('contact.form.privacyPolicy') || 'integritetspolicyn'}
                        </a>
                      </label>
                    </div>
                  </div>

                  <div className="pt-4">
                    {/* reCAPTCHA Widget */}
                    <div className="mb-4">
                      <ReCAPTCHA
                        ref={recaptchaRef}
                        sitekey="6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI"
                        onChange={onRecaptchaChange}
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-custom-button hover:bg-custom-button/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-custom-button disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Skickar...
                        </>
                      ) : (
                        t('contact.form.send') || 'Skicka meddelande'
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="mt-16 text-center">
          <h3 className="text-2xl font-heading font-bold text-gray-900 mb-4">
            Behöver du hjälp med att komma igång?
          </h3>
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
            Vi hjälper dig att välja rätt tjänst och guidar dig genom hela legaliseringsprocessen
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/bestall"
              className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-custom-button hover:bg-custom-button/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-custom-button"
            >
              Starta beställning
            </a>
            <a
              href="/tjanster"
              className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              Se våra tjänster
            </a>
          </div>
        </div>
      </div>
    </>
  );
};

export const getStaticProps: GetStaticProps = async ({ locale }) => {
  return {
    props: {
      ...(await serverSideTranslations(locale || 'sv', ['common'])),
    },
  };
};

export default ContactPage;
