"use client";

import { type ReactNode } from "react";
import { motion, type HTMLMotionProps } from "framer-motion";

interface FloatingCardProps extends Omit<HTMLMotionProps<"div">, "children"> {
  children: ReactNode;
  delay?: number;
  floatDistance?: number;
  duration?: number;
  className?: string;
}

/**
 * Card with floating animation and spring physics
 * 
 * @example
 * ```tsx
 * <FloatingCard delay={0.2} floatDistance={12}>
 *   <MetricCard />
 * </FloatingCard>
 * ```
 */
export function FloatingCard({
  children,
  delay = 0,
  floatDistance = 8,
  duration = 6,
  className = "",
  ...motionProps
}: FloatingCardProps) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 20 }}
      animate={{ 
        opacity: 1, 
        y: 0,
      }}
      transition={{
        opacity: { duration: 0.6, delay },
        y: { 
          duration: 0.6, 
          delay,
          type: "spring",
          stiffness: 100,
          damping: 15,
        },
      }}
      whileHover={{
        y: -floatDistance,
        transition: { 
          type: "spring", 
          stiffness: 400, 
          damping: 25 
        },
      }}
      {...motionProps}
    >
      <motion.div
        animate={{
          y: [0, -floatDistance / 2, 0],
        }}
        transition={{
          duration,
          repeat: Infinity,
          ease: "easeInOut",
          delay: delay * 2,
        }}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}
