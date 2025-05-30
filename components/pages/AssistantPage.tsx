"use client";

import { useState, useEffect, useRef } from "react";
import { 
  Wifi, 
  WifiOff,
  Search,
  Globe,
  Paperclip,
  Mic,
  SquareStack,
  SlidersHorizontal,
  AudioWaveform,
  PlusCircle
} from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { PageWrapper } from "@/components/ui/PageWrapper";
import { askLlm, AskQuery, AskResponse } from "@/lib/api";

// Types for better type safety
interface Message {
  id: number;
  type: "user" | "ai";
  content: string;
  timestamp: Date;
  status?: "sending" | "sent" | "error";
  sessionId?: string;
}

interface LLMConnectionStatus {
  isConnected: boolean;
  isConnecting: boolean;
  lastConnected?: Date;
  error?: string;
}

// LLM Service class - Simplified as we'll use the api.ts functions directly for now
// Keeping the status management part for UI updates
class LLMService {
  private connectionStatus: LLMConnectionStatus = {
    isConnected: false,
    isConnecting: false,
  };

  private readonly baseUrl: string;
  private readonly apiPath = "/api";

  private statusCallbacks: ((status: LLMConnectionStatus) => void)[] = [];

  constructor() {
    if (typeof window !== 'undefined') {
      if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
        this.baseUrl = "http://localhost:5001"; // Backend API
      } else {
        this.baseUrl = window.location.origin; // Assumes backend is on the same domain or proxied
      }
    } else {
      this.baseUrl = ''; 
    }
  }

  onStatusChange(callback: (status: LLMConnectionStatus) => void) {
    this.statusCallbacks.push(callback);
    callback(this.connectionStatus);
    return () => {
      this.statusCallbacks = this.statusCallbacks.filter(cb => cb !== callback);
    };
  }

  private notifyStatusChange() {
    this.statusCallbacks.forEach(callback => callback(this.connectionStatus));
  }

  private async attemptConnection() {
    if (!this.baseUrl) {
      this.connectionStatus = { isConnected: false, isConnecting: false, error: "API base URL not configured." };
      this.notifyStatusChange();
      return;
    }

    this.connectionStatus = { ...this.connectionStatus, isConnecting: true, error: undefined };
    this.notifyStatusChange();

    try {
      const healthCheckUrl = `${this.baseUrl}${this.apiPath}`;
      const response = await fetch(healthCheckUrl); 
      if (response.ok) {
        this.connectionStatus = { isConnected: true, isConnecting: false, lastConnected: new Date() };
      } else {
        this.connectionStatus = { isConnected: false, isConnecting: false, error: `Connection failed: ${response.statusText} (Status: ${response.status}) to ${healthCheckUrl}` };
      }
    } catch (error) {
      console.error("Error connecting to LLM service:", error);
      this.connectionStatus = { isConnected: false, isConnecting: false, error: "Connection error. Is the Python server running?" };
    }
    this.notifyStatusChange();
  }

  async reconnect() {
    if (this.connectionStatus.isConnecting) return;
    await this.attemptConnection();
  }

  getStatus(): LLMConnectionStatus {
    return { ...this.connectionStatus };
  }

  // sendMessage is now handled directly by calling askLlm from api.ts in the component
}

// Create singleton instance
const llmService = new LLMService();

// Connection Status Component
function ConnectionStatus({ status }: { status: LLMConnectionStatus }) {
  const getStatusDisplay = () => {
    if (status.isConnecting) {
      return {
        icon: <Wifi className="w-2 h-2 text-yellow-400 animate-pulse" />,
        text: "Connecting...",
        color: "text-yellow-400"
      };
    }
    
    if (status.isConnected) {
      return {
        icon: <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>,
        text: "Online",
        color: "text-green-400"
      };
    }
    
    return {
      icon: <WifiOff className="w-2 h-2 text-red-400" />,
      text: "Offline",
      color: "text-red-400"
    };
  };

  const statusDisplay = getStatusDisplay();

  return (
    <div className="flex items-center space-x-2">
      {statusDisplay.icon}
      <span className={`text-xs ${statusDisplay.color}`}>
        {statusDisplay.text}
      </span>
      {status.error && (
        <button
          onClick={() => llmService.reconnect()}
          className="text-xs text-gray-500 hover:text-gray-300 underline ml-2"
        >
          Retry
        </button>
      )}
    </div>
  );
}

