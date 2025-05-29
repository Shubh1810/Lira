"use client";

import { useState } from "react";
import { Brain, CheckCircle, Bell } from "lucide-react";
import { cn } from "@/lib/utils";

// Import reusable components
import { PageWrapper } from "@/components/ui/PageWrapper";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";

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
  const [activeTab, setActiveTab] = useState("memory");

  return (
    <PageWrapper>
      <PageHeader
        icon={Brain}
        iconGradient="bg-gradient-to-r from-purple-500 to-pink-500"
        title=""
        subtitle="Your AI's learning journey"
        rightElement={
          <div className="relative">
            <Bell className="w-6 h-6 text-gray-500" />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></div>
          </div>
        }
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="relative">
          <StatCard
            icon={Brain}
            iconColor="text-blue-400"
            value="12"
            label="Memories"
            subtitle="+3 today"
          />
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></div>
        </div>
        <div className="relative">
          <StatCard
            icon={CheckCircle}
            iconColor="text-green-400"
            value="8"
            label="Tasks"
            subtitle="+2 completed"
          />
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-1 mb-4 relative">
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></div>
        <div className="flex space-x-1">
          <button
            onClick={() => setActiveTab("memory")}
            className={cn(
              "flex-1 py-3 px-4 rounded-md text-sm font-medium transition-all",
              activeTab === "memory" 
                ? "bg-gray-800 text-gray-100 shadow-lg" 
                : "text-gray-400 hover:text-gray-300"
            )}
          >
            Memories
          </button>
          <button
            onClick={() => setActiveTab("tasks")}
            className={cn(
              "flex-1 py-3 px-4 rounded-md text-sm font-medium transition-all",
              activeTab === "tasks" 
                ? "bg-gray-800 text-gray-100 shadow-lg" 
                : "text-gray-400 hover:text-gray-300"
            )}
          >
            Tasks
          </button>
        </div>
      </div>

      {/* Content List */}
      <div className="flex-1 space-y-3 overflow-y-auto">
        {aiMemoryData
          .filter(item => activeTab === "memory" ? item.type === "memory" : item.type === "task")
          .map((item) => (
          <div key={item.id} className="bg-gray-900/50 border border-gray-800 rounded-lg p-4 relative">
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></div>
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center space-x-3">
                <div className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center",
                  item.type === "memory" ? "bg-gray-800" : "bg-gray-800"
                )}>
                  {item.type === "memory" ? (
                    <Brain className="w-4 h-4 text-blue-400" />
                  ) : (
                    <CheckCircle className="w-4 h-4 text-green-400" />
                  )}
                </div>
                <span className={cn(
                  "text-xs px-2 py-1 rounded-full font-medium",
                  item.status === "active" 
                    ? "bg-gray-800 text-green-400" 
                    : "bg-gray-800 text-gray-500"
                )}>
                  {item.status}
                </span>
              </div>
              <span className="text-xs text-gray-600">{item.timestamp}</span>
            </div>
            <p className="text-sm text-gray-300 leading-relaxed">{item.content}</p>
          </div>
        ))}
      </div>
    </PageWrapper>
  );
} 