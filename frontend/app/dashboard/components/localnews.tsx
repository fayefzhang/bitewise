import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const location = "Philadelphia, PA";

interface ArticleEntryProps {
  title: string;
  description: string;
  link?: string;
}

const fetchLocalNews = async () => {
  const BASE_URL = "http://localhost:3000";

  try {
    const response = await fetch(`${BASE_URL}/api/local-news`, {
      method: "POST",
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
      },
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

  useEffect(() => {
    const fetchNews = async () => {
      const news = await fetchLocalNews();

      console.log(news);
      setLocalNews(news);
      setIsLoading(false);
    };

    fetchNews();
  }, []);

  return (
    <aside className="bg-white shadow p-4 rounded-lg max-h-[35vh]">
      <div className="sticky top-0 z-10 pb-2">
        <div className="flex justify-between items-center px-2">
          <h2 className="text-xl font-bold mb-2">Local News</h2>
          <h4 className="text-sm italic">{location}</h4>
        </div>
        <div className="border-b-2 border-veryLightBlue mb-2 w-full"></div>
      </div>

      <div className="overflow-y-auto flex-grow pb-4 max-h-[22vh]">
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
