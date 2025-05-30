"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, MessageSquare, User, Zap } from "lucide-react"; // Added User and Zap for icons
import { getChatSessionDetails, SessionDetail, ChatMessage as ApiChatMessage } from "@/lib/api"; // Renamed ChatMessage to ApiChatMessage to avoid conflict
import { cn } from "@/lib/utils";

interface SessionDetailViewProps {
  sessionId: string;
  onBack: () => void;
}

// Interface for display purposes, can be extended
interface DisplayMessage extends ApiChatMessage {
  icon: React.ElementType;
  iconColor: string;
  bgColor: string;
}

export function SessionDetailView({ sessionId, onBack }: SessionDetailViewProps) {
  const [sessionDetails, setSessionDetails] = useState<SessionDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId) return;

    async function fetchDetails() {
      try {
        setIsLoading(true);
        setError(null);
        const details = await getChatSessionDetails(sessionId);
        setSessionDetails(details);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load session details.");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchDetails();
  }, [sessionId]);

  const displayMessages: DisplayMessage[] = sessionDetails?.messages.map(msg => ({
    ...msg,
    icon: msg.type === 'human' ? User : Zap, // Zap for AI, or MessageSquare if preferred
    iconColor: msg.type === 'human' ? "text-blue-400" : "text-purple-400",
    bgColor: msg.type === 'human' ? "bg-gray-800" : "bg-gray-700",
  })) || [];

  return (
    <div className="mt-0">
      <div className="flex items-center mb-4">
        <button 
          onClick={onBack} 
          className="p-2 mr-2 rounded-md hover:bg-gray-700 transition-colors"
          aria-label="Back to sessions list"
        >
          <ArrowLeft className="w-5 h-5 text-gray-300" />
        </button>
        {isLoading && <h2 className="text-lg font-semibold text-gray-300">Loading session...</h2>}
        {error && <h2 className="text-lg font-semibold text-red-500">Error</h2>}
        {sessionDetails && !isLoading && !error && (
          <h2 className="text-lg font-semibold text-gray-300 truncate">{sessionDetails.title}</h2>
        )}
      </div>

      {isLoading && <p className="text-gray-400 text-center py-4">Loading messages...</p>}
      {error && !isLoading && <p className="text-red-500 text-center py-4">Error: {error}</p>}

      {!isLoading && !error && sessionDetails && (
        <div className="space-y-4">
          {displayMessages.length > 0 ? (
            displayMessages.map((message, index) => (
              <div key={index} className={cn("p-4 rounded-lg shadow-md", message.bgColor)}>
                <div className="flex items-start space-x-3">
                  <div className={cn("w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0", message.bgColor === "bg-gray-800" ? "bg-gray-700" : "bg-gray-600")}>
                    <message.icon className={cn("w-5 h-5", message.iconColor)} />
                  </div>
                  <div className="flex-1">
                    <p className={cn("text-sm", message.type === 'human' ? "text-gray-200" : "text-gray-100")}>
                      {message.content}
                    </p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-500 text-center py-4">No messages in this session.</p>
          )}
        </div>
      )}
      {!isLoading && !error && !sessionDetails && (
         <p className="text-gray-500 text-center py-4">Session data not found.</p>
      )}
    </div>
  );
} 