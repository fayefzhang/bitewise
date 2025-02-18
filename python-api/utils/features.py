import re
import pandas as pd
import os

bias_data_path = os.path.join(os.path.dirname(__file__), '..', 'data', 'mediabias', 'bias.csv')
if os.path.exists(bias_data_path):
    print("bias.csv found at:", bias_data_path)
else:
    print("bias.csv NOT found at:", bias_data_path)
bias_data = pd.read_csv(bias_data_path)
bias_lookup = bias_data.set_index("news_source")["rating"].to_dict()
bias_translation = {'left' : 0, 'left-center' : 1, 'center' : 2, 'right-center' : 3, 'right' : 4, 'Unknown' : 5}

source_mapping = {
    "https://abcnews.go.com/": "ABC News",
    "https://apnews.com/": "AP",
    "https://arstechnica.com/": "Ars Technica",
    "https://fortune.com/": "Fortune",
    "https://mashable.com/": "Mashable",
    "https://nationalgeographic.com/": "National Geographic",
    "https://www.vice.com/": "Vice",
    "https://nymag.com/": "New York Magazine",
    "https://techcrunch.com/": "TechCrunch",
    "https://thehill.com/": "The Hill",
    "https://thenextweb.com/": "The Next Web",
    "https://time.com/": "Time Magazine",
    "https://www.aljazeera.com/": "Al Jazeera",
    "https://www.axios.com/": "Axios",
    "https://www.bbc.com/": "BBC News",
    "https://www.bleacherreport.com/": "Bleacher Report",
    "https://www.bloomberg.com/": "Bloomberg",
    "https://www.breitbart.com/": "Breitbart News",
    "https://www.buzzfeed.com/": "BuzzFeed News",
    "https://www.cbsnews.com/": "CBS News",
    "https://www.ccn.com/": "CCN",
    "https://www.cnn.com/": "CNN (Web News)",
    "https://www.engadget.com/": "Engadget",
    "https://www.foxnews.com/": "Fox Online News",
    "https://www.huffingtonpost.com/": "HuffPost",
    "https://www.medicalnewstoday.com/": "Medical News Today",
    "https://www.msnbc.com/": "MSNBC",
    "https://www.mtv.com/news/": "MTV News Online",
    "https://www.nationalreview.com/": "National Review",
    "https://www.nbcnews.com/": "NBCNews.com",
    "https://www.newscientist.com/section/news/": "New Scientist",
    "https://www.newsweek.com/": "Newsweek",
    "https://www.nextbigfuture.com/": "Next Big Future",
    "https://www.npr.org/": "NPR Online News",
    "https://www.nytimes.com/": "New York Times - News",
    "https://www.politico.com/": "Politico",
    "https://www.reuters.com/": "Reuters",
    "https://www.theamericanconservative.com/": "The American Conservative",
    "https://www.theguardian.com/": "The Guardian",
    "https://www.theverge.com/": "The Verge",
    "https://www.usatoday.com/news/": "USA TODAY",
    "https://www.washingtonpost.com/": "Washington Post",
    "https://www.washingtontimes.com/": "Washington Times",
    "https://www.wired.com/": "Wired",
    "https://www.wsj.com/": "Wall Street Journal - News",
    "https://news.yahoo.com/": "Yahoo! News",
    "https://www.atlanticcouncil.org/": "Atlantic Council",
    "https://www.csmonitor.com/": "Christian Science Monitor",
    "https://www.foreignpolicy.com/": "Foreign Policy",
    "https://www.theatlantic.com/": "The Atlantic",
    "https://www.vox.com/": "Vox",
    "https://www.nature.com/news/": "Nature",
    "https://www.pbs.org/newshour/": "PBS NewsHour",
    "https://www.rollingstone.com/": "RollingStone.com",
    "https://www.esquire.com/news-politics/": "Esquire",
    "https://www.vogue.com/": "Vogue",
    "https://www.salon.com/": "Salon",
    "https://slate.com/": "Slate"
}

def get_source_and_bias(source):
    source = source.strip().lower()
    if not source.endswith('/'):
        source += '/'
    cleaned_source = source_mapping.get(source, "UNKNOWN")
    bias = bias_translation[bias_lookup.get(cleaned_source, "Unknown")]
    return cleaned_source, bias

# for daily news dashboard, we already have scraped content
def char_length(content):
    return len(content)

def estimate_reading_time(char_length):
    if not char_length:
        return None
    word_count = char_length / 5 # approximate
    mins = word_count / 250  # 250 words per minute
    if mins < 2:
        return 0
    elif 2 <= mins <= 7:
        return 1
    else:
        return 2