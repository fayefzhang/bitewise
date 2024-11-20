# # newsapi key: 42315216943d40838494b438f9aff6c4
# # python library: https://github.com/mattlisiv/newsapi-python
# #
# # $ pip install newsapi-python
# #
# # News API has 2 main endpoints:
# #
# # Everything /v2/everything – search every article published by over 150,000 different sources large and small in the last 5 years. This endpoint is ideal for news analysis and article discovery.
# #
# # Top headlines /v2/top-headlines – returns breaking news headlines for countries, categories, and singular publishers. This is perfect for use with news tickers or anywhere you want to use live up-to-date news headlines.
# #
# # There is also a minor endpoint that can be used to retrieve a small subset of the publishers we can scan:
# # Sources /v2/top-headlines/sources – returns information (including name, description, and category) about the most notable sources available for obtaining top headlines from. This list could be piped directly through to your users when showing them some of the options available.

# from newsapi import NewsApiClient
# from typing import Dict, Union

# def get_news() -> Dict[str, Union[str, any]]:
#     newsapi = NewsApiClient(api_key='')

#     # /v2/top-headlines
#     top_headlines = newsapi.get_top_headlines(q='election',
#                                               category='general',
#                                               language='en',
#                                               country='us',
#                                               page_size=10)

#     return top_headlines