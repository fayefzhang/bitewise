from flask import Flask, request, jsonify, send_from_directory
import os
from utils.openai import generate_summary_individual, generate_summary_collection, generate_podcast_collection, generate_audio_from_article
from utils.newsapi import generate_filename, daily_news, user_search, get_sources
from utils.openai import generate_summary_individual, generate_summary_collection
from utils.newsapi import generate_filename, daily_news, user_search, get_sources, fetch_search_results
from utils.exa import get_contents
from utils.clustering import cluster_articles, cluster_daily_news, cluster_daily_news_titles
from utils.crawl import crawl_all as daily_crawl_all
from utils.crawl import crawl_location as daily_crawl_location
from collections import Counter
import logging
import json
import pandas as pd
import re


app = Flask(__name__)
app.logger.setLevel(logging.DEBUG)

@app.before_request
def log_request_info():
    logging.debug(f"Headers: {request.headers}")
    logging.debug(f"Body: {request.data}")

@app.route('/daily-news', methods=['POST'])
def refresh_daily_news():
    return refresh_helper()

@app.route('/local-news', methods=['POST'])
def refresh_local_news():
    return refresh_helper('local_articles_data.json')

# helper function to refresh news and cluster to find main topics
def refresh_helper(file_path='articles_data.json'):
    # get filepath for daily newws data
    current_dir = os.path.dirname(os.path.abspath(__file__))
    json_file_path = os.path.join(current_dir, 'data', file_path)

    # apply clustering and get top 4 clusters
    cluster_dict = cluster_daily_news_titles(json_file_path)
    print(set(cluster_dict.values()))

    # add cluster label to articles
    with open(json_file_path, 'r', encoding='utf-8') as f:
        articles_data = json.load(f)
    articles_df = pd.DataFrame(articles_data)
    articles_df['cluster'] = articles_df.index.map(cluster_dict)

    # get top clusters
    top_clusters = (
        articles_df['cluster']
        .value_counts()
        .nlargest(4)
        .index
    )

    # get articles for top clusters
    top_articles = articles_df[articles_df['cluster'].isin(top_clusters)]
    response = (
        top_articles.groupby('cluster')
        .apply(lambda x: x.to_dict(orient='records'))
        .to_dict()
    )
    return jsonify(response)


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
        if search_results != "":
            print("search results not empty")
        else:
            print ("search results empty")
        
        response = {
            "query": query,
            "results": search_results,
            "filename": filename
        }

        # add clustering results if requested
        if cluster and search_results:
            cluster_dict = cluster_articles(search_results)
            print(set(cluster_dict.values()))
            for article in search_results:
                article_id = article.get("id")
                article["cluster"] = cluster_dict.get(article_id, None)
                if article["cluster"] != -1:
                    print(article["title"], article["cluster"])

        return jsonify(response), 200
    except Exception as e:
        app.logger.error(f"Unexpected error: {str(e)}")
        return {"error": "Internal Server Error"}, 500


# @app.route('/daily-news', methods=['POST'])
# def refresh_daily_news():
#     data = request.json
#     search_preferences = data.get("search_preferences", {})
#     if not search_preferences:
#         return jsonify({"error": "User preferences are required"}), 400
    
#     filename = os.path.join("data", generate_filename("daily news"))
#     news = daily_news(search_preferences, filename) # this could also take in query, but don't see how we'd use this
#     news = [] if news is None else news

#     response = {
#         "results": news,
#         "filename": filename
#     }

#     return jsonify(response), 200

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
    # print(contents_mapping)

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

# For generating a an audio file from an article using TTS
@app.route('/generate-audio', methods=['POST'])
def generate_audio():
    data = request.get_json()
    article_title = data.get('article')
    summary = data.get('summary')
    filename = re.sub(r'[<>:"/\\|?*]', '', article_title) + "-tts.mp3"
    if not article_title:
        return jsonify({"error": "Article title is required"}), 400
    if not summary:
        return jsonify({"error": "Article summary is required"}), 400
    audio_path = generate_audio_from_article(summary, filename)
    return jsonify({"audio_path": audio_path}), 200


# For generating a podcast from multiple articles
@app.route('/generate-podcast', methods=['POST'])
def generate_podcast():
    data = request.get_json()
    articles = data.get('articles')
    if not articles:
        return jsonify({"error": "Articles are required"}), 400
    paths = generate_podcast_collection(articles)
    return jsonify(paths), 200

@app.route('/audio/<filename>', methods=['GET'])
def serve_audio(filename):
    return send_from_directory("data/podcasts/audio", filename, mimetype="audio/mpeg")


@app.route('/user/preferences', methods=['GET'])
def get_preferences():
    userID = request.args.get('userID')

    if userID == "TEST":
        current_dir = os.path.dirname(os.path.abspath(__file__))
        json_file_path = os.path.join(current_dir, 'data', 'test_preferences.json')

        with open(json_file_path, 'r') as file:
            test_preferences = json.load(file)
        return jsonify(test_preferences), 200

    # NEED TO IMPLEMENT ACTUAL USER ID FETCHING
    return jsonify({"error": "User ID not found"}), 404

@app.route('/search/topics', methods=['POST'])
def topic_search():
    data = request.get_json()
    topics = data.get('topics')
    search_preferences = data.get("search_preferences", {})

    results = []
    for topic in topics:
        
        topic_search_results = user_search(topic, search_preferences, "")
        topic_result = {
            "topic": topic,
            "results": topic_search_results[:3] # arbitrary amount, can change
        }
        results.append(topic_result)
    
    return jsonify(results), 200

@app.route('/crawl/all', methods=['POST'])
def crawl_all():
    try:
        daily_crawl_all()
        return jsonify({"message": "ok"}), 200 
    except Exception as e:
        app.logger.error(f"Error occurred: {str(e)}")
        return jsonify({"error": "An error occurred"}), 500


@app.route('/crawl/local', methods=['POST'])
def crawl_local():

    # TODO: pass in location

    try:
        daily_crawl_location()
        return jsonify({"message": "ok"}), 200 
    except Exception as e:
        app.logger.error(f"Error occurred: {str(e)}")
        return jsonify({"error": "An error occurred"}), 500

if __name__ == '__main__':
    app.run(port=5000)