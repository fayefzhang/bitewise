# NEED TO *pip3 install nltk* BEFORE THIS WILL WORK

import nltk
from nltk.corpus import stopwords
from nltk.tokenize import word_tokenize
from nltk.stem import WordNetLemmatizer
from nltk.data import find
import string

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
    lemmatizer = WordNetLemmatizer()
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