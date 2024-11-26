from exa_py import Exa, Result
from typing import Dict, List
from openai import OpenAI
import config

# articles: ["title", "url"]
def get_contents(articles: Dict[str, str]) -> List[Result]:
    exa = Exa(api_key="")
    openai = OpenAI(api_key='')
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