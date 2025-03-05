
import {
  Toast,
  ToastActionElement,
  ToastProps,
} from "@/components/ui/toast";
import { useToast as useToastUI } from "@/components/ui/use-toast";

export type ToastOptions = Omit<
  ToastProps,
  "id" | "open" | "onOpenChange" | "forceMount"
> & {
  id?: string;
  action?: ToastActionElement;
  description?: React.ReactNode;
  duration?: number;
};

export interface ToastState {
  toasts: ToastOptions[];
  addToast(options: ToastOptions): string;
  updateToast(id: string, options: ToastOptions): void;
  dismissToast(id: string): void;
}

export const useToast = useToastUI;

export const toast = (options: ToastOptions) => {
  const { toast } = useToastUI();
  return toast(options);
};
