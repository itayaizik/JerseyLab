import { Check, AlertCircle } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
} from "@/components/ui/toast";

export function Toaster() {
  const { toasts, dismiss } = useToast();

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, variant, open }) {
        const isError = variant === "error" || variant === "destructive";
        return (
          // A tap anywhere on the notice closes it, not only on the small X.
          <Toast key={id} variant={variant} open={open} onClick={() => dismiss(id)} className="cursor-pointer">
            <span
              className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full ${isError ? "bg-red-50 text-red-600" : "bg-brand-orange-soft text-brand-orange-ink"}`}
              aria-hidden="true"
            >
              {isError ? <AlertCircle className="h-5 w-5" /> : <Check className="h-5 w-5" />}
            </span>
            <div className="grid min-w-0 flex-1 gap-0.5">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && <ToastDescription>{description}</ToastDescription>}
            </div>
            {action}
            <ToastClose onClick={() => dismiss(id)} />
          </Toast>
        );
      })}
    </ToastProvider>
  );
}
