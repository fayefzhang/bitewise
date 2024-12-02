from flask import Flask, request, jsonify
import os
from utils.openai import generate_summary_individual, generate_summary_collection
from utils.newsapi import generate_filename, daily_news, user_search, get_sources
from utils.exa import get_contents
from utils.clustering import cluster_articles
import logging

app = Flask(__name__)


@app.route('/search', methods=['POST'])
def search():
    try:
        data = request.json
        app.logger.info(f"Received data: {data}")
        query = data.get("query", "")
        search_preferences = data.get("search_preferences", {})
        cluster = data.get("cluster", False)

        if not query:
            return jsonify({"error": "Query is required"}), 400
        if not search_preferences:
            return jsonify({"error": "User preferences are required"}), 400
        
        filename = os.path.join("data", generate_filename(query))
        search_results = user_search(query, search_preferences, filename)
        search_results = "" if search_results is None else search_results
        
        response = {
            "query": query,
            "results": search_results,
            "filename": filename
        }

        # add clustering results if requested
        if cluster and search_results:
            response["clusters"] = cluster_articles(search_results)

        return jsonify(response), 200
    except Exception as e:
        app.logger.error(f"Unexpected error: {str(e)}")
        return {"error": "Internal Server Error"}, 500


@app.route('/daily-news', methods=['POST'])
def refresh_daily_news():
    data = request.json
    search_preferences = data.get("search_preferences", {})
    if not search_preferences:
        return jsonify({"error": "User preferences are required"}), 400
    
    filename = os.path.join("data", generate_filename("daily news"))
    news = daily_news(search_preferences, filename) # this could also take in query, but don't see how we'd use this
    news = [] if news is None else news

    response = {
        "results": news,
        "filename": filename
    }

    return jsonify(response), 200

# this will only be called once to get sources
@app.route('/sources', methods=['POST'])
def headline_sources():
    filename = "data/sources.json"
    response_sources = get_sources(filename)
    response = {
        "sources": response_sources,
        "filename": filename
    }
    return jsonify(response), 200

# For summarizing a single article
# also need to add in caching article summary later...
@app.route('/summarize-article', methods=['POST'])
def summarize_article():
    data = request.get_json()
    article = data.get('article')
    if not article:
        return jsonify({"error": "Article is required"}), 400
    
    full_content = article.get("fullContent")
    title = article.get("title")
    url = article.get("url")

    app.logger.info(f"url: {url}, title: {title}, full_content: {full_content}")
    
    # only retrieve full content if we didn't already get it
    if not full_content:
        fetched_data = get_contents({url: {"title": title, "fullContent": None}})
        full_content = fetched_data[url]["fullContent"]

    # generate summary
    ai_preferences = data.get('ai_preferences')
    if not ai_preferences:
        return jsonify({"error": "AI preferences are required"}), 400

    summary = generate_summary_individual(full_content, ai_preferences)
    return jsonify({"summary": summary}), 200

# For summarizing multiple articles into one summary
@app.route('/summarize-articles', methods=['POST'])
def summarize_articles():
    data = request.get_json()
    articles = data.get('articles')
    ai_preferences = data.get('ai_preferences')

    if not ai_preferences:
        return jsonify({"error": "AI preferences are required"}), 400
    if not articles:
        return jsonify({"error": "Articles are required"}), 400
    
    # dict mapping urls to summary
    contents_mapping = get_contents(articles)
    print(contents_mapping)

    # enrich articles with full scraped content
    enriched_articles = []
    for url, article_data in articles.items():
        article_result = contents_mapping.get(url, None)
        enriched_articles.append({
            "url": url,
            "title": article_result["title"],
            "content": article_result['fullContent'],
    })

    articles_text = "\n\n".join([f"### {article['title']} ###\n{article['content']}" for article in enriched_articles])
    summary = generate_summary_collection(articles_text, ai_preferences)
    return jsonify({
        "summary": summary,
        "enriched_articles": enriched_articles,
    }), 200
if __name__ == '__main__':
    app.run(port=5000)