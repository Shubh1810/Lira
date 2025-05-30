import os
import uuid # For generating unique session IDs
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field # Added Field
from langchain_openai import ChatOpenAI
from langchain.prompts import PromptTemplate, ChatPromptTemplate, MessagesPlaceholder # Added ChatPromptTemplate, MessagesPlaceholder
from langchain.chains import LLMChain
from langchain.memory import ConversationBufferMemory # Added ConversationBufferMemory
from langchain_core.messages import HumanMessage, AIMessage # Added HumanMessage, AIMessage
from dotenv import load_dotenv
from typing import Optional, List, Dict # Added List, Dict
import logging
from contextlib import asynccontextmanager

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

# --- Pydantic Models ---
class ChatMessage(BaseModel):
    type: str # "human" or "ai"
    content: str

class ChatSession(BaseModel):
    id: str
    title: str # User's first question
    messages: List[ChatMessage] = []

class AskQuery(BaseModel):
    query: str
    session_id: Optional[str] = None

class AskResponse(BaseModel):
    response: str
    session_id: str
    new_session_created: bool = False # To inform the client if a new session started

class SessionListItem(BaseModel):
    id: str
    title: str

class SessionDetail(BaseModel):
    id: str
    title: str
    messages: List[ChatMessage]

class ErrorResponse(BaseModel):
    error: str

# --- In-memory store for chat sessions ---
# In a production environment, replace this with a persistent store (e.g., database, vector store)
chat_sessions_store: Dict[str, ChatSession] = {}


# Initialize LLM at startup
llm_model: Optional[ChatOpenAI] = None # Renamed from llm to llm_model to avoid conflict with LLMChain's llm param

# Elaboration template - Modified to include chat history
CONVERSATIONAL_TEMPLATE_STRING = """You are Lira, a highly capable and meticulous AI agentic assistant.
Answer the user's question based on the following conversation history and the current question.
If the conversation is new or the history is not relevant, answer the current question directly.

Conversation History:
{chat_history}

User Question:
{user_question}

Your Answer:"""

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Initialize LLM
    try:
        global llm_model
        llm_model = ChatOpenAI(
            model_name="gpt-4.1-nano-2025-04-14", # Ensure this model supports chat history well
            temperature=0.7,
            request_timeout=30,
        )
        logger.info("Successfully initialized LLM model")
    except Exception as e:
        logger.error(f"Failed to initialize LLM model: {str(e)}")
        raise RuntimeError(f"Failed to initialize LLM model: {str(e)}")
    
    yield
    
    # Cleanup (if needed)
    logger.info("Shutting down application")

# Initialize FastAPI with lifespan
app = FastAPI(
    title="Lira AI API",
    description="AI Assistant API powered by LangChain and OpenAI with Chat History",
    version="1.1.0",
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000", 
        "https://lira-orcin.vercel.app"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api", summary="Health Check")
async def health_check():
    """Health check endpoint"""
    if not llm_model:
        raise HTTPException(
            status_code=503,
            detail="Service unavailable: LLM not initialized"
        )
    return {"status": "healthy", "message": "Lira AI API is running"}

@app.post("/api/ask", response_model=AskResponse, summary="Ask the LLM")
async def ask_llm(payload: AskQuery):
    """
    Process a user query, manage chat session, and return AI response.
    """
    try:
        if not llm_model:
            raise HTTPException(
                status_code=503,
                detail="Service unavailable: LLM not initialized"
            )

        session_id = payload.session_id
        user_query = payload.query
        new_session_created = False

        if session_id and session_id in chat_sessions_store:
            chat_session = chat_sessions_store[session_id]
            # Load existing messages into memory for the chain
            history_messages = [HumanMessage(content=msg.content) if msg.type == "human" else AIMessage(content=msg.content) for msg in chat_session.messages]
        else:
            session_id = str(uuid.uuid4())
            chat_session = ChatSession(id=session_id, title=user_query) # First query becomes the title
            chat_sessions_store[session_id] = chat_session
            history_messages = []
            new_session_created = True
            logger.info(f"New chat session created: {session_id} with title: '{user_query}'")
        
        # Add current user query to the session messages
        chat_session.messages.append(ChatMessage(type="human", content=user_query))

        # Setup memory for the current request
        memory = ConversationBufferMemory(memory_key="chat_history", return_messages=True)
        for msg in history_messages: # Load past messages if any
            if isinstance(msg, HumanMessage):
                memory.chat_memory.add_user_message(msg.content)
            elif isinstance(msg, AIMessage):
                memory.chat_memory.add_ai_message(msg.content)
        
        # Create prompt template that includes a placeholder for messages
        prompt = ChatPromptTemplate.from_messages([
            MessagesPlaceholder(variable_name="chat_history"),
            ("user", "{user_question}")
        ])
        
        # Update LLMChain to use the new prompt and memory
        # Note: The ELABORATION_TEMPLATE is not directly used here as ChatPromptTemplate is more suitable for conversational chains
        # You might want to adapt parts of ELABORATION_TEMPLATE into a system message within ChatPromptTemplate if needed.
        conversational_llm_chain = LLMChain(
            llm=llm_model,
            prompt=prompt,
            memory=memory,
            verbose=True # For debugging
        )

        # Get response from LLM chain
        response_dict = conversational_llm_chain.invoke({"user_question": user_query})
        ai_response_content = response_dict[conversational_llm_chain.output_key]

        # Add AI response to session messages
        chat_session.messages.append(ChatMessage(type="ai", content=ai_response_content))
        
        # TODO: Add chat_session.messages to a vector store here for long-term context management.
        # Example: vector_store.add_documents([Document(page_content=msg.content, metadata={"session_id": session_id, "type": msg.type}) for msg in chat_session.messages])
        # This would typically happen after each user/AI interaction or batched.

        return AskResponse(response=ai_response_content, session_id=session_id, new_session_created=new_session_created)

    except Exception as e:
        logger.error(f"Error processing query: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Error processing your request: {str(e)}"
        )

@app.get("/api/chat_sessions", response_model=List[SessionListItem], summary="List Chat Sessions")
async def list_chat_sessions():
    """
    Retrieve a list of all chat session IDs and their titles.
    """
    return [SessionListItem(id=session_id, title=session.title) for session_id, session in chat_sessions_store.items()]

@app.get("/api/chat_sessions/{session_id}", response_model=SessionDetail, summary="Get Chat Session Details")
async def get_chat_session_details(session_id: str):
    """
    Retrieve all messages for a specific chat session.
    """
    if session_id not in chat_sessions_store:
        raise HTTPException(status_code=404, detail="Chat session not found")
    session = chat_sessions_store[session_id]
    return SessionDetail(id=session.id, title=session.title, messages=session.messages)


# For local development (commented out for Vercel deployment)
# if __name__ == "__main__":
#     import uvicorn
#     port = int(os.environ.get("PORT", 5001))
#     uvicorn.run(
#         "main:app",  # This should be "index:app" if running this file directly locally
#         host="0.0.0.0",
#         port=port,
#         reload=True, 
#         log_level="info"
#     ) 