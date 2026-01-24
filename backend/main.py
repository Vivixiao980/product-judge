from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import os
from dotenv import load_dotenv
from db import retrieve_knowledge

load_dotenv()

app = FastAPI(title="ProductThink API", description="Backend for the ProductThink AI Advisor")

# CORS setup
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://frontend-silk-delta-34.vercel.app",
    "https://*.vercel.app",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class PitchInput(BaseModel):
    pitch_text: str
    pitch_type: str  # "pitch", "answer"
    # Optional history for conversation
    conversation_history: List[str] = []
    skipped_questions: bool = False

class KnowledgeQuery(BaseModel):
    query: str
    k: int = 5

class KnowledgeResponse(BaseModel):
    context: str
    sources: List[str]

class FeedbackResponse(BaseModel):
    verdict: str  # "BLOCKED", "APPROVED", "WARNING", "INQUIRY"
    score: int
    summary: str
    
    questions: Optional[List[str]] = None # For Inquiry Mode
    
    # Detailed feedback from 6 roles
    pm_feedback: Optional[dict] = None
    strategy_feedback: Optional[dict] = None
    growth_feedback: Optional[dict] = None
    tech_feedback: Optional[dict] = None
    user_feedback: Optional[dict] = None
    investor_feedback: Optional[dict] = None
    
    similar_cases: Optional[List[str]] = None

@app.get("/")
async def root():
    return {"message": "Product Spar API is running."}

@app.post("/api/knowledge", response_model=KnowledgeResponse)
async def get_knowledge(query: KnowledgeQuery):
    """Retrieves relevant knowledge from the vector database."""
    try:
        docs = retrieve_knowledge(query.query, k=query.k)
        if docs:
            context = "\n\n---\n\n".join(docs)
            return KnowledgeResponse(context=context, sources=docs)
        return KnowledgeResponse(context="", sources=[])
    except Exception as e:
        print(f"Knowledge retrieval error: {e}")
        return KnowledgeResponse(context="", sources=[])

@app.post("/api/judge", response_model=FeedbackResponse)
async def judge_pitch(input: PitchInput):
    try:
        from agent import app as agent_app
        
        # Invoke agent
        initial_state = {
            "pitch": input.pitch_text,
            "pitch_type": input.pitch_type,
            "conversation_history": input.conversation_history,
            "skipped_questions": input.skipped_questions,
            "questions": [],
            "verdict": "",
            "final_score": 0,
            "summary": "",
            "pm_feedback": {},
            "strategy_feedback": {},
            "growth_feedback": {},
            "tech_feedback": {},
            "user_feedback": {},
            "investor_feedback": {},
            "similar_cases": []
        }
        # Run Agent
        final_state = agent_app.invoke(initial_state)
        
        return FeedbackResponse(
            verdict=final_state.get("verdict", "WARNING"),
            score=final_state.get("final_score", 0),
            summary=final_state.get("summary", "Analysis complete."),
            questions=final_state.get("questions", []), # Inquiry questions
            pm_feedback=final_state.get("pm_feedback"),
            strategy_feedback=final_state.get("strategy_feedback"),
            growth_feedback=final_state.get("growth_feedback"),
            tech_feedback=final_state.get("tech_feedback"),
            user_feedback=final_state.get("user_feedback"),
            investor_feedback=final_state.get("investor_feedback"),
            similar_cases=final_state.get("similar_cases", [])
        )
    except Exception as e:
        print(f"Agent Error: {e}")
        return FeedbackResponse(
            verdict="BLOCKED",
            score=0,
            summary=f"System Error: {str(e)}. Please check backend logs.",
            pm_feedback=None,
            strategy_feedback=None,
            growth_feedback=None,
            tech_feedback=None,
            user_feedback=None,
            investor_feedback=None,
            similar_cases=[]
        )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
