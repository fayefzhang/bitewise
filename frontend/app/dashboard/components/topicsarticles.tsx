import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Tab } from "@headlessui/react";
import { TopicArticles } from "../../common/interfaces";
import { defaultUserPreferences } from "@/app/common/utils";

interface ArticleEntryProps {
  title: string;
  description: string;
  link?: string;
  source: string;
}

const TopicsArticles = () => {
  const BASE_URL: string = "http://localhost:3000";
  const [preferences, setPreferences] = useState(defaultUserPreferences);
  const [topicArticles, setTopicArticles] = useState<TopicArticles>();

  useEffect(() => {
    const userEmail = localStorage.getItem("userEmail");

    const getTopicsArticles = async () => {
      try {
        if (userEmail) {
          // user is logged in
          console.log("Fetching user preferences...");
          const userPrefResponse = await fetch(
            `${BASE_URL}/api/user/preferences?email=${userEmail}`
          );
          if (!userPrefResponse.ok) {
            throw new Error("Failed to get existing user preferences");
          }
          const userPreferences = await userPrefResponse.json();
          setPreferences(userPreferences);
        }

        const fromDate = new Date();
        fromDate.setDate(fromDate.getDate() - 2);
        const formattedFromDate = fromDate.toISOString().split("T")[0];

        const searchPreferences = {
          sources: null,
          domains: null,
          exclude_domains: null,
          from_date: formattedFromDate,
          read_time: null,
          bias: null,
        };
        console.log("data.topics: " + preferences.topics);
        console.log("Fetching topic articles...");
        const topicsResponse = await fetch(`${BASE_URL}/api/search/topics`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            topics: preferences.topics,
            ...searchPreferences,
          }),
        });

        const rawTopicsData = await topicsResponse.text();
        // console.log("Raw topic articles response:", rawTopicsData);

        if (!rawTopicsData) {
          console.warn("Received empty response from topic articles API.");
          //   setTopicArticles(null); // Avoid error
          return;
        }

        const topicsData = JSON.parse(rawTopicsData);
        console.log("Topic Articles:", topicsData);
        setTopicArticles(topicsData);
      } catch (error) {
        console.error(
          "Error retrieving user preferences or topic articles",
          error
        );
      }
    };

    getTopicsArticles();
  }, []);

  const renderArticles = () => {
    if (!topicArticles) return null;

    return (
      <div>
        <Tab.Group>
          <div className="sticky top-10 z-10 bg-veryLightBlue rounded-lg">
            <Tab.List className="flex overflow-x-auto whitespace-nowrap scrollbar-hide max-w-full flex-nowrap">
              {Object.entries(topicArticles).map(
                ([topic, articles]: [string, any[]]) => (
                  <Tab
                    key={topic}
                    className={({ selected }: { selected: boolean }) =>
                      `px-4 py-2.5 text-sm leading-5 font-bold rounded-lg flex-shrink-0
                                      ${
                                        selected
                                          ? "bg-darkBlue text-white"
                                          : "hover:bg-darkBlue/[0.12]"
                                      }
                                      focus:outline-none`
                    }
                  >
                    {topic}
                  </Tab>
                )
              )}
            </Tab.List>
          </div>
          <div className="overflow-y-auto mt-2 max-h-[30vh] pb-4">
            <Tab.Panels className="mt-2 mb-2">
              {Object.entries(topicArticles).map(
                ([topic, articles]: [string, any[]]) => (
                  <Tab.Panel key={topic}>
                    {articles.map((articles: any, articleIndex: number) => (
                      <div key={articles.article.title}>
                      <ArticleEntry
                        key={articles.article.title || `${topic}-${articleIndex}`}
                        title={articles.article.title}
                        description={articles.article.description}
                        link={articles.article.url}
                        source={articles.article.source}
                      />
                        {/* <hr className="border-t-3 border-veryLightBlue my-2" /> */}
                      </div>
                    ))}
                  </Tab.Panel>
                )
              )}
            </Tab.Panels>
          </div>
        </Tab.Group>
      </div>
    );
  };

  return (
    <aside className="bg-white shadow p-4 rounded-lg max-h-[45vh] overflow-hidden">
      <div className="sticky top-0 z-10">
        <h2 className="text-lg font-bold mb-2">Your Topics</h2>
      </div>
      {renderArticles()}
    </aside>
  );
};

const ArticleEntry: React.FC<ArticleEntryProps> = ({
  title,
  description,
  link,
  source,
}) => {
  return (
    <div className="bg-white p-4 rounded-md shadow mb-4 hover:bg-veryLightBlue">
      {link && (<Link
          href={link}
          className="text-sm mt-2 block hover:underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          <h4 className="font-bold text-sm mb-2">{title}</h4>
        </Link>)}
      
      <p className="text-sm">{description}</p>
    </div>
  );
};

export default TopicsArticles;
