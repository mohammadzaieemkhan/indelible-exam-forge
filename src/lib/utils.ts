
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Animation helpers
export const fadeIn = (delay: number = 0) => ({
  hidden: { opacity: 0, y: 10 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: {
      delay,
      duration: 0.5
    }
  }
})

export const scaleIn = (delay: number = 0) => ({
  hidden: { opacity: 0, scale: 0.9 },
  visible: { 
    opacity: 1, 
    scale: 1,
    transition: {
      delay,
      duration: 0.4
    }
  }
})

export const slideInFromRight = (delay: number = 0) => ({
  hidden: { opacity: 0, x: 20 },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: {
      delay,
      duration: 0.5
    }
  }
})

export const staggerContainer = (staggerChildren: number = 0.1, delayChildren: number = 0) => ({
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      delayChildren,
      staggerChildren
    }
  }
})

// Format date to display in web 3.0 style
export function formatDateWeb3(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  const diff = Math.floor((now.getTime() - d.getTime()) / 1000)
  
  if (diff < 60) return `${diff}s ago`
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  if (diff < 2592000) return `${Math.floor(diff / 86400)}d ago`
  
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}

// Generate random gradient for cards
export function getRandomGradient(): string {
  const gradients = [
    'from-blue-500/20 to-violet-500/20',
    'from-violet-500/20 to-purple-500/20',
    'from-purple-500/20 to-pink-500/20',
    'from-pink-500/20 to-red-500/20',
    'from-red-500/20 to-orange-500/20',
    'from-orange-500/20 to-yellow-500/20',
    'from-yellow-500/20 to-lime-500/20',
    'from-lime-500/20 to-green-500/20',
    'from-green-500/20 to-emerald-500/20',
    'from-emerald-500/20 to-teal-500/20',
    'from-teal-500/20 to-cyan-500/20',
    'from-cyan-500/20 to-sky-500/20',
    'from-sky-500/20 to-blue-500/20'
  ]
  
  return gradients[Math.floor(Math.random() * gradients.length)]
}
