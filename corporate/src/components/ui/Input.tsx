import { InputHTMLAttributes, forwardRef } from 'react';

import { cn } from '@/lib/utils';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, ...props }, ref) => {
    return (
      <div className="space-y-1.5">
        {label && <label className="block text-sm text-[#8E8E93]">{label}</label>}
        <input
          ref={ref}
          className={cn(
            'w-full bg-[#121212] border rounded-md px-3 py-2',
            'text-white placeholder:text-[#8E8E93]',
            'focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500',
            error ? 'border-red-500' : 'border-[#2C2C2E]',
            className
          )}
          {...props}
        />
        {error && <p className="text-sm text-red-500">{error}</p>}
      </div>
    );
  }
);
Input.displayName = 'Input';

