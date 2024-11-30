from exa_py import Exa
from typing import Dict, List
from . import config

# articles: ["title", "url"]
def get_contents(articles: Dict[str, str]) -> List[any]:
    exa = Exa(api_key=config.EXA_API_KEY)
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
    return {result.url: result for result in results_data.results}
