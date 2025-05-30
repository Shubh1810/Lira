"use client";

import { useEffect, useState } from "react";
import { MessageSquare, ChevronRight } from "lucide-react";
import { getChatSessions, SessionListItem } from "@/lib/api";

interface ChatHistorySectionProps {
  onSessionSelect: (sessionId: string) => void;
}

export function ChatHistorySection({ onSessionSelect }: ChatHistorySectionProps) {
  const [sessions, setSessions] = useState<SessionListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSessions() {
      try {
        setIsLoading(true);
        setError(null);
        const fetchedSessions = await getChatSessions();
        setSessions(fetchedSessions);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load chat history.");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchSessions();
  }, []);

  return (
    <div className="mt-0">
      {isLoading && <p className="text-gray-400 text-center py-4">Loading chat history...</p>}
      {error && <p className="text-red-500 text-center py-4">Error: {error}</p>}
      
      {!isLoading && !error && (
        <div className="space-y-3">
          {sessions.length > 0 ? (
            sessions.map((session) => (
              <div 
                key={session.id} 
                className="bg-gray-900/50 border border-gray-800 rounded-lg p-4 hover:bg-gray-800/70 transition-colors cursor-pointer"
                onClick={() => onSessionSelect(session.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-gray-800 flex-shrink-0">
                      <MessageSquare className="w-4 h-4 text-blue-400" />
                    </div>
                    <p className="text-sm font-medium text-gray-200 truncate">{session.title}</p>
                  </div>
                  <div className="flex items-center space-x-2 flex-shrink-0">
                    <ChevronRight className="w-4 h-4 text-gray-600" />
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-500 text-center py-4">No chat history yet.</p>
          )}
        </div>
      )}
    </div>
  );
} 