import requests
from datetime import datetime, timedelta
import json
import re
from . import query_processing
from .query_processing import parse_query

# API key and global vars
api_key =  "e1f28be4691a45cf9ac878f1615b522e"
BASE_URL = "https://newsapi.org/v2"

# DEFINE FUNCTIONS TO CREATE API REQUESTS
def fetch_search_results(query=None, from_date=None, to_date=None, language=None, sort_by=None, page_size=100, page=1, domains=None, exclude_domains=None):
    """
    Fetch articles from the /v2/everything endpoint.
    """
    url = f"{BASE_URL}/everything"
    params = {
        "apiKey": api_key,
        "q": query,
        "from": from_date,
        "to": to_date,
        "language": language,
        "sortBy": sort_by,
        "pageSize": page_size,
        "page": page,
        "domains": domains,
        "excludeDomains": exclude_domains,
    }
    return make_request(url, params)

def fetch_top_headlines(query=None, country=None, category=None, sources=None, page_size=100, page=1):
    """
    Fetch articles from the /v2/headlines endpoint.
    """
    url = f"{BASE_URL}/top-headlines"
    params = {
        "apiKey": api_key,
        "q": query,
        "country": country,
        "category": category,
        "sources": sources,
        "pageSize": page_size,
        "page": page,
    }
    return make_request(url, params)

def fetch_sources(category=None, language=None, country=None):
    """
    Fetch available sources from the /v2/top-headlines/sources endpoint.
    """
    url = f"{BASE_URL}/top-headlines/sources"
    params = {
        "apiKey": api_key,
        "category": category,
        "language": language,
        "country": country,
    }
    return make_request(url, params)

def make_request(url, params):
    """
    Helper function to make GET requests and handle errors.
    """
    try:
        response = requests.get(url, params=params)
        if (response.status_code == 200):
            return response.json()
        else:
            print(f"Error {response.status_code}: {response.text}")
            return None
    except requests.RequestException as e:
        print(f"Request failed: {e}")
        return None

# used for search queries
def aggregate_eliminate_dups(responses, user_pref=None):
    """
    Aggregate results from multiple API responses, separating articles in preferred user domains
    """
    seen_urls = set()
    general_articles = []
    preferred_articles = []
    id = 0

    # Add articles from user preferences (news dashboard and search)
    if user_pref and "articles" in user_pref:
        for article in user_pref["articles"]:
            article_url = article.get("url")
            if article_url and article_url not in seen_urls:
                if (article.get("name") == "[Removed]"):
                    continue
                article["id"] = id
                id += 1
                article["user_pref"] = True
                seen_urls.add(article_url)
                preferred_articles.append(article)

    # Add articles from general search results
    for response in responses:
        if response and "articles" in response:
            for article in response["articles"]:
                article_url = article.get("url")

                if (article.get("name") == "[Removed]"):
                    continue

                # Skip duplicates
                if not article_url or article_url in seen_urls:
                    continue

                # Mark URL as seen and add the article to the list
                seen_urls.add(article_url)
                article["user_pref"] = False
                article["id"] = id
                id += 1
                general_articles.append(article)

    return general_articles + preferred_articles


### SEARCH PROCEDURE ###

# get user params
def user_search(question, user_preferences, filename):
    # step 1: parse question. @TODO for QUINN

    # step 2: set API args
    # for now, setting default variables
    from_date = (datetime.now() - timedelta(days=8)).strftime('%Y-%m-%d') # results in past week
    language = "en" # defaulting english

    domains = user_preferences.get("domains", None)
    exclude_domains = user_preferences.get("domains", None)
    question = parse_query(question)

    # step 3: make API requests
    response_popularity = fetch_search_results(question, from_date=from_date, language=language, sort_by="popularity", exclude_domains=exclude_domains)
    response_relevancy = fetch_search_results(question, from_date=from_date, language=language, sort_by="relevancy", exclude_domains=exclude_domains)
    response_domains = None
    if domains:
        response_domains = fetch_search_results(question, from_date=from_date, language=language, sort_by="popularity", domains=domains, exclude_domains=exclude_domains)
    # step 4: aggregate results
    responses = [response_popularity, response_relevancy]
    aggregated_results = aggregate_eliminate_dups(responses, response_domains)

    # step 5: write jsons to file for test data
    try:
        with open(filename, 'w') as json_file:
            json.dump(aggregated_results, json_file, indent=4)
    except Exception as e:
        print(f"Error writing to file: {e}")

    return aggregated_results

### GET SOURCES ###
# these correspond to top headlines (in US) but we can probably use them too for filt/pref in search page
def get_sources(filename):
    response_sources = fetch_sources(country='us')
    with open(filename, 'w') as json_file:
                json.dump(response_sources, json_file, indent=4)
    return response_sources

### DAILY NEWS DASHBOARD ###
# unfortunately top headlines doesn't return that many results, so we'll have to do extra API calls for now
def daily_news(user_preferences, filename, question=None):
    sources = user_preferences.get("sources", None)
    country='us' # defaulting this because need to set at least one param
    categories = ['general', 'business', 'entertainment', 'health', 'science', 'sports', 'technology'] 
    # the problem with this is that we want mostly politics/curr events- most categories not very "breaking news"

    responses = []
    for category in categories:
        responses.append(fetch_top_headlines(category=category, country=country))
    response_sources = None

    if sources:
        response_sources = fetch_top_headlines(query=question, sources=sources)

    aggregated_results = aggregate_eliminate_dups(responses, response_sources)
    
    try:
        with open(filename, 'w') as json_file:
            json.dump(aggregated_results, json_file, indent=4)
    except Exception as e:
        print(f"Error writing to file: {e}")

    return aggregated_results

def generate_filename(question):
    sanitized_question = re.sub(r'[^a-zA-Z0-9]', '_', question.lower()).strip('_')
    time = datetime.now().strftime("%Y%m%d_%H%M%S")
    return f"{sanitized_question}_{time}.json"

    
''' Running questions
How to sort results- what if we did two queries - one by relevancy and one by popularity and then aggregated results
Is there any way to use time of upload for breaking news - how would we categorize breaking news -> should look into this
Should we exclude certain sources like reddit - should we do this after
How to get good daily news- top headlines api isn't too great
'''