from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from langchain_openai import ChatOpenAI
from langchain.prompts import PromptTemplate
from langchain.chains import LLMChain
from dotenv import load_dotenv
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

# Pydantic models for request/response validation
class Query(BaseModel):
    query: str

class Response(BaseModel):
    response: str

class ErrorResponse(BaseModel):
    error: str

# Initialize LLM and chain at startup
llm: ChatOpenAI = None
llm_chain: LLMChain = None

# Elaboration template
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
    # Startup: Initialize LLM and chain
    try:
        global llm, llm_chain
        model_name = "gpt-4.1-nano-2025-04-14"
        logger.info(f"Attempting to initialize LLM with model: {model_name}")
        llm = ChatOpenAI(
            model_name=model_name,
            temperature=0.7,
            request_timeout=30,
        )
        elaboration_prompt = PromptTemplate(
            input_variables=["user_question"],
            template=ELABORATION_TEMPLATE
        )
        llm_chain = LLMChain(llm=llm, prompt=elaboration_prompt)
        logger.info("Successfully initialized LLM and chain")
    except Exception as e:
        logger.error(f"Failed to initialize LLM: {str(e)}")
        raise RuntimeError(f"Failed to initialize LLM: {str(e)}")
    
    yield
    
    # Cleanup (if needed)
    logger.info("Shutting down application")

# Initialize FastAPI with lifespan
app = FastAPI(
    title="Lira AI API",
    description="AI Assistant API powered by LangChain and OpenAI",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",  # For local development
        "https://lira-orcin.vercel.app"  # Vercel deployment
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api")
async def health_check():
    """Health check endpoint"""
    if not llm or not llm_chain:
        raise HTTPException(
            status_code=503,
            detail="Service unavailable: LLM not initialized"
        )
    return {"status": "healthy", "message": "Lira AI API is running"}

@app.post("/api/ask")
async def ask_llm(query: Query):
    """
    Process a user query and return AI response
    """
    try:
        if not llm or not llm_chain:
            raise HTTPException(
                status_code=503,
                detail="Service unavailable: LLM not initialized"
            )

        # Get response from LLM chain
        response_dict = llm_chain.invoke({"user_question": query.query})
        ai_response = response_dict[llm_chain.output_key]

        return Response(response=ai_response)

    except Exception as e:
        logger.error(f"Error processing query: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error processing your request: {str(e)}"
        ) 