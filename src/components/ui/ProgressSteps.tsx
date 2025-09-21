import React from 'react';
import { useTranslation } from 'next-i18next';

interface Step {
  id: string;
  title: string;
  description?: string;
}

interface ProgressStepsProps {
  steps: Step[];
  currentStep: string;
}

const ProgressSteps: React.FC<ProgressStepsProps> = ({ steps, currentStep }) => {
  const { t } = useTranslation('common');
  
  // Find current step index
  const currentIndex = steps.findIndex(step => step.id === currentStep);
  const progressPercentage = Math.max(0, (currentIndex / (steps.length - 1)) * 100);

  return (
    <div className="mb-10">
      <div className="hidden sm:block">
        <nav aria-label={t('accessibility.progressSteps') || 'Progress steps'}>
          <div className="mb-12"> {/* Container for steps */}
            <ol className="flex items-center justify-between">
              {steps.map((step, index) => {
                const isActive = index === currentIndex;
                const isCompleted = index < currentIndex;
                
                return (
                  <li key={step.id} className="flex-1 relative">
                    <div className="flex flex-col items-center">
                      {/* Step circle */}
                      <span
                        className={`
                          w-10 h-10 flex items-center justify-center rounded-full 
                          shadow-md transition-all duration-200 z-10
                          ${isActive
                            ? 'bg-primary-600 text-white ring-4 ring-primary-100'
                            : isCompleted
                            ? 'bg-primary-600 text-white'
                            : 'bg-gray-200 text-gray-500'}
                        `}
                      >
                        {isCompleted ? (
                          <svg className="w-6 h-6" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        ) : (
                          <span className={`${isActive ? 'font-bold' : ''}`}>{index + 1}</span>
                        )}
                      </span>
                      
                      {/* Step text */}
                      <div className="flex flex-col items-center mt-3">
                        <span
                          className={`
                            text-sm font-medium text-center
                            ${isActive ? 'text-primary-700 font-bold' : isCompleted ? 'text-primary-600' : 'text-gray-500'}
                          `}
                        >
                          {step.title}
                        </span>
                        {step.description && (
                          <span className="hidden sm:block text-xs text-center text-gray-500 max-w-[120px] mt-1">
                            {step.description}
                          </span>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>
          
          {/* Progress bar below the steps */}
          <div className="relative h-1 bg-gray-200 mt-2 rounded-full overflow-hidden">
            <div 
              className="absolute top-0 left-0 h-full bg-primary-600 transition-all duration-500 ease-in-out rounded-full"
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
        </nav>
      </div>
      
      {/* Mobile version - shows only current step */}
      <div className="sm:hidden">
        <div className="bg-gray-50 p-4 rounded-lg shadow-sm border border-gray-100 mb-4">
          <div className="flex items-center mb-2">
            <span className="w-8 h-8 flex items-center justify-center rounded-full bg-primary-600 text-white text-sm mr-3">
              {currentIndex + 1}
            </span>
            <p className="text-sm font-medium text-gray-500">
              {t('order.step')} {currentIndex + 1} {t('order.of')} {steps.length}
            </p>
          </div>
          <h3 className="text-lg font-bold text-primary-700">
            {steps[currentIndex]?.title}
          </h3>
          {steps[currentIndex]?.description && (
            <p className="text-sm text-gray-600 mt-1">{steps[currentIndex].description}</p>
          )}
        </div>
        
        {/* Mobile progress bar */}
        <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className="absolute top-0 left-0 h-full bg-primary-600 transition-all duration-500 ease-in-out rounded-full"
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
};

export default ProgressSteps;
