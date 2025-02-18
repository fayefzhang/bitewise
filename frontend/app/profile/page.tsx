"use client";

import Header from "../components/header";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { interests, sources } from "../common/utils";

const ProfilePage: React.FC = () => {
  const router = useRouter();
  const handleSearch = (term: string) => {
    if (term) {
      router.push(`/search?query=${encodeURIComponent(term)}`);
    }
  };

  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [selectedSources, setSelectedSources] = useState<string[]>([]);

  const handleOptionClick = (interest: string, isTopics: boolean) => {
    if (isTopics) {
      // topics
      if (selectedTopics.includes(interest))
        setSelectedTopics(selectedTopics.filter((i) => i !== interest));
      else setSelectedTopics([...selectedTopics, interest]);
    } else {
      // sources
      if (selectedSources.includes(interest))
        setSelectedSources(selectedSources.filter((i) => i !== interest));
      else setSelectedSources([...selectedSources, interest]);
    }
  };

  // handle searching for topics
  const [searchInterestsQuery, setSearchInterestsQuery] = useState<string>("");
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchInterestsQuery(event.target.value);
  };
  const filteredInterests = interests.filter((interest) =>
    interest.toLowerCase().includes(searchInterestsQuery.toLowerCase())
  );

  // TODO: implement searching for sources
  // (not sure if we even need this if we only have like 5-7 options)

  return (
    <div className="min-h-screen flex flex-col">
      <Header onSearch={handleSearch} placeholder="Search topic..." />

      <div className="flex-grow flex flex-col items-start bg-white p-8">
        <div className="flex flex-col items-center mb-4">
          <h1 className="text-2xl font-bold text-gray-700">
            Your Persistent User Preferences
          </h1>
        </div>
        <div className="flex flex-col items-center mb-4">
          <h1 className="text-xl font-bold text-gray-600">Your Topics</h1>
        </div>
        <div className="mb-4">
          <input
            type="text"
            placeholder="Search..."
            value={searchInterestsQuery}
            onChange={handleSearchChange}
            className="w-full border-2 rounded-full px-4 py-2 text-blue-500 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="w-full flex flex-wrap gap-4 mb-8">
          {filteredInterests.map((interest) => (
            <button
              key={interest}
              className={`border-2 rounded-full px-4 py-2 text-blue-500 font-medium hover:bg-blue-500 hover:text-white focus:outline-none ${
                selectedTopics.includes(interest)
                  ? "bg-blue-500 text-white"
                  : "bg-white"
              }`}
              onClick={() => handleOptionClick(interest, true)}
            >
              {interest}
            </button>
          ))}
        </div>
        <div className="flex flex-col items-center mb-4">
          <h1 className="text-xl font-bold text-gray-600">Your Sources</h1>
        </div>
        <div className="w-full flex flex-wrap gap-4 mb-8">
          {sources.map((source) => (
            <button
              key={source}
              className={`border-2 rounded-full px-4 py-2 text-blue-500 font-medium hover:bg-blue-500 hover:text-white focus:outline-none ${
                selectedSources.includes(source)
                  ? "bg-blue-500 text-white"
                  : "bg-white"
              }`}
              onClick={() => handleOptionClick(source, false)}
            >
              {source}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
