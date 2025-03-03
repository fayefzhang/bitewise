"use client";

import { useState, useEffect } from "react";
import { AdvancedSearchPreferences, Article, Summary } from "../common/interfaces";
import { defaultSearchPreferences } from "../common/utils";
import Header from "../components/header";
import Sidebar from "../search/sidebar";
import Image from "next/image";
import {
  fetchArticleSummary,
  handleSearch,
} from "./searchUtils";

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
    fetchArticleSummary(selectedArticle, setSelectedArticle);
  }, [selectedArticle]);

  async function setPreferences(preferences: AdvancedSearchPreferences) {
    setHeaderPreferences(preferences);
  }

  // Log timestamp when articles array gets updated
  useEffect(() => {
    if (articles.length > 0) {
      console.log(`[${new Date().toISOString()}] Articles updated:`, articles);
    }
  }, [articles]);

  // Log timestamp when summary gets updated
  useEffect(() => {
    if (summary) {
      console.log(`[${new Date().toISOString()}] Summary updated:`, summary);
    }
  }, [summary]);

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
        onSearch={(term) => handleSearch(term, headerPreferences, setArticles, setSummary, () => closePanel())}
        setPreferences={(preferences) => setPreferences(preferences)}
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
          <section className="mb-8">
            {summary ? (
              <>
                <h1 className="text-2xl font-bold text-black">{summary.title}</h1>
                <p className="text-gray-600 mt-2">{summary.summary}</p>
              </>
            ) : articles.length > 0 && (
              <p className="text-gray-400 italic">Loading summary...</p>
            )}
          </section>

          <section>
            {articles.length > 0 ? (
              articles.map((article) => (
                <div
                  key={article.url}
                  className={`mt-6 cursor-pointer border-2 rounded-lg transition-colors duration-300 ${
                    selectedArticleUrl === article.url ? "border-blue-500 bg-blue-100" : "border-transparent"
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
                      <h2 className="font-bold text-lg text-black">{article.title}</h2>
                      <p className="text-gray-500">{article.source} • {article.time}</p>
                      <p className="text-gray-500 text-sm">
                        {biasRatingLabels[parseInt(article.biasRating, 10)]} • {readTimeLabels[parseInt(article.readTime, 10)]}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center mt-16">No articles.</p>
            )}
          </section>
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
