from agents import build_reader_agent, build_search_agent, writer_chain, critic_chain

def run_research_pipeline(topic : str) -> dict:

    state = {}

    print("\n" +" ="*50)
    print("step 1 - search agent is  working...")
    print("="*50)

    search_agent = build_search_agent()
    search_result = search_agent.invoke({
        "messages": [("user", f"Find recent, reliable and detailed information about: {topic}")]
    })

    state["search_results"] = search_result['messages'][-1].content

    print(state['search_results'][0]['text'])

    print("\n" +" ="*50)
    print("step 2 - reader agent is  working...")
    print("="*50)

    reader_agent = build_reader_agent()
    reader_result = reader_agent.invoke({
        "messages": [(
            f"Based on the following search results about '{topic}',"
            f"Pick the most relevant URL and scrape it for deeper content. \n\n"
            f"Search Results:\n{state['search_results'][:800]}"
        )]
    })

    state['scraped_content'] = reader_result['messages'][-1].content

    print("\nscraped content: \n", state['scraped_content'][0]['text'])

    print("\n" +" ="*50)
    print("step 3 - writer is drafting the work...")
    print("="*50)

    research_combined = (
        f"SEARCH RESULTS : \n {state['search_results']} \n\n"
        f"DETAILED SCRAPED CONTENT : \n {state['scraped_content']}"
    )

    state["report"] = writer_chain.invoke({
        "topic": topic,
        "research": research_combined
    })

    print("\n Final Report\n", state['report'])

    print("\n" +" ="*50)
    print("step 4 - critic is reveiwing the report...")
    print("="*50)

    state['feedback'] = critic_chain.invoke({
        "report": state['report']
    })

    print("\n critic report \n", state['feedback'])

    return state

if __name__ == "__main__":
    topic = input("\nEnter a research topic : ")
    run_research_pipeline(topic)
