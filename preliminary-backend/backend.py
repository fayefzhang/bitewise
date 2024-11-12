
from news_api import get_news
from exa import get_contents
from typing import Dict, Union

def get_article_urls(headlines_json: Dict[str, Union[str, any]]) -> Dict[str, str]:
    articles = headlines_json['articles']
    url_dict = {}
    for article in articles:
        url_dict[article['title']] = article['url']
    return url_dict

def get_article_contents(url_dict: Dict[str, str]) -> Dict[str, str]:
    article_contents = get_contents(url_dict)
    return article_contents

def main():
    top_election_headlines = get_news()
    print(top_election_headlines)
    # url_dict = get_article_urls(top_election_headlines)
    # print(url_dict)
    # article_contents = get_article_contents(url_dict)
    # print(article_contents)

if __name__ == '__main__':
    main()