"use client";

import Header from "../components/header";
import Image from "next/image";
import { Key, useState, useEffect } from "react";
import { useSearchParams, usePathname, useRouter } from "next/navigation";

interface Article {
  id: Key | null | undefined;
  url: string;
  imageUrl: string;
  title: string;
  source: string;
  content: string;
  time: string;
  bias: string;
  readTime: string;
  relatedSources: RelatedSource[];
  details: string[];
  fullContent: string;
}

interface RelatedSource {
  id: Key | null | undefined;
  title: string;
  source: string;
  time: string;
  bias: string;
}

interface Summary {
  title: string;
  summary: string;
}

const SearchPage: React.FC = () => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  const searchParams = useSearchParams();

  const BASE_URL: string = "http://localhost:3000";

  // default AI and search preferences
  const AIPreferences = {
    length: "short",  // options: {"short", "medium", "long"}
    tone: "formal",  // options: {"formal", "conversational", "technical", "analytical"}
    format: "highlights",  // options: {"highlights", "bullets", "analysis", "quotes"} 
    jargon_allowed: true,  // options: {True, False}
  };

  const searchPreferences = {
    sources: null, // for daily news
    domains: null, // theoretically same as sources, will add in code later to go from one to another so we only need one
    exclude_domains: null,
    from_date: null, // this defaults to past 7 days in newsapi code
    read_time: null,
    bias: null
  };

  useEffect(() => {
    const query = searchParams.get("query");
    if (query) {
      // USING SAMPLE DATA
      const sampleRelatedSource = {
        id: 1,
        title: "Chancellor Scholz...",
        source: "Reuters",
        time: "1 hr ago",
        bias: "LEAN RIGHT",
      };

      const sampleArticle = {
        id: 1,
        url: "https://www.cnbc.com/2022/12/07/germanys-ruling-coalition-collapses-as-chancellor-scholz-fires-finance-minister.html",
        imageUrl: "/article-thumbnail.jpg",
        title:
          "Germany’s ruling coalition collapses as Chancellor Scholz fires finance minister",
        source: "CNBC",
        content: "Germany’s ruling coalition collapsed on Wednesday...",
        time: "5 hours ago",
        bias: "NEUTRAL",
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
          article: Object.fromEntries([
            [selectedArticle.title, selectedArticle.fullContent, selectedArticle.url]
          ]),          
          user_preferences: AIPreferences
        }

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
              details: [...prevArticle.details, data.summary]
            };
          });

        } catch(error) {
          console.error("Error processing article summary request", error);
        }
      }
    };

    fetchArticleSummary();
  }, [selectedArticle]);

  async function handleSearch(term: string) {
    const requestBody = {
      query: term,
      user_preferences: searchPreferences,
      ai_preferences: AIPreferences
    }

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
      const articlesData = data.articles
        .map((entry: any) => ({
          id: entry.id,
          url: entry.url,
          imageUrl: entry.urlToImage,
          title: entry.title,
          source: entry.source.name,
          content: entry.content,
          time: entry.time,
          bias: entry.bias,
          readTime: entry.readTime,
          relatedSources: entry.relatedSources,
          details: entry.details,
          fullContent: entry.fullContent,
        }));

      setArticles(articlesData);
      setSummary({
        title: term,
        summary: data.summary,
      });

    } catch (error) {
      console.error("Error processing search request", error);
    }
  }

  function handleArticleClick(article: Article) {
    setSelectedArticle(article);
    setIsPanelOpen(true); // Open panel
  }

  function closePanel() {
    setIsPanelOpen(false); // Close panel
  }

  return (
    <div className="bg-gray-100 min-h-screen p-4 md:p-8 text-black">
      <div className="max-w-7xl mx-auto bg-white rounded-lg shadow-md overflow-hidden">
        <Header onSearch={handleSearch} placeholder="Search topic..." />

        {/* Main Content */}
        <main className="p-4 md:p-8">
          <section className="flex-1">
            {summary && articles.length > 0 ? (
              <>
                <section className="mb-8">
                  <h1 className="text-2xl font-bold">{summary.title}</h1>
                  <p className="text-gray-600 mt-2">{summary.summary}</p>
                </section>
                <section>
                  {articles.map((article) => (
                    <div
                      key={article.id}
                      className="mt-6 cursor-pointer"
                      onClick={() => handleArticleClick(article)}
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
                          <h2 className="font-bold text-lg">{article.title}</h2>
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
            className={`aside-panel ${
              isPanelOpen ? "open" : ""
            } w-full md:w-64 bg-blue-50 p-4 rounded-lg`}
          >
            <button onClick={closePanel} className="p-2 bg-gray-200 rounded-md">
              Close
            </button>
            {selectedArticle && (
              <>
                <h2 className="font-bold">{selectedArticle.title}</h2>
                <p className="text-gray-500">
                  {selectedArticle.source} • {selectedArticle.time}
                </p>
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
                          className="rounded-lg p-2 shadow-md  w-full h-full text-center bg-white"
                        >
                          <div className="flex-wrap items-center">
                            <p className="text-xs text-gray-500">{source.title}</p>
                            <p className="text-xs text-gray-500">{source.source}</p>
                            <p className="text-xs text-gray-500">{source.time}</p>
                            <p className="text-xs font-bold text-blue-600">
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
    </div>
  );
};

export default SearchPage;
