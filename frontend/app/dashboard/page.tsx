"use client";

import Header from "../components/header";
import TopicsArticles from "./components/topicsarticles";
import LocalNews from "./components/localnews";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Article } from "../common/interfaces";
import Sidebar from "../search/sidebar";
import {
  defaultAIPreferences,
  defaultSearchPreferences,
  toTitleCase,
} from "../common/utils";

const BASE_URL = "http://localhost:3000";

const readTimeLabels = ["Short", "Medium", "Long"];
const biasRatingLabels = [
  "Left",
  "Left-Center",
  "Center",
  "Right-Center",
  "Right",
  "Unknown",
];
const difficultyLabels = ["Easy", "Medium", "Hard"];

const fetchDailyNews = async () => {
  try {
    const response = await fetch(`${BASE_URL}/api/daily-news`, {
      method: "POST",
      cache: "no-store",
    });
    if (!response.ok) {
      throw new Error("Failed to fetch daily news");
    }

    return response.json();
  } catch (error) {
    console.error(error);
    return null;
  }
};

interface NewsSectionProps {
  header: string;
  summary: string;
  articles: Article[];
  handleArticleClick: (article: Article) => void;
}

const NewsSection: React.FC<NewsSectionProps> = ({
  header,
  summary,
  articles,
  handleArticleClick,
}) => {
  return (
    <section className="mb-8">
      <h2 className="text-xl font-bold mb-2">{header}</h2>
      <p className="mb-4 text-justify">{summary}</p>
      <div className="flex space-x-4">
        <div className="flex w-full">
          {/* Image Section */}
          <div className="w-1/3 pr-4 flex items-center">
            <div className="relative w-full h-full flex items-center justify-center">
              <Image
                src={articles[1].imageUrl}
                alt={articles[1].title}
                fill
                sizes="(max-width: 768px) 100vw, 33vw"
                className="rounded-md object-cover"
              />
            </div>
          </div>

          {/* Scrollable Articles Section */}
          <div className="w-2/3 flex flex-col space-y-2 overflow-y-auto max-h-[15rem]">
            {articles.map((article, index) => (
              <div
                key={index}
                className="bg-white p-1 rounded-md shadow cursor-pointer hover:bg-blue-50"
                onClick={() => handleArticleClick(article)}
              >
                <div className="flex justify-between mt-1">
                  <p className="text-xs">{article.source}</p>
                  <p className="text-xs">{article.authors[0]}</p>
                </div>
                <p className="text-sm font-bold">{article.title}</p>
                <div>
                  <div className="flex justify-between mt-1">
                    <p className="text-xs">
                      {article.biasRating !== "5" &&
                        biasRatingLabels[parseInt(article.biasRating, 10)]}
                    </p>
                    <p className="text-xs">
                      {readTimeLabels[parseInt(article.readTime, 10)]}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

const DashboardPage: React.FC = () => {
  const router = useRouter();
  const handleSearch = (term: string) => {
    if (term) {
      router.push(`/search?query=${encodeURIComponent(term)}`);
    }
  };

  const [dailyNews, setDailyNews] = useState<any>(null);
  const [dailySummary, setDailySummary] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [dailyPodcast, setDailyPodcast] = useState<string>("");

  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  const fetchDailyPodcast = async (articles: string[]) => {
    console.log("generating daily podcast...");
    try {
      const response = await fetch(`${BASE_URL}/api/generate/podcast`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        cache: "no-store",
        body: JSON.stringify({ articles }),
      });
      if (!response.ok) {
        throw new Error("Failed to generate podcast");
      }

      return response.json();
    } catch (error) {
      console.error(error);
      return null;
    }
  };

  useEffect(() => {
    const fetchPodcast = async () => {
      if (!dailyNews) return; // wait for daily news to load

      if (dailyNews.podcast) {
        setDailyPodcast(dailyNews.podcast);
        return;
      }

      const articles = dailyNews.clusters.flatMap((cluster: any) =>
        cluster.articles.slice(0, 3).map((article: Article) => article.url)
      );

      const podcast = await fetchDailyPodcast(articles);
      setDailyPodcast(podcast.s3_url);

      console.log("PODCAST", podcast);
    };

    fetchPodcast();
  }, [dailyNews]);

  function handleArticleClick(article: Article) {
    if (isPanelOpen) {
      closePanel();
    } else {
      setSelectedArticle(article);
      setIsPanelOpen(true); // Open panel
    }
  }

  function closePanel() {
    setSelectedArticle(null);
    setIsPanelOpen(false); // Close panel
  }

  useEffect(() => {
    // Get article summary if not already done
    const fetchArticleSummary = async () => {
      if (selectedArticle?.summaries.length === 0) {
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
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(articleBody),
          });
          const data = await response.json();

          console.log("summary", data);

          setSelectedArticle((prevArticle) => {
            if (!prevArticle) return null;
            return {
              ...prevArticle,
              summaries: [...prevArticle.summaries, data.summary],
            };
          });
        } catch (error) {
          console.error("Error processing article summary request", error);
        }

        // generate audio summary
        // try {
        //   const response = await fetch(`${BASE_URL}/api/generate/audio`, {
        //     method: "POST",
        //     headers: {
        //       "Content-Type": "application/json",
        //     },
        //     body: JSON.stringify({
        //       title: selectedArticle.title,
        //       summary: selectedArticle.summaries[0],
        //     }),
        //   });

        //   const data = await response.json();
        //   console.log("summary podcast", data);
        // } catch (error) {
        //   console.error("Error processing article podcast request", error);
        // }
      }
    };

    fetchArticleSummary();
  }, [selectedArticle]);

  useEffect(() => {
    const fetchNews = async () => {
      const news = await fetchDailyNews();

      console.log(news);

      setDailyNews(news);
      setDailySummary(news.summary);
      setIsLoading(false);
    };

    fetchNews();
  }, []);

  return (
    <div className="w-full min-h-screen mx-auto bg-white text-black">
      <Header onSearch={handleSearch} placeholder="Search topic..." />

      {/* Main Content */}
      <main className="p-4 md:p-8 flex flex-col md:flex-row space-y-6 md:space-y-0 md:space-x-6">
        {/* Main Section */}
        <div className="flex-1 flex-col">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">
              Good{" "}
              {new Date().getHours() < 12
                ? "morning"
                : new Date().getHours() < 18
                ? "afternoon"
                : "evening"}
              !
            </h1>
            <p className="text-right italic">
              {new Date().toLocaleDateString("en-US", {
                month: "long",
                day: "2-digit",
                year: "numeric",
              })}
            </p>
          </div>
          <p className="mt-4 mb-4 text-justify">{dailySummary}</p>

          {/* Audio Summary */}
            {dailyPodcast ? (
            <audio controls className="mt-2 w-full">
              <source
              src={dailyPodcast}
              type="audio/mpeg"
              />
              Listen to your daily bites: 4:41 min
            </audio>
            ) : (
            <div className="flex mt-2 mb-4 italic">
              Loading your daily bites...
            </div>
            )}

          {/* Dynamically Render News Sections */}
          {isLoading || !dailyNews ? (
            <p>Loading...</p>
          ) : (
            dailyNews.clusters.map((cluster: any, index: any) =>
              cluster.cluster !== -1 ? (
                <NewsSection
                  key={index}
                  header={dailyNews.clusterLabels[index]}
                  summary={dailyNews.clusterSummaries[index]}
                  articles={cluster.articles}
                  handleArticleClick={handleArticleClick}
                />
              ) : null
            )
          )}
        </div>

        {/* Your + Local Topics */}
        <div className="w-full md:w-[30%] flex flex-col space-y-4">
          <div className="fixed space-y-4 pr-4 max-w-full md:max-w-[30%]">
            <TopicsArticles />
            <LocalNews />
          </div>
        </div>

        <Sidebar
          selectedArticle={selectedArticle}
          closePanel={closePanel}
          isPanelOpen={isPanelOpen}
        />
      </main>
    </div>
  );
};

export default DashboardPage;
