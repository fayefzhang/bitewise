import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Tab } from '@headlessui/react';

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
        const userEmail = localStorage.getItem("userEmail");

        const getTopicsArticles = async () => {
            try {

                console.log("Fetching user preferences...");
                const userPrefResponse = await fetch(
                    `${BASE_URL}/api/user/preferences?email=${userEmail}`
                );
                if (!userPrefResponse.ok) {
                    throw new Error("Failed to get existing user preferences");
                }
                const userPreferences = await userPrefResponse.json();
                setPreferences(userPreferences);

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
                console.log("data.topics: " + userPreferences.topics);
                console.log("Fetching topic articles...");
                const topicsResponse = await fetch(`${BASE_URL}/api/search/topics`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        topics: userPreferences.topics,
                        ...searchPreferences,
                    }),
                });

                const rawTopicsData = await topicsResponse.text();
                console.log("Raw topic articles response:", rawTopicsData);

                if (!rawTopicsData) {
                    console.warn("Received empty response from topic articles API.");
                    setTopicArticles([]); // Avoid error
                    return;
                }
                
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

        return (
            <Tab.Group>
                <div className="w-full overflow-hidden">
                    <Tab.List className="flex space-x-1 p-1 overflow-x-auto whitespace-nowrap scrollbar-hide max-w-full flex-nowrap">
                        {topicArticles.map((topic: any) => (
                            <Tab
                                key={topic.topic}
                                className={({ selected }: { selected: boolean }) =>
                                    `px-4 py-2.5 text-sm leading-5 font-bold rounded-lg flex-shrink-0
                                    ${selected ? 'bg-white shadow' : 'hover:bg-white/[0.12] hover:text-white'}
                                    focus:outline-none`
                                }
                            >
                                {topic.topic}
                            </Tab>
                        ))}
                    </Tab.List>
                </div>
                <Tab.Panels className="mt-2">
                    {topicArticles.map((topic: any) => (
                        <Tab.Panel key={topic.topic}>
                            {topic.results.map((articles: any, articleIndex: number) => (
                                <ArticleEntry 
                                    key={articles.article.title || `${topic.topic}-${articleIndex}`}
                                    title={articles.article.title}
                                    description={articles.article.description}
                                    link={articles.article.url}
                                />
                            ))}
                        </Tab.Panel>
                    ))}
                </Tab.Panels>
            </Tab.Group>
        );
    };

    return (
        <aside className="bg-blue-50 p-4 rounded-lg max-h-[50vh] overflow-y-auto">
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
          <Link href={link} className="text-sm mt-2 block hover:underline" target="_blank" rel="noopener noreferrer">
            MORE
          </Link>
        )}
      </div>
    );
};

export default TopicsArticles;