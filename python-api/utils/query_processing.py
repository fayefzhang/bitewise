# NEED TO *pip3 install nltk* BEFORE THIS WILL WORK

import nltk
from nltk.corpus import stopwords
from nltk.tokenize import word_tokenize
from nltk.corpus import wordnet as wn
from nltk.stem import WordNetLemmatizer
from nltk.data import find
import string

import os
os.environ["TOKENIZERS_PARALLELISM"] = "false"

nltk.download('punkt')
nltk.download('stopwords')
nltk.download('wordnet')
nltk.download('omw-1.4')
nltk.download('punkt_tab')

lemmatizer = WordNetLemmatizer()

def parse_query(query: str) -> str:
    # nltk setup
    try:
        find('tokenizers/punkt')
    except LookupError:
        nltk.download('punkt')
    try:
        find('corpora/stopwords')
    except LookupError:
        nltk.download('stopwords')
    try:
        find('corpora/wordnet.zip')
    except LookupError:
        nltk.download('wordnet')
        nltk.download('omw-1.4')

    # 1. Tokenization
    tokens = word_tokenize(query)

    stop_words = set(stopwords.words('english'))
    punctuation = set(string.punctuation)

    # 2. Stopword removal
    tokens = [
        token for token in tokens
        if token not in stop_words and token not in punctuation
    ]

    # 3. Lemmatization
    tokens = [lemmatizer.lemmatize(token) for token in tokens]

    return " ".join(tokens)

# testing
if __name__ == '__main__':

    # result: happening israel hamas war

    print(parse_query("what is happening in the israel hamas war?"))

    # result: trump election
    print(parse_query("what will trump do after the election?"))

    # result: biggest election issue US
    print(parse_query("what are the biggest election issues in the US?"))