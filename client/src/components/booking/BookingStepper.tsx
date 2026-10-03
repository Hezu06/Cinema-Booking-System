import React from 'react';

export type BookingStep = 'seat' | 'payment' | 'ticket';

interface BookingStepperProps {
  currentStep: BookingStep;
}

export const BookingStepper: React.FC<BookingStepperProps> = ({ currentStep }) => {
  const steps: { id: BookingStep; label: string }[] = [
    { id: 'seat', label: 'Chọn ghế' },
    { id: 'payment', label: 'Thanh toán' },
    { id: 'ticket', label: 'Vé điện tử' },
  ];

  const stepOrder: Record<BookingStep, number> = {
    seat: 1,
    payment: 2,
    ticket: 3,
  };

  const currentIndex = stepOrder[currentStep] || 1;

  return (
    <div className="w-full max-w-md mx-auto py-3 px-4 select-none">
      <div className="relative flex items-center justify-between">
        {/* Horizontal connector lines */}
        <div className="absolute left-6 right-6 top-2.5 h-[2px] bg-[#222230] -z-0" />
        <div
          className="absolute left-6 top-2.5 h-[2px] bg-[#FCFC65] -z-0 transition-all duration-500"
          style={{
            width: `${((currentIndex - 1) / (steps.length - 1)) * 88}%`,
          }}
        />

        {steps.map((step, idx) => {
          const stepNumber = idx + 1;
          const isCompleted = stepNumber < currentIndex;
          const isActive = stepNumber === currentIndex;

          return (
            <div key={step.id} className="relative z-10 flex flex-col items-center group">
              {/* Dot Indicator */}
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center transition-all duration-300 ${
                  isActive
                    ? 'bg-[#FCFC65] ring-4 ring-[#FCFC65]/20 shadow-neon scale-110'
                    : isCompleted
                    ? 'bg-[#FCFC65]'
                    : 'bg-[#222230] border border-[#353545]'
                }`}
              >
                {isCompleted && (
                  <div className="w-1.5 h-1.5 rounded-full bg-[#08080C]" />
                )}
                {isActive && (
                  <div className="w-1.5 h-1.5 rounded-full bg-[#08080C]" />
                )}
              </div>

              {/* Label */}
              <span
                className={`text-[11px] font-semibold mt-2 transition-colors ${
                  isActive
                    ? 'text-white'
                    : isCompleted
                    ? 'text-[#A0A0B2]'
                    : 'text-[#606075]'
                }`}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
