
import { cn } from "@/lib/utils"
import { HTMLMotionProps, motion } from "framer-motion"

interface SkeletonProps {
  className?: string;
  shimmer?: boolean;
  animated?: boolean;
  [key: string]: any; // Allow other props to pass through
}

function Skeleton({
  className,
  shimmer = true,
  animated = true,
  ...props
}: SkeletonProps) {
  if (shimmer) {
    return (
      <motion.div
        initial={{ opacity: 0.5 }}
        animate={{ opacity: [0.5, 0.8, 0.5] }}
        transition={{
          repeat: Infinity,
          duration: 1.5,
          ease: "easeInOut"
        }}
        className={cn(
          "rounded-md bg-gradient-to-r from-muted/60 via-muted to-muted/60 bg-[length:400%_100%]",
          animated && "animate-skeleton-shimmer",
          className
        )}
        {...props}
      />
    )
  }
  
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  )
}

export { Skeleton }
