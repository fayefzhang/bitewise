"use client";

import { AdvancedSearchPreferences, Article, Summary } from "../common/interfaces";
import {
  defaultAIPreferences,
  defaultSearchPreferences,
  toTitleCase,
} from "../common/utils";
import Header from "../components/header";
import Sidebar from "../search/sidebar";
import Image from "next/image";
import { useState, useEffect } from "react";

const readTimeLabels = ["<2 min", "2-7 min", "7+ min"];
const biasRatingLabels = ["Left", "Left-Center", "Center", "Right-Center", "Right", "Unknown"];

// const filterArticles = (
//   articles: Article[],
//   headerPreferences: Preferences | null
// ) => {
//   if (!headerPreferences) return articles;
//   return articles.filter((article) => {
//     let readTime = true;
//     let biasMatch = true;
//     let dateMatch = true;

//     // Read Time Filtering (Supports Multiple Selections)
//     if (headerPreferences?.read_time?.length > 0) {
//       readTime = headerPreferences.read_time.some(
//         (time) =>
//           (time === "Short" && article.readTime === "<2 min") ||
//           (time === "Medium" && article.readTime === "2-7 min") ||
//           (time === "Long" && article.readTime === ">7 min")
//       );
//     }

//     // Bias Filtering (Supports Multiple Selections)
//     if (headerPreferences?.bias?.length > 0) {
//       biasMatch = headerPreferences.bias.some((bias) =>
//         article.biasRating.includes(bias.toLowerCase())
//       );
//     }

//     // Date Filtering (Supports From and To Dates)
//     if (headerPreferences?.from_date) {
//       const articleDate = new Date(article.time).getTime();
//       const fromDate = new Date(headerPreferences.from_date).getTime();
//       if (articleDate < fromDate) {
//         dateMatch = false;
//       }
//     }

//     if (headerPreferences?.to_date) {
//       const articleDate = new Date(article.time).getTime();
//       const toDate = new Date(headerPreferences.to_date).getTime();
//       if (articleDate > toDate) {
//         dateMatch = false;
//       }
//     }

//     return (
//       biasMatch &&
//       readTime &&
//       dateMatch &&
//       (!headerPreferences?.clustering || article.cluster !== -1)
//     );
//   });
// };

