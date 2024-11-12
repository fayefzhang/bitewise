from exa_py import Exa
from typing import Dict
from openai import OpenAI


def get_contents(articles: Dict[str, str]) -> [str]:
    exa = Exa(api_key="")
    openai = OpenAI(api_key='')
    url_list = []
    for url in articles.values():
        url_list.append(url)
    results_data = exa.get_contents(
      url_list,
      text={
        "max_characters": 1000,
        "include_html_tags": False
      }
    )
    print(results_data)

    return [item.text for item in results_data.results]
