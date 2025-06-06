import * as React from 'react';
import { cn } from '@/lib/utils';
import { File } from 'lucide-react';

export function EmptyPlaceholder({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'flex min-h-[400px] flex-col items-center justify-center rounded-md border border-dashed p-8 text-center animate-in fade-in-50',
        className,
      )}
      {...props}
    >
      <div className="mx-auto flex max-w-[420px] flex-col items-center justify-center text-center">{children}</div>
    </div>
  );
}

interface EmptyPlaceholderIconProps extends React.HTMLAttributes<HTMLDivElement> {
  name: string;
}

EmptyPlaceholder.Icon = function EmptyPlaceholderIcon({ className, ...props }: EmptyPlaceholderIconProps) {
  return (
    <div className={cn('flex h-20 w-20 items-center justify-center rounded-full bg-muted', className)} {...props}>
      <File className="h-10 w-10 text-muted-foreground" />
    </div>
  );
};

EmptyPlaceholder.Title = function EmptyPlaceholderTitle({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h2 className={cn('mt-6 text-xl font-semibold', className)} {...props} />;
};

EmptyPlaceholder.Description = function EmptyPlaceholderDescription({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn('mb-8 mt-2 text-center text-sm font-normal leading-6 text-muted-foreground', className)}
      {...props}
    />
  );
};
