"use client";

import { Preferences, Article, Summary } from '../common/interfaces';
import { toTitleCase } from '../common/utils'
import Header from "../components/header";
import Image from "next/image";
import { Key, useState, useEffect } from "react";
import { useSearchParams, usePathname, useRouter } from "next/navigation";

const SearchPage: React.FC = () => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [selectedArticleId, setSelectedArticleId] = useState<number | null>(
    null
  );
  const [headerPreferences, setHeaderPreferences] = useState<Preferences | null> (null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  const searchParams = useSearchParams();

  const BASE_URL: string = "http://localhost:3000";

  // default AI and search preferences
  const AIPreferences = {
    length: "short", // options: {"short", "medium", "long"}
    tone: "formal", // options: {"formal", "conversational", "technical", "analytical"}
    format: "highlights", // options: {"highlights", "bullets", "analysis", "quotes"}
    jargon_allowed: true, // options: {True, False}
  };

  const searchPreferences = {
    sources: null, // for daily news
    domains: null, // theoretically same as sources, will add in code later to go from one to another so we only need one
    exclude_domains: null,
    from_date: null, // this defaults to past 7 days in newsapi code
    read_time: null,
    bias: null,
  };

  useEffect(() => {
    const query = searchParams.get("query");
    if (query) {
      // USING SAMPLE DATA
      const sampleRelatedSource = {
        id: 1,
        title: "Chancellor Scholz...",
        source: "Reuters",
        date: "1 hr ago",
        bias: "right-center",
      };

      const sampleArticle = {
        id: 1,
        url: "https://www.cnbc.com/2022/12/07/germanys-ruling-coalition-collapses-as-chancellor-scholz-fires-finance-minister.html",
        imageUrl: "/article-thumbnail.jpg",
        title:
          "Germany’s ruling coalition collapses as Chancellor Scholz fires finance minister",
        source: "CNBC",
        content: "Germany’s ruling coalition collapsed on Wednesday...",
        date: "5 hours ago",
        bias: "center",
        readTime: "5 MIN READ",
        relatedSources: [sampleRelatedSource],
        details: [
          "Scholz sacks finance minister Lindner over budget disputes",
          "Scholz expected to lead minority government with Social Democrats and Greens",
          "To hold confidence vote in January triggering snap elections",
          "Political shake-up could benefit populist movements such as AfD",
          "Scholz to ask opposition conservatives for support",
        ],
        fullContent: "",
      };

      setArticles([sampleArticle]);
      setSummary({
        title: "Germany",
        summary:
          "Germany's ruling coalition collapses as Chancellor Scholz fires finance minister. Also, France and Germany hold talks over Trump election win and Germany's cabinet approves draft law on voluntary military service.",
      });
    } else {
      setArticles([]);
      setSummary(null);
    }
  }, [searchParams]);

  useEffect(() => {
    // Get article summary if not already done
    const fetchArticleSummary = async () => {
      if (selectedArticle?.details.length === 0) {
        const articleBody = {
          article: {
            title: selectedArticle.title,
            fullContent: selectedArticle.fullContent,
            url: selectedArticle.url,
          },
          ai_preferences: AIPreferences,
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
              details: [...prevArticle.details, data.summary],
            };
          });
        } catch (error) {
          console.error("Error processing article summary request", error);
        }
      }
    };

    fetchArticleSummary();
  }, [selectedArticle, AIPreferences]);

  async function setPreferences(preferences: Preferences) {
    console.log("frontend page after search\n", headerPreferences);
    setHeaderPreferences(preferences);
  }

  async function handleSearch(term: string) {
    const requestBody = {
      query: term,
      search_preferences: searchPreferences,
      ai_preferences: AIPreferences,
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
      const data = await response.json();

      // Process search results
      const articlesData = data.articles.map((entry: any) => ({
        id: entry.id,
        url: entry.url,
        imageUrl: entry.urlToImage,
        title: entry.title,
        source: entry.source.name,
        content: entry.content,
        date: entry.date,
        bias: entry.bias,
        readTime: entry.readTime,
        relatedSources: entry.relatedSources,
        details: entry.details,
        fullContent: entry.fullContent,
      }));

      setArticles(articlesData);
      setSummary({
        title: toTitleCase(term),
        summary: data.summary.summary,
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
      if (typeof article.id === "number") {
        setSelectedArticleId(article.id);
      } else {
        setSelectedArticleId(null); // Fallback for invalid id
      }
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
    setSelectedArticleId(null);
    setIsPanelOpen(false); // Close panel
  }

  return (
    <div className="w-full min-h-screen mx-auto bg-white">
      <Header onSearch={handleSearch} setPreferences={setPreferences} placeholder="Search topic..." />

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
                {articles.filter((article) => {
                  let readTime = true;
                  if (headerPreferences && headerPreferences.read_time != "") {
                    readTime = ((headerPreferences?.read_time == "Short" && article.readTime == "<2 min") || 
                    (headerPreferences?.read_time == "Medium" && article.readTime == "2-7 min") || 
                    (headerPreferences?.read_time == "Long" && article.readTime == ">7 min"));
                  }
                  return (headerPreferences?.bias == null || article.bias.includes(headerPreferences.bias.toLowerCase()) && readTime);
                })
                .map((article) => (
                  <div
                    key={article.id}
                    className={`mt-6 cursor-pointer border-2 rounded-lg transition-colors duration-300 ${
                      selectedArticleId === article.id
                        ? "border-blue-500 bg-blue-100"
                        : "border-transparent"
                    }`}
                    onClick={() => handleArticleClick(article)}
                    onDoubleClick={() => handleArticleDoubleClick(article)}
                  >
                    <div className="flex items-center space-x-4">
                      <Image
                        src="/bitewise_logo.png" // Replace with actual image path
                        alt="article thumbnail"
                        width={80}
                        height={50}
                        className="rounded-lg"
                      />
                      <div>
                        <p className="text-gray-500">{article.source}</p>
                        <h2 className="font-bold text-lg text-black">
                          {article.title}
                        </h2>
                        <p className="text-gray-500 text-sm">
                          {article.bias} • {article.readTime}
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

        {/* Sliding Panel */}
        <aside
          className={`text-black fixed right-0 top-24 h-[calc(100vh-4rem)] w-full md:w-[40%] lg:w-[30%] bg-blue-50 p-4 rounded-lg shadow-lg transition-transform duration-300 ease-in-out ${
            isPanelOpen ? "translate-x-0" : "translate-x-full"
          }`}
          style={{ zIndex: 50 }}
        >
          <button onClick={closePanel} className="p-2 text-gray-500 rounded-md">
            Close
          </button>
          {selectedArticle && (
            <>
              <h2 className="font-bold">{selectedArticle.title}</h2>
              <p className="text-gray-500">
                {selectedArticle.source} • {selectedArticle.date}
              </p>
              <a
                href={selectedArticle.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block mt-4 text-blue-500 hover:underline"
              >
                Read Full Article
              </a>
              <audio controls className="mt-2 w-full">
                <source src="/audio-summary.mp3" type="audio/mpeg" />{" "}
                {/* Replace with actual audio file */}
                Your browser does not support the audio element.
              </audio>
              <ul className="mt-4 list-disc list-inside space-y-2">
                {selectedArticle.details.map((detail, index) => (
                  <li key={index} className="text-gray-700 text-sm">
                    {detail}
                  </li>
                ))}
              </ul>
              {/* Related Articles */}
              {selectedArticle.relatedSources.length > 0 && (
                <>
                  <h3 className="mt-6 font-bold">Related Articles</h3>
                  <p className="text-sm text-gray-500">
                    Explore a more conservative viewpoint.
                  </p>
                  <div className="mt-2 grid grid-cols-1 gap-2">
                    {selectedArticle.relatedSources.map((source) => (
                      <div
                        key={source.id}
                        className="rounded-lg p-2 shadow-md w-full h-full text-center bg-white"
                      >
                        <div className="flex-wrap items-center text-xs">
                          <p className="text-gray-500">{source.title}</p>
                          <p className="text-gray-500">{source.source}</p>
                          <p className="text-gray-500">{source.date}</p>
                          <p className="font-bold text-blue-600">
                            {source.bias}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </>
          )}
        </aside>
      </main>
    </div>
  );
};

export default SearchPage;
