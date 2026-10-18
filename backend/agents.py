from dotenv import load_dotenv
load_dotenv()

import os
import requests

# from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_groq import ChatGroq
from langchain_ollama import ChatOllama
from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import ChatPromptTemplate
from tavily import TavilyClient
from langchain.agents import create_agent
from tools import web_search, scrape_url;

# “LCEL chain ek predefined sequence follow karti hai, jabki Agent available tools ko use karne ka decision le sakta hai. Mere project mein Writer aur Critic fixed tasks perform karte hain, isliye LCEL chains use ki hain. Search aur Reader ko tools call karne hain, isliye create_agent() use kiya hai. Writer ko web search ki zaroorat ho toh zaroori nahi ki use Agent banaya jaye; pipeline se search results provide kar sakte hain. Lekin agar Writer ko dynamically decide karna ho ki kab aur kaise search karna hai, toh Agent banana useful hoga.”


# llm = ChatGoogleGenerativeAI(
#     model="gemini-3.6-flash"
# )
llm = ChatGroq(
    model="openai/gpt-oss-120b",
    api_key=os.getenv("GROQ_API_KEY"),
    temperature=0
)



# llm = ChatOllama(model="llama3.2")

def build_search_agent():
    return create_agent(
        model = llm,
        tools=[web_search],
        system_prompt="""
        You are a web research agent.

        You have access to only one tool: web_search.
        Use web_search to find recent and reliable information.
        Never call web_open, browse, or any other unavailable tool.
        Return the search results with their titles, URLs, and snippets.
        """
    )

def build_reader_agent():
    return create_agent(
        model = llm,
        tools=[scrape_url],
        system_prompt="""
        You are a research reader agent.

        You have access to only one tool: scrape_url.
        You must use scrape_url to read relevant URLs provided in the user's message.
        Call scrape_url with the actual URL as its argument.
        Never call web_open or any other unavailable tool.
        Keep the source URLs alongside the extracted content.
        Do not invent URLs or facts.
        """
    )

writer_prompt = ChatPromptTemplate.from_messages([
    ("system", "You are an expert research writer. Write clear, structured and insightful reports."),
    ("human", """Write a detailed research report on the topic below.

Topic: {topic}

Research Gathered:
{research}

Structure the report as:
- Introduction
- Key Findings (minimum 3 well-explained points)
- Conclusion
- Sources (list all URLs found in the research)

Be detailed, factual and professional."""),
])

writer_chain = writer_prompt | llm | StrOutputParser()

critic_prompt = ChatPromptTemplate.from_messages([
    ("system", "You are a sharp and constructive research critic. Be honest and specific."),
    ("human", """Review the research report below and evaluate it strictly.

Report:
{report}

Respond in this exact format:

Score: X/10

Strengths:
- ...
- ...

Areas to Improve:
- ...
- ...

One line verdict:
..."""),
])

critic_chain = critic_prompt | llm | StrOutputParser()
