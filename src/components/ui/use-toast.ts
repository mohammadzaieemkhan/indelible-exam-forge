
// Correctly re-export the useToast hook from the hooks directory
import * as React from "react";
import { useToast as useToastHook, toast as toastFunction } from "@/hooks/use-toast";

// Re-export the hook and toast function
export const useToast = useToastHook;
export const toast = toastFunction;
