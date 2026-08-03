import * as React from "react";
import { cva } from "class-variance-authority";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

// ToastProvider is the positioned container that holds the toasts.
const ToastProvider = React.forwardRef(({ ...props }, ref) => (
  <div
    ref={ref}
    className="pointer-events-none fixed z-[100] flex w-full flex-col gap-2 p-4 sm:bottom-0 sm:right-0 sm:top-auto md:max-w-[380px]"
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
  "group pointer-events-auto relative flex w-full items-start justify-between gap-3 overflow-hidden border-2 p-4 pl-10 text-right duration-300 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-80 data-[state=open]:slide-in-from-bottom-3 data-[state=closed]:slide-out-to-bottom-3 data-[state=open]:zoom-in-95 data-[state=closed]:zoom-out-95",
  {
    variants: {
      variant: {
        default: "border-[#1B2A4A] bg-[#1B2A4A] text-white",
        success: "border-[#1B2A4A] bg-[#1B2A4A] text-white",
        error: "border-red-500 bg-red-500 text-white",
        destructive: "border-red-500 bg-red-500 text-white",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

const Toast = React.forwardRef(({ className, variant, open, ...props }, ref) => (
  <div
    ref={ref}
    data-state={open ? "open" : "closed"}
    className={cn(toastVariants({ variant }), "shadow-lg", className)}
    style={{ boxShadow: "3px 3px 0 #E8622A" }}
    role="status"
    aria-live="polite"
    aria-atomic="true"
    {...props}
  >
    <span className="absolute top-0 bottom-0 right-0 w-1.5 bg-[#E8622A]" aria-hidden="true" />
    {props.children}
  </div>
));
Toast.displayName = "Toast";

const ToastClose = React.forwardRef(({ className, ...props }, ref) => (
  <button
    ref={ref}
    aria-label="סגור"
    className={cn(
      "absolute left-2 top-2 p-1 text-white/70 transition-colors hover:text-white focus:outline-none",
      className
    )}
    toast-close=""
    {...props}
  >
    <X className="h-4 w-4" />
  </button>
));
ToastClose.displayName = "ToastClose";

const ToastTitle = React.forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("text-sm font-heading font-bold text-white", className)} {...props} />
));
ToastTitle.displayName = "ToastTitle";

const ToastDescription = React.forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("text-xs text-white/80 font-body leading-relaxed", className)} {...props} />
));
ToastDescription.displayName = "ToastDescription";

const ToastAction = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "inline-flex h-8 shrink-0 items-center justify-center border bg-transparent px-3 text-sm font-medium",
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