// Message Component
function MessageBubble({ message }: { message: Message }) {
  const formatMessageContent = (content: string) => {
    let htmlContent = content;
    htmlContent = htmlContent.replace(/^### (.*$)/gim, "<h3>$1</h3>");
    htmlContent = htmlContent.replace(/^## (.*$)/gim, "<h2>$1</h2>");
    htmlContent = htmlContent.replace(/^# (.*$)/gim, "<h1>$1</h1>");
    htmlContent = htmlContent.replace(/\*\*([^\*\*]+)\*\*/g, "<strong>$1</strong>");
    htmlContent = htmlContent.replace(/__([^__]+)__/g, "<strong>$1</strong>");
    return htmlContent;
  };

  return (
    <div
      className={cn(
        "flex",
        message.type === "user" ? "justify-end" : "justify-start"
      )}
    >
      <div className={cn(
        "max-w-[85%] relative",
        message.type === "user" 
          ? "p-3 rounded-2xl bg-gray-700 text-gray-100 rounded-br-md" 
          : "text-gray-200"
      )}>
        {message.type === "ai" ? (
          <div 
            className="text-base md:text-lg leading-relaxed whitespace-pre-wrap font-geist-sans"
            dangerouslySetInnerHTML={{ __html: formatMessageContent(message.content) }}
          />
        ) : (
          <p className="text-base md:text-lg leading-relaxed whitespace-pre-wrap font-geist-sans">{message.content}</p>
        )}
        {message.status === "sending" && (
          <div className="text-xs text-gray-500 mt-1">Sending...</div>
        )}
        {message.status === "error" && (
          <div className="text-xs text-red-400 mt-1">Failed to send</div>
        )}
      </div>
    </div>
  );
}

// Main Assistant Page Component
export default function AssistantPage() {
  const [messages, setMessages] = useState<Message[]>(() => []);
  const [inputMessage, setInputMessage] = useState("");
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<LLMConnectionStatus>(llmService.getStatus());

  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    const unsubscribe = llmService.onStatusChange(setConnectionStatus);
    if (!connectionStatus.isConnected && !connectionStatus.isConnecting) {
      llmService.reconnect(); 
    }
    return unsubscribe;
  }, [connectionStatus.isConnected, connectionStatus.isConnecting]);

  const handleNewChat = () => {
    setMessages([]);
    setInputMessage("");
    setCurrentSessionId(null);
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !connectionStatus.isConnected) {
      if (!connectionStatus.isConnected) {
        console.warn("Cannot send message: LLM service not connected.");
      }
      return;
    }
    
    const userMessageContent = inputMessage;
    const userMessage: Message = { 
      id: Date.now(), 
      type: "user", 
      content: userMessageContent,
      timestamp: new Date(),
      sessionId: currentSessionId || undefined,
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputMessage("");

    const aiMessageId = Date.now() + 1;
    const aiMessagePlaceholder: Message = {
      id: aiMessageId,
      type: "ai",
      content: "",
      timestamp: new Date(),
      status: "sending",
      sessionId: currentSessionId || undefined,
    };
    
    setMessages(prev => [...prev, aiMessagePlaceholder]);

    try {
      const payload: AskQuery = {
        query: userMessageContent,
        session_id: currentSessionId,
      };
      const response: AskResponse = await askLlm(payload);
      
      setMessages(prev => prev.map(msg => 
        msg.id === aiMessageId 
          ? { ...msg, content: response.response, status: "sent", sessionId: response.session_id }
          : msg
      ));

      if (response.session_id) {
        setCurrentSessionId(response.session_id);
      }

    } catch (error) {
      console.error("Error sending message or getting LLM response:", error);
      setMessages(prev => prev.map(msg => 
        msg.id === aiMessageId 
          ? { 
              ...msg, 
              content: error instanceof Error ? error.message : "Sorry, I encountered an error. Please try again.", 
              status: "error" 
            }
          : msg
      ));
    }
  };

  return (
    <PageWrapper className="flex flex-col h-full overflow-hidden p-0 md:p-4 relative">
      {/* New Chat Button - Positioned at the very top */}
      <div className="max-w-3xl w-full mx-auto relative">
        <button
          onClick={handleNewChat}
          className="fixed top-5.5 right-5 md:top-5 md:right-117 z-30 bg-gray-800/50 hover:bg-gray-700/90 text-gray-200 p-2 rounded-full shadow-lg transition-colors backdrop-blur-sm"
        >
          <PlusCircle className="w-5 h-5" />
        </button>
      </div>

      {/* Main centered content column that grows */}
      <div className={cn(
        "max-w-3xl w-full mx-auto flex flex-col flex-1 min-h-0 pt-12 md:pt-10",
        messages.length > 0 ? "pb-[200px] md:pb-[220px]" : "pb-[120px] md:pb-10"
      )}>
        
        {messages.length <= 0 ? (
          // Welcome Message
          <div className="flex-grow flex flex-col items-center justify-center text-center p-4 select-none">
            <div className="inline-flex items-center justify-center mb-4 md:mb-9 -ml-9 md:ml-0 mt-[-4rem] md:mt-0">
              <Image 
                src="/glitch-logo.png"
                alt="Lira Logo"
                width={100}
                height={100}
                className="mr-0"
              />
              <h1 className="text-5xl md:text-6xl text-gray-200 font-michroma">
                Lira
              </h1>
            </div>
            <p className="text-lg md:text-2xl text-gray-400 mb-6 md:mb-10 font-audiowide">
              Ready to explore your network and automate half your life?<br />Let me handle your errand management and make your life easier. Ask me anything.
            </p>
            
            {/* Live Connection Status Dashboard */}
            <div className="w-full max-w-2xl mx-auto bg-black/50 rounded-2xl p-4 backdrop-blur-xl border border-gray-800/50">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-gray-300 text-sm font-medium">Live Connections</h3>
                <div className="flex items-center space-x-2">
                  <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                  </span>
                  <span className="text-xs text-gray-400">Live</span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {/* Communication Apps */}
                <div className="space-y-2">
                  <h4 className="text-xs text-gray-500 uppercase tracking-wider mb-2">Communication</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between bg-gray-900/50 p-2 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <div className="w-6 h-6 flex items-center justify-center rounded bg-blue-500/10">
                          <Image src="/whatsapp.png" width={14} height={14} alt="WhatsApp" className="opacity-90" />
                        </div>
                        <span className="text-sm text-gray-300">WhatsApp</span>
                      </div>
                      <span className="flex h-2 w-2 relative">
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                      </span>
                    </div>
                    <div className="flex items-center justify-between bg-gray-900/50 p-2 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <div className="w-6 h-6 flex items-center justify-center rounded bg-red-500/10">
                          <Image src="/gmail.png" width={14} height={14} alt="Gmail" className="opacity-90" />
                        </div>
                        <span className="text-sm text-gray-300">Gmail</span>
                      </div>
                      <span className="flex h-2 w-2 relative">
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                      </span>
                    </div>
                    <div className="flex items-center justify-between bg-gray-900/50 p-2 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <div className="w-6 h-6 flex items-center justify-center rounded bg-blue-500/10">
                          <Image src="/messenger.png" width={14} height={14} alt="Messenger" className="opacity-90" />
                        </div>
                        <span className="text-sm text-gray-300">Messenger</span>
                      </div>
                      <span className="flex h-2 w-2 relative">
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Social Media */}
                <div className="space-y-2">
                  <h4 className="text-xs text-gray-500 uppercase tracking-wider mb-2">Social</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between bg-gray-900/50 p-2 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <div className="w-6 h-6 flex items-center justify-center rounded bg-blue-500/10">
                          <Image src="/instagram.png" width={14} height={14} alt="Instagram" className="opacity-90" />
                        </div>
                        <span className="text-sm text-gray-300">Instagram</span>
                      </div>
                      <span className="flex h-2 w-2 relative">
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                      </span>
                    </div>
                    <div className="flex items-center justify-between bg-gray-900/50 p-2 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <div className="w-6 h-6 flex items-center justify-center rounded bg-blue-500/10">
                          <Image src="/x.png" width={12} height={12} alt="X" className="opacity-90" />
                        </div>
                        <span className="text-sm text-gray-300">X</span>
                      </div>
                      <span className="flex h-2 w-2 relative">
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                      </span>
                    </div>
                    <div className="flex items-center justify-between bg-gray-900/50 p-2 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <div className="w-6 h-6 flex items-center justify-center rounded bg-blue-500/10">
                          <Image src="/linkedin.png" width={14} height={14} alt="LinkedIn" className="opacity-90" />
                        </div>
                        <span className="text-sm text-gray-300">LinkedIn</span>
                      </div>
                      <span className="flex h-2 w-2 relative">
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Productivity */}
                <div className="space-y-2">
                  <h4 className="text-xs text-gray-500 uppercase tracking-wider mb-2">Productivity</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between bg-gray-900/50 p-2 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <div className="w-6 h-6 flex items-center justify-center rounded bg-blue-500/10">
                          <Image src="/calender.png" width={14} height={14} alt="Calendar" className="opacity-90" />
                        </div>
                        <span className="text-sm text-gray-300">Calendar</span>
                      </div>
                      <span className="flex h-2 w-2 relative">
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                      </span>
                    </div>
                    <div className="flex items-center justify-between bg-gray-900/50 p-2 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <div className="w-6 h-6 flex items-center justify-center rounded bg-blue-500/10">
                          <Image src="/google-drive.png" width={14} height={14} alt="Google Drive" className="opacity-90" />
                        </div>
                        <span className="text-sm text-gray-300">Google Drive</span>
                      </div>
                      <span className="flex h-2 w-2 relative">
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                      </span>
                    </div>
                    <div className="flex items-center justify-between bg-gray-900/50 p-2 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <div className="w-6 h-6 flex items-center justify-center rounded bg-purple-500/10">
                          <Image src="/obsidian.png" width={14} height={14} alt="Obsidian" className="opacity-90" />
                        </div>
                        <span className="text-sm text-gray-300">Obsidian</span>
                      </div>
                      <span className="flex h-2 w-2 relative">
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Connection Stats */}
              <div className="mt-4 pt-3 border-t border-gray-800/30 grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-medium text-gray-200">0/6</div>
                  <div className="text-xs text-gray-500">Connected</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-medium text-gray-200">N/A</div>
                  <div className="text-xs text-gray-500">Latency</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-medium text-gray-200">N/A</div>
                  <div className="text-xs text-gray-500">Uptime</div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          // Chat Messages Area
          <div className="flex-1 overflow-hidden min-h-0">
            <div 
              ref={chatContainerRef}
              className="h-full space-y-4 overflow-y-auto p-4"
            >
              {messages.map((message) => (
                <MessageBubble key={message.id} message={message} />
              ))}
            </div>
          </div>
        )}
      </div>

      <ChatInputBar 
        inputMessage={inputMessage}
        setInputMessage={setInputMessage}
        handleSendMessage={handleSendMessage}
        isConnecting={connectionStatus.isConnecting}
        isConnected={connectionStatus.isConnected}
        connectionStatus={connectionStatus}
        isChatActive={messages.length > 0}
      />
    </PageWrapper>
  );
}

// ChatInputBar Component
interface ChatInputBarProps {
  inputMessage: string;
  setInputMessage: (value: string) => void;
  handleSendMessage: () => void;
  isConnecting: boolean;
  isConnected: boolean;
  connectionStatus: LLMConnectionStatus;
  isChatActive: boolean;
}

function ChatInputBar({ 
  inputMessage, 
  setInputMessage, 
  handleSendMessage,
  isConnecting,
  isConnected,
  connectionStatus,
  isChatActive
}: ChatInputBarProps) {
  const [showResearchButton, setShowResearchButton] = useState(false);
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [isResearchActive, setIsResearchActive] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const checkScreenSize = () => {
      setShowResearchButton(window.innerWidth >= 768);
    };
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);

    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"; 
      const scrollHeight = textareaRef.current.scrollHeight;
      const lineHeight = parseInt(getComputedStyle(textareaRef.current).lineHeight) || 20; 
      const maxHeight = lineHeight * 3; 
      textareaRef.current.style.height = `${Math.min(scrollHeight, maxHeight)}px`;
    }

    return () => window.removeEventListener('resize', checkScreenSize);
  }, [inputMessage]); 
  
  const onTextareaKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const outerWrapperClasses = isChatActive
    ? "fixed bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black to-transparent pb-safe z-50"
    : "fixed bottom-0 left-0 right-0 bg-transparent md:relative md:mt-auto p-2 md:py-2 md:pb-4 z-10";

  const innerMaxWidthContainerClasses = isChatActive
    ? "max-w-3xl mx-auto px-4"
    : "max-w-3xl mx-auto";

  return (
    <div className={outerWrapperClasses}>
      <div className={innerMaxWidthContainerClasses}>
        <div className={cn(
          "p-0.5 bg-gradient-to-r from-blue-500/30 via-pink-500/30 to-yellow-400/30 rounded-2xl shadow-lg",
          isChatActive && "animate-gradient-spin animate-gradient-pulse"
        )}>
          <div className={cn(
            "bg-black rounded-2xl p-3 md:p-4 shadow-2xl flex flex-col space-y-2 md:space-y-3 backdrop-blur-xl",
            isChatActive && "backdrop-blur-2xl"
          )}>
            <textarea
              ref={textareaRef} 
              rows={1} 
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={onTextareaKeyPress} 
              placeholder={isConnected ? "Ask anything..." : "Ask anything... (offline mode)"}
              className="w-full bg-transparent text-gray-100 placeholder-gray-500 focus:outline-none text-sm md:text-base resize-none overflow-y-auto min-h-[24px] md:min-h-[28px] py-1.5 px-1"
              disabled={isConnecting || !isConnected}
            />

            <div className="flex items-center justify-between space-x-2 pt-1 md:pt-2 border-t border-gray-800/30">
              <div className="flex items-center space-x-2">
                <button 
                  onClick={() => setIsSearchActive(!isSearchActive)}
                  className={cn(
                    "p-2 px-3 rounded-lg text-sm flex items-center space-x-1.5 transition-colors",
                    isSearchActive 
                      ? "bg-white/90 text-black"
                      : "bg-gray-900/90 text-white hover:bg-white/90 hover:text-black"
                  )}
                >
                  <Search className="w-4 h-4 transition-colors" />
                  <span>Search</span>
                </button>
                {showResearchButton && (
                  <button 
                    onClick={() => setIsResearchActive(!isResearchActive)}
                    className={cn(
                      "hidden md:flex p-2 px-3 rounded-lg text-sm items-center space-x-1.5 transition-colors",
                      isResearchActive 
                        ? "bg-white/90 text-black"
                        : "bg-gray-900/90 text-white hover:bg-white/90 hover:text-black"
                    )}
                  >
                    <SlidersHorizontal className="w-4 h-4 transition-colors" />
                    <span>Research</span>
                  </button>
                )}
              </div>

              <div className="flex items-center space-x-1.5">
                <button className="p-1.5 text-gray-400 hover:text-gray-200 rounded-full hover:bg-gray-700/70 transition-colors">
                  <SquareStack className="w-4 h-4" />
                </button>
                <button className="p-1.5 text-gray-400 hover:text-gray-200 rounded-full hover:bg-gray-700/70 transition-colors">
                  <Globe className="w-4 h-4" />
                </button>
                <button className="p-1.5 text-gray-400 hover:text-gray-200 rounded-full hover:bg-gray-700/70 transition-colors">
                  <Paperclip className="w-4 h-4" />
                </button>
                <button className="p-1.5 text-gray-400 hover:text-gray-200 rounded-full hover:bg-gray-700/70 transition-colors hidden md:inline-flex">
                  <Mic className="w-4 h-4" />
                </button>
                <button
                  onClick={handleSendMessage}
                  disabled={isConnecting || !isConnected || !inputMessage.trim()}
                  className={cn(
                    "p-2 rounded-lg transition-colors flex items-center justify-center aspect-square",
                    isConnecting || !isConnected || !inputMessage.trim()
                      ? "bg-gray-700 text-gray-500 cursor-not-allowed"
                      : "bg-white/90 hover:bg-white/75"
                  )}
                >
                  <AudioWaveform className="w-4 h-4 text-black" />
                </button>
              </div>
            </div>
          </div>
        </div>
        <div className="text-center pt-1.5 pb-2 md:hidden">
          <ConnectionStatus status={connectionStatus} />
        </div>
      </div>
    </div>
  );
} 