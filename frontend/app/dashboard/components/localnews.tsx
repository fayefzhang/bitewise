import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const BASE_URL = "http://localhost:3000";

interface ArticleEntryProps {
  title: string;
  description: string;
  link?: string;
}

const fetchLocalNews = async (location: string) => {

  try {
    const response = await fetch(`${BASE_URL}/api/local-news`, {
      method: "POST",
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        location: location,
      }),
    });
    if (!response.ok) {
      throw new Error("Failed to fetch local news");
    }
    return response.json();
  } catch (error) {
    console.error(error);
    return null;
  }
};

const LocalNews = () => {
  const router = useRouter();

  const [localNews, setLocalNews] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [location, setLocation] = useState<string>("Philadelphia");

  useEffect(() => {
    const userEmail = localStorage.getItem("userEmail");

    const getUserPreferences = async () => {
      try {
        if (userEmail) {
          const userPrefResponse = await fetch(
            `${BASE_URL}/api/user/preferences?email=${userEmail}`
          );
          if (!userPrefResponse.ok) {
            throw new Error("Failed to get existing user preferences");
          }
          const userPreferences = await userPrefResponse.json();
          setLocation(userPreferences.location);
        }
      } catch (error) {
        console.error("Error retrieving user preferences", error);
      }
    };

    getUserPreferences();
  }, []); // Runs only once on mount

  useEffect(() => {
    const fetchNews = async () => {
      const news = await fetchLocalNews(location);

      setLocalNews(news);
      setIsLoading(false);
    };

    fetchNews();
  }, [location]);

  return (
    <aside className="bg-white shadow p-4 rounded-lg max-h-[40vh]">
      <div className="sticky top-0 z-10 pb-2">
        <div className="flex justify-between items-center px-2">
          <h2 className="text-xl font-bold mb-2">Local News</h2>
          <h4 className="text-sm">📍 {location}</h4>
        </div>
        <div className="border-b-2 border-veryLightBlue mb-2 w-full"></div>
      </div>

      <div className="overflow-y-auto flex-grow pb-4 max-h-[28vh]">
        {isLoading || !localNews ? (
          <p>Loading...</p>
        ) : (
          localNews.clusters.map((cluster: any, index: any) => (
            <ArticleEntry
              key={index}
              title={localNews.clusterLabels[index]}
              description={localNews.clusterSummaries[index]}
            />
          ))
        )}
      </div>
    </aside>
  );
};

const ArticleEntry: React.FC<ArticleEntryProps> = ({
  title,
  description,
  link,
}) => {
  return (
    <div className="bg-white p-4 rounded-md shadow mb-4 hover:bg-veryLightBlue">
      <h4 className="font-bold text-sm mb-2">{title}</h4>
      <p className="text-sm">{description}</p>
    </div>
  );
};

export default LocalNews;
