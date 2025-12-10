/**
 * TermsAcceptance - Shared terms and conditions checkbox component
 * Used in Step 10 for both upload and original document flows
 */

import React from 'react';
import Link from 'next/link';

interface TermsAcceptanceProps {
  locale: string;
  id?: string;
}

export const TermsAcceptance: React.FC<TermsAcceptanceProps> = ({
  locale,
  id = 'terms-acceptance'
}) => {
  return (
    <div className="pt-4">
      <div className="flex items-start">
        <div className="flex items-center h-5">
          <input
            id={id}
            name={id}
            type="checkbox"
            className="h-4 w-4 text-custom-button focus:ring-custom-button border-gray-300 rounded"
            required
          />
        </div>
        <div className="ml-3 text-sm">
          <label htmlFor={id} className="text-gray-700">
            {locale === 'en' ? (
              <>
                I have read and accept the{' '}
                <Link
                  href="/villkor"
                  target="_blank"
                  className="text-custom-button hover:text-custom-button-hover underline"
                >
                  terms and conditions
                </Link>{' '}
                and{' '}
                <Link
                  href="/integritetspolicy"
                  target="_blank"
                  className="text-custom-button hover:text-custom-button-hover underline"
                >
                  privacy policy
                </Link>
                .
              </>
            ) : (
              <>
                Jag har läst och accepterar{' '}
                <Link
                  href="/villkor"
                  target="_blank"
                  className="text-custom-button hover:text-custom-button-hover underline"
                >
                  allmänna villkor
                </Link>{' '}
                och{' '}
                <Link
                  href="/integritetspolicy"
                  target="_blank"
                  className="text-custom-button hover:text-custom-button-hover underline"
                >
                  integritetspolicy
                </Link>
                .
              </>
            )}
          </label>
        </div>
      </div>
    </div>
  );
};

export default TermsAcceptance;
