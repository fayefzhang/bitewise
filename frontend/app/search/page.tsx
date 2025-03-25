"use client";

import { useState, useEffect, useRef } from "react";
import { AdvancedSearchPreferences, Article, Summary } from "../common/interfaces";
import Spinner from "../common/Spinner";
import { defaultSearchPreferences } from "../common/utils";
import Header from "../components/header";
import Sidebar from "../search/sidebar";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { fetchArticleSummary, handleSearch } from "./searchUtils";
import { defaultAIPreferences } from "../common/utils";
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import SpeedIcon from '@mui/icons-material/Speed';
import Tooltip from '@mui/material/Tooltip';

const readTimeLabels = ["Short", "Medium", "Long"];
const biasRatingLabels = ["Left", "Left-Center", "Center", "Right-Center", "Right", ""];

const SearchPage: React.FC = () => {
  const router = useRouter();

  const [articles, setArticles] = useState<Article[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [selectedArticleUrl, setSelectedArticleUrl] = useState<string | null>(
    null
  );
  const [searchTerm, setSearchTerm] = useState<string>("");

  const [headerPreferences, setHeaderPreferences] = useState<AdvancedSearchPreferences>(
    defaultSearchPreferences
  );
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const BASE_URL: string = "http://localhost:3000";

  const previousSelectedArticle = useRef(selectedArticle ? selectedArticle.url : "");

  const userEmail = localStorage.getItem("userEmail");
    const storedPreferences = userEmail
      ? JSON.parse(localStorage.getItem(`preferences_${userEmail}`) || "{}")
      : {};
  
    const [aiPreferences, setAIPreferences] = useState({
      length: storedPreferences.length || defaultAIPreferences.length,
      tone: storedPreferences.tone || defaultAIPreferences.tone,
      format: storedPreferences.format || defaultAIPreferences.format,
      jargon_allowed:
        storedPreferences.jargon_allowed ?? defaultAIPreferences.jargon_allowed,
    });

  useEffect(() => {
    if (selectedArticle && selectedArticle.url !== previousSelectedArticle.current) {
      console.log("fetch from search");
      fetchArticleSummary(selectedArticle, setSelectedArticle, aiPreferences);
      previousSelectedArticle.current = selectedArticle.url;
    }
  }, [selectedArticle]);

  // programatic search by entering a specific url
  useEffect(() => {
    const queryParams = new URLSearchParams(window.location.search)

    const query = queryParams.get("query");

    const fromDate = queryParams.get("from_date");
    const toDate = queryParams.get("to_date");
    const readTime = queryParams.get("read_time")?.split(",") || [];
    const bias = queryParams.get("bias")?.split(",") || [];
    const clustering = queryParams.get("clustering") === "true"; // Expecting "true" or "false"

    const preferences = {
      from_date: fromDate || "",
      to_date: toDate || "",
      read_time: readTime,
      bias: bias,
      clustering: clustering,
    };

    if (query) {
      console.log("searching query: ", query);
      if (preferences) {
        handleSearchWithLoading(query, preferences);
      } else {
        handleSearchWithLoading(query);
      }
    }
  }, []);

  // Debug log to see when preferences change
  useEffect(() => {
    console.log("headerPreferences updated:", headerPreferences);
  }, [headerPreferences]);

  function setPreferences(preferences: AdvancedSearchPreferences) {
    setHeaderPreferences(preferences);
  }

  async function handleSearchWithLoading(term: string, preferences?: AdvancedSearchPreferences) {
    setIsLoading(true);
    try {
      // console.log("headerPreferences in handleSearchWithLoading():, ", headerPreferences);
      if (preferences) {
        await handleSearch(term, preferences, aiPreferences, setArticles, setSummary, setIsLoading, () =>
          closePanel()
        );
      } else {
        await handleSearch(term, headerPreferences, aiPreferences, setArticles, setSummary, setIsLoading, () =>
          closePanel()
        );
      }
    } catch (error) {
      console.error("Error during search:", error);
      // Provide feedback to the user
      alert("An error occurred while processing your request. Please try again later.");
    }
  }

  function handleArticleClick(article: Article) {
    if (isPanelOpen) {
      closePanel();
    } else {
      setSelectedArticle(article);
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

  return (
    <div className="w-full min-h-screen mx-auto bg-veryLightBlue">
      <Header
        onSearch={(term) => handleSearchWithLoading(term)}
        setPreferences={setPreferences}
        placeholder="Search topic..."
        isSearchPage={true}
      />

      {/* Main Content */}
      <div className="w-[80%] min-h-screen mx-auto text-black">
      <main className="p-4 md:p-8 main-content flex">
        <section
          className={`transition-all duration-300 ease-in-out ${
            isPanelOpen ? "w-[70%]" : "w-full"
          }`}
        >
          <section className="mb-8">
            {summary ? (
              <>
                <h1 className="text-2xl font-bold">{summary.title}</h1>
                <p className="mt-6 mb-8 text-sm">{summary.summary}</p>
              </>
            ) : articles.length > 0 && (
              <p className="flex"><Spinner /> Loading summary...</p>
            )}
          </section>

          <section>
            {isLoading ? (
              <p className="text-center mt-16 flex items-center justify-center">
                <Spinner /> Searching...
              </p>
            ) : articles.length > 0 ? (
              articles.map((article, index) => (
                <div
                key={index}
                className="bg-white p-1 px-4 rounded-md shadow cursor-pointer hover:bg-veryLightBlue mb-2"
                onClick={() => handleArticleClick(article)}
                onDoubleClick={() => handleArticleDoubleClick(article)}
                >
                <div className="flex grow items-center space-x-4">
                    <Image
                      src={article.imageUrl || "/bitewise_logo.png"}
                      alt="article thumbnail"
                      width={80}
                      height={50}
                      className="rounded-lg"
                      style={{ width: "80px", height: "50px", objectFit: "cover" }}
                    />
                    <div className="flex-grow">
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
                          <SpeedIcon sx={{ fontSize: "10px" }}/>
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
                </div>
              </div>
              ))
            ) : (
              <p className="text-center mt-16"></p>
            )}
          </section>
        </section>

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

export default SearchPage;