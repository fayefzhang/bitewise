import React, { useEffect, useState } from 'react';
import Link from 'next/link';

interface ArticleEntryProps {
    title: string;
    description: string;
    link?: string; 
}

const TopicsArticles = () => {

    const BASE_URL: string = "http://localhost:3000";
    const [preferences, setPreferences] = useState(null);
    const [topicArticles, setTopicArticles] = useState<any[]>([]);
    
    useEffect(() => {
        const getTopicsArticles = async () => {
            try {
                console.log("Fetching user preferences...");
                const preferencesResponse = await fetch(`${BASE_URL}/api/user/preferences?userID=TEST`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                });
                const rawData = await preferencesResponse.text();
                console.log("Raw user preferences response:", rawData);
                const data = JSON.parse(rawData);
                setPreferences(data);

                const fromDate = new Date();
                fromDate.setDate(fromDate.getDate() - 2);
                const formattedFromDate = fromDate.toISOString().split('T')[0];

                const searchPreferences = {
                    sources: null,
                    domains: null,
                    exclude_domains: null,
                    from_date: formattedFromDate,
                    read_time: null,
                    bias: null,
                };
                console.log("data.topics: " + data.topics);
                console.log("Fetching topic articles...");
                const topicsResponse = await fetch(`${BASE_URL}/api/search/topics`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        topics: data.topics,
                        ...searchPreferences,
                    }),
                });

                const rawTopicsData = await topicsResponse.text();
                console.log("Raw topic articles response:", rawTopicsData);
                const topicsData = JSON.parse(rawTopicsData);
                console.log("Topic Articles:", topicsData);
                setTopicArticles(topicsData);
            } catch (error) {
                console.error("Error retrieving user preferences or topic articles", error);
            }
        };

        getTopicsArticles();
    }, []);

    const renderArticles = () => {
        if (!topicArticles) return null;

        return topicArticles.map((topic: any) => (
            <div key={topic.topic}>
                <h3 className="font-semibold">{topic.topic}</h3>
                {topic.results.map((article: any) => (
                    <ArticleEntry 
                        key={article.title}
                        title={article.title}
                        description={article.description}
                        link={article.url}
                    />
                ))}
            </div>
        ));
    };

    return (
        <aside className="bg-blue-50 p-4 rounded-lg max-h-[400px] overflow-y-auto">
            <h2 className='text-lg font-bold mb-4'>Your Topics</h2>
            {renderArticles()}
        </aside>
    );
};


const ArticleEntry: React.FC<ArticleEntryProps>  = ({ title, description, link }) => {
    return (
      <div className="bg-white p-4 rounded-md shadow mb-4">
        <h4 className="font-semibold">{title}</h4>
        <p className="text-sm">{description}</p>
        {link && (
          <Link href={link} className="text-sm mt-2 block hover:underline">
            MORE
          </Link>
        )}
      </div>
    );
};

export default TopicsArticles;