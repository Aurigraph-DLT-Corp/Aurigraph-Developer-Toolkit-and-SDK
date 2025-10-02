import React from 'react';

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ className = '', ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`relative w-full rounded-lg border p-4 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground ${className}`}
        {...props}
      />
    );
  }
);

export const AlertDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className = '', ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`text-sm [&_p]:leading-relaxed ${className}`}
        {...props}
      />
    );
  }
);

Alert.displayName = 'Alert';
AlertDescription.displayName = 'AlertDescription';