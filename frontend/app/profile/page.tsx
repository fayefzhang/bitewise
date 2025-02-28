"use client";

import Header from "../components/header";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { interests, sources } from "../common/utils";

const BASE_URL = "http://localhost:3000";

const ProfilePage: React.FC = () => {
  const router = useRouter();
  const handleSearch = (term: string) => {
    if (term) {
      router.push(`/search?query=${encodeURIComponent(term)}`);
    }
  };

  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [selectedSources, setSelectedSources] = useState<string[]>([]);
  const [readTime, setReadTime] = useState<number | null>(null);
  const [bias, setBias] = useState<number>(0);
  const [fromDate, setFromDate] = useState<string>("");
  const [clustering, setClustering] = useState<boolean>(false);
  const [location, setLocation] = useState<string>("");

  // Fetch user preferences on page load
  useEffect(() => {
    const userEmail = localStorage.getItem("userEmail");
    const fetchUserPreferences = async () => {
      try {
        const userPrefResponse = await fetch(
          `${BASE_URL}/api/user/preferences?email=${userEmail}`
        );
        if (!userPrefResponse.ok) {
          throw new Error("Failed to get existing user preferences");
        }
        const userPreferences = await userPrefResponse.json();

        // Set the initial state based on fetched preferences
        setSelectedTopics(userPreferences.topics || []);
        setSelectedSources(userPreferences.sources || []);
        setReadTime(userPreferences.read_time);
        setBias(userPreferences.bias);
        setFromDate(userPreferences.from_date);
        setClustering(userPreferences.clustering);
        setLocation(userPreferences.location || "");
      } catch (error) {
        console.error("Error fetching user preferences:", error);
      }
    };

    fetchUserPreferences();
  }, []);

  const updateUserProfile = async (
    updatedTopics: string[],
    updatedSources: string[],
    updatedReadTime: number | null,
    updatedBias: number,
    updatedFromDate: string,
    updatedClustering: boolean,
    updatedLocation: string
  ) => {
    try {
      const userEmail = localStorage.getItem("userEmail");
      const response = await fetch(`${BASE_URL}/api/user/update`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user: {
            email: userEmail, // make sure to pass the current user's email
            preferences: {
              topics: updatedTopics,
              sources: updatedSources,
              read_time: updatedReadTime,
              bias: updatedBias,
              from_date: updatedFromDate,
              clustering: updatedClustering,
              location: updatedLocation,
            },
          },
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update user preferences");
      }

      const updatedPreferences = await response.json();
      console.log("Updated preferences:", updatedPreferences);
    } catch (error) {
      console.error("Error updating preferences:", error);
    }
  };

  const handleLogOut = async () => {
    localStorage.clear();
    router.push("/dashboard");
  };

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

  useEffect(() => {
    // if user is not signed in, push back to dashboard
    const userEmail = localStorage.getItem("userEmail"); // check against localstorage (this is the scuffed way)
    if (userEmail == null) router.push("/dashboard");
  });

  return (
    <div className="min-h-screen flex flex-col">
      <Header onSearch={handleSearch} placeholder="Search topic..." />

      <div className="flex-grow flex flex-col items-start bg-white p-8">
        {/* Topics Section */}
        <div className="flex flex-col items-center mb-4">
          <h1 className="text-2xl font-bold text-gray-700">
            Your Persistent User Preferences
          </h1>
        </div>

        {/* Advanced Search Section */}
        <div className="flex flex-col items-center mb-4">
          <h1 className="text-xl font-bold text-gray-600">
            Advanced Search Defaults
          </h1>
        </div>
        {/* Read Time */}
        <div className="flex flex-row items-center gap-4 text-gray-800">
          <label>Read Time</label>
          <select
            value={readTime || ""}
            onChange={(e) => setReadTime(Number(e.target.value))}
            className="border-2 rounded-full px-4 py-2 text-blue-500 font-medium"
          >
            <option value={0}>Select Read Time</option>
            <option value={1}>Short</option>
            <option value={2}>Medium</option>
            <option value={3}>Long</option>
          </select>
        </div>

        {/* Bias */}
        <div className="flex flex-row items-center gap-4 text-gray-800">
          <label>Bias</label>
          <select
            value={bias}
            onChange={(e) => setBias(Number(e.target.value))}
            className="border-2 rounded-full px-4 py-2 text-blue-500 font-medium"
          >
            <option value={0}>Select Bias</option>
            <option value={1}>Center</option>
            <option value={2}>Left</option>
            <option value={3}>Left-Center</option>
            <option value={4}>Right</option>
            <option value={5}>Right-Center</option>
          </select>
          <div className="relative group">
            <svg
              className="transform translate-y-3 w-4 h-4 text-blue-500 hover:text-gray-700 cursor-pointer"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M12 18h0"
              />
            </svg>
            <div className="w-56 bg-gray-800 text-white text-xs rounded-md p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-lg">
              Bias is determined by the source's rating in our bias database.
            </div>
          </div>
        </div>

        {/* Date Published From */}
        <div className="flex flex-row items-center gap-4 mb-2 text-gray-800">
          <label>Date Published From</label>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="border-2 rounded-full px-4 py-2 text-blue-500 font-medium"
          />
        </div>

        {/* Clustering */}
        <div className="flex flex-row items-center gap-4 mb-2 text-gray-800">
          <label>Enable Clustering</label>
          <input
            type="checkbox"
            checked={clustering}
            onChange={() => setClustering(!clustering)}
            className="border-2 rounded-full px-4 py-2 text-blue-500 font-medium"
          />
        </div>

        <div className="flex flex-col items-center mb-6">
          <button
            className="bg-blue-900 hover:bg-blue-700 text-white font-semibold py-1 px-6 rounded-full focus:outline-none"
            onClick={() =>
              updateUserProfile(
                selectedTopics,
                selectedSources,
                readTime,
                bias,
                fromDate,
                clustering,
                location
              )
            }
          >
            Save Preferences
          </button>
        </div>

        {/* Topics Section */}
        <div className="flex-col items-center mb-4">
          <h1 className="text-2xl font-bold text-gray-600">Dashboard Preferences</h1>
        </div>
        <div className="flex-col items-center mb-4">
          <h1 className="text-xl font-bold text-gray-600">Followed Topics</h1>
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
        <div className="w-full flex flex-wrap gap-4 mb-2">
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
        <div className="flex flex-col items-center mb-6">
          <button
            className="bg-blue-900 hover:bg-blue-700 text-white font-semibold py-1 px-6 rounded-full focus:outline-none"
            onClick={() =>
              updateUserProfile(
                selectedTopics,
                selectedSources,
                readTime,
                bias,
                fromDate,
                clustering,
                location
              )
            }
          >
            Save Preferences
          </button>
        </div>

        {/* Location */}
        <div className="flex flex-col items-center mb-4">
          <h1 className="text-xl font-bold text-gray-600">Local News Location</h1>
        </div>
        <div className="flex flex-row items-center gap-4 mb-2 text-gray-800">
          <label>Location</label>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="border-2 rounded-full px-4 py-2 text-blue-500 font-medium"
            placeholder="Enter your location"
          />
        </div>
        <div className="flex flex-col items-center mb-6">
          <button
            className="bg-blue-900 hover:bg-blue-700 text-white font-semibold py-1 px-6 rounded-full focus:outline-none"
            onClick={() =>
              updateUserProfile(
                selectedTopics,
                selectedSources,
                readTime,
                bias,
                fromDate,
                clustering,
                location
              )
            }
          >
            Save Preferences
          </button>
        </div>

        {/* Sources Section */}
        <div className="flex flex-col items-center mb-4">
          <h1 className="text-xl font-bold text-gray-600">Your Sources</h1>
        </div>
        <div className="w-full flex flex-wrap gap-4 mb-2">
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
        <div className="flex flex-col items-center mb-6">
          <button
            className="bg-blue-900 hover:bg-blue-700 text-white font-semibold py-1 px-6 rounded-full focus:outline-none"
            onClick={() =>
              updateUserProfile(
                selectedTopics,
                selectedSources,
                readTime,
                bias,
                fromDate,
                clustering,
                location
              )
            }
          >
            Save Preferences
          </button>
        </div>

        <div className="flex flex-col items-center mb-6">
          <button
            className="bg-blue-900 hover:bg-blue-700 text-white font-semibold py-1 px-6 rounded-full focus:outline-none"
            onClick={() => handleLogOut()}
          >
            Log Out
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