const SearchPage: React.FC = () => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [selectedArticleUrl, setSelectedArticleUrl] = useState<string | null>(
    null
  );
  const [headerPreferences, setHeaderPreferences] = useState<AdvancedSearchPreferences>(
    defaultSearchPreferences
  );
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const BASE_URL: string = "http://localhost:3000";

  useEffect(() => {
    // Get article summary if not already done
    const fetchArticleSummary = async () => {
      if (selectedArticle?.summaries.length === 0) {
        const articleBody = {
          article: {
            title: selectedArticle.title,
            fullContent: selectedArticle.fullContent,
            url: selectedArticle.url,
          },
          ai_preferences: defaultAIPreferences,
        };

        try {
          const response = await fetch(`${BASE_URL}/api/summarize/article`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(articleBody),
          });
          const data = await response.json();

          setSelectedArticle((prevArticle) => {
            if (!prevArticle) return null;
            return {
              ...prevArticle,
              summaries: [...prevArticle.summaries, data.summary || data],
            };
          });
        } catch (error) {
          console.error("Error processing article summary request", error);
        }
      }
    };

    fetchArticleSummary();
  }, [selectedArticle]);

  async function setPreferences(preferences: AdvancedSearchPreferences) {
    setHeaderPreferences(preferences);
  }

  async function handleSearch(term: string) {
    const requestBody = {
      query: term,
      search_preferences: headerPreferences,
      ai_preferences: defaultAIPreferences,
      cluster: headerPreferences?.clustering,
    };

    // Clear existing content
    setArticles([]); // Clear articles
    setSummary(null); // Clear summary

    // Close article details sidebar
    closePanel();

    try {
      // Send search request to backend
      const response = await fetch(`${BASE_URL}/api/search`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });
      const searchData = await response.json();

      console.log("Raw search results (no filtering): ", searchData);

      const { bias, read_time, from_date } = headerPreferences || {};
      const hasFilters = (bias?.length || 0) > 0 || (read_time?.length || 0) > 0 || from_date;

      let filteredArticles = searchData || [];

      if (hasFilters) {
        const filterRequestBody = {
          articles: searchData.articles,
          filter_preferences: {
            bias: headerPreferences?.bias,
            maxReadTime: headerPreferences?.read_time,
            dateRange: headerPreferences?.from_date,
          },
        };
        console.log("Filtering", filterRequestBody);

        const filterResponse = await fetch(`${BASE_URL}/api/search/filter`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(filterRequestBody),
        });
    
        const filteredData = await filterResponse.json();
        filteredArticles = filteredData;

        console.log("Filtered search results: ", filteredArticles);
      }

      // Process search results
      const articlesData = filteredArticles.articles.map((entry: any) => ({
        id: entry.id,  // NO ID?
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
        fullContent: entry.fullContent,
        cluster: entry.cluster,
      }));

      setArticles(articlesData);
      setSummary({
        title: toTitleCase(term),
        summary: searchData.summary.summary,
      });
    } catch (error) {
      console.error("Error processing search request", error);
    }
  }

  function handleArticleClick(article: Article) {
    if (isPanelOpen) {
      closePanel();
    } else {
      setSelectedArticle(article);
      console.log("SELECT ARTICLE", article);
      console.log("SELECT ARTICLE ID", article.url);
      setSelectedArticleUrl(article.url);
      setIsPanelOpen(true); // Open panel
    }
  }

  function handleArticleDoubleClick(article: Article) {
    if (article.url) {
      window.open(article.url, "_blank"); // Open the URL in a new tab
    }
  }

  function closePanel() {
    setSelectedArticle(null);
    setSelectedArticleUrl(null);
    setIsPanelOpen(false); // Close panel
  }

  // const filteredArticles = filterArticles(articles, headerPreferences);

  return (
    <div className="w-full min-h-screen mx-auto bg-white">
      <Header
        onSearch={handleSearch}
        setPreferences={setPreferences}
        placeholder="Search topic..."
        isSearchPage={true}
      />

      {/* Main Content */}
      <main className="p-4 md:p-8 main-content flex">
        <section
          className={`transition-all duration-300 ease-in-out ${
            isPanelOpen ? "w-[70%]" : "w-full"
          }`}
        >
          {summary && articles.length > 0 ? (
            <>
              <section className="mb-8">
                <h1 className="text-2xl font-bold text-black">
                  {summary.title}
                </h1>
                <p className="text-gray-600 mt-2">{summary.summary}</p>
              </section>
              <section>
                {articles
                // .filter((article) => {
                //   let readTime = true;
                //   if (headerPreferences && headerPreferences.read_time != "") {
                //     readTime = ((headerPreferences?.read_time == "Short" && article.readTime == "<2 min") || 
                //     (headerPreferences?.read_time == "Medium" && article.readTime == "2-7 min") || 
                //     (headerPreferences?.read_time == "Long" && article.readTime == ">7 min"));
                //   }
                //   return (headerPreferences?.bias == null || article.bias.includes(headerPreferences.bias.toLowerCase()) && readTime && (!headerPreferences.clustering || article.cluster != -1));
                // })
                .map((article) => (
                  <div
                    key={article.url}
                    className={`mt-6 cursor-pointer border-2 rounded-lg transition-colors duration-300 ${
                      selectedArticleUrl === article.url
                        ? "border-blue-500 bg-blue-100"
                        : "border-transparent"
                    }`}
                    onClick={() => handleArticleClick(article)}
                    onDoubleClick={() => handleArticleDoubleClick(article)}
                  >
                    <div className="flex items-center space-x-4">
                      <Image
                        src={article.imageUrl || "/bitewise_logo.png"}
                        alt="article thumbnail"
                        width={80}
                        height={50}
                        className="rounded-lg"
                        style={{ width: "80px", height: "50px", objectFit: "cover" }}
                      />
                      <div>
                        <h2 className="font-bold text-lg text-black">
                          {article.title}
                        </h2>
                        <p className="text-gray-500">{article.source} • {article.time}</p>
                        <p className="text-gray-500 text-sm">
                          {biasRatingLabels[parseInt(article.biasRating, 10)]} • {readTimeLabels[parseInt(article.readTime, 10)]}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </section>
            </>
          ) : (
            <p className="text-gray-500 text-center mt-16">
              No results yet. Start by typing a search query.
            </p>
          )}
        </section>

        <Sidebar
          selectedArticle={selectedArticle}
          closePanel={closePanel}
          isPanelOpen={isPanelOpen}
        />
      </main>
    </div>
  );
};

export default SearchPage;
