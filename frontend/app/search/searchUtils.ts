import { Article, Summary, AdvancedSearchPreferences } from "../common/interfaces";
import { defaultAIPreferences, toTitleCase } from "../common/utils";

const BASE_URL = "http://localhost:3000";

export async function fetchArticleSummary(selectedArticle: Article | null, setSelectedArticle: Function) {
  if (!selectedArticle || selectedArticle.summaries.length > 0) return;

  const articleBody = {
    article: {
      title: selectedArticle.title,
      content: selectedArticle.content,
      url: selectedArticle.url,
    },
    ai_preferences: defaultAIPreferences,
  };

  try {
    const response = await fetch(`${BASE_URL}/api/summarize/article`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(articleBody),
    });

    const data = await response.json();

    setSelectedArticle((prevArticle: Article | null) => {
      if (!prevArticle) return null;
      return {
        ...prevArticle,
        summaries: [...prevArticle.summaries, data.summary || data],
        s3Url: data.s3Url || null,
      };
    });
  } catch (error) {
    console.error("Error processing article summary request", error);
  }
}

export async function handleSearch(
  term: string,
  headerPreferences: AdvancedSearchPreferences,
  setArticles: Function,
  setSummary: Function,
  closePanel: Function,
) {
  const requestBody = {
    query: term,
    search_preferences: headerPreferences,
    ai_preferences: defaultAIPreferences,
    cluster: headerPreferences?.clustering,
  };

  setArticles([]);
  setSummary(null);
  closePanel();

  try {
    const articlesResponse = await fetch(`${BASE_URL}/api/search`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    });
    const searchData = await articlesResponse.json();

    console.log("Raw search results (no filtering): ", searchData);

    let filteredArticles = searchData.articles || [];

    if (headerPreferences?.bias?.length || headerPreferences?.read_time?.length || headerPreferences?.from_date) {
      const filterResponse = await fetch(`${BASE_URL}/api/search/filter`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          articles: searchData.articles,
          filter_preferences: {
            bias: headerPreferences?.bias,
            maxReadTime: headerPreferences?.read_time,
            dateRange: headerPreferences?.from_date,
          },
        }),
      });

      const filteredData = await filterResponse.json();
      filteredArticles = filteredData;
      console.log("Filtered search results: ", filteredArticles);
    }

    const articlesData = filteredArticles.map((entry: any) => ({
      id: entry.id,
      url: entry.url,
      authors: entry.authors,
      imageUrl: entry.imageUrl,
      title: entry.title,
      source: entry.source,
      content: entry.content,
      time: entry.datePublished,
      biasRating: entry.biasRating,
      readTime: entry.readTime,
      relatedSources: entry.relatedSources,
      summaries: [],
      cluster: entry.cluster,
    }));

    setArticles(articlesData); // updates the articles on the frontend

    if (articlesData.length > 4) {
      fetchSummariesForFirstFive(articlesData, setArticles);
    }

    const summaryRequestBody = { // passing in the first 5 articles
        articles: articlesData.slice(0, 5),
            ai_preferences: defaultAIPreferences,
      };

    const summaryResponse = await fetch(`${BASE_URL}/api/search/query-summary`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(summaryRequestBody),
      });

    const summaryData = await summaryResponse.json()

    setSummary({ // updates the summary on the frontend
      title: toTitleCase(term),
      summary: summaryData.summary,
    });
  } catch (error) {
    console.error("Error processing search request", error);
  }
}

export async function fetchSummariesForFirstFive(articlesToProcess: Article[], setArticles: Function) {
  const updatedArticles = [...articlesToProcess];

  const requests = updatedArticles.slice(0, 5).map(async (article, index) => {
    if (article.summaries.length === 0) {
      try {
        const response = await fetch(`${BASE_URL}/api/summarize/article`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            article: { title: article.title, content: article.content, url: article.url },
            ai_preferences: defaultAIPreferences,
          }),
        });

        const data = await response.json();

        updatedArticles[index] = {
          ...article,
          summaries: [...article.summaries, data.summary || data],
        };
      } catch (error) {
        console.error("Error processing article summary request", error);
      }
    }
  });

  await Promise.all(requests);
  setArticles(updatedArticles);
}
