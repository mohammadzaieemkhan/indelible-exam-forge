
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Checks if an exam is currently active based on its scheduled date and time
 * @param examDate The exam date (YYYY-MM-DD format)
 * @param examTime The exam time (HH:MM format)
 * @returns boolean indicating if the exam is currently active
 */
export function isExamActive(examDate: string, examTime: string): boolean {
  const now = new Date();
  const examDateTime = new Date(`${examDate}T${examTime}`);
  return examDateTime <= now;
}

/**
 * Returns a formatted string representing the time remaining until an exam
 * @param examDate The exam date (YYYY-MM-DD format)
 * @param examTime The exam time (HH:MM format)
 * @returns formatted string showing time remaining
 */
export function getTimeRemaining(examDate: string, examTime: string): string {
  const now = new Date();
  const examDateTime = new Date(`${examDate}T${examTime}`);
  const diffMs = examDateTime.getTime() - now.getTime();
  
  if (diffMs <= 0) return "now";
  
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  
  if (diffDays > 0) {
    return `${diffDays} day${diffDays > 1 ? 's' : ''} and ${diffHours} hour${diffHours > 1 ? 's' : ''}`;
  } else if (diffHours > 0) {
    return `${diffHours} hour${diffHours > 1 ? 's' : ''} and ${diffMinutes} minute${diffMinutes > 1 ? 's' : ''}`;
  } else {
    return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''}`;
  }
}

/**
 * Formats the elapsed time from start to end in minutes and seconds
 * @param start start time in milliseconds
 * @param end end time in milliseconds
 * @returns formatted string showing elapsed time
 */
export function formatElapsedTime(start: number, end: number): string {
  const elapsed = end - start;
  const minutes = Math.floor(elapsed / 60000);
  const seconds = Math.floor((elapsed % 60000) / 1000);
  return `${minutes} minute${minutes !== 1 ? 's' : ''} and ${seconds} second${seconds !== 1 ? 's' : ''}`;
}
