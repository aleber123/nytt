import React from 'react';
import { useTranslation } from 'next-i18next';

interface Testimonial {
  id: number;
  name: string;
  role: string;
  content: string;
  image?: string;
  rating: number;
}

interface TestimonialsProps {
  title: string;
  subtitle?: string;
  testimonials: Testimonial[];
}

const Testimonials: React.FC<TestimonialsProps> = ({ title, subtitle, testimonials }) => {
  const { t } = useTranslation('common');

  // Funktion för att rendera stjärnbetyg
  const renderStars = (rating: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <svg
          key={i}
          className={`h-5 w-5 ${
            i <= rating ? 'text-yellow-400' : 'text-gray-300'
          }`}
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
          />
        </svg>
      );
    }
    return stars;
  };

  // Funktion för att generera en placeholder-avatar om ingen bild finns
  const renderAvatar = (testimonial: Testimonial) => {
    if (testimonial.image) {
      return (
        <img
          className="h-12 w-12 rounded-full object-cover"
          src={testimonial.image}
          alt={`${testimonial.name} avatar`}
        />
      );
    }

    // Generera initialer från namnet
    const initials = testimonial.name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);

    return (
      <div className="h-12 w-12 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-medium">
        {initials}
      </div>
    );
  };

  return (
    <section className="py-12 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-heading font-bold mb-4">{title}</h2>
          {subtitle && <p className="text-lg text-gray-600 max-w-2xl mx-auto">{subtitle}</p>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial) => (
            <div
              key={testimonial.id}
              className="bg-white rounded-lg shadow-card p-6 flex flex-col h-full"
            >
              <div className="flex items-center mb-4">
                <div className="flex-shrink-0 mr-4">{renderAvatar(testimonial)}</div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900">{testimonial.name}</h3>
                  <p className="text-sm text-gray-500">{testimonial.role}</p>
                </div>
              </div>

              <div className="flex mb-4" aria-label={`Betyg: ${testimonial.rating} av 5`}>
                {renderStars(testimonial.rating)}
              </div>

              <blockquote className="flex-grow">
                <p className="text-gray-600 italic">"{testimonial.content}"</p>
              </blockquote>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
