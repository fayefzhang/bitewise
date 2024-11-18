// app/search/page.tsx

"use client";

import Image from "next/image";
import { Key, useState } from "react";

interface Article {
  id: Key | null | undefined;
  title: string;
  source: string;
  time: string;
  bias: string;
  readTime: string;
  relatedSources: RelatedSource[];
  details: string[];
}

interface RelatedSource {
  id: Key | null | undefined;
  title: string;
  source: string;
  time: string;
  bias: string;
}

interface Summary {
  title: string;
  summary: string;
}

const SearchPage: React.FC = () => {
  const sampleRelatedSource = {
    id: 1,
    title: "Chancellor Scholz...",
    source: "Reuters",
    time: "1 hr ago",
    bias: "LEAN RIGHT",
  };

  const sampleArticle = {
    id: 1,
    title:
      "Germany’s ruling coalition collapses as Chancellor Scholz fires finance minister",
    source: "CNBC",
    time: "5 hours ago",
    bias: "NEUTRAL",
    readTime: "5 MIN READ",
    relatedSources: [
      sampleRelatedSource,
      sampleRelatedSource,
    ],
    details: [
      "Scholz sacks finance minister Lindner over budget disputes",
      "Scholz expected to lead minority government with Social Democrats and Greens",
      "To hold confidence vote in January triggering snap elections",
      "Political shake-up could benefit populist movements such as AfD",
      "Scholz to ask opposition conservatives for support",
    ],
  };

  const [articles, setArticles] = useState<Article[]>([
    sampleArticle,
    sampleArticle,
    sampleArticle,
    sampleArticle,
  ]);

  const [summary, setSummary] = useState<Summary>({
    title: "Germany",
    summary:
      "Germany's ruling coalition collapses as Chancellor Scholz fires finance minister. Also, France and Germany hold talks over Trump election win and Germany's cabinet approves draft law on voluntary military service.",
  });

  return (
    <div className="bg-gray-100 min-h-screen p-4 md:p-8 text-black">
      <div className="max-w-7xl mx-auto bg-white rounded-lg shadow-md">
        {/* Header */}
        <header className="bg-blue-600 p-4 rounded-t-lg flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <div className="bg-white p-2 rounded-full">
              {/* Icon Placeholder */}
              <span
                role="img"
                aria-label="radio"
                className="text-blue-600 text-lg"
              >
                📻
              </span>
            </div>
            <input
              type="text"
              placeholder={summary.title}
              className="p-2 rounded-md w-full md:w-80"
            />
          </div>
          <div className="flex space-x-4">
            <button className="p-2 rounded-full bg-white">
              <span role="img" aria-label="settings">
                ⚙️
              </span>
            </button>
            <button className="p-2 rounded-full bg-white">
              <span role="img" aria-label="user">
                👤
              </span>
            </button>
          </div>
        </header>

        {/* Main Content */}
        <main className="p-4 md:p-8 flex flex-col md:flex-row space-y-6 md:space-y-0 md:space-x-6">
          {/* Articles List */}
          <section className="flex-1">
            <h1 className="text-2xl font-bold">{summary.title}</h1>
            <p className="text-gray-600 mt-2">{summary.summary}</p>

            {articles.map((article) => (
              <div key={article.id} className="mt-6">
                <div className="flex items-center space-x-4">
                  <Image
                    src="/placeholder.png" // Replace with actual image path
                    alt="article thumbnail"
                    width={80}
                    height={50}
                    className="rounded-lg"
                  />
                  <div>
                    <p className="text-gray-500">{article.source}</p>
                    <h2 className="font-bold text-lg">{article.title}</h2>
                    <p className="text-gray-500 text-sm">
                      {article.bias} • {article.readTime}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </section>

          {/* Article Details */}
          <aside className="w-full md:w-64 bg-blue-50 p-4 rounded-lg">
            <h2 className="font-bold">{articles[0].title}</h2>
            <p className="text-gray-500">
              {articles[0].source} • {articles[0].time}
            </p>
            <audio controls className="mt-2 w-full">
              <source src="/audio-summary.mp3" type="audio/mpeg" />{" "}
              {/* Replace with actual audio file */}
              Your browser does not support the audio element.
            </audio>
            <ul className="mt-4 list-disc list-inside space-y-2">
              {articles[0].details.map((detail, index) => (
                <li key={index} className="text-gray-700 text-sm">
                  {detail}
                </li>
              ))}
            </ul>

            {/* Related Articles */}
            <h3 className="mt-6 font-bold">Related Articles</h3>
            <p className="text-sm text-gray-500">
              Explore a more conservative viewpoint.
            </p>
            <div className="mt-2 grid grid-cols-1 gap-2">
              {articles[0].relatedSources.map((source) => (
                <div
                  key={source.id}
                  className="rounded-lg p-2 shadow-md  w-full h-full text-center bg-[url(/placeholder.png)]"
                >
                  <div className="flex-wrap items-center">
                    <p className="text-xs text-gray-500">{source.title}</p>
                    <p className="text-xs text-gray-500">{source.source}</p>
                    <p className="text-xs text-gray-500">{source.time}</p>
                    <p className="text-xs font-bold text-blue-600">
                      {source.bias}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </aside>
        </main>
      </div>
    </div>
  );
};

export default SearchPage;
