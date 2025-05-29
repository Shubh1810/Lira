"use client";

import { X, ArrowDownToLine, PlusSquare, SquareArrowUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface WelcomeOverlayProps {
  onDismiss: () => void;
}

export function WelcomeOverlay({ onDismiss }: WelcomeOverlayProps) {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: "spring", stiffness: 300, damping: 30, duration: 0.3 }}
          className="bg-gray-800/80 border border-gray-700 p-6 md:p-8 rounded-2xl shadow-2xl max-w-md w-full text-left relative flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-purple-500/20 rounded-full">
                <ArrowDownToLine size={24} className="text-purple-400" />
              </div>
              <h2 className="text-xl md:text-2xl font-bold text-gray-100">
                Quick App Access!
              </h2>
            </div>
            <button
              onClick={onDismiss}
              className="text-gray-500 hover:text-gray-300 transition-colors p-1 -mr-2 -mt-1"
              aria-label="Dismiss welcome message"
            >
              <X size={22} />
            </button>
          </div>

          <p className="text-gray-400 text-sm md:text-base mb-6">
            For the best experience, add Lira to your Home Screen. Here&apos;s how on Safari (iOS):
          </p>

          <div className="space-y-5 mb-8">
            <div className="flex items-center space-x-3 p-3 bg-gray-700/50 rounded-lg">
              <SquareArrowUp size={36} className="text-blue-400 flex-shrink-0" />
              <div>
                <p className="font-medium text-gray-200">1. Tap the Share Icon</p>
                <p className="text-xs text-gray-400">It&apos;s usually at the bottom or top of your Safari browser.</p>
              </div>
            </div>

            <div className="flex items-center space-x-3 p-3 bg-gray-700/50 rounded-lg">
              <PlusSquare size={36} className="text-green-400 flex-shrink-0" />
              <div>
                <p className="font-medium text-gray-200">2. Add to Home Screen</p>
                <p className="text-xs text-gray-400">Scroll down in the share menu and select this option.</p>
              </div>
            </div>
          </div>

          <div className="mt-auto flex flex-col sm:flex-row-reverse gap-3">
            <button
              onClick={onDismiss}
              className="w-full sm:w-auto bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2.5 px-6 rounded-lg text-base transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-800"
            >
              Okay, Got It!
            </button>
          </div>
          
          <p className="text-xs text-gray-500 mt-5 text-center">
            On other devices/browsers, look for a similar &quot;Install&quot; or &quot;Add to Page&quot; option.
          </p>

        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
} 