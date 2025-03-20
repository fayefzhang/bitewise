import pandas as pd
import json
from bertopic import BERTopic
import re
import numpy as np
import nltk
from nltk.corpus import stopwords
from nltk.tokenize import word_tokenize
from nltk.corpus import wordnet as wn
from nltk.stem import WordNetLemmatizer
from sklearn.feature_extraction.text import CountVectorizer

nltk.download('wordnet')
import os
os.environ["TOKENIZERS_PARALLELISM"] = "false"

nltk.download('stopwords')
lemmatizer = WordNetLemmatizer()
stop_words = set(stopwords.words('english'))
NUM_TOPICS = 5


# loads data and returns a pandas dataframe
def load_data(file):
    with open(file, 'r', encoding='utf-8') as f:
        data = json.load(f)
        article_data = pd.DataFrame(data)
    return article_data 

def clean_df(article_df):
    if article_df is None:
        return None

    # drop duplicates from crawled data
    article_data = article_df.drop_duplicates(subset='url', keep='first')
    article_data = article_data.drop_duplicates(subset=['title', 'source'], keep='first')
    article_data = article_data.dropna(subset=['content'])

    def clean_text(text):
        if not isinstance(text, str):
            return ""
        text = text.lower()
        text = re.sub(r'http\S+|www\S+|https\S+', '', text)
        text = re.sub(r'\W+', ' ', text)
        tokens = word_tokenize(text)
        tokens = [word for word in tokens if word not in stop_words]
        tokens = [lemmatizer.lemmatize(word) for word in tokens]
        return ' '.join(tokens)

    article_data['cleaned_content'] = article_data['content'].apply(clean_text)
    article_data['snippet'] = article_data['title'] + " " + article_data['cleaned_content'].str[:300]
    return article_data

def find_topics(article_df):
    # include bigrams and unigrams
    vectorizer_model = CountVectorizer(ngram_range=(1, 2))
    topic_model = BERTopic(
        calculate_probabilities=True,
        min_topic_size=5,
        vectorizer_model=vectorizer_model
    )

    topics, probs = topic_model.fit_transform(article_df['snippet'])
    article_df["topic"] = topics

    topic_labels = topic_model.generate_topic_labels(nr_words=5, separator=" ")
    topic_model.set_topic_labels(topic_labels)

    return article_df, topic_model

def filter_topics(article_data, topic_model):

    topic_info = topic_model.get_topic_info()
    top_topics = topic_info.sort_values(by="Count", ascending=False).index
    print(f"Top topics: {top_topics}")

    # garbage key words that the crawler can fail on
    crossword_words = ['newsletter', 'book', 'signup', 'sign-up', 'daily', 'time', 'bbc', 'sign up', 'crossword', 'atlantic', 'best', 'the', 'weekday', 'puzzle', 'new york']
    ad_words = ['ad', 'video', 'content', 'video content', 'loading video', 'ad audio', 'relevant ad', 'advertisement']
    advice_words = ['time', 'dear', 'life', 'question', 'advice', 'prudence']
    bad_sets = [crossword_words, ad_words, advice_words]
    
    filtered_topics = []
    for topic in top_topics:

        # eliminate -1 topic
        if topic == -1:
            print(f"Removed topic: {topic} due to outliers/noise")
            continue

        # eliminate topics where most articles are from same source
        articles_in_topic = article_data[article_data["topic"] == topic]
        source_counts = articles_in_topic["source"].value_counts(normalize=True)
        if source_counts.max() >= 0.5:
            print(f"Removed topic: {topic} due to same source bias")
            continue

        # eliminate topics with garbage key words
        topic_representation = topic_info[topic_info['Topic'] == topic]['Representation'].values
        if len(topic_representation) > 0:
            topic_words = set(topic_representation[0])
            remove_topic = False
            for bad_set in bad_sets:
                unwanted_count = len(topic_words.intersection(bad_set))
                if unwanted_count >= 4:
                    remove_topic = True
                    print(f"Removed topic {topic}: {topic_words}, due to garbage key words")
                    break

            if remove_topic:
                continue
            
        # else add the topic-passed validations
        filtered_topics.append(topic)


    # filter out articles that are not in the top topics
    article_data = article_data[article_data["topic"].isin(filtered_topics[:NUM_TOPICS])]

    return filtered_topics[:NUM_TOPICS], article_data

def find_rep_article(filtered_topics, topic_model, article_data):
    representative_articles = {}

    # Retrieve representative articles for each top 10 topic
    for topic in filtered_topics:
        representative_docs = topic_model.get_representative_docs(topic)
        if representative_docs is None:
            representative_docs = []
        rep_articles_info = article_data[article_data['snippet'].isin(representative_docs)]
        rep_articles_info = rep_articles_info[["url", "title", "source", "content", "imageUrl", "authors", "time"]]
        representative_articles[topic] = rep_articles_info.to_dict(orient="records")

    return representative_articles

def format_response(rep_article_urls, article_data):
    fields_to_keep = ["url", "title", "source", "content", "imageUrl", "authors", "time"]
    cluster_groups = {}

    # Organize articles by cluster
    for _, article in article_data.iterrows():
        cluster_id = article["topic"]
        if cluster_id not in cluster_groups:
            cluster_groups[cluster_id] = []
        cluster_groups[cluster_id].append(article[fields_to_keep])

    # first three articles per cluster are representatives
    for cluster_id, articles in cluster_groups.items():
        rep_for_cluster = rep_article_urls.get(cluster_id, []) 
        non_rep_articles = [article for article in articles if article["url"] not in rep_for_cluster]
        cluster_groups[cluster_id] = rep_for_cluster[:3] + non_rep_articles

    # response format for app.py
    response = {
        "clustered_articles": cluster_groups
    }
    return response


def news_pipeline(file):
    article_data = load_data(file)
    cleaned_data = clean_df(article_data)
    cleaned_data, topic_model = find_topics(cleaned_data)
    filtered_topics, cleaned_data = filter_topics(cleaned_data, topic_model) # applies num topics param
    rep_articles = find_rep_article(filtered_topics, topic_model, cleaned_data)
    resp = format_response(rep_articles, cleaned_data)    
    return resp

def main():
    file = r"C:\Users\jared\OneDrive\Desktop\bitewise\python-api\data\articles_data.json"
    news_pipeline(file)

if __name__ == "__main__":
    main()


### HELPER FUNCTION ###
def remove_articles_by_source(input_file, output_file, source_to_remove):
    # Read the JSON data
    with open(input_file, 'r', encoding='utf-8') as f:
        articles_data = json.load(f)
    
    # Filter out articles with the specified source
    filtered_articles = [
        article for article in articles_data if article.get('source') != source_to_remove
    ]
    
    # Save the cleaned data back to a new file (or overwrite the original file)
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(filtered_articles, f, indent=4, ensure_ascii=False)
    
    print(f"Removed articles from source: {source_to_remove}")
    print(f"Remaining articles: {len(filtered_articles)}")

# path = r"C:\Users\jared\OneDrive\Desktop\bitewise\python-api\data\articles_data.json"
# source_to_remove = 'https://arstechnica.com'
# remove_articles_by_source(path, path, source_to_remove)
