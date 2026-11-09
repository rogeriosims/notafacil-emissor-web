import React, { forwardRef } from 'react';
import { LucideIcon } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface FormInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
    label: string;
    id: string; // id is required for accessibility
    error?: string;
    icon?: LucideIcon;
    helperText?: string;
    containerClassName?: string;
    labelClassName?: string;
    inputClassName?: string;
}

export const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
    ({
        label,
        id,
        error,
        icon: Icon,
        helperText,
        className,
        containerClassName,
        labelClassName,
        inputClassName,
        ...props
    }, ref) => {
        return (
            <div className={cn("space-y-2", containerClassName)}>
                <label htmlFor={id} className={cn("text-sm font-medium text-slate-700 block", labelClassName)}>
                    {label}
                </label>

                <div className="relative">
                    {Icon && (
                        <Icon
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                            size={18}
                            aria-hidden="true"
                        />
                    )}

                    <input
                        id={id}
                        ref={ref}
                        className={cn(
                            "w-full rounded-md border text-sm transition-colors focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-50",
                            Icon ? "pl-10" : "px-3",
                            "h-10",
                            error
                                ? "border-red-500 focus:ring-red-500 placeholder:text-red-300"
                                : "border-slate-300 focus:ring-blue-500 focus:border-blue-500",
                            inputClassName,
                            className
                        )}
                        aria-invalid={!!error}
                        aria-describedby={error ? `${id}-error` : helperText ? `${id}-description` : undefined}
                        {...props}
                    />
                </div>

                {error && (
                    <p id={`${id}-error`} className="text-xs text-red-500 animate-in slide-in-from-top-1">
                        {error}
                    </p>
                )}

                {!error && helperText && (
                    <p id={`${id}-description`} className="text-xs text-slate-500">
                        {helperText}
                    </p>
                )}
            </div>
        );
    }
);

FormInput.displayName = 'FormInput';
