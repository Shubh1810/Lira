"use client";

import { useState } from "react";
import { Brain, CheckCircle, MessageSquare, Bell } from "lucide-react";
import { cn } from "@/lib/utils";
import { PageWrapper } from "@/components/ui/PageWrapper";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { ChatHistorySection } from "./ChatHistorySection";
import { SessionDetailView } from "./SessionDetailView";

// Mock data for AI memory and tasks
const aiMemoryData = [
  { id: 1, type: "memory", content: "Remembered your preference for morning meetings", timestamp: "2h ago", status: "active" },
  { id: 2, type: "task", content: "Scheduled follow-up with Sarah from marketing", timestamp: "4h ago", status: "completed" },
  { id: 3, type: "memory", content: "Learned about your interest in AI research", timestamp: "1d ago", status: "active" },
  { id: 4, type: "task", content: "Prepared quarterly report summary", timestamp: "2d ago", status: "completed" },
  { id: 5, type: "memory", content: "Noted your coffee preference: oat milk latte", timestamp: "3d ago", status: "active" },
  { id: 6, type: "task", content: "Analyzed market trends for Q4", timestamp: "3d ago", status: "completed" },
];

export default function MemoryPage() {
  const [activeTab, setActiveTab] = useState("chat");
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);

  const handleSessionSelect = (sessionId: string) => {
    setSelectedSessionId(sessionId);
  };

  const handleBackToSessions = () => {
    setSelectedSessionId(null);
  };

  // Determine Icon and Title based on activeTab and selectedSessionId
  let pageIcon = Brain;
  let pageIconGradient = "bg-gradient-to-r from-purple-500 to-pink-500";
  let pageTitle = "AI Memory";
  let pageSubtitle = "Your AI's learning journey";

  if (activeTab === "chat") {
    pageIcon = MessageSquare;
    pageIconGradient = "bg-gradient-to-r from-blue-500 to-cyan-500";
    if (selectedSessionId) {
      pageTitle = "Chat Details"; // Title changes when viewing a session
      pageSubtitle = "Reviewing a specific conversation";
    } else {
      pageTitle = "Chat History";
      pageSubtitle = "Review past conversations";
    }
  } else if (activeTab === "memory") {
    // Stays as AI Memory (default)
  } else if (activeTab === "tasks") {
    pageIcon = CheckCircle;
    pageIconGradient = "bg-gradient-to-r from-green-500 to-teal-500";
    pageTitle = "Tasks";
    pageSubtitle = "Managed by your AI";
  }

  return (
    <PageWrapper>
      <PageHeader
        icon={pageIcon}
        iconGradient={pageIconGradient}
        title={pageTitle}
        subtitle={pageSubtitle}
        rightElement={
          <div className="relative">
            <Bell className="w-6 h-6 text-gray-500" />
          </div>
        }
      />

      {/* Stats Cards - Only show if not in chat tab or if in chat tab but no session selected */}
      {(activeTab !== "chat" || (activeTab === "chat" && !selectedSessionId)) && (
        <div className="grid grid-cols-2 gap-4 mb-6">
          <StatCard icon={Brain} iconColor="text-blue-400" value="12" label="Memories" subtitle="+3 today" />
          <StatCard icon={CheckCircle} iconColor="text-green-400" value="8" label="Tasks" subtitle="+2 completed" />
        </div>
      )}

      {/* Tab Navigation - Only show if no session is selected or not on chat tab */}
      {!(activeTab === "chat" && selectedSessionId) && (
          <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-1 mb-4 relative">
            <div className="flex space-x-1">
              <button
                onClick={() => { setActiveTab("chat"); setSelectedSessionId(null); }} // Reset session on tab click
                className={cn(
                  "flex-1 py-3 px-4 rounded-md text-sm font-medium transition-all",
                  activeTab === "chat" ? "bg-gray-800 text-gray-100 shadow-lg" : "text-gray-400 hover:text-gray-300"
                )}
              >
                Chat History
              </button>
              <button
                onClick={() => { setActiveTab("memory"); setSelectedSessionId(null); }}
                className={cn(
                  "flex-1 py-3 px-4 rounded-md text-sm font-medium transition-all",
                  activeTab === "memory" ? "bg-gray-800 text-gray-100 shadow-lg" : "text-gray-400 hover:text-gray-300"
                )}
              >
                Memories
              </button>
              <button
                onClick={() => { setActiveTab("tasks"); setSelectedSessionId(null); }}
                className={cn(
                  "flex-1 py-3 px-4 rounded-md text-sm font-medium transition-all",
                  activeTab === "tasks" ? "bg-gray-800 text-gray-100 shadow-lg" : "text-gray-400 hover:text-gray-300"
                )}
              >
                Tasks
              </button>
            </div>
          </div>
      )}

      {/* Content Display based on activeTab and selectedSessionId */}
      {activeTab === "chat" && (
        selectedSessionId ? (
          <SessionDetailView sessionId={selectedSessionId} onBack={handleBackToSessions} />
        ) : (
          <ChatHistorySection onSessionSelect={handleSessionSelect} />
        )
      )}

      {activeTab === "memory" && (
        <div className="flex-1 space-y-3 overflow-y-auto">
          {aiMemoryData
            .filter(item => item.type === "memory")
            .map((item) => (
            <div key={item.id} className="bg-gray-900/50 border border-gray-800 rounded-lg p-4 relative">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center bg-gray-800")}>
                    <Brain className="w-4 h-4 text-blue-400" />
                  </div>
                  <span className={cn("text-xs px-2 py-1 rounded-full font-medium", item.status === "active" ? "bg-gray-800 text-green-400" : "bg-gray-800 text-gray-500")}>
                    {item.status}
                  </span>
                </div>
                <span className="text-xs text-gray-600">{item.timestamp}</span>
              </div>
              <p className="text-sm text-gray-300 leading-relaxed">{item.content}</p>
            </div>
          ))}
        </div>
      )}

      {activeTab === "tasks" && (
        <div className="flex-1 space-y-3 overflow-y-auto">
          {aiMemoryData
            .filter(item => item.type === "task")
            .map((item) => (
            <div key={item.id} className="bg-gray-900/50 border border-gray-800 rounded-lg p-4 relative">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center bg-gray-800")}>
                    <CheckCircle className="w-4 h-4 text-green-400" />
                  </div>
                  <span className={cn("text-xs px-2 py-1 rounded-full font-medium", item.status === "active" ? "bg-gray-800 text-green-400" : "bg-gray-800 text-gray-500")}>
                    {item.status} {/* Assuming tasks can also have a status like memories */}
                  </span>
                </div>
                <span className="text-xs text-gray-600">{item.timestamp}</span>
              </div>
              <p className="text-sm text-gray-300 leading-relaxed">{item.content}</p>
            </div>
          ))}
        </div>
      )}
    </PageWrapper>
  );
} 