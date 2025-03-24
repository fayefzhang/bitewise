from exa_py import Exa
from typing import Dict, List
from . import config
from newspaper import Article

# articles: {"url": { "title": "string", "content": "string" }}
def get_contents(articles: Dict[str, Dict[str, str]]) -> Dict[str, Dict[str, str]]:
    exa = Exa(api_key=config.EXA_API_KEY)
    url_list = []

    for url, article_data in articles.items():
      if not article_data.get("content"):
        url_list.append(url)
        print(f"Processing URL: {url}")

    fetched_results = {}
    
    if url_list:
      try:
        results_data = exa.get_contents(
            url_list,
            text={"include_html_tags": False}
        )
        fetched_results = {result.url: result for result in results_data.results}
        
      except ValueError as e:
        print(f"Failed to fetch contents for some URLs: {e}")
        print(f"URLs attempted: {url_list}")

        # Retry individual URLs to salvage some results
        for url in url_list:
            try:
              result = exa.get_contents([url], text={"include_html_tags": False})
              if result.results:
                fetched_results[url] = result.results[0]
            except ValueError:
              print(f"Skipping URL due to failure: {url}")

    # modify articles with content of fetched results
    for url, article_data in articles.items():
      if url in fetched_results:
        try:
          article_data["content"] = fetched_results[url].text.strip()
          # Attempt to get metadata using newspaper3k
          article = Article(url)
          article.download()
          article.parse()
          article_data["imageUrl"] = article.top_image
          article_data["authors"] = article.authors
          article_data["date"] = article.publish_date
          article_data["title"] = article.title
        except Exception as e:
          print(f"Error processing {url}: {e}") 

    return articles