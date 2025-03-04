from flask import Flask, request, jsonify, send_from_directory
import os
from utils.openai_utils import generate_summary_individual, generate_summary_collection, daily_news_summary, generate_podcast_collection, generate_audio_from_article
from utils.newsapi import generate_filename, daily_news, user_search, get_sources, fetch_search_results, get_topics_articles
from utils.exa import get_contents
from utils.clustering import cluster_articles, cluster_daily_news, cluster_daily_news_titles
from utils.crawl import crawl_all as daily_crawl_all
from utils.crawl import crawl_location as daily_crawl_location
from utils.features import get_source_and_bias, char_length, estimate_reading_time
from collections import Counter
import logging
import json
import pandas as pd
import re
from datetime import datetime
from threading import Thread
from utils.dashboard_topics import news_pipeline


app = Flask(__name__)
app.logger.setLevel(logging.DEBUG)

@app.before_request
def log_request_info():
    logging.debug(f"Headers: {request.headers}")
    logging.debug(f"Body: {request.data}")

@app.route('/daily-news', methods=['POST'])
def refresh_daily_news():
    last_modified_timestamp = os.path.getmtime("data/articles_data.json")
    last_modified_date = datetime.fromtimestamp(last_modified_timestamp)
    current_time = datetime.now()
    time_difference = current_time - last_modified_date
    if time_difference.total_seconds() > 12 * 3600:
        Thread(target=daily_crawl_all).start()
    return refresh_helper()

@app.route('/local-news', methods=['POST'])
def refresh_local_news():
    last_modified_timestamp = os.path.getmtime("data/local_articles_data.json")
    last_modified_date = datetime.fromtimestamp(last_modified_timestamp)
    current_time = datetime.now()
    time_difference = current_time - last_modified_date
    if time_difference.total_seconds() > 12 * 3600:
        Thread(target=daily_crawl_location).start()
    return refresh_helper('local_articles_data.json')

# helper function to refresh news and cluster to find main topics
def refresh_helper(file_path='articles_data.json'):
    # get filepath for daily newws data
    current_dir = os.path.dirname(os.path.abspath(__file__))
    json_file_path = os.path.join(current_dir, 'data', file_path)

    # get trending topics
    cluster_dict = news_pipeline(json_file_path)

    # add additional information (source, bias, readtime)
    for cluster_id, articles in cluster_dict["clustered_articles"].items():
        for article in articles:
            # source and bias
            article["source"], article["biasRating"] = get_source_and_bias(article.get("source", {}))
            article["readTime"] = estimate_reading_time(char_length(article.get("content", None)))

    # take 3 articles from each cluster for overall summary
    top_clusters = sorted(cluster_dict["clustered_articles"].items(), key=lambda x: len(x[1]), reverse=True)
    top_articles = []
    max_articles_per_cluster = 3
    for cluster, articles in top_clusters:
        print(f"Cluster ID: {cluster}, Articles Count: {len(articles)}")
        top_articles.extend(articles[:max_articles_per_cluster])

    # **Generate summary from daily news articles**
    articles_text = "\n\n".join([
        f"### {article.get('title', 'Untitled')} ###\n{article.get('content', '')}" for article in top_articles
    ])

    daily_summary = daily_news_summary(articles_text)  # Calling the summary function

    # **Build the final response**
    response = {
        "overall_summary": daily_summary,  # Daily news summary
        "clusters": [
            {
                "cluster_id": cluster_id,
                "title": cluster_articles[0].get("title", "Untitled"),  # Using first article title as cluster title
                "articles": list(cluster_articles)
            }
            for cluster_id, cluster_articles in top_clusters
        ]
    }

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
    
    full_content = article.get("content")
    title = article.get("title")
    url = article.get("url")

    app.logger.info(f"url: {url}, title: {title}, full_content: {full_content}")
    
    # only retrieve full content if we didn't already get it
    if not full_content:
        fetched_data = get_contents({url: {"title": title, "content": None}})
        full_content = fetched_data[url]["content"]

    # generate summary
    ai_preferences = data.get('ai_preferences')
    if not ai_preferences:
        return jsonify({"error": "AI preferences are required"}), 400

    summary_output_full = generate_summary_individual(full_content, ai_preferences)
    if "error" in summary_output_full:
        summary_output = summary_output_full["error"]
    else:
        summary_output = summary_output_full["summary"]
    print("HEREE",summary_output)
    if "**Reading Difficulty**:" in summary_output:
        summary, difficulty = summary_output.split("**Reading Difficulty**:", 1)
        summary = summary.replace("**Summary**:", "").strip()
        difficulty = difficulty.strip()
    else:
        summary = summary_output.replace("**Summary**:", "").strip()
        difficulty = "Unknown"
    difficulty = difficulty.strip()
    # if difficult is easy, then 0, if medium, then 1, if hard, then 2
    difficulty_int = 0 if difficulty == "Easy" else 1 if difficulty == "Medium" else 2 if difficulty == "Hard" else -1
    return jsonify({
        "summary": summary,
        "difficulty": difficulty_int,
        "s3_url": summary_output_full.get("s3_url", None)
    }), 200

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
    is_dashboard = data.get('is_dashboard', False)
    if not is_dashboard:
        contents_mapping = get_contents(articles)
    else:
        contents_mapping = articles
        
    # enrich articles with full scraped content
    enriched_articles = []
    for url, article_data in articles.items():
        article_result = contents_mapping.get(url, None)
        enriched_articles.append({
            "url": url,
            "title": article_result.get("title", ""),
            "content": article_result.get("content", ""),
            "imageUrl": article_result.get("imageUrl", ""),
            "readTime": article_result.get("readTime", ""),
            "biasRating": article_result.get("biasRating", ""),
            "source": article_result.get("source", ""),
            "authors": article_result.get("authors", ""),
            "time": article_result.get("time", ""),
            "sentiment": article_result.get("sentiment", ""),
    })

    # only use the first 10 articles for summarization (3 full, next 7 thirds) @Sanya verify
    articles_text = "\n\n".join([
    f"### {article['title']} ###\n{article['content']}" if i < 3 
    else f"### {article['title']} ###\n{article['content'][:len(article['content']) // 3]}" 
    for i, article in enumerate(enriched_articles[:10])
    ])
    # articles_text = "\n\n".join([f"### {article['title']} ###\n{article['content']}" for article in enriched_articles[:7]])
    summary_output = generate_summary_collection(articles_text, ai_preferences)
    title, summary = summary_output.split("**Summary**:", 1)  # Splitting based on "**Summary**:"
    title = title.replace("**Title**:", "").strip()
    summary = summary.strip()
    return jsonify({
        "title": title,
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
    result = generate_podcast_collection(articles)
    if not result.get("s3_url"):
        return jsonify({"error": "Failed to upload podcast to S3"}), 500
    return jsonify(result), 200

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

    if not data:
        return jsonify({"error": "No JSON data received"}), 400

    topics = data.get('topics')
    search_preferences = data.get("search_preferences", {})
    
    print("topics in app.py:", topics)  # Debugging print
    if topics is None:
        return jsonify({"error": "Missing 'topics' in request data"}), 400
        
    # print("topics in app.py: " + topics)
    results = get_topics_articles(topics, search_preferences)

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

@app.route('/irrelevant-articles', methods=['POST'])
def filter_irrelevant():
    data = request.get_json()
    articles = data.get('articles')
    query = data.get('query')
    if not articles:
        return jsonify({"error": "Articles are required"}), 400
    relevant_indices = filter_irrelevant_articles(articles, query)
    app.logger.info("Articles were filtered: ", relevant_indices)
    return jsonify({"relevant_indices": relevant_indices}), 200

if __name__ == '__main__':
    app.run(port=5000)


    