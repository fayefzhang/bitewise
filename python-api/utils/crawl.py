import os
import requests
from bs4 import BeautifulSoup
import time
import re
import json
import concurrent.futures
import time
from PIL import Image
from io import BytesIO
from newspaper import Article as NewsArticle


class Article:
    def __init__(self, url, source):
        self.url = url
        self.authors = None
        self.imageUrl = None
        self.title = None
        self.source = source
        self.content = None
        self.time = None

    def __hash__(self):
        return hash(self.url)

    def __eq__(self, other):
        if not isinstance(other, Article):
            return False
        return self.url == other.url

current_dir = os.path.dirname(__file__)
sources_path = os.path.join(current_dir, '../data/scraping/sources.txt')
seeds_path = os.path.normpath(sources_path)
local_sources_path = os.path.join(current_dir, '../data/scraping/local_sources.json')

# set of crawlable urls
robots_allowance = set()

# 1) check for robots.txt; parse
def check_robots_txt(base_url, current_url, user_agent="minicrawl"):
    robots_file = base_url.rstrip('/') + '/robots.txt'
    crawl_delay = 0.0
    active_agent = None
    allow = True
    found_rule = False

    try:
        response = requests.get(robots_file, timeout=5)
        if response.status_code == 200:
            user_agent_pattern = re.compile(r"^User-agent: (.+)$", re.IGNORECASE)
            allow_pattern = re.compile(r"^Allow: (.+)$", re.IGNORECASE)
            disallow_pattern = re.compile(r"^Disallow: (.+)$", re.IGNORECASE)
            crawl_delay_pattern = re.compile(r"^Crawl-delay: (.+)$", re.IGNORECASE)

            for line in response.text.splitlines():
                line = line.strip()
                if not line or line.startswith('#'):
                    continue

                matcher = user_agent_pattern.match(line)
                if matcher:
                    if found_rule:
                        break
                    active_agent = matcher.group(1).strip()
                    continue

                if active_agent is None or not (active_agent == user_agent or active_agent == "*"):
                    continue

                matcher = allow_pattern.match(line)
                if matcher and not found_rule:
                    rule = matcher.group(1).strip()
                    normalized_rule = normalize_url(rule, base_url)
                    if normalized_rule and current_url.startswith(normalized_rule):
                        found_rule = True
                        allow = True
                        continue

                matcher = disallow_pattern.match(line)
                if matcher and not found_rule:
                    rule = matcher.group(1).strip()
                    normalized_rule = normalize_url(rule, base_url)
                    if normalized_rule and current_url.startswith(normalized_rule):
                        found_rule = True
                        allow = False
                        continue

                matcher = crawl_delay_pattern.match(line)
                if matcher:
                    crawl_delay = float(matcher.group(1).strip())
    except Exception as e:
        print(f"Error parsing robots.txt: {e}")
    return [crawl_delay, 1.0 if allow else 0.0]

def normalize_url(rule, host_url):
    if not rule.startswith("/"):
        return None
    return host_url.rstrip("/") + rule

# 2) scrape and parse html. find all outgoing links and add to data structure
def fetch_page(url):
    try:
        response = requests.get(url)
        response.raise_for_status()
        return response.text
    except requests.exceptions.RequestException as e:
        print(f"Error fetching {url}: {e}")
        return None

def extract_links(html, base_url, delay=0.5):
    soup = BeautifulSoup(html, 'html.parser')
    articles = set()  # use a set to avoid duplicates

    for a_tag in soup.find_all('a', href=True):
        if len(articles) > 30:  # max 30 articles per source
            break

        link = a_tag['href']
        if link.startswith('/'):
            link = base_url + link  # handle relative links
            
        title = a_tag.get_text(strip=True)  # TODO: fix title -- extract h1 from scraping article
        if len(link) - len(base_url) < 20 or len(title) < 20:  # avoid non-article links
            continue

        article = Article(url=link, source=base_url)

        # parse article
        parsed_article = NewsArticle(link)
        parsed_article.download()
        parsed_article.parse()
        article.title = parsed_article.title
        article.authors = parsed_article.authors
        article.time = parsed_article.publish_date
        article.content = parsed_article.text
        article.imageUrl = parsed_article.top_image
        articles.add(article)

        print(f"{link}, {title}")

        time.sleep(delay)  # be polite and avoid overloading the server

    return articles

# process single seed with timeout
def process_seed(seed, timeout=120):
    try:
        print(f"-------------------------> crawling: {seed}")
        delay, allowed = check_robots_txt(seed, seed)
        if allowed == 1:
            html = fetch_page(seed)
            if not html:
                return set()
            links = extract_links(html, base_url=seed, delay=delay)
            return links
    except Exception as e:
        print(f"Error processing {seed}: {e}")
    return set()


# crawl websites inputted by sources
def crawl_seeds(sources, output_file='articles_data.json'):
    articles_list = []

    for seed in sources:
        all_links = set()

        try:
            with concurrent.futures.ThreadPoolExecutor(max_workers=1) as executor:
                future = executor.submit(process_seed, seed)
                links = future.result(timeout=120)  # timeout of 2 min
                all_links.update(links)
        except concurrent.futures.TimeoutError:
            print(f"Timeout reached for seed: {seed}. Skipping to the next.")
        except Exception as e:
            print(f"Unexpected error: {e}. Continuing to the next seed.")

        # store articles in a list
        for article in all_links:
            articles_data = {
                "url": article.url,
                "title": article.title,
                "source": article.source,
                "fullContent": article.content,
                "content": article.content[:200] + "...",
                "imageUrl": article.imageUrl,
                "authors": article.authors,
                "time": None
            }

            if article.time is not None:
                articles_data["time"] = article.time.strftime('%Y-%m-%dT%H:%M:%S')
            else:
                articles_data["time"] = "unknown"

            articles_list.append(articles_data)

    if articles_list:
        articles_list = articles_list * 2  # double the articles for better clustering
        with open("data/" + output_file, 'w', encoding='utf-8') as json_file:
            json.dump(articles_list, json_file, ensure_ascii=False, indent=4)
        
    print(f"Visited {len(all_links)} pages and saved data to {output_file}")

def crawl_all():
    with open(seeds_path, 'r') as file:
        seeds = file.read()
        seed_list = [seed.rstrip('/') + '/' for seed in seeds.splitlines()]

    crawl_seeds(sources=seed_list)


# crawl local sources
def crawl_location(location="Philadelphia, PA"):
    # get local news sources
    with open(local_sources_path, "r") as file:
        data = json.load(file)
    local_seed_list = data.get(location, None)

    for source in local_seed_list:
        print(source)

    crawl_seeds(sources=local_seed_list, output_file='local_articles_data.json')


def main():
    crawl_all()

if __name__ == "__main__":
    main()