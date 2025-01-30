import React, { useEffect, useState } from 'react';
import { useRouter } from "next/navigation";
import Link from 'next/link';

const location = "Philadelphia, PA";

interface ArticleEntryProps {
    title: string;
    description: string;
    link?: string; 
}

const fetchLocalNews = async () => {
    const BASE_URL = "http://localhost:3000";

    try {
        const response = await fetch(`${BASE_URL}/api/daily-news`, {
        method: "POST",
        cache: "no-store",
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ local: true })
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
        <aside className="bg-blue-50 p-4 rounded-lg max-h-[250px] overflow-y-auto">
            <h2 className='text-lg font-bold mb-2'>Local News</h2>
            <h4 className="font-semibold italic">{location}</h4>

            {isLoading || !localNews ? (
            <p>Loading...</p>
          ) : (
            localNews.map((cluster: any, index: any) =>
                <ArticleEntry 
                    key={index}
                    title={""}
                    description={cluster.summary}
                />
            )
          )}
        </aside>
    );
};

const getFormattedDate = (): string => {
    const today = new Date();
    const options: Intl.DateTimeFormatOptions = { month: 'long', day: '2-digit', year: 'numeric' };
    return today.toLocaleDateString('en-US', options);
};

const ArticleEntry: React.FC<ArticleEntryProps>  = ({ title, description, link }) => {
    return (
      <div className="bg-white p-4 rounded-md shadow mb-4">
        <h4 className="font-semibold">{title}</h4>
        <p className="text-sm">{description}</p>
      </div>
    );
};

export default LocalNews;