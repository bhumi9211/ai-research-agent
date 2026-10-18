from agents import build_reader_agent, build_search_agent, writer_chain, critic_chain
from tools import web_search, scrape_url

#  -------------------------------------------------------------------------

BLOCKED = ("instagram.com", "facebook.com", "x.com", "twitter.com", "youtube.com")

def run_research_pipeline(topic: str, use_critic: bool = True, max_scrape: int = 2) -> dict:
    state = {}

    # Step 1
    print("\nstep 1 - searching...")
    state["search_results"] = web_search.invoke({"query": topic})

    # Step 2
    print("\nstep 2 - scraping...")
    urls = [
        line.replace("URL:", "").strip()
        for line in state["search_results"].split("\n")
        if line.startswith("URL:")
    ]
    urls = [u for u in urls if not any(b in u for b in BLOCKED)][:max_scrape]

    scraped = []
    for u in urls:
        text = scrape_url.invoke({"url": u})[:1500]      
        scraped.append(f"SOURCE: {u}\n{text}")
    state["scraped_content"] = "\n\n".join(scraped)

    if not state["scraped_content"]:
        raise ValueError("No scrapable content found.")

    # Step 3
    print("\nstep 3 - writer is drafting...")
    research_combined = (
        f"SEARCH RESULTS:\n{state['search_results']}\n\n"
        f"DETAILED SCRAPED CONTENT:\n{state['scraped_content']}"
    )
    state["report"] = writer_chain.invoke({"topic": topic, "research": research_combined})
    print("\nFinal Report\n", state["report"])

    # Step 4
    if use_critic:
        print("\nstep 4 - critic is reviewing...")
        state["feedback"] = critic_chain.invoke({"report": state["report"]})
        print("\ncritic report\n", state["feedback"])

    return state

def revise_research_report(topic, report, feedback):
    revised_report = writer_chain.invoke({
        "topic": topic,
        "research": f"""
Original Report:
{report}

Critic Feedback:
{feedback}

Revise the report using the critic's suggestions.
- Fix the identified weaknesses.
- Use only facts and sources supported by the original research.
- Do not invent facts, statistics, or URLs.
- Return the complete revised report.
"""
    })

    revised_feedback = critic_chain.invoke({
        "report": revised_report
    })

    return {
        "revised_report": revised_report,
        "revised_feedback": revised_feedback
    }
    

if __name__ == "__main__":
    topic = input("\nEnter a research topic : ")
    run_research_pipeline(topic)


