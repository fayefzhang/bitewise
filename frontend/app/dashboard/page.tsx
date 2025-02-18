"use client";

import Header from "../components/header";
import TopicsArticles from './components/topicsarticles';
import LocalNews from './components/localnews';
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

const readTimeLabels = ["<2 min", "2-7 min", "7+ min"];
const biasRatingLabels = ["Left", "Left-Center", "Center", "Right-Center", "Right", "Unknown"];
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

const NewsSection: React.FC<NewsSectionProps> = ({ header, summary, articles, handleArticleClick }) => {
  return (
    <section className="mb-8">
      <h2 className="text-xl font-bold mb-2">{header}</h2>
      <p className="mb-4">{summary}</p>  
      <div className="flex space-x-4">
        <div className="flex w-full">
            <div className="w-2/5 pr-4 flex items-center">
            <div className="relative w-full h-full mb-2 flex items-center justify-center">
              <Image
              src={articles[1].imageUrl}
              alt={articles[1].title}
              fill
              sizes="(max-width: 768px) 100vw, 33vw"
              className="rounded-md object-cover"
              />
            </div>
            </div>
          <div className="w-3/5 flex flex-col space-y-4">
            {articles.slice(0, 3).map((article, index) => (
                <div
                key={index}
                className="bg-white p-2 rounded-md shadow cursor-pointer"
                onClick={() => handleArticleClick(article)}
                >
                <p className="text-sm font-bold">{article.title}</p>
                <div>
                  <div className="flex justify-between mt-1">
                  <p className="text-xs">{article.source}</p>
                  <p className="text-xs">{article.authors[0]}</p>
                  </div>
                  <div className="flex justify-between mt-1">
                  <p className="text-xs">{article.biasRating !== "5" && biasRatingLabels[parseInt(article.biasRating, 10)]}</p>
                  <p className="text-xs">{readTimeLabels[parseInt(article.readTime, 10)]}</p>
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

  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);


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
        }
      };
  
      fetchArticleSummary();
    }, [selectedArticle]);

  useEffect(() => {
    const fetchNews = async () => {
      const news = await fetchDailyNews();

      console.log(news);

      setDailyNews(news);
      setDailySummary(news.summary)
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
            <h1 className="text-2xl font-bold">
            Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}!
            </h1>
          <p className="text-lg mt-4 mb-4">{dailySummary}</p>

          {/* Audio Summary */}
          <audio controls className="mt-2 w-full">
            <source src="http://localhost:3000/api/audio?filename=podcast_aefd727d6bbc48c69712aaee79f4114d.mp3" type="audio/mpeg" />
            {/* Replace with actual audio file */}
            Your browser does not support the audio element.
          </audio>
          <button className="flex items-center hover:underline mb-8">
            <svg
              className="w-6 h-6 mr-2"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M12 3v10.55a4 4 0 1 0 2 0V3h-2zm-7 6.5v2h2V9.5a7 7 0 1 1 10 0v2h2v-2a9 9 0 1 0-14 0z" />
            </svg>
            Listen to your daily bites: 4:41 min
          </button>

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
                articles={cluster.articles.slice(0, 3)} // Use the first 3 articles
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
