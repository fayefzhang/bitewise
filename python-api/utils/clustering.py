import re
import json
import pandas as pd
import numpy as np
import nltk
from nltk.corpus import stopwords
from nltk.tokenize import word_tokenize
from nltk.stem import WordNetLemmatizer
from sentence_transformers import SentenceTransformer
from sklearn.cluster import DBSCAN
from transformers import pipeline

nltk.download('punkt')
nltk.download('stopwords')
nltk.download('wordnet')
nltk.download('omw-1.4')

pd.set_option('display.max_colwidth', None)

model = SentenceTransformer('all-MiniLM-L6-v2')
dbscan = DBSCAN(eps=0.5, min_samples=3, metric='cosine')
dbscan2 = DBSCAN(eps=0.2, min_samples=5, metric='cosine') # for tighter clustering

def clean_text(text):
    if not isinstance(text, str):
        return ""
    text = text.lower()
    text = re.sub(r'http\S+|www\S+|https\S+', '', text)
    text = re.sub(r'\W+', ' ', text)
    tokens = word_tokenize(text)
    tokens = [word for word in tokens if word not in stopwords.words('english')]
    lemmatizer = WordNetLemmatizer()
    tokens = [lemmatizer.lemmatize(word) for word in tokens]
    return ' '.join(tokens)

def cluster_articles(search_data):
    articles_df = pd.json_normalize(search_data)
    articles_df['combined_text'] = articles_df['title'].fillna('') + ' ' + articles_df['description'].fillna('')
    articles_df['processed_text'] = articles_df['combined_text'].apply(clean_text)
    embeddings = model.encode(articles_df['processed_text'].fillna(''))
    clusters = dbscan.fit_predict(embeddings)
    articles_df['cluster'] = clusters
    # Convert clusters to JSON format
    # clusters_json = []
    # for cluster_id in sorted(articles_df['cluster'].unique()):
    #     cluster_articles = articles_df[articles_df['cluster'] == cluster_id]
    #     cluster_data = {
    #         "cluster_id": int(cluster_id),
    #         "articles": cluster_articles[['title', 'description', 'url']].to_dict(orient='records')
    #     }
    #     clusters_json.append(cluster_data)
    
    # return dict mapping article id to cluster
    # print("IN DBSCAN- CLUSTERS:")
    # print(clusters)
    id_to_cluster = dict(zip(articles_df['id'], articles_df['cluster']))

    return id_to_cluster

# should eventually refactor to combine with above function
def cluster_daily_news(filename):
    with open(filename, 'r', encoding='utf-8') as f:
        articles_data = json.load(f)
    articles_df = pd.json_normalize(articles_data)
    articles_df['combined_text'] = articles_df['title'].fillna('') + ' ' + articles_df['content'].fillna('')
    articles_df['processed_text'] = articles_df['combined_text'].apply(clean_text)
    embeddings = model.encode(articles_df['processed_text'].fillna(''))
    clusters = dbscan.fit_predict(embeddings)
    articles_df['cluster'] = clusters
    id_to_cluster = dict(zip(articles_df.index, articles_df['cluster']))
    return id_to_cluster

def extract_first_sentence(text):
    if not isinstance(text, str) or text.strip() == "":
        return ""
    sentences = nltk.sent_tokenize(text)
    return sentences[0] if sentences else ""

def cluster_daily_news_titles(filename):
    with open(filename, 'r', encoding='utf-8') as f:
        articles_data = json.load(f)
    articles_df = pd.json_normalize(articles_data)
    articles_df['first_sentence'] = articles_df['content'].fillna('').apply(extract_first_sentence)
    articles_df['combined_text'] = articles_df['title'].fillna('') + " " + articles_df['first_sentence'].fillna('')
    articles_df['processed_text'] = articles_df['combined_text'].apply(clean_text)
    embeddings = model.encode(articles_df['processed_text'].fillna(''))
    clusters = dbscan2.fit_predict(embeddings)
    articles_df['cluster'] = clusters
    id_to_cluster = dict(zip(articles_df.index, articles_df['cluster']))
    return id_to_cluster
