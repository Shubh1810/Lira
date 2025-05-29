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

// Types for better type safety
interface Message {
  id: number;
  type: "user" | "ai";
  content: string;
  timestamp: Date;
  status?: "sending" | "sent" | "error";
}

interface LLMConnectionStatus {
  isConnected: boolean;
  isConnecting: boolean;
  lastConnected?: Date;
  error?: string;
}

// LLM Service class for future API integration
class LLMService {
  private connectionStatus: LLMConnectionStatus = {
    isConnected: false,
    isConnecting: false,
  };

  private readonly baseUrl: string;
  private readonly apiPath = "/api"; // Assuming your main.py routes are under /api

  private statusCallbacks: ((status: LLMConnectionStatus) => void)[] = [];

  constructor() {
    if (typeof window !== 'undefined') {
      if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
        // Local development: point to the FastAPI server (main.py on port 5001)
        this.baseUrl = "http://localhost:5001";
      } else {
        // Deployed environment (Vercel or other): use the current origin
        // This assumes the /api path will be correctly proxied or handled by Vercel
        this.baseUrl = window.location.origin;
      }
    } else {
      // Fallback for SSR or other non-browser environments (should not make calls from here)
      this.baseUrl = ''; // Or handle error, or provide a server-side default if applicable
    }
    // Do not attempt connection from constructor; let useEffect in component handle it
  }

  // Subscribe to connection status changes
  onStatusChange(callback: (status: LLMConnectionStatus) => void) {
    this.statusCallbacks.push(callback);
    callback(this.connectionStatus); // Immediately call with current status
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
      // Assuming your main.py has a health check at its root / or /api
      // For main.py directly, it might be `${this.baseUrl}/` if no /api prefix is in main.py for health
      // If main.py also serves under /api, then `${this.baseUrl}${this.apiPath}` is correct.
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

  async sendMessage(message: string): Promise<string> {
    if (!this.baseUrl) {
      throw new Error("API base URL not configured. Cannot send message.");
    }
    if (!this.connectionStatus.isConnected) {
      await this.reconnect();
      if (!this.connectionStatus.isConnected) {
        throw new Error("LLM service not connected. Please check the Python server.");
      }
    }
    
    try {
      const messageUrl = `${this.baseUrl}${this.apiPath}/ask`;
      const response = await fetch(messageUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: message }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: "Unknown error from backend" }));
        throw new Error(`Backend error: ${errorData.detail || response.statusText} (Status: ${response.status}) from ${messageUrl}`);
      }

      const responseData = await response.json();
      return responseData?.response || Promise.reject("Invalid response format from backend.");
    } catch (error) {
      console.error("Error sending message to LLM backend:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error.";
      throw new Error(`Failed to send message: ${errorMessage}`);
    }
  }
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
  // Simple function to convert markdown bold to HTML strong tags
  const formatMessageContent = (content: string) => {
    let htmlContent = content;

    // Headings: #, ##, ###
    // Important: Process from ### down to # to avoid conflicts (e.g., ## matching ### first)
    htmlContent = htmlContent.replace(/^### (.*$)/gim, "<h3>$1</h3>");
    htmlContent = htmlContent.replace(/^## (.*$)/gim, "<h2>$1</h2>");
    htmlContent = htmlContent.replace(/^# (.*$)/gim, "<h1>$1</h1>");

    // Bold: **text** or __text__
    htmlContent = htmlContent.replace(/\*\*([^\*\*]+)\*\*/g, "<strong>$1</strong>");
    htmlContent = htmlContent.replace(/__([^__]+)__/g, "<strong>$1</strong>");
    
    // Italic: *text* or _text_
    // htmlContent = htmlContent.replace(/\*([^\*]+)\*/g, "<em>$1</em>");
    // htmlContent = htmlContent.replace(/_([^_]+)_/g, "<em>$1</em>");

    // TODO: Add more markdown conversions as needed (e.g., lists, links, code blocks)

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
        "max-w-[85%] p-3 rounded-2xl relative",
        message.type === "user" 
          ? "bg-gray-700 text-gray-100 rounded-br-md" 
          : "bg-gray-900/50 border border-gray-800 text-gray-200 rounded-bl-md"
      )}>
        {message.type === "ai" ? (
          <div 
            className="text-sm leading-relaxed whitespace-pre-wrap"
            dangerouslySetInnerHTML={{ __html: formatMessageContent(message.content) }}
          />
        ) : (
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
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
  const [connectionStatus, setConnectionStatus] = useState<LLMConnectionStatus>({
    isConnected: false,
    isConnecting: false,
  });

  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Scroll to bottom of chat on new message
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  // Subscribe to LLM connection status and attempt initial connection
  useEffect(() => {
    const unsubscribe = llmService.onStatusChange(setConnectionStatus);
    // Attempt to connect when component mounts on client-side
    llmService.reconnect(); 
    return unsubscribe;
  }, []);

  const handleNewChat = () => {
    setMessages([]);
    setInputMessage("");
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;
    
    const userMessage: Message = { 
      id: Date.now(), 
      type: "user", 
      content: inputMessage,
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputMessage("");

    // Create AI response message with sending status
    const aiMessageId = Date.now() + 1;
    const aiMessage: Message = {
      id: aiMessageId,
      type: "ai",
      content: "",
      timestamp: new Date(),
      status: "sending",
    };
    
    setMessages(prev => [...prev, aiMessage]);

    try {
      const responseContent = await llmService.sendMessage(inputMessage);
      
      // Update the AI message with the response
      setMessages(prev => prev.map(msg => 
        msg.id === aiMessageId 
          ? { ...msg, content: responseContent, status: "sent" }
          : msg
      ));

    } catch (error) {
      console.error("Error sending message or getting LLM response:", error); // Log the error
      // Handle error
      setMessages(prev => prev.map(msg => 
        msg.id === aiMessageId 
          ? { 
              ...msg, 
              content: "Sorry, I encountered an error. Please try again.", 
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
          className="fixed top-5.5 right-5 md:top-5 md:right-114 z-30 bg-gray-800/50 hover:bg-gray-700/90 text-gray-200 p-2 rounded-full shadow-lg transition-colors backdrop-blur-sm"
        >
          <PlusCircle className="w-5 h-5" />
        </button>
      </div>

      {/* Main centered content column that grows */}
      <div className={cn(
        "max-w-3xl w-full mx-auto flex flex-col flex-1 min-h-0 pt-12 md:pt-10",
        messages.length > 0 ? "pb-[200px] md:pb-[220px]" : "pb-[120px] md:pb-10"
      )}>
        
        {/* Conditional rendering for welcome vs chat */}
        {messages.length <= 0 ? (
          // Welcome Message
          <div className="flex-grow flex flex-col items-center justify-center text-center p-4 select-none">
            <div className="inline-flex items-center justify-center mb-9 -ml-9 md:ml-0">
              <Image 
                src="/pagelogo.png"
                alt="Lira Logo"
                width={100}
                height={100}
                className="mr-0"
              />
              <h1 className="text-5xl md:text-6xl text-gray-200 font-michroma">
                Lira
              </h1>
            </div>
            <p className="text-lg md:text-2xl text-gray-400 mb-10">
              Want to find the top opportunities and best people to connect with? want to know what the whales are buying? Ask me anything.
            </p>
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
      </div> {/* End of Main centered content column */}

      {/* Chat Input Bar */}
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

// New ChatInputBar Component
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
        {/* Main container for the input bar */}
        <div className={cn(
          "bg-gray-900/90 border border-gray-700/80 rounded-2xl p-3 md:p-4 shadow-2xl flex flex-col space-y-2 md:space-y-3",
          isChatActive && "backdrop-blur-lg"
        )}>
          <textarea
            ref={textareaRef} 
            rows={1} 
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={onTextareaKeyPress} 
            placeholder={isConnected ? "Ask anything..." : "Ask anything... (offline mode)"}
            className="w-full bg-transparent text-gray-100 placeholder-gray-500 focus:outline-none text-sm md:text-base resize-none overflow-y-auto min-h-[24px] md:min-h-[28px] py-1.5 px-1"
            disabled={isConnecting}
          />

          {/* Bottom row: Action Buttons & Send */}
          <div className="flex items-center justify-between space-x-2 pt-1 md:pt-2 border-t border-gray-800/70">
            {/* Left Group: Search and Research buttons */}
            <div className="flex items-center space-x-2">
              <button 
                className="p-2 px-3 bg-teal-500/20 hover:bg-teal-500/30 rounded-lg text-teal-300 text-sm flex items-center space-x-1.5 transition-colors"
              >
                <Search className="w-4 h-4" />
                <span>Search</span>
              </button>
              {showResearchButton && (
                <button 
                  className="hidden md:flex p-2 px-3 bg-gray-800 hover:bg-gray-700/70 rounded-lg text-gray-300 text-sm items-center space-x-1.5 transition-colors"
                >
                  <SlidersHorizontal className="w-4 h-4 text-gray-400" />
                  <span>Research</span>
                </button>
              )}
            </div>

            {/* Right Group: Utility Icons and Send Button */}
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
              {/* Send Button */}
              <button
                onClick={handleSendMessage}
                disabled={isConnecting || !inputMessage.trim()}
                className={cn(
                  "p-2 rounded-lg transition-colors flex items-center justify-center aspect-square",
                  isConnecting || !inputMessage.trim()
                    ? "bg-gray-700 text-gray-500 cursor-not-allowed"
                    : "bg-teal-500 hover:bg-teal-600 text-white"
                )}
              >
                <AudioWaveform className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
        {/* Connection Status for Mobile */}
        <div className="text-center pt-1.5 pb-2 md:hidden">
          <ConnectionStatus status={connectionStatus} />
        </div>
      </div>
    </div>
  );
} 