/**
 * Progress Indicator Component
 * Shows visual progress through the checkout flow
 */

import React from 'react';

interface ProgressIndicatorProps {
  currentStep: number;
  totalSteps: number;
}

export const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  currentStep,
  totalSteps
}) => {
  const percentage = (currentStep / totalSteps) * 100;
  
  return (
    <div className="mb-8">
      {/* Progress text */}
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium text-gray-700">
          Steg {currentStep} av {totalSteps}
        </span>
        <span className="text-sm font-medium text-custom-button">
          {Math.round(percentage)}% klart
        </span>
      </div>
      
      {/* Progress bar */}
      <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
        <div 
          className="bg-gradient-to-r from-custom-button to-custom-button-hover h-3 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
      
      {/* Step dots */}
      <div className="flex justify-between mt-2">
        {Array.from({ length: totalSteps }, (_, i) => (
          <div
            key={i}
            className={`w-2 h-2 rounded-full transition-colors duration-300 ${
              i < currentStep
                ? 'bg-custom-button'
                : i === currentStep - 1
                ? 'bg-custom-button animate-pulse'
                : 'bg-gray-300'
            }`}
            title={`Steg ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
};

export default ProgressIndicator;
