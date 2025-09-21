import React, { useState } from 'react';
import { useTranslation } from 'next-i18next';

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQProps {
  title: string;
  subtitle?: string;
  items: FAQItem[];
}

const FAQ: React.FC<FAQProps> = ({ title, subtitle, items }) => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const { t } = useTranslation('common');

  const toggleItem = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="py-12 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-heading font-bold mb-4">{title}</h2>
          {subtitle && <p className="text-lg text-gray-600 max-w-2xl mx-auto">{subtitle}</p>}
        </div>

        <div className="max-w-3xl mx-auto">
          <dl className="space-y-6">
            {items.map((item, index) => (
              <div 
                key={index}
                className="border border-gray-200 rounded-lg overflow-hidden"
              >
                <dt>
                  <button
                    className={`flex justify-between w-full px-6 py-4 text-left text-gray-900 font-medium ${
                      openIndex === index ? 'bg-primary-50' : 'bg-white'
                    }`}
                    onClick={() => toggleItem(index)}
                    aria-expanded={openIndex === index}
                    aria-controls={`faq-answer-${index}`}
                  >
                    <span className="text-lg">{item.question}</span>
                    <span className="ml-6 flex-shrink-0">
                      <svg
                        className={`h-6 w-6 transform ${openIndex === index ? 'rotate-180' : ''} transition-transform duration-200`}
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        aria-hidden="true"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </span>
                  </button>
                </dt>
                <dd
                  id={`faq-answer-${index}`}
                  className={`px-6 pb-4 ${openIndex === index ? 'block' : 'hidden'}`}
                >
                  <div className="text-base text-gray-600">
                    {item.answer}
                  </div>
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
};

export default FAQ;
