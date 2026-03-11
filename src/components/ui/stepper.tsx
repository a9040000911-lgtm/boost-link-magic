/**
 * Stepper Component
 * Visual progress indicator for multi-step flows
 */

import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface StepItem {
  id: string;
  label: string;
  shortLabel?: string;
}

interface StepperProps {
  steps: StepItem[];
  currentStep: number;
  completedSteps?: number[];
  className?: string;
  variant?: 'default' | 'compact';
}

export function Stepper({
  steps,
  currentStep,
  completedSteps = [],
  className,
  variant = 'default',
}: StepperProps) {
  return (
    <div className={cn('flex items-center justify-center gap-1', className)}>
      {steps.map((step, index) => {
        const isCompleted = completedSteps.includes(index) || index < currentStep;
        const isCurrent = index === currentStep;
        const isLast = index === steps.length - 1;

        return (
          <div key={step.id} className="flex items-center">
            {/* Step circle */}
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: isCurrent ? 1.1 : 1 }}
              className={cn(
                'relative flex items-center justify-center rounded-full transition-all duration-300',
                variant === 'default'
                  ? 'w-9 h-9 text-sm'
                  : 'w-7 h-7 text-xs',
                isCompleted && 'bg-primary text-primary-foreground',
                isCurrent && !isCompleted && 'bg-primary text-primary-foreground ring-4 ring-primary/20',
                !isCompleted && !isCurrent && 'bg-muted text-muted-foreground'
              )}
            >
              {isCompleted ? (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                >
                  <Check className={variant === 'default' ? 'w-5 h-5' : 'w-3.5 h-3.5'} />
                </motion.div>
              ) : (
                <span className="font-semibold">{index + 1}</span>
              )}
            </motion.div>

            {/* Step label (default variant only) */}
            {variant === 'default' && (
              <span
                className={cn(
                  'ml-2 text-sm font-medium hidden sm:block',
                  isCurrent ? 'text-foreground' : 'text-muted-foreground'
                )}
              >
                {step.label}
              </span>
            )}

            {/* Connector line */}
            {!isLast && (
              <div
                className={cn(
                  'mx-2 h-0.5 rounded-full transition-all duration-300',
                  variant === 'default' ? 'w-8' : 'w-4',
                  isCompleted ? 'bg-primary' : 'bg-muted'
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

/**
 * Compact stepper for mobile/views with limited space
 */
export function CompactStepper({
  currentStep,
  totalSteps,
  className,
}: {
  currentStep: number;
  totalSteps: number;
  className?: string;
}) {
  return (
    <div className={cn('flex items-center gap-1.5', className)}>
      {Array.from({ length: totalSteps }).map((_, index) => (
        <motion.div
          key={index}
          initial={{ scale: 0.8 }}
          animate={{ scale: index === currentStep ? 1.2 : 1 }}
          className={cn(
            'rounded-full transition-all duration-200',
            index === currentStep
              ? 'w-6 h-2 bg-primary'
              : index < currentStep
              ? 'w-2 h-2 bg-primary'
              : 'w-2 h-2 bg-muted'
          )}
        />
      ))}
    </div>
  );
}
