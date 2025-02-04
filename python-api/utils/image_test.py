from newspaper import Article

def main():
    url = 'https://www.nytimes.com/2025/02/04/us/politics/trump-president-washington-dc.html'
    article = Article(url)
    article.download()
    article.parse()
    main_image = article.top_image
    print(main_image)


if __name__ == '__main__':
    main()