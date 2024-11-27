from flask import Flask, request, jsonify
import os
from utils.openai import generate_summary_individual, generate_summary_collection
from utils.newsapi import generate_filename, daily_news, user_search, get_sources
from utils.exa import get_contents

app = Flask(__name__)


@app.route('/search', methods=['POST'])
def search():
    data = request.json
    query = data.get("query", "")
    user_preferences = data.get("user_preferences", {})

    if not query:
        return jsonify({"error": "Query is required"}), 400
    if not user_preferences:
        return jsonify({"error": "User preferences are required"}), 400
    
    filename = os.path.join("data", generate_filename(query))
    search_results = user_search(query, user_preferences, filename)
    search_results = "" if search_results is None else search_results
    
    response = {
        "query": query,
        "results": search_results,
        "filename": filename
    }

    return jsonify(response), 200


@app.route('/daily-news', methods=['POST'])
def refresh_daily_news():
    data = request.json
    user_preferences = data.get("user_preferences", {})
    if not user_preferences:
        return jsonify({"error": "User preferences are required"}), 400
    
    filename = os.path.join("data", generate_filename("daily news"))
    news = daily_news(user_preferences, filename) # this could also take in query, but don't see how we'd use this
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
@app.route('/summarize-article', methods=['POST'])
def summarize_article():
    data = request.get_json()
    article = data.get('article')
    # assuming article = the url of the article
    article = get_contents([article])
    user_preferences = data.get('user_preferences')

    if not article:
        return jsonify({"error": "Article is required"}), 400
    if not user_preferences:
        return jsonify({"error": "User preferences are required"}), 400

    summary = generate_summary_individual(article[0].text, user_preferences)
    return jsonify({"summary": summary}), 200

# For summarizing multiple articles into one summary
@app.route('/summarize-articles', methods=['POST'])
def summarize_articles():
    data = request.get_json()
    articles = data.get('articles') # to clarify @Sanya is this expecting all article text concatenated into one string?
    # I'm assuming that it's a dictionary of the form: ["title" : "url"], can also be just a list of URLs - q
    articles = get_contents(articles)
    # articles is now a [Result]. Result is the return type from the exa function call. - q 
    
    articles_text = "\n\n".join([f"### Article {i+1} ###\n{result.text.strip()}" for i, result in enumerate(articles)])

    user_preferences = data.get('user_preferences')
    if not articles:
        return jsonify({"error": "Articles are required"}), 400
    if not user_preferences:
        return jsonify({"error": "User preferences are required"}), 400

    summary = generate_summary_collection(articles_text, user_preferences)
    return jsonify({"summary": summary}), 200

if __name__ == '__main__':
    app.run(port=5000)