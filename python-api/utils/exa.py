from exa_py import Exa
from typing import Dict, List
from . import config
from newspaper import Article

# articles: {"url": { "title": "string", "fullContent": "string" }}
def get_contents(articles: Dict[str, Dict[str, str]]) -> Dict[str, Dict[str, str]]:
    exa = Exa(api_key=config.EXA_API_KEY)
    url_list = []
    
    # only calls exa if we haven't already scraped content
    for url, article_data in articles.items():
      if not article_data.get("fullContent"):
        url_list.append(url)
        print(f"url: {url}")

    if len(url_list) != 0:
      results_data = exa.get_contents(
        url_list,
        # MAX_CHARACTERS IS 1000 RN FOR TESTING, can change later
        text={
          # "max_characters": 1000,
          "include_html_tags": False
        }
      )
      fetched_results = {result.url: result for result in results_data.results}
    else:
        fetched_results = {}

    # modify articles with content of fetched results
    for url, article_data in articles.items():
      if url in fetched_results:
        article_data["fullContent"] = fetched_results[url].text.strip()
        # get thumbnail image
        article = Article(url)
        article.download()
        article.parse()
        article_data["imageUrl"] = article.top_image
        article_data["authors"] = article.authors
        article_data["date"] = article.publish_date

    return articles