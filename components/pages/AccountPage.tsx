"use client";

import { useState, useEffect } from "react";
import { useSession, signIn, signOut } from "next-auth/react";
import Image from "next/image";
import { 
  User, 
  Settings, 
  Bell, 
  Shield, 
  Palette, 
  Moon, 
  Sun, 
  Volume2, 
  Smartphone,
  LogOut,
  Edit,
  ChevronRight,
  Crown,
  Zap,
  LucideIcon,
  Check,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PageWrapper } from "@/components/ui/PageWrapper";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";

interface SettingsItem {
  icon: LucideIcon;
  label: string;
  action: () => void;
  hasChevron?: boolean;
  highlight?: boolean;
  toggle?: boolean;
  value?: boolean;
}

interface SettingsGroup {
  title: string;
  items: SettingsItem[];
}

interface GradientPreset {
  id: string;
  name: string;
  gradient: string;
}

const gradientPresets: GradientPreset[] = [
  { id: 'cosmic', name: 'Cosmic', gradient: 'bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-800' },
  { id: 'sunset', name: 'Sunset', gradient: 'bg-gradient-to-br from-orange-500 via-pink-500 to-red-600' },
  { id: 'ocean', name: 'Ocean', gradient: 'bg-gradient-to-br from-cyan-500 via-blue-500 to-indigo-600' },
  { id: 'forest', name: 'Forest', gradient: 'bg-gradient-to-br from-green-500 via-emerald-500 to-teal-600' },
  { id: 'aurora', name: 'Aurora', gradient: 'bg-gradient-to-br from-violet-500 via-purple-500 to-pink-600' }
];

