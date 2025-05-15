
// Export the useToast hook correctly from the right place
import * as React from "react";
import { useToast as useToastHook, toast as toastFunction } from "@/hooks/use-toast";

// Re-export the hook and toast function
export const useToast = useToastHook;
export const toast = toastFunction;
