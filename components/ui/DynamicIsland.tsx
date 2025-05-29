import { type ReactNode, type MouseEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface DynamicIslandProps {
  currentPageTitle: string;
  isOpen: boolean;
  onToggle: () => void;
  children: ReactNode;
}

export function DynamicIsland({ currentPageTitle, isOpen, onToggle, children }: DynamicIslandProps) {
  return (
    <div className="relative"> 
      {/* Backdrop - Renders when isOpen is true */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.1 }} // Backdrop fade duration as per user's last change
            onClick={onToggle} // Click on backdrop closes the island
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40" // z-index lower than island
            style={{ touchAction: "none" }}
          />
        )}
      </AnimatePresence>

      {/* Dynamic Island Container (changed from button to div) */}
      <motion.div
        onClick={onToggle} 
        role="button" // Add role for accessibility since it's not a native button
        tabIndex={0}  // Make it focusable
        onKeyDown={(e) => { // Allow keyboard activation (Enter/Space)
          if (e.key === 'Enter' || e.key === ' ') {
            onToggle();
          }
        }}
        className={cn(
          "fixed left-1/2 -translate-x-1/2 top-4",
          "bg-gray-900/65 border border-gray-800 shadow-lg",
          "flex items-center justify-center cursor-pointer", // Added cursor-pointer
          !isOpen && "active:scale-95", // Apply scale effect only when closed
          "lg:max-w-xl", // Max width on large screens (576px)
          "z-50" // Ensure island is above backdrop
        )}
        style={{ willChange: 'width, height, border-radius' }} // Performance hint
        animate={{
          width: isOpen ? "90%" : "12rem",  // Wider on mobile, constrained by max-w on desktop
          height: isOpen ? "60vh" : "3rem", // Longer profile
          borderRadius: isOpen ? "1rem" : "9999px",
        }}
        transition={{
          type: "tween",       // Changed from spring
          duration: 0.005,     // Set a duration for the tween animation
        }}
      >
        {/* Content for the closed state (Sparkles icon and Title) */}
        <AnimatePresence mode="wait">
          {!isOpen && (
            <motion.div
              key="title"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0, transition: { delay: 0.02, duration: 0.15 } }} // Faster entry
              exit={{ opacity: 0, y: -5, transition: { duration: 0.1 } }} // Faster exit
              className="flex items-center space-x-1 px-4 whitespace-nowrap" // Original classes
            >
              <Image 
                src="/glitch-logo.png"
                alt="Lira Logo"
                width={30} // Keeping the 35x35 size you set
                height={30}
                className="flex-shrink-0"
              />
              <span className="text-sm font-medium text-gray-400">
                {currentPageTitle}
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Content for the open state (Menu Items) */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              key="menu"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: { delay: 0.2, duration: 0.33 } }} // Content fades in even sooner and faster
              exit={{ opacity: 0, transition: { duration: 0.05 } }}   // Very fast content fade out
              className="absolute inset-0 p-4 overflow-y-auto w-full h-full"
              onClick={(e: MouseEvent<HTMLDivElement>) => e.stopPropagation()} 
            >
              {children} 
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div> 
    </div>
  );
} 