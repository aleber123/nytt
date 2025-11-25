import React from 'react';
import { GetStaticProps } from 'next';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import Head from 'next/head';
import Link from 'next/link';

const TermsAndConditionsPage: React.FC = () => {
  const { t } = useTranslation('common');

  return (
    <>
      <Head>
        <title>Terms and Conditions - Legalization Service</title>
        <meta
          name="description"
          content="Read our terms and conditions to understand the terms for our legalization services."
        />
      </Head>

      <div className="bg-custom-page-header py-12">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl md:text-4xl font-heading font-bold text-white text-center">
            Terms and Conditions
          </h1>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gray-50 rounded-xl shadow-sm border border-gray-200 p-8">
            <div className="text-gray-700">
              <p className="text-gray-600 mb-6">
                <em>Last updated: {new Date().toLocaleDateString('en-US')}</em>
              </p>

              <h2 className="text-2xl font-heading font-bold text-gray-900 mb-4">1. General Information</h2>
              <p className="text-gray-700 mb-6">
                These General Terms and Conditions ("Terms") govern the use of DOX Visumpartner AB's ("we", "us" or "our") services.
                By using our services, you accept these terms. These terms apply from the moment you accept them before placing an order.
              </p>

              <h2 className="text-2xl font-heading font-bold text-gray-900 mb-4">2. Service Description</h2>
              <p className="text-gray-700 mb-6">
                We offer document legalization services for documents intended for use abroad. This includes handling of documents,
                communication with relevant authorities, embassies and other instances, as well as transport of documents.
              </p>

              <h2 className="text-2xl font-heading font-bold text-gray-900 mb-4">3. Customer's Responsibility</h2>
              <p className="text-gray-700 mb-4">As a customer, you are responsible for:</p>
              <ul className="list-disc list-inside text-gray-700 mb-6 space-y-2">
                <li>Providing correct and complete documents</li>
                <li>Specifying the correct destination and requirements for legalization</li>
                <li>Paying for the services according to agreement</li>
                <li>Checking that all information is correct before ordering</li>
              </ul>

              <h2 className="text-2xl font-heading font-bold text-gray-900 mb-4">4. Our Responsibility and Limitations</h2>
              <p className="text-gray-700 mb-4">
                We strive to provide high-quality services, but the following limitations apply:
              </p>
              <ul className="list-disc list-inside text-gray-700 mb-6 space-y-2">
                <li><strong>Transport Responsibility:</strong> We take no responsibility for lost or delayed mail during transport. This is exclusively the shipping company's responsibility.</li>
                <li><strong>Authority Guarantees:</strong> We can never guarantee that an authority, embassy, notary or other instance will perform what is requested. This is always up to the respective instance and their assessment.</li>
                <li><strong>Time Frames:</strong> Specified time frames are estimates and may vary depending on authorities' processing times.</li>
                <li><strong>Document Integrity:</strong> We handle your documents with the greatest care, but cannot guarantee that external parties will not cause damage.</li>
              </ul>

              <h2 className="text-2xl font-heading font-bold text-gray-900 mb-4">5. Prices and Payment</h2>
              <p className="text-gray-700 mb-6">
                Prices are stated excluding VAT and other fees. Payment shall be made according to the payment terms stated at the time of ordering.
                We reserve the right to change prices, but changes do not affect ongoing orders.
              </p>

              <h2 className="text-2xl font-heading font-bold text-gray-900 mb-4">6. Cancellation and Refund</h2>
              <p className="text-gray-700 mb-6">
                Orders can be cancelled before processing begins. After processing has begun, an administration fee will be charged.
                Refunds are made according to applicable legislation and our internal routines.
              </p>

              <h2 className="text-2xl font-heading font-bold text-gray-900 mb-4">7. Force Majeure</h2>
              <p className="text-gray-700 mb-6">
                We are not responsible for delays or non-delivery of services due to circumstances beyond our control,
                such as natural disasters, war, strikes, government decisions or technical problems.
              </p>

              <h2 className="text-2xl font-heading font-bold text-gray-900 mb-4">8. Applicable Law and Disputes</h2>
              <p className="text-gray-700 mb-6">
                These terms are governed by Swedish law. Any disputes shall be resolved through Swedish courts with Stockholm as the first instance.
              </p>

              <h2 className="text-2xl font-heading font-bold text-gray-900 mb-4">9. Changes to Terms</h2>
              <p className="text-gray-700 mb-6">
                We reserve the right to change these terms. Changes take effect when they are published on our website.
                Continued use of our services after changes implies acceptance of the new terms.
              </p>

              <h2 className="text-2xl font-heading font-bold text-gray-900 mb-4">10. Contact</h2>
              <p className="text-gray-700 mb-6">
                If you have questions about these terms, please contact us:
              </p>
              <div className="bg-gray-50 p-4 rounded-lg mb-6">
                <p className="text-gray-700">
                  <strong>LegaliseringsTjänst AB</strong><br />
                  Kungsgatan 12<br />
                  111 43 Stockholm<br />
                  Sweden<br />
                  <br />
                  Email: info@legaliseringstjanst.se<br />
                  Phone: 08-123 45 67
                </p>
              </div>
            </div>

            <div className="mt-8 pt-8 border-t border-gray-200">
              <Link
                href="/contact"
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                Back to contact
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export const getStaticProps: GetStaticProps = async ({ locale }) => {
  return {
    props: {
      ...(await serverSideTranslations(locale || 'en', ['common'])),
    },
  };
};

export default TermsAndConditionsPage;