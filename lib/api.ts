// src/lib/api.ts

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';

export interface ChatMessage {
  type: 'human' | 'ai';
  content: string;
}

export interface SessionListItem {
  id: string;
  title: string;
}

export interface SessionDetail extends SessionListItem {
  messages: ChatMessage[];
}

export async function getChatSessions(): Promise<SessionListItem[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/chat_sessions`);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: 'Failed to fetch chat sessions' }));
      throw new Error(errorData.detail || 'Failed to fetch chat sessions');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching chat sessions:', error);
    // In a real app, you might want to throw a custom error or return a specific error structure
    throw error; 
  }
}

export async function getChatSessionDetails(sessionId: string): Promise<SessionDetail> {
  try {
    const response = await fetch(`${API_BASE_URL}/chat_sessions/${sessionId}`);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: `Failed to fetch session ${sessionId}` }));
      throw new Error(errorData.detail || `Failed to fetch session ${sessionId}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Error fetching session details for ${sessionId}:`, error);
    throw error;
  }
}

// You would also add your /api/ask endpoint call here
export interface AskQuery {
  query: string;
  session_id?: string | null;
}

export interface AskResponse {
  response: string;
  session_id: string;
  new_session_created: boolean;
}

export async function askLlm(payload: AskQuery): Promise<AskResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/ask`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: 'Failed to get LLM response' }));
      throw new Error(errorData.detail || 'Failed to get LLM response');
    }
    return await response.json();
  } catch (error) {
    console.error('Error asking LLM:', error);
    throw error;
  }
} 