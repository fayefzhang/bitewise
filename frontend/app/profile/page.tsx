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

  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [searchInterestsQuery, setSearchInterestsQuery] = useState<string>("");

  const handleOptionClick = (interest: string) => {
    if (selectedInterests.includes(interest)) {
      setSelectedInterests(selectedInterests.filter((i) => i !== interest));
    } else {
      setSelectedInterests([...selectedInterests, interest]);
    }
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchInterestsQuery(event.target.value);
  };

  const filteredInterests = interests.filter((interest) =>
    interest.toLowerCase().includes(searchInterestsQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen flex flex-col">
      <Header onSearch={handleSearch} placeholder="Search topic..." />

      <div className="flex-grow flex flex-col items-start bg-white p-8">
        <div className="flex flex-col items-center mb-8">
          <h1 className="text-2xl font-bold text-gray-700">Good evening, GUEST.</h1>
        </div>
        <div className="flex flex-col items-center mb-8">
          <h1 className="text-xl font-bold text-gray-600">Your Topics</h1>
        </div>
        <div className="mb-12">
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
                selectedInterests.includes(interest)
                  ? "bg-blue-500 text-white"
                  : "bg-white"
              }`}
              onClick={() => handleOptionClick(interest)}
            >
              {interest}
            </button>
          ))}
        </div>
        <div className="flex flex-col items-center mb-8">
          <h1 className="text-xl font-bold text-gray-600">Your Sources</h1>
        </div>
        <div className="w-full flex flex-wrap gap-4 mb-8">
          {sources.map((source) => (
            <button
              key={source}
              className={`border-2 rounded-full px-4 py-2 font-medium hover:bg-blue-500 hover:text-white focus:outline-none bg-blue-500 text-white`}
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
