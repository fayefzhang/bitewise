"use client";

import Header from "../components/header";
import TopicsArticles from "./components/topicsarticles";
import LocalNews from "./components/localnews";
import { useState, useEffect } from "react";
import DatePicker from "react-datepicker";
import { biasRatingLabels, readTimeLabels, difficultyLabels } from "../common/utils";
import "react-datepicker/dist/react-datepicker.css";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import SpeedIcon from '@mui/icons-material/Speed';
import Tooltip from '@mui/material/Tooltip';

import { Article, AdvancedSearchPreferences } from "../common/interfaces";
import Sidebar from "../search/sidebar";
import {
  defaultAIPreferences,
  defaultSearchPreferences,
  toTitleCase,
} from "../common/utils";

const BASE_URL = "http://localhost:3000";

const fetchDailyNews = async (date?: string) => {
  try {
    const response = await fetch(`${BASE_URL}/api/daily-news`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date }),
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
    <section className="mb-8 bg-white p-5 rounded-md shadow cursor-pointer">
      <h2 className="text-xl font-bold mb-2">{header}</h2>
      <div className="border-b-2 border-veryLightBlue mb-4 w-full"/>
      <p className="mb-4 text-sm">{summary}</p>
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
                className="bg-white p-1 px-4  rounded-md shadow cursor-pointer hover:bg-veryLightBlue"
                onClick={() => handleArticleClick(article)}
              >
                <div className="flex justify-between mt-1">
                  <p className="text-xs">{article.source}</p>
                  <p className="text-xs">{article.authors[0]}</p>
                </div>
                <p className="text-sm font-bold">{article.title}</p>
                <div>
                <div className="flex justify-between mt-1">
                  {biasRatingLabels[parseInt(article.biasRating, 10)] ? (
                    <Tooltip title="Political Bias: The article and source's political leaning (Left, Left-Center, Center, Right-Center, or Right)" arrow>
                      <div className="flex items-center space-x-1 text-xs">
                      <SpeedIcon sx={{ fontSize: "10px" }} />
                      <p>{biasRatingLabels[parseInt(article.biasRating, 10)]}</p>
                      </div>
                    </Tooltip>
                    ) : (
                    <div className="flex items-center space-x-1 text-xs"></div>
                    )
                  }
                  <Tooltip title="Read Time: Estimated time to read the article (Short, Medium, or Long)" arrow>
                    <div className="flex items-center space-x-1 text-xs">
                      <AccessTimeIcon sx={{ fontSize: "10px" }} />
                      <p>{readTimeLabels[parseInt(article.readTime, 10)]}</p>
                    </div>
                  </Tooltip>
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
      const queryParams = new URLSearchParams({ query: term });
  
      if (headerPreferences) {
        if (headerPreferences.from_date) queryParams.append("from_date", headerPreferences.from_date);
        if (headerPreferences.to_date) queryParams.append("to_date", headerPreferences.to_date);
        if (headerPreferences.read_time.length) queryParams.append("read_time", headerPreferences.read_time.join(","));
        if (headerPreferences.bias.length) queryParams.append("bias", headerPreferences.bias.join(","));
        queryParams.append("clustering", String(headerPreferences.clustering)); // Convert boolean to string
      }
  
      console.log("about to push router")
      router.push(`/search?${queryParams.toString()}`);
    }
  };

  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [dailyNews, setDailyNews] = useState<any>(null);
  const [dailySummary, setDailySummary] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [dailyPodcast, setDailyPodcast] = useState<string>("");
  const [headerPreferences, setHeaderPreferences] = useState<AdvancedSearchPreferences>(
    defaultSearchPreferences
  );
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
      if (!dailyNews || !dailyNews.clusters || !dailyNews.summary) return; // wait for daily news to load

      if (dailyNews.podcast) {
        setDailyPodcast(dailyNews.podcast);
        console.log("set podcast from daily news", dailyNews.podcast);
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

  function setPreferences(preferences: AdvancedSearchPreferences) {
    setHeaderPreferences(preferences);
  }

  useEffect(() => {
    console.log("headerPreferences updated:", headerPreferences);
  }, [headerPreferences]);

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
              summaries: [...prevArticle.summaries, data.summary || data],
              difficulty: data.difficulty,
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
        setIsLoading(true);
        const formattedDate = selectedDate
          ? selectedDate.toISOString().split("T")[0]
          : undefined;

        const news = await fetchDailyNews(formattedDate);
        setDailyNews(news);
        setDailySummary(news?.summary || null);

        console.log("daily news", news);
        setIsLoading(false);
    };

    fetchNews();
  }, [selectedDate]);

  return (
    <div className="bg-veryLightBlue">
      <Header onSearch={handleSearch} setPreferences={setPreferences} placeholder="Search topic..." />
      <div className="w-[80%] min-h-screen mx-auto text-black">
        {/* Main Content */}
        <main className="py-2 md:py-8 flex flex-col md:flex-row space-y-6 md:space-y-0 md:space-x-12">
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
              <div className="flex justify-end">
                <DatePicker
                  selected={selectedDate}
                  onChange={(date: Date | null) => setSelectedDate(date)}
                  dateFormat="MMMM d, yyyy"
                  maxDate={new Date()} // Prevent selecting future dates
                  className="border p-2 rounded-md"
                />
              </div>
            </div>
            <p className="mt-6 mb-8 text-sm">{dailySummary}</p>

            {/* Audio Summary */}
            {dailyNews && dailyNews.summary ? (
              dailyPodcast ? (
                <audio controls className="mb-4 w-full">
                  <source src={dailyPodcast} type="audio/mpeg" />
                </audio>
              ) : (
                null
              )
            ) : null}

            {/* Dynamically Render News Sections */}
            {isLoading || !dailyNews ? (
              <p>Loading...</p>
            ) : dailyNews.clusters && dailyNews.clusters.length > 0 ? (
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
            ): (
              <p className="text-center text-gray-500 italic">
                No daily news dashboard for this date.
              </p>
            )}
          </div>

          {/* Your + Local Topics */}
          <div className="w-[30%] y-[80%] flex flex-col space-y-4">
            <div className="fixed w-[24%] flex flex-col space-y-4"> 
              <TopicsArticles />
              <LocalNews />
            </div>
          </div>

          <Sidebar
            selectedArticle={selectedArticle}
            setSelectedArticle={setSelectedArticle}
            closePanel={closePanel}
            isPanelOpen={isPanelOpen}
          />
        </main>
      </div>
    </div>
  );
};

export default DashboardPage;
