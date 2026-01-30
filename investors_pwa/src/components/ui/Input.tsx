import { InputHTMLAttributes, forwardRef } from 'react';

import { cn } from '@/lib/utils';

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          'w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2',
          'text-white placeholder:text-gray-500',
          'focus:outline-none focus:ring-2 focus:ring-blue-500',
          className
        )}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';

