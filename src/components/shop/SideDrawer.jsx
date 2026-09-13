import React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

// A panel that slides in from the side of the screen: the cart, the size guide,
// the catalogue filters and the mobile menu.
//
// Built on the dialog primitive, so it traps focus, closes on Escape and on a
// click outside, and hands focus back to whatever opened it.
//
// The page is right-to-left, so 'start' is the right edge and 'end' the left.
// The slide animations name physical sides, which is why the mapping is written
// out here rather than derived.
const SIDES = {
  start: 'right-0 rounded-l-[1.75rem] data-[state=open]:slide-in-from-right data-[state=closed]:slide-out-to-right',
  end: 'left-0 rounded-r-[1.75rem] data-[state=open]:slide-in-from-left data-[state=closed]:slide-out-to-left',
};

export default function SideDrawer({
  open,
  onOpenChange,
  side = 'end',
  // A small grey line above the title ("מדריך מידות"), or the only heading
  // when there is no title ("סינון לפי").
  label,
  title,
  children,
  footer,
  className = '',
  bodyClassName = '',
}) {
  const heading = title || label;

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-[70] bg-brand-navy-dark/45 backdrop-blur-[2px] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0" />
        <DialogPrimitive.Content
          dir="rtl"
          className={cn(
            'fixed inset-y-0 z-[70] flex h-full w-[min(92vw,30rem)] flex-col bg-white shadow-lift outline-none duration-300 data-[state=open]:animate-in data-[state=closed]:animate-out',
            SIDES[side],
            className,
          )}
        >
          <div className="flex items-center justify-between gap-4 px-5 pb-4 pt-5 sm:px-7 sm:pt-6">
            <div className="min-w-0">
              {title && label && <p className="shop-eyebrow">{label}</p>}
              <DialogPrimitive.Title
                className={title ? 'mt-0.5 text-xl font-semibold leading-snug text-brand-navy' : 'shop-eyebrow text-base'}>
                {heading}
              </DialogPrimitive.Title>
            </div>
            <DialogPrimitive.Close
              aria-label="סגירה"
              className="inline-flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl border border-brand-line text-brand-orange-ink transition hover:border-brand-orange hover:bg-brand-orange-soft">
              <X className="h-5 w-5" />
            </DialogPrimitive.Close>
          </div>
          <DialogPrimitive.Description className="sr-only">{heading}</DialogPrimitive.Description>

          <div className={cn('flex-1 overflow-y-auto overscroll-contain px-5 pb-6 sm:px-7', bodyClassName)}>
            {children}
          </div>

          {footer && (
            <div className="border-t border-brand-line bg-white px-5 py-4 sm:px-7 sm:py-5">
              {footer}
            </div>
          )}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
