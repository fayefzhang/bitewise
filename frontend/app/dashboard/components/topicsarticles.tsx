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
    const [topicArticles, setTopicArticles] = useState(null);

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

    return (
        <aside className="w-full md:w-[30%] bg-blue-50 p-4 rounded-lg">
        <h3 className="text-lg font-bold mb-4">Your Topics</h3>
        <ArticleEntry 
            title="Climate Change" 
            description="Trump's victory promises to shake up U.S. energy and climate policy, analysts DO NOT SAY BECAUSE THEY'RE STUPIIIIIID." 
        />
        <div className="bg-white p-4 rounded-md shadow">
            <h4 className="font-semibold">NFL</h4>
            <p className="text-sm">
            Niners RB Christian McCaffrey back at practice after missing first
            eight games of season.
            </p>
            <Link href="/" className="text-sm mt-2 block hover:underline">
            MORE
            </Link>
        </div>

        <h3 className="text-lg font-bold mb-4">Local News</h3>
        <div className="bg-white p-4 rounded-md shadow">
            <h4 className="font-semibold">
            Philadelphia, PA <span>73°</span>
            </h4>
            <p className="text-sm">
            Voter turnout throughout Philly area mostly lower than 2020
            </p>
            <Link href="/" className="text-sm mt-2 block hover:underline">
            MORE
            </Link>
        </div>
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