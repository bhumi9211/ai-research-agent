import os
from dotenv import load_dotenv

load_dotenv()
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from pipeline import run_research_pipeline, revise_research_report

# IMPORT your existing pipeline file
from pipeline import run_research_pipeline

app = FastAPI(title="AI Research Agent API")


# Allow React frontend to connect
app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.getenv("FRONTEND_URL")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Request body schema
class ResearchRequest(BaseModel):
    topic: str

class ReviseRequest(BaseModel):
    topic: str
    report: str
    feedback: str


# Home route
@app.get("/")
def home():
    return {
        "message": "AI Research Agent API is running"
    }


# Research API
@app.post("/research")
def research(request: ResearchRequest):

    topic = request.topic.strip()

    if not topic:
        raise HTTPException(
            status_code=400,
            detail="Please enter a research topic."
        )

    try:
        # Call your existing Search -> Reader -> Writer -> Critic pipeline
        result = run_research_pipeline(topic)

        return {
            "topic": topic,
            "search_results": result["search_results"],
            "scraped_content": result["scraped_content"],
            "report": result["report"],
            "feedback": result["feedback"],
        
        }

    except Exception as e:
        print("Research pipeline error:", repr(e))

        raise HTTPException(
            status_code=500,
            detail="Research failed. Check the backend terminal for details."
        )



@app.post("/revise")
def revise(request: ReviseRequest):
    try:
        result = revise_research_report(
            topic=request.topic,
            report=request.report,
            feedback=request.feedback
        )
        return result

    except Exception as e:
        print("Revision error:", repr(e))
        raise HTTPException(
            status_code=500,
            detail="Report revision failed. Check backend terminal."
        )
