"use client";

import { Network, Search, TrendingUp, Calendar, Users, Plus } from "lucide-react";
import { PageWrapper } from "@/components/ui/PageWrapper";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";

// Mock data for networking opportunities
const networkingData = [
  { id: 1, name: "Alex Chen", role: "AI Research Scientist", company: "OpenAI", match: 95, interests: ["ML", "Neural Networks"], avatar: "AC" },
  { id: 2, name: "Sarah Johnson", role: "Product Manager", company: "Google", match: 88, interests: ["Product Strategy", "AI Ethics"], avatar: "SJ" },
  { id: 3, name: "David Kim", role: "Startup Founder", company: "TechVenture", match: 82, interests: ["Entrepreneurship", "AI Apps"], avatar: "DK" },
  { id: 4, name: "Emily Rodriguez", role: "Data Scientist", company: "Meta", match: 79, interests: ["Data Analysis", "AI Research"], avatar: "ER" },
  { id: 5, name: "Michael Zhang", role: "CTO", company: "StartupXYZ", match: 85, interests: ["Tech Leadership", "Innovation"], avatar: "MZ" },
];

export default function NetworkingPage() {
  return (
    <PageWrapper>
      <PageHeader
        icon={Network}
        iconGradient="bg-gradient-to-r from-blue-500 to-cyan-500"
        title=""
        subtitle="Connect & grow together"
        rightElement={
          <div className="relative">
            <Search className="w-6 h-6 text-gray-500" />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></div>
          </div>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="relative">
          <StatCard
            icon={TrendingUp}
            iconColor="text-green-400"
            value="24"
            label="Connections"
          />
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></div>
        </div>
        <div className="relative">
          <StatCard
            icon={Calendar}
            iconColor="text-purple-400"
            value="8"
            label="Meetings"
          />
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></div>
        </div>
        <div className="relative">
          <StatCard
            icon={Users}
            iconColor="text-blue-400"
            value="5"
            label="New Today"
          />
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></div>
        </div>
      </div>

      {/* Recommended Connections */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-100">Recommended</h3>
        <div className="relative">
          <Plus className="w-5 h-5 text-gray-500" />
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></div>
        </div>
      </div>
      
      <div className="flex-1 space-y-3 overflow-y-auto">
        {networkingData.map((person) => (
          <div key={person.id} className="bg-gray-900/50 border border-gray-800 rounded-lg p-4 cursor-pointer hover:bg-gray-800/50 transition-colors relative">
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></div>
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                <span className="text-sm font-bold text-white">{person.avatar}</span>
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-100">{person.name}</h4>
                <p className="text-sm text-gray-400">{person.role}</p>
                <p className="text-xs text-gray-600">{person.company}</p>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold text-green-400">{person.match}%</div>
                <div className="text-xs text-gray-600">match</div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {person.interests.map((interest, idx) => (
                <span key={idx} className="text-xs bg-gray-800 text-blue-300 px-2 py-1 rounded-full border border-gray-700">
                  {interest}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </PageWrapper>
  );
} 