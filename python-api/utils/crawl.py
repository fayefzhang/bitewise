import os
import requests
from bs4 import BeautifulSoup
import time
import re


current_dir = os.path.dirname(__file__)
sources_path = os.path.join(current_dir, '../data/sources.txt')
seeds_path = os.path.normpath(sources_path)

with open(seeds_path, 'r') as file:
    seeds = file.read()
    seed_list = [seed.rstrip('/') + '/' for seed in seeds.splitlines()]
    # print(seed_list)


### STEPS

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

            # initialize variables
            user_agent_pattern = re.compile(r"^User-agent: (.+)$", re.IGNORECASE)
            allow_pattern = re.compile(r"^Allow: (.+)$", re.IGNORECASE)
            disallow_pattern = re.compile(r"^Disallow: (.+)$", re.IGNORECASE)
            crawl_delay_pattern = re.compile(r"^Crawl-delay: (.+)$", re.IGNORECASE)
            
            # iterate through each line of robots.txt
            for line in response.text.splitlines():
                line = line.strip()
                if not line or line.startswith('#'):
                    continue

                # match user-agent
                matcher = user_agent_pattern.match(line)
                if matcher:
                    if found_rule:
                        break
                    active_agent = matcher.group(1).strip()
                    continue

                # skip rules that aren't for current agent or all agents
                if active_agent is None or not (active_agent == user_agent or active_agent == "*"):
                    continue

                # match allows
                matcher = allow_pattern.match(line)
                if matcher and not found_rule:
                    rule = matcher.group(1).strip()
                    normalized_rule = normalize_url(rule, base_url)
                    # print("allowed. normalized rule is:", normalized_rule)
                    if normalized_rule and current_url.startswith(normalized_rule):
                        found_rule = True
                        allow = True
                        continue
                
                # match disallow
                matcher = disallow_pattern.match(line)
                if matcher and not found_rule:
                    rule = matcher.group(1).strip()
                    normalized_rule = normalize_url(rule, base_url)
                    # print("disallowed. normalized rule is:", normalized_rule)
                    if normalized_rule and current_url.startswith(normalized_rule):
                        found_rule = True
                        allow = False
                        continue

                # match crawl delay
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
    
# for seed in seed_list:
#     crawl_delay, allowed = check_robots_txt(seed, seed)
#     print(f"Url: {seed}, Crawl Delay: {crawl_delay}, Allowed: {allowed}")


# 2) scrape and parse html. find all outgoing links and add to data structure
#    - use BeautifulSoup to ignore nav bar, other irrelevant links

# fetch and parse a webpage
def fetch_page(url):
    try:
        response = requests.get(url)
        response.raise_for_status()  # raise an error for bad status codes
        return response.text
    except requests.exceptions.RequestException as e:
        print(f"Error fetching {url}: {e}")
        return None
        
# extract links from a webpage
def extract_links(html, base_url, delay=0.5):
    soup = BeautifulSoup(html, 'html.parser')
    links = set()  # use a set to avoid duplicates

    for a_tag in soup.find_all('a', href=True):
        if len(links) > 30:  # max 30 articles per source
            break

        link = a_tag['href']
        if link.startswith('/'):
            link = base_url + link  # handle relative links
        title = a_tag.get_text(strip=True)
        if len(link) - len(base_url) < 20 or len(title) < 20:  # avoid non article links
            continue
        
        article = Article(url=link, source=base_url)
        article.title = title
        article.content = extract_contents(link)
        links.add(link)

        print(f"{link}, {title}")

        time.sleep(delay)  # be polite and avoid overloading the server
    
    return links

# 3) scrape each outgoing link (map of url to html)
#    - store: URL, title, author, date, source, content

def extract_contents(url):
    try:
        # fetch article HTML content
        response = requests.get(url)
        response.raise_for_status()
        soup = BeautifulSoup(response.content, 'html.parser')

        # extract the content -- paragraph <p> tags
        paragraphs = soup.find_all('p')
        content = " ".join(p.get_text(strip=True) for p in paragraphs)

        print(content)

        # Return the extracted details
        return content
    
    except Exception as e:
        print(f"An error occurred while scraping the article: {e}")
        return None



# print(seeds)

class Article:
    def __init__(self, url, source):
        self.url = url
        self.source = source
        self.title = None
        self.content = None 

    def __hash__(self):
        return hash(self.url)
    
    def __eq__(self, other):
        if not isinstance(other, Article):
            return False
        return self.url == other.url
    


# main crawler function
if __name__ == "__main__":
    all_links = set()
    
    for seed in seeds:
        print(f"crawling: {seed}")
        delay, allowed = check_robots_txt(seed, seed)
        if allowed == 1:
            html = fetch_page(seed)
            if not html:
                continue
            links = extract_links(html, base_url=seed, delay=delay) # struct
            all_links.update(links)

    print(f"Visited {len(all_links)} pages:")

