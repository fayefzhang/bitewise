from exa_py import Exa
from typing import Dict, List
from openai import OpenAI
import config

# articles: ["title", "url"]
def get_contents(articles: Dict[str, str]) -> List[any]:
    exa = Exa(api_key="9a12cb7e-61ad-4b76-9ad9-15e5713fa9fe")
    openai = OpenAI(api_key="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")
    url_list = []
    for url in articles.values():
        url_list.append(url)
    results_data = exa.get_contents(
      url_list,
      # MAX_CHARACTERS IS 1000 RN FOR TESTING, can change later
      text={
        "max_characters": 1000,
        "include_html_tags": False
      }
    )
    
    # results_data example can be found in the /data/exa/example_api_response
    # the Result type is essentially an object with all the fields found in the JSON
    return [article_result for article_result in results_data.results]