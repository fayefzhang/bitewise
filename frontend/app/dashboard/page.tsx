"use client";

import Header from "../components/header";
import TopicsArticles from './components/topicsarticles';
import LocalNews from './components/localnews';
import { Key, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

const fetchDailyNews = async () => {
  const BASE_URL = "http://localhost:3000";

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

interface Article {
  url: string;
  image: string;
  title: string;
  source: string;
  sentiment: string;
  readTime: string;
  biasRating: string;
}

interface NewsSectionProps {
  header: string;
  summary: string;
  articles: Article[];
}

const NewsSection: React.FC<NewsSectionProps> = ({ header, summary, articles }) => {
  return (
    <section className="mb-8">
      <h2 className="text-xl font-bold">{header}</h2>
      <p className="mb-4">{summary}</p>  
      <div className="flex space-x-4">
        {articles.map((article, index) => (
            <Link
              key={index}
              href={article.url}
              className="bg-white p-4 rounded-md shadow w-1/3"
              target="_blank"
              rel="noopener noreferrer"
            >
              <div className="relative w-full h-32 mb-2">
              <Image
                src={article.image}
                alt={article.title}
                layout="fill"
                objectFit="cover"
                className="rounded-md"
              />
              </div>
              <p className="text-sm font-bold">{article.title}</p>
              <div>
                <p className="text-xs">{article.source}</p>
                <div className="flex justify-between mt-1">
                  {/* <p className="text-sm">{article.sentiment}</p> */}
                  <p className="text-sm">{article.biasRating}</p>
                  <p className="text-xs">{article.readTime}</p>
                </div>
              </div>
            </Link>
        ))}
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

  useEffect(() => {
    const fetchNews = async () => {
      const news = await fetchDailyNews();

      console.log(news);

      setDailyNews(news.clusterSummaries);
      setDailySummary(news.overall_summary)
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
          <h1 className="text-2xl font-bold">Good evening, USER.</h1>
          <p className="text-lg mb-4">
          {dailySummary}
          </p>

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
            dailyNews.map((cluster: any, index: any) =>
              cluster.cluster !== -1 ? (
                <NewsSection
                  key={index}
                  header={cluster.title}
                  summary={cluster.summary}
                  articles={cluster.articles.slice(0, 3)} // Use the first 3 articles
                />
              ) : null
            )
          )}
        </div>

        {/* Your + Local Topics */}
        <div className="w-full md:w-[30%] flex flex-col space-y-4">
          <TopicsArticles />
          <LocalNews />
        </div>
      </main>
    </div>
  );
};

export default DashboardPage;
