# AI Research Agent API

An AI-powered research system that automates web research and report generation using a multi-agent pipeline. The backend is built with FastAPI and exposes REST APIs that allow a React frontend to generate research reports and revise them based on feedback.

## Features

- **Automated Web Research:** Searches the web for relevant information.
- **Reader Agent:** Extracts useful content from web pages.
- **Writer Agent:** Generates a structured research report.
- **Critic Agent:** Reviews the generated report and provides feedback.
- **Report Revision:** Revises reports based on user-provided feedback.
- **REST API:** FastAPI endpoints for research and report revision.
- **CORS Support:** Allows communication between the React frontend and FastAPI backend.
- **Environment Variables:** Uses a `.env` file for local configuration.

## Architecture

```text
React Frontend
      |
      | HTTP Requests
      v
FastAPI Backend
      |
      +---- POST /research
      |          |
      |          v
      |     Search Agent
      |          |
      |          v
      |     Reader Agent
      |          |
      |          v
      |     Writer Agent
      |          |
      |          v
      |     Critic Agent
      |          |
      |          v
      |     Research Report
      |
      +---- POST /revise
                 |
                 v
          Report Revision
```

## Tech Stack

- Python
- FastAPI
- Uvicorn
- Pydantic
- React (frontend)
- LangChain and Groq/Gemini 
- Tavily and BeautifulSoup 

## Project Structure

```text
ai-research-agent/
│
├── main.py                 # FastAPI application
├── pipeline.py             # Research and revision pipeline
├── tools.py                # Web search and scraping tools
├── .env                    # Environment variables
├── .gitignore              # Git ignore rules
├── requirements.txt        # Python dependencies
└── README.md               # Project documentation
└── client                  # Project frontend
```


Create a `.env` file in the project root directory.

```env
# React frontend URL
FRONTEND_URL=http://localhost:5173

# FastAPI backend URL
BACKEND_URL=http://127.0.0.1:8000

# Add API keys required by your pipeline
GOOGLE_API_KEY=your_google_api_key
TAVILY_API_KEY=your_tavily_api_key
```



## Running the Backend

Start the FastAPI development server from the directory containing `main.py`:

```bash
uvicorn main:app --reload
```

The backend will be available at:

- **API Base URL:** http://127.0.0.1:8000
- **Interactive API Documentation:** http://127.0.0.1:8000/docs
- **Alternative API Documentation:** http://127.0.0.1:8000/redoc

## API Endpoints

### 1. Home

**Endpoint:** `GET /`

Checks whether the API is running.

Example response:

```json
{
  "message": "AI Research Agent API is running"
}
```

### 2. Generate Research Report

**Endpoint:** `POST /research`

Generates a research report for the specified topic.

Request body:

```json
{
  "topic": "Impact of Artificial Intelligence on Education"
}
```

Example response structure:

```json
{
  "topic": "Impact of Artificial Intelligence on Education",
  "search_results": [],
  "scraped_content": [],
  "report": "Generated research report...",
  "feedback": "Critic agent feedback..."
}
```

The actual values and data structures depend on the output returned by `run_research_pipeline()`.

### 3. Revise Research Report

**Endpoint:** `POST /revise`

Revises an existing report using the critic's feedback or additional instructions.

Request body:

```json
{
  "topic": "Impact of Artificial Intelligence on Education",
  "report": "The original research report...",
  "feedback": "Add more evidence and improve the conclusion."
}
```

The response depends on the structure returned by `revise_research_report()`.

## Testing the API

You can test the endpoints using the interactive Swagger UI:

1. Start the FastAPI server.
2. Open http://127.0.0.1:8000/docs.
3. Select `GET /` and click **Try it out** to check the server.
4. Select `POST /research`, enter a research topic, and execute the request.
5. Use `POST /revise` to submit a report and feedback for revision.

You can also call these endpoints from your React frontend using `fetch()` or Axios.

## Connecting the React Frontend

If your React application runs on port `5173`

## Running the Frontend


```bash
cd client
npm install
npm run dev
```


**Built with FastAPI and AI-powered research agents.**