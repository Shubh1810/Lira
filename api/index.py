import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from langchain_openai import ChatOpenAI
from langchain.prompts import PromptTemplate
from langchain.chains import LLMChain
from dotenv import load_dotenv
from typing import Optional
import logging
from contextlib import asynccontextmanager

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Load environment variables (will also be picked up by Vercel's env vars)
load_dotenv()

# Pydantic models for request/response validation
class Query(BaseModel):
    query: str

class Response(BaseModel):
    response: str

# Initialize LLM and chain (will be done during serverless function cold start)
llm: Optional[ChatOpenAI] = None
llm_chain: Optional[LLMChain] = None

# Elaboration template (ensure this is defined before lifespan)
ELABORATION_TEMPLATE = """You are Lira, a highly capable and meticulous AI agentic assistant.
A user has asked the following question:
"{user_question}"

Your task is to provide a comprehensive, well-structured, and insightful answer.
Please consider the following:

1. **Contextual Awareness:** If the question does not imply a need for broader context, try best to stay concise for every answer saving on tokens generated.
2. **Step-by-Step Thinking (Implicit):** Before generating the final response, internally "think" about the best way to address all facets of the user's query.

Please generate your response now:"""

@asynccontextmanager
async def lifespan(app: FastAPI):
    global llm, llm_chain
    logger.info("Lifespan startup: Initializing LLM and chain...")
    try:
        llm = ChatOpenAI(
            model_name=os.getenv("OPENAI_MODEL_NAME", "gpt-4.1-nano-2025-04-14"), # Use env var for model
            temperature=float(os.getenv("OPENAI_TEMPERATURE", 0.7)), # Use env var
            request_timeout=int(os.getenv("OPENAI_REQUEST_TIMEOUT", 30)), # Use env var
            openai_api_key=os.getenv("OPENAI_API_KEY") # Explicitly pass key
        )
        elaboration_prompt = PromptTemplate(
            input_variables=["user_question"],
            template=ELABORATION_TEMPLATE
        )
        llm_chain = LLMChain(llm=llm, prompt=elaboration_prompt)
        logger.info("Successfully initialized LLM and chain")
    except Exception as e:
        logger.error(f"Failed to initialize LLM during startup: {str(e)}")
        # Depending on policy, you might want the app to fail startup or continue with llm=None
        # For now, we'll let it proceed, and routes will check if llm is None.
        llm = None 
        llm_chain = None
    
    yield
    
    logger.info("Lifespan shutdown: Cleaning up (if needed).")


# Initialize FastAPI app instance - Vercel will look for this 'app' object.
app = FastAPI(
    title="Lira AI API (Vercel)",
    description="AI Assistant API powered by LangChain and OpenAI, deployed on Vercel.",
    version="1.0.1",
    lifespan=lifespan # Manage LLM initialization with lifespan
)

# Configure CORS - Vercel handles routing, but FastAPI still processes CORS headers
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",      # For local Next.js development
        "https://lira-orcin.vercel.app" # Your Vercel deployment
        # Add other origins if needed, like staging environments
    ],
    allow_credentials=True,
    allow_methods=["*"], # Allows all methods
    allow_headers=["*"], # Allows all headers
)

@app.get("/") # Corresponds to /api/
async def health_check_root():
    """Health check for the root of the API."""
    if not llm_chain:
        raise HTTPException(status_code=503, detail="Service Temporarily Unavailable: LLM not fully initialized.")
    return {"status": "healthy", "message": "Lira AI API (Vercel) is running"}


@app.post("/ask", response_model=Response) # Corresponds to /api/ask
async def ask_llm_route(query: Query):
    """
    Process a user query and return AI response
    """
    if not llm_chain: # Check if LLM chain was initialized
        logger.error("Attempted to use /ask endpoint but LLM chain is not initialized.")
        raise HTTPException(status_code=503, detail="Service Temporarily Unavailable: LLM not initialized.")

    try:
        logger.info(f"Received query for /ask: {query.query[:50]}...") # Log partial query
        response_dict = await llm_chain.ainvoke({"user_question": query.query}) # Use ainvoke for async
        ai_response = response_dict[llm_chain.output_key]
        logger.info(f"Successfully processed query, response length: {len(ai_response)}")
        return Response(response=ai_response)

    except Exception as e:
        logger.error(f"Error processing query in /ask: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Error processing your request: {str(e)}"
        )

# Note: The `if __name__ == "__main__":` block for uvicorn is NOT included here.
# Vercel handles the serving of the 'app' object. 