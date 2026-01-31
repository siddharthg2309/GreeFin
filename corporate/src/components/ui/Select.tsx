import { SelectHTMLAttributes, forwardRef } from 'react';

import { cn } from '@/lib/utils';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, options, ...props }, ref) => {
    return (
      <div className="space-y-1.5">
        {label && <label className="block text-sm text-[#8E8E93]">{label}</label>}
        <select
          ref={ref}
          className={cn(
            'w-full bg-[#121212] border rounded-md px-3 py-2',
            'text-white',
            'focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500',
            error ? 'border-red-500' : 'border-[#2C2C2E]',
            className
          )}
          {...props}
        >
          {options.map(({ value, label: optionLabel }) => (
            <option key={value} value={value}>
              {optionLabel}
            </option>
          ))}
        </select>
        {error && <p className="text-sm text-red-500">{error}</p>}
      </div>
    );
  }
);
Select.displayName = 'Select';

