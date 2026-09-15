import * as React from "react";
import { cva } from "class-variance-authority";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { t, isEn } from "@/lib/i18n";

// The short notices the shop shows after an action ("נוספה למועדפים"), in the
// storefront's style: a white card with a soft shadow, a round icon, navy text.
//
// On a phone they sit at the top, below the edge of the screen rather than on
// the header's buttons; on a desktop, in the bottom corner on the left, the end
// side of a right-to-left page.

const ToastProvider = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    dir={isEn ? "ltr" : "rtl"}
    className={cn(
      "pointer-events-none fixed inset-x-0 top-3 z-[100] flex flex-col items-center gap-2 px-3",
      "sm:inset-x-auto sm:bottom-5 sm:top-auto sm:end-5 sm:w-[24rem] sm:items-stretch sm:px-0",
      className
    )}
    {...props}
  />
));
ToastProvider.displayName = "ToastProvider";

// Kept for compatibility; toasts render inside ToastProvider directly.
const ToastViewport = React.forwardRef(({ ...props }, ref) => (
  <div ref={ref} {...props} />
));
ToastViewport.displayName = "ToastViewport";

const toastVariants = cva(
  "group pointer-events-auto relative flex w-full max-w-md items-center gap-3 rounded-2xl bg-white py-3 pe-2 ps-3.5 text-start shadow-float ring-1 ring-brand-line transition-all duration-200 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:slide-in-from-top-2 sm:data-[state=open]:slide-in-from-bottom-2 data-[state=closed]:pointer-events-none data-[state=closed]:opacity-0 data-[state=closed]:scale-95",
  {
    variants: {
      variant: {
        default: "",
        success: "",
        error: "ring-red-200",
        destructive: "ring-red-200",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

// Only what a <div> understands is passed on. The toast state also carries
// `duration` and `onOpenChange`, which used to be spread onto the element.
const Toast = React.forwardRef(({ className, variant, open, children, onClick }, ref) => (
  <div
    ref={ref}
    data-state={open ? "open" : "closed"}
    className={cn(toastVariants({ variant }), className)}
    role={variant === "error" || variant === "destructive" ? "alert" : "status"}
    aria-live={variant === "error" || variant === "destructive" ? "assertive" : "polite"}
    aria-atomic="true"
    onClick={onClick}
    // An open cart or menu drawer treats any press outside it as a reason to
    // close. A press on the toast is not about the drawer.
    onPointerDown={(e) => e.stopPropagation()}
  >
    {children}
  </div>
));
Toast.displayName = "Toast";

const ToastClose = React.forwardRef(({ className, onClick, ...props }, ref) => (
  <button
    ref={ref}
    type="button"
    aria-label={t("סגירה", "Close")}
    className={cn(
      "flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl text-brand-navy/45 transition-colors hover:bg-brand-mist hover:text-brand-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange",
      className
    )}
    onClick={(e) => { e.stopPropagation(); onClick?.(e); }}
    {...props}
  >
    <X className="h-4 w-4" aria-hidden="true" />
  </button>
));
ToastClose.displayName = "ToastClose";

const ToastTitle = React.forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("text-[15px] font-semibold leading-snug text-brand-navy", className)} {...props} />
));
ToastTitle.displayName = "ToastTitle";

const ToastDescription = React.forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("text-[13px] leading-relaxed text-brand-navy/60", className)} {...props} />
));
ToastDescription.displayName = "ToastDescription";

const ToastAction = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "inline-flex h-9 shrink-0 items-center justify-center rounded-xl border border-brand-line px-3 text-sm font-medium text-brand-navy",
      className
    )}
    {...props}
  />
));
ToastAction.displayName = "ToastAction";

export {
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastClose,
  ToastAction,
};
