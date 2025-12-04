'use client';

// Re-export existing UI components
export { Button } from '@/components/ui/button';
export { Dialog } from '@/components/ui/dialog';

// Simple placeholder components
import * as React from 'react';

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => {
  return (
    <input
      ref={ref}
      className={`flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 ${className || ''}`}
      {...props}
    />
  );
});
Input.displayName = 'Input';

export const Label = React.forwardRef<
  HTMLLabelElement,
  React.LabelHTMLAttributes<HTMLLabelElement>
>(({ className, ...props }, ref) => {
  return (
    <label
      ref={ref}
      className={`text-sm font-medium text-gray-700 ${className || ''}`}
      {...props}
    />
  );
});
Label.displayName = 'Label';

export const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={`bg-white rounded-lg shadow ${className || ''}`}
      {...props}
    />
  );
});
Card.displayName = 'Card';

export const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  return <div ref={ref} className={`p-6 ${className || ''}`} {...props} />;
});
CardHeader.displayName = 'CardHeader';

export const CardTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => {
  return <h3 ref={ref} className={`text-lg font-semibold ${className || ''}`} {...props} />;
});
CardTitle.displayName = 'CardTitle';

export const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => {
  return <p ref={ref} className={`text-sm text-gray-600 ${className || ''}`} {...props} />;
});
CardDescription.displayName = 'CardDescription';

export const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  return <div ref={ref} className={`p-6 pt-0 ${className || ''}`} {...props} />;
});
CardContent.displayName = 'CardContent';

export const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  return <div ref={ref} className={`p-6 pt-0 ${className || ''}`} {...props} />;
});
CardFooter.displayName = 'CardFooter';

export const Badge = React.forwardRef<
  HTMLSpanElement,
  React.HTMLAttributes<HTMLSpanElement>
>(({ className, ...props }, ref) => {
  return (
    <span
      ref={ref}
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${className || ''}`}
      {...props}
    />
  );
});
Badge.displayName = 'Badge';

export const Skeleton = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={`animate-pulse bg-gray-200 rounded ${className || ''}`}
      {...props}
    />
  );
});
Skeleton.displayName = 'Skeleton';

// Select components
interface SelectContextValue {
  value?: string;
  onValueChange?: (value: string) => void;
}

const SelectContext = React.createContext<SelectContextValue>({});

export const Select: React.FC<{
  children: React.ReactNode;
  value?: string;
  onValueChange?: (value: string) => void;
}> = ({ children, value, onValueChange }) => {
  return (
    <SelectContext.Provider value={{ value, onValueChange }}>
      <div className="relative">{children}</div>
    </SelectContext.Provider>
  );
};

export const SelectTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, children, ...props }, ref) => {
  return (
    <button
      ref={ref}
      type="button"
      className={`flex h-10 w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ${className || ''}`}
      {...props}
    >
      {children}
    </button>
  );
});
SelectTrigger.displayName = 'SelectTrigger';

export const SelectValue: React.FC<{ placeholder?: string }> = ({
  placeholder,
}) => {
  return <span className="text-gray-500">{placeholder}</span>;
};

export const SelectContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={`absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white shadow-lg ${className || ''}`}
      {...props}
    />
  );
});
SelectContent.displayName = 'SelectContent';

export const SelectItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { value: string }
>(({ className, children, value, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={`cursor-pointer px-3 py-2 hover:bg-gray-100 ${className || ''}`}
      {...props}
    >
      {children}
    </div>
  );
});
SelectItem.displayName = 'SelectItem';

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => {
  return (
    <textarea
      ref={ref}
      className={`flex min-h-[80px] w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 ${className || ''}`}
      {...props}
    />
  );
});
Textarea.displayName = 'Textarea';

export const Separator = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  return <div ref={ref} className={`h-px bg-gray-200 ${className || ''}`} {...props} />;
});
Separator.displayName = 'Separator';

export const Alert = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  return (
    <div ref={ref} className={`rounded-lg border p-4 ${className || ''}`} {...props} />
  );
});
Alert.displayName = 'Alert';

export const AlertTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => {
  return <h5 ref={ref} className={`font-medium mb-1 ${className || ''}`} {...props} />;
});
AlertTitle.displayName = 'AlertTitle';

export const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => {
  return <p ref={ref} className={`text-sm ${className || ''}`} {...props} />;
});
AlertDescription.displayName = 'AlertDescription';

// Toast components (minimal implementation)
export const Toaster: React.FC = () => {
  return <div id="toaster" className="fixed top-0 right-0 z-50 p-4" />;
};

export const useToast = () => {
  return {
    toast: (props: { title?: string; description?: string; variant?: string }) => {
      console.log('Toast:', props);
    },
  };
};

export const toast = (props: {
  title?: string;
  description?: string;
  variant?: string;
}) => {
  console.log('Toast:', props);
};
