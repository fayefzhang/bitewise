import React from 'react';

interface ProgressStepsProps {
  currentStep: number;
  totalSteps: number;
}

const ProgressSteps: React.FC<ProgressStepsProps> = ({ currentStep, totalSteps }) => {
  return (
    <div className="flex items-center mb-4">
      {Array.from({ length: totalSteps }).map((_, index) => (
        <React.Fragment key={index}>
          <div
            className={`flex items-center justify-center w-8 h-8 rounded-full ${
              index < currentStep ? 'bg-blue-500 text-white' : 'border-2 border-gray-300 text-gray-500'
            }`}
          >
            {index < currentStep ? '✓' : index + 1}
          </div>
          {index < totalSteps - 1 && (
            <div
              className={`w-24 h-1 ${
                index < currentStep - 1 ? 'bg-blue-500' : 'bg-gray-300'
              }`}
            ></div>
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

export default ProgressSteps;
