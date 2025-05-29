"use client";

import { useState, useEffect } from "react";
import { useSession, signIn } from "next-auth/react";
import Image from "next/image";
import { 
  Brain, 
  Network,
  MessageCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { DynamicIsland } from "@/components/ui/DynamicIsland";

// Import page components
import MemoryPage from "@/components/pages/MemoryPage";
import NetworkingPage from "@/components/pages/NetworkingPage";
import AssistantPage from "@/components/pages/AssistantPage";
import AccountPage from "@/components/pages/AccountPage";

export default function Home() {
  const [currentPage, setCurrentPage] = useState("assistant");
  const [currentPageTitle, setCurrentPageTitle] = useState("Agent");
  const [isNavOpen, setIsNavOpen] = useState(false);
  const { data: session } = useSession();

  const navItems = [
    { name: "Memory", icon: Brain, page: "memory", title: "AI Memory", bgColor: "bg-gray-800" },
    { name: "Network", icon: Network, page: "networking", title: "Networking", bgColor: "bg-gray-800" },
    { name: "Agent", icon: MessageCircle, page: "assistant", title: "Agent", bgColor: "bg-gray-800" },
  ];

  const handleNavClick = (page: string) => {
    const selectedNavItem = navItems.find(item => item.page === page);
    setCurrentPage(page);
    setCurrentPageTitle(selectedNavItem ? selectedNavItem.title : "Lira");
    setIsNavOpen(false);
  };

  const handleSignIn = () => {
    signIn("google");
  };

  const handleAccountClick = () => {
    if (session) {
      setCurrentPage("account");
      setCurrentPageTitle("Account");
      setIsNavOpen(false);
    }
  };

  // Helper to get user-specific localStorage keys from app/page.tsx context
  const getUserStorageKey = (baseKey: string) => {
    if (typeof window !== 'undefined' && session?.user?.email) {
        return `user_${session.user.email}_${baseKey}`;
    }
    return null;
  };

  const getCurrentGradient = () => {
    let themeId = 'cosmic'; // Default
    if (typeof window !== 'undefined' && session?.user?.email) {
      const gradientKey = getUserStorageKey('gradient');
      themeId = (gradientKey ? localStorage.getItem(gradientKey) : null) || session?.user?.profileThemeId || 'cosmic';
    }
    const gradientMap: { [key: string]: string } = {
      'cosmic': 'bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-800',
      'sunset': 'bg-gradient-to-br from-orange-500 via-pink-500 to-red-600',
      'ocean': 'bg-gradient-to-br from-cyan-500 via-blue-500 to-indigo-600',
      'forest': 'bg-gradient-to-br from-green-500 via-emerald-500 to-teal-600',
      'aurora': 'bg-gradient-to-br from-violet-500 via-purple-500 to-pink-600'
    };
    return gradientMap[themeId] || gradientMap['cosmic'];
  };

  const getUserDisplayName = () => {
    if (typeof window !== 'undefined' && session?.user?.email) {
      const nameKey = getUserStorageKey('displayName');
      return (nameKey ? localStorage.getItem(nameKey) : null) || session?.user?.name || "Guest";
    }
    return session?.user?.name || "Guest";
  };

  const userName = getUserDisplayName();
  const userInitial = userName.charAt(0).toUpperCase() || "G";
  const userEmail = session?.user?.email || "Sign in to access features";

  // State for local user name and gradient to ensure re-render on localStorage change
  const [localUserName, setLocalUserName] = useState(userName);
  const [localUserGradient, setLocalUserGradient] = useState(getCurrentGradient());

  useEffect(() => {
    setLocalUserName(getUserDisplayName());
    setLocalUserGradient(getCurrentGradient());
    const handleStorageChange = () => {
        setLocalUserName(getUserDisplayName());
        setLocalUserGradient(getCurrentGradient());
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [session]);

  return (
    <div className="min-h-screen bg-black text-gray-300 flex flex-col relative">
      {/* Dynamic Island Navigation */}
      <DynamicIsland
        currentPageTitle={currentPageTitle}
        isOpen={isNavOpen}
        onToggle={() => setIsNavOpen(!isNavOpen)}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-0.5">
              <Image 
                src="/glitch-logo.png"
                alt="Lira Logo"
                width={24}
                height={24}
                className=" w-9 h-9"
              />
              <span className="text-lg font-semibold text-gray-100">Lira Labs</span>
            </div>
          </div>

          <nav className="space-y-2 flex-1 overflow-y-auto">
            {navItems.map((item) => {
              const IconComponent = item.icon;
              const isSelected = currentPage === item.page;
              return (
                <div
                  key={item.name}
                  className={cn(
                    "w-full rounded-lg",
                    isSelected 
                      ? "p-0.5 bg-gradient-to-r from-blue-500 via-pink-500 to-yellow-400 shadow-lg animate-gradient-spin animate-gradient-pulse" 
                      : ""
                  )}
                >
                  <button
                    onClick={() => handleNavClick(item.page)}
                    className={cn(
                      "w-full flex items-center space-x-3 py-3 px-4 text-left touch-manipulation transition-all",
                      isSelected
                        ? "bg-gray-900 text-white rounded-md"
                        : "bg-transparent text-gray-400 hover:bg-gray-800/60 hover:text-gray-200 active:bg-gray-800 rounded-lg"
                    )}
                    type="button"
                  >
                    <IconComponent className={cn("w-6 h-6", isSelected ? "text-white" : "text-gray-500")} />
                    <span className="text-sm font-medium">{item.name}</span>
                  </button>
                </div>
              );
            })}
          </nav>

          {/* Account Section */}
          <div className="mt-6">
            {session ? (
              <button 
                onClick={handleAccountClick}
                className="w-full flex items-center space-x-3 p-3 bg-gray-800/50 hover:bg-gray-800/70 rounded-lg transition-colors"
              >
                {session?.user?.image ? (
                  <Image 
                    src={session.user.image} 
                    alt={localUserName}
                    width={40} 
                    height={40} 
                    className="w-10 h-10 rounded-full" 
                  />
                ) : (
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-lg ${localUserGradient}`}>
                    <span className="text-sm font-bold text-white">{userInitial}</span>
                  </div>
                )}
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-sm font-medium text-gray-100 truncate">{localUserName}</p>
                  <p className="text-xs text-gray-400 truncate">{userEmail}</p>
                </div>
              </button>
            ) : (
              <button 
                onClick={handleSignIn}
                className="w-full bg-white hover:bg-gray-100 text-gray-800 border border-gray-300 rounded-lg p-3 flex items-center justify-center space-x-2 transition-colors"
              >
                <Image src="/google-logo.png" alt="Google sign-in" width={16} height={16} />
                <span className="text-sm font-medium">Continue with Google</span>
              </button>
            )}
          </div>
        </div>
      </DynamicIsland>

      {/* Main Content */}
      <main className="flex-1 p-4 pb-4 overflow-hidden mt-20">
        {currentPage === "memory" && <MemoryPage />}
        {currentPage === "networking" && <NetworkingPage />}
        {currentPage === "assistant" && <AssistantPage />}
        {currentPage === "account" && session && <AccountPage />}
        {currentPage === "account" && !session && (()=>{
            setCurrentPage("assistant");
            setCurrentPageTitle("AI Assistant");
            return <AssistantPage />;
        })()}
      </main>
    </div>
  );
}
