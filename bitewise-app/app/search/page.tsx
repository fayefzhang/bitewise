// app/search/page.tsx

"use client";

import Image from 'next/image';
import { useState } from 'react';

interface Article {
  id: number;
  title: string;
  source: string;
  time: string;
  bias: string;
  readTime: string;
  relatedBias: string;
  relatedSource: string;
  relatedTime: string;
  details: string[];
}

const SearchPage: React.FC = () => {
  const [articles, setArticles] = useState<Article[]>([
    {
      id: 1,
      title: "Germany’s ruling coalition collapses as Chancellor Scholz fires finance minister",
      source: "CNBC",
      time: "5 hours ago",
      bias: "NEUTRAL",
      readTime: "5 MIN READ",
      relatedBias: "LEAN RIGHT",
      relatedSource: "Reuters",
      relatedTime: "1 hr ago",
      details: [
        "Scholz sacks finance minister Lindner over budget disputes",
        "Scholz expected to lead minority government with Social Democrats and Greens",
        "To hold confidence vote in January triggering snap elections",
        "Political shake-up could benefit populist movements such as AfD",
        "Scholz to ask opposition conservatives for support",
      ],
    },
  ]);

  return (
    <div className="bg-gray-100 min-h-screen p-4 md:p-8 text-black">
      <div className="max-w-7xl mx-auto bg-white rounded-lg shadow-md">
        {/* Header */}
        <header className="bg-blue-600 p-4 rounded-t-lg flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <div className="bg-white p-2 rounded-full">
              {/* Icon Placeholder */}
              <span role="img" aria-label="radio" className="text-blue-600 text-lg">📻</span>
            </div>
            <input
              type="text"
              placeholder="Germany"
              className="p-2 rounded-md w-full md:w-80"
            />
          </div>
          <div className="flex space-x-4">
            <button className="p-2 rounded-full bg-white">
              <span role="img" aria-label="settings">⚙️</span>
            </button>
            <button className="p-2 rounded-full bg-white">
              <span role="img" aria-label="user">👤</span>
            </button>
          </div>
        </header>

        {/* Main Content */}
        <main className="p-4 md:p-8 flex flex-col md:flex-row space-y-6 md:space-y-0 md:space-x-6">
          {/* Articles List */}
          <section className="flex-1">
            <h1 className="text-2xl font-bold">Germany</h1>
            <p className="text-gray-600 mt-2">
              Germany's ruling coalition collapses as Chancellor Scholz fires finance minister. Also, France and Germany hold talks over...
            </p>
            
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
                    <p className="text-gray-500 text-sm">{article.bias} • {article.readTime}</p>
                  </div>
                </div>
              </div>
            ))}
          </section>

          {/* Article Details */}
          <aside className="w-full md:w-64 bg-blue-50 p-4 rounded-lg">
            <h2 className="font-bold">{articles[0].title}</h2>
            <p className="text-gray-500">{articles[0].source} • {articles[0].time}</p>
            <audio controls className="mt-2 w-full">
              <source src="/audio-summary.mp3" type="audio/mpeg" /> {/* Replace with actual audio file */}
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
            <p className="text-sm text-gray-500">Explore a more conservative viewpoint.</p>
            <div className="mt-2 grid grid-cols-1 gap-2">
              <div className="bg-white rounded-lg p-2 shadow-md text-center">
                <p className="text-xs text-gray-500">{articles[0].relatedSource}</p>
                <p className="text-xs text-gray-500">{articles[0].relatedTime}</p>
                <p className="text-xs font-bold text-blue-600">{articles[0].relatedBias}</p>
              </div>
              <div className="bg-white rounded-lg p-2 shadow-md text-center">
                <p className="text-xs text-gray-500">{articles[0].relatedSource}</p>
                <p className="text-xs text-gray-500">{articles[0].relatedTime}</p>
                <p className="text-xs font-bold text-blue-600">{articles[0].relatedBias}</p>
              </div>
            </div>
          </aside>
        </main>
      </div>
    </div>
  );
};

export default SearchPage;