export default function AccountPage() {
  const { data: session, status } = useSession();
  const [darkMode, setDarkMode] = useState(true);
  const [notifications, setNotifications] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  // Helper to get user-specific localStorage keys
  const getUserKey = (key: string) => {
    if (!session?.user?.email) return null;
    return `user_${session.user.email}_${key}`;
  };

  const [editedName, setEditedName] = useState(() => {
    if (typeof window !== 'undefined' && session?.user?.email) {
      const nameKey = getUserKey('displayName');
      return nameKey ? localStorage.getItem(nameKey) || session?.user?.name || "" : session?.user?.name || "";
    }
    return session?.user?.name || "";
  });
  
  const [selectedGradient, setSelectedGradient] = useState(() => {
    if (typeof window !== 'undefined' && session?.user?.email) {
      const gradientKey = getUserKey('gradient');
      return gradientKey ? localStorage.getItem(gradientKey) || 'cosmic' : 'cosmic';
    }
    return 'cosmic';
  });

  // Effect to update display name if session changes (e.g. initial load after sign in)
  // but prioritize localStorage if edit mode is not active.
  useEffect(() => {
    if (typeof window !== 'undefined' && session?.user && !isEditingProfile) {
      const nameKey = getUserKey('displayName');
      const storedName = nameKey ? localStorage.getItem(nameKey) : null;
      setEditedName(storedName || session.user.name || "");

      const gradientKey = getUserKey('gradient');
      const storedGradient = gradientKey ? localStorage.getItem(gradientKey) : null;
      setSelectedGradient(storedGradient || 'cosmic');
    }
  }, [session, isEditingProfile]); // Removed session.user.displayName and profileThemeId dependencies

  const settingsGroups: SettingsGroup[] = [
    {
      title: "Account",
      items: [
        { icon: Crown, label: "Upgrade to Pro", action: () => {}, hasChevron: true, highlight: true },
        { icon: Shield, label: "Privacy & Security", action: () => {}, hasChevron: true },
      ]
    },
    {
      title: "Preferences",
      items: [
        { 
          icon: darkMode ? Moon : Sun, 
          label: "Dark Mode", 
          action: () => setDarkMode(!darkMode), 
          toggle: true, 
          value: darkMode 
        },
        { 
          icon: Bell, 
          label: "Notifications", 
          action: () => setNotifications(!notifications), 
          toggle: true, 
          value: notifications 
        },
        { 
          icon: Volume2, 
          label: "Sound Effects", 
          action: () => setSoundEnabled(!soundEnabled), 
          toggle: true, 
          value: soundEnabled 
        },
      ]
    },
    {
      title: "AI Settings",
      items: [
        { icon: Zap, label: "AI Personality", action: () => {}, hasChevron: true },
        { icon: Palette, label: "Response Style", action: () => {}, hasChevron: true },
        { icon: Smartphone, label: "Device Sync", action: () => {}, hasChevron: true },
      ]
    }
  ];

  const handleSignIn = () => {
    signIn("google");
  };

  const handleSignOut = () => {
    signOut();
  };

  const handleEditProfile = () => {
    setIsEditingProfile(!isEditingProfile);
    // When starting edit, ensure form is populated from current source (localStorage or session)
    if (typeof window !== 'undefined' && session?.user?.email) {
        const nameKey = getUserKey('displayName');
        setEditedName(nameKey ? localStorage.getItem(nameKey) || session?.user?.name || "" : session?.user?.name || "");
        const gradientKey = getUserKey('gradient');
        setSelectedGradient(gradientKey ? localStorage.getItem(gradientKey) || 'cosmic' : 'cosmic');
    } else {
        setEditedName(session?.user?.name || "");
        setSelectedGradient('cosmic');
    }
  };

  const handleSaveProfile = () => {
    if (!session?.user?.email) return;
    
    const nameKey = getUserKey('displayName');
    if (nameKey) localStorage.setItem(nameKey, editedName);
    
    const gradientKey = getUserKey('gradient');
    if (gradientKey) localStorage.setItem(gradientKey, selectedGradient);
    
    setIsEditingProfile(false);
    // Optionally, provide user feedback that settings are saved locally.
    console.log('Profile settings saved to localStorage');
  };

  const handleCancelEdit = () => {
    setIsEditingProfile(false);
    // Reset to saved user-specific values or session defaults
    if (typeof window !== 'undefined' && session?.user?.email) {
      const nameKey = getUserKey('displayName');
      setEditedName(nameKey ? localStorage.getItem(nameKey) || session?.user?.name || "" : session?.user?.name || "");
      const gradientKey = getUserKey('gradient');
      setSelectedGradient(gradientKey ? localStorage.getItem(gradientKey) || 'cosmic' : 'cosmic');
    } else {
      setEditedName(session?.user?.name || "");
      setSelectedGradient('cosmic');
    }
  };

  const getCurrentGradient = () => {
    const preset = gradientPresets.find(p => p.id === selectedGradient);
    return preset ? preset.gradient : gradientPresets[0].gradient;
  };

  const getUserDisplayName = () => {
    // If editing, show the edited name. Otherwise, show the name from localStorage or session.
    if (isEditingProfile) return editedName;
    if (typeof window !== 'undefined' && session?.user?.email) {
      const nameKey = getUserKey('displayName');
      return nameKey ? localStorage.getItem(nameKey) || session?.user?.name || "Guest" : session?.user?.name || "Guest";
    }
    return session?.user?.name || "Guest";
  };

  const userName = getUserDisplayName();
  const userInitial = userName.charAt(0).toUpperCase() || "G";
  const userEmail = session?.user?.email || "Sign in to access full features";
  const pageSubtitle = session?.user?.name ? `Logged in as ${session.user.name}` : "Manage your profile & settings";

  return (
    <PageWrapper>
      <PageHeader
        icon={User}
        iconGradient="bg-gradient-to-r from-orange-500 to-red-500"
        title=""
        subtitle={pageSubtitle}
        rightElement={
          <div className="relative">
            <Settings className="w-6 h-6 text-gray-500" />
          </div>
        }
      />

      {/* Profile Card */}
      <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-4 mb-6">
        <div className="flex items-center space-x-4">
          {session?.user?.image ? (
            <Image 
              src={session.user.image} 
              alt={userName} 
              width={64} 
              height={64} 
              className="w-16 h-16 rounded-full" 
            />
          ) : (
            <div className={`w-16 h-16 ${getCurrentGradient()} rounded-full flex items-center justify-center shadow-lg`}>
              <span className="text-xl font-bold text-white">{userInitial}</span>
            </div>
          )}
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-100">{userName}</h3>
            <p className="text-sm text-gray-400 truncate max-w-xs">{userEmail}</p>
            {session && (
              <div className="flex items-center space-x-2 mt-1">
                <Crown className="w-4 h-4 text-yellow-400" />
                <span className="text-xs text-yellow-400 font-medium">Pro Member</span>
              </div>
            )}
          </div>
          {session && (
            <button 
              onClick={handleEditProfile}
              className="w-8 h-8 bg-gray-800 hover:bg-gray-700 rounded-lg flex items-center justify-center transition-colors"
            >
              <Edit className="w-4 h-4 text-gray-400" />
            </button>
          )}
        </div>

        {/* Edit Profile Section */}
        {isEditingProfile && session && (
          <div className="mt-6 pt-4 border-t border-gray-800">
            <div className="space-y-4">
              {/* Name Editing */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Display Name</label>
                <input
                  type="text"
                  value={editedName} // This now comes from state tied to localStorage
                  onChange={(e) => setEditedName(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Enter your display name"
                />
              </div>

              {/* Gradient Presets */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">Profile Color</label>
                <div className="grid grid-cols-5 gap-3">
                  {gradientPresets.map((preset) => (
                    <button
                      key={preset.id}
                      onClick={() => setSelectedGradient(preset.id)} // Updates state tied to localStorage
                      className={cn(
                        "relative w-12 h-12 rounded-full flex items-center justify-center transition-all",
                        preset.gradient,
                        selectedGradient === preset.id 
                          ? "ring-2 ring-purple-400 ring-offset-2 ring-offset-gray-900" 
                          : "hover:scale-110"
                      )}
                    >
                      <span className="text-sm font-bold text-white">{userInitial}</span>
                      {selectedGradient === preset.id && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
                <div className="flex justify-center mt-2">
                  <span className="text-xs text-gray-500">
                    {gradientPresets.find(p => p.id === selectedGradient)?.name || 'Cosmic'}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3 pt-2">
                <button
                  onClick={handleSaveProfile} // Now saves to localStorage
                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-white rounded-lg py-2 px-4 text-sm font-medium transition-colors flex items-center justify-center space-x-2"
                >
                  <Check className="w-4 h-4" />
                  <span>Save Changes</span>
                </button>
                <button
                  onClick={handleCancelEdit}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg py-2 px-4 text-sm font-medium transition-colors flex items-center justify-center space-x-2"
                >
                  <X className="w-4 h-4" />
                  <span>Cancel</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Conditional Sign In/Out Button */}
      {!session && status !== "loading" && (
        <button 
          onClick={handleSignIn}
          className="w-full bg-white hover:bg-gray-100 text-gray-800 border border-gray-300 rounded-lg p-4 flex items-center justify-center space-x-3 mb-6 transition-colors"
        >
          <Image src="/google-logo.png" alt="Google sign-in" width={20} height={20} />
          <span className="text-sm font-medium">Continue with Google</span>
        </button>
      )}

      {/* Stats - Potentially show only if logged in or use placeholder values */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="relative">
          <StatCard
            icon={User}
            iconColor="text-blue-400"
            value={session ? "156" : "--"} 
            label="AI Interactions"
          />
          {!session && <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></div>}
        </div>
        <div className="relative">
          <StatCard
            icon={Zap}
            iconColor="text-green-400"
            value={session ? "24" : "--"}
            label="Days Active"
          />
          {!session && <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></div>}
        </div>
        <div className="relative">
          <StatCard
            icon={Palette}
            iconColor="text-purple-400"
            value={session ? "89%" : "--"}
            label="Satisfaction"
          />
          {!session && <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></div>}
        </div>
      </div>

      {/* Settings Groups - Some settings might be disabled or hidden if not logged in */}
      <div className="flex-1 space-y-4 overflow-y-auto">
        {settingsGroups.map((group) => (
          <div key={group.title} className="bg-gray-900/50 border border-gray-800 rounded-lg overflow-hidden relative">
            <div className="px-4 py-3 border-b border-gray-800">
              <h4 className="text-sm font-semibold text-gray-400">{group.title}</h4>
            </div>
            <div className="divide-y divide-gray-800">
              {group.items.map((item) => (
                <button
                  key={item.label}
                  onClick={item.action}
                  disabled={!session && (item.label === "Edit Profile" || group.title === "AI Settings")} // "Edit Profile" string here is a bit brittle
                  className={cn(
                    "w-full flex items-center justify-between p-4 hover:bg-gray-800/50 transition-colors",
                    item.highlight && "bg-gray-800/30",
                    !session && (item.label === "Edit Profile" || group.title === "AI Settings") && "opacity-50 cursor-not-allowed"
                  )}
                >
                  <div className="flex items-center space-x-3">
                    <div className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center",
                      item.highlight 
                        ? "bg-gray-800 text-yellow-400" 
                        : "bg-gray-800 text-gray-400"
                    )}>
                      <item.icon className="w-4 h-4" />
                    </div>
                    <span className={cn(
                      "text-sm font-medium",
                      item.highlight ? "text-yellow-400" : "text-gray-200"
                    )}>
                      {item.label}
                    </span>
                  </div>
                  
                  {item.toggle ? (
                    <div className={cn(
                      "w-12 h-6 rounded-full transition-colors relative",
                      item.value ? "bg-gray-600" : "bg-gray-700"
                    )}>
                      <div className={cn(
                        "w-5 h-5 bg-gray-300 rounded-full absolute top-0.5 transition-transform",
                        item.value ? "translate-x-6" : "translate-x-0.5"
                      )} />
                    </div>
                  ) : item.hasChevron ? (
                    <ChevronRight className="w-4 h-4 text-gray-500" />
                  ) : null}
                </button>
              ))}
            </div>
          </div>
        ))}

        {/* Logout Button */}
        {session && (
          <button 
            onClick={handleSignOut}
            className="w-full bg-red-600/80 hover:bg-red-600 text-white rounded-lg p-4 flex items-center justify-center space-x-3 mt-4 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span className="text-sm font-medium">Sign Out</span>
          </button>
        )}
      </div>
    </PageWrapper>
  );
} 