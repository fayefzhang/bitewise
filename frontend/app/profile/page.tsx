"use client";

import Header from "../components/header";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import {
  interests,
  sources,
  biasRatingLabels,
  readTimeLabels,
} from "../common/utils";

const BASE_URL = "http://localhost:3000";

const ProfilePage: React.FC = () => {
  const router = useRouter();
  const handleSearch = (term: string) => {
    if (term) {
      router.push(`/search?query=${encodeURIComponent(term)}`);
    }
  };

  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [customTopic, setCustomTopic] = useState<string>("");
  const [includedSources, setIncludedSources] = useState<string[]>([]);
  const [excludedSources, setExcludedSources] = useState<string[]>([]);
  const [readTime, setReadTime] = useState<string[]>([]);
  const [bias, setBias] = useState<string[]>([]);
  const [fromDate, setFromDate] = useState<string>("");
  const [clustering, setClustering] = useState<boolean>(false);
  const [location, setLocation] = useState<string>("Philadelphia");
  const [isLocationEdited, setIsLocationEdited] = useState<boolean>(false);

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
        setIncludedSources(userPreferences.sources || []);
        setReadTime(userPreferences.read_time || []);
        setBias(userPreferences.bias || []);
        setFromDate(userPreferences.from_date);
        setClustering(userPreferences.clustering);
        setLocation(userPreferences.location || "Philadelphia");
      } catch (error) {
        console.error("Error fetching user preferences:", error);
      }
    };

    fetchUserPreferences();
  }, []);

  const updateUserProfile = async (
    updatedTopics: string[],
    updatedSources: string[],
    updatedReadTime: string[],
    updatedBias: string[],
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
      if (selectedTopics.includes(interest)) {
        setSelectedTopics(selectedTopics.filter((i) => i !== interest));
        updateUserProfile(
          selectedTopics.filter((i) => i !== interest),
          includedSources,
          readTime,
          bias,
          fromDate,
          clustering,
          location
        );
      } else {
        setSelectedTopics([...selectedTopics, interest]);
        updateUserProfile(
          [...selectedTopics, interest],
          includedSources,
          readTime,
          bias,
          fromDate,
          clustering,
          location
        );
      }
    }
  };

  const handleSourceToggle = (source: string) => {
    if (includedSources.includes(source)) {
      setIncludedSources(includedSources.filter((s) => s !== source));
      setExcludedSources([...excludedSources, source]);
    } else if (excludedSources.includes(source)) {
      setExcludedSources(excludedSources.filter((s) => s !== source));
    } else {
      setIncludedSources([...includedSources, source]);
    }
    updateUserProfile(
      selectedTopics,
      [...includedSources, source],
      readTime,
      bias,
      fromDate,
      clustering,
      location
    );
  };

  // handle searching for topics
  const [searchInterestsQuery, setSearchInterestsQuery] = useState<string>("");
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchInterestsQuery(event.target.value);
  };
  const filteredInterests = interests.filter((interest) =>
    interest.toLowerCase().includes(searchInterestsQuery.toLowerCase())
  );
  const combinedInterests = Array.from(new Set([...filteredInterests, ...selectedTopics]));

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
      <div className="w-[80%] min-h-screen mx-auto text-black">
      <div className="flex-grow flex flex-col items-start bg-white p-8">
        {/* Topics Section */}
        <div className="flex flex-col items-center mb-4">
          <h1 className="text-2xl font-bold text-gray-600">
            Persistent User Preferences
          </h1>
        </div>

        {/* Advanced Search Section */}
        <div className="flex flex-col items-center mb-4">
          <h1 className="text-xl font-bold">
            Advanced Search Defaults
          </h1>
        </div>
        {/* Read Time */}
        <div className="flex flex-row items-center gap-4">
          <label>Read Time</label>
          <div className="flex flex-wrap gap-2">
            {readTimeLabels.map((label, index) => (
              <button
                key={index}
                className={`border-2 rounded-full px-4 py-2 text-darkBlue font-medium ${
                  readTime.includes(label) ? "bg-darkBlue text-white" : "bg-white"
                }`}
                onClick={() => {
                  if (readTime.includes(label)) {
                    setReadTime(readTime.filter((b) => b !== label));
                    updateUserProfile(
                      selectedTopics,
                      includedSources,
                      readTime.filter((b) => b !== label),
                      bias,
                      fromDate,
                      clustering,
                      location
                    );
                  } else {
                    setReadTime([...readTime, label]);
                    updateUserProfile(
                      selectedTopics,
                      includedSources,
                      [...readTime, label],
                      bias,
                      fromDate,
                      clustering,
                      location
                    );
                  }
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Bias */}
        <div className="flex flex-row items-center gap-4">
          <label>Bias</label>
          <div className="flex flex-wrap gap-2">
            {biasRatingLabels.map(
              (label, index) =>
                label && (
                  <button
                    key={index}
                    className={`border-2 rounded-full px-4 py-2 text-darkBlue font-medium ${
                      bias.includes(label)
                        ? "bg-darkBlue text-white"
                        : "bg-white"
                    }`}
                    onClick={() => {
                      if (bias.includes(label)) {
                        setBias(bias.filter((b) => b !== label));
                        updateUserProfile(
                          selectedTopics,
                          includedSources,
                          readTime,
                          bias.filter((b) => b !== label),
                          fromDate,
                          clustering,
                          location
                        );
                      } else {
                        setBias([...bias, label]);
                        updateUserProfile(
                          selectedTopics,
                          includedSources,
                          readTime,
                          [...bias, label],
                          fromDate,
                          clustering,
                          location
                        );
                      }
                    }}
                  >
                    {label}
                  </button>
                )
            )}
          </div>
          <div className="relative group">
            <svg
              className="transform translate-y-3 w-4 h-4 text-darkBlue hover:text-gray-700 cursor-pointer"
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

        <div className="border-b-2 border-veryLightBlue mb-4 w-full"/>

        {/* Topics Section */}
        <div className="flex-col items-center mb-4">
          <h1 className="text-2xl font-bold text-gray-600">
            Dashboard Preferences
          </h1>
        </div>
        <div className="flex-col items-center mb-4">
          <h1 className="text-xl font-bold">Followed Topics</h1>
        </div>
        <div className="flex flex-row items-center gap-4 mb-4">
          <input
            type="text"
            placeholder="Search Topics..."
            value={searchInterestsQuery}
            onChange={handleSearchChange}
            className="w-full border-2 rounded-full px-4 py-2 text-darkBlue font-medium focus:outline-none focus:ring-2 focus:ring-darkBlue"
          />
          <input
            type="text"
            placeholder="Add custom topic..."
            value={customTopic}
            onChange={(e) => setCustomTopic(e.target.value)}
            className="border-2 rounded-full px-4 py-2 text-darkBlue font-medium focus:outline-none focus:ring-2 focus:ring-darkBlue"
          />
          <button
            className="bg-darkBlue hover:bg-mediumBlue text-white font-semibold py-2 px-4 rounded-full focus:outline-none"
            onClick={() => {
              if (customTopic && !selectedTopics.includes(customTopic)) {
                setSelectedTopics([...selectedTopics, customTopic]);
                setCustomTopic("");
                updateUserProfile(
                  [...selectedTopics, customTopic],
                  includedSources,
                  readTime,
                  bias,
                  fromDate,
                  clustering,
                  location
                );
              }
            }}
          >
            Add
          </button>
        </div>
        <div className="w-full flex flex-wrap gap-4 mb-4">
          {combinedInterests.map((interest) => (
            <button
              key={interest}
              className={`border-2 rounded-full px-4 py-2 text-darkBlue font-medium hover:bg-darkBlue hover:text-white focus:outline-none ${
                selectedTopics.includes(interest)
                  ? (interests.includes(interest) ? "bg-darkBlue text-white" : "bg-darkBlue text-blue-100")
                  : "bg-white"
              }`}
              onClick={() => handleOptionClick(interest, true)}
            >
              {interest}
            </button>
          ))}
        </div>

        {/* Location */}
        <div className="flex flex-col items-center mb-4">
          <h1 className="text-xl font-bold">Local News Location</h1>
        </div>
        <div className="flex flex-row items-center gap-4 mb-4">
          <label>
            Location {isLocationEdited && <span className="text-red-500">*</span>}
          </label>
          <input
            type="text"
            value={location}
            onChange={(e) => {
              setLocation(e.target.value);
              setIsLocationEdited(true); // Mark as edited
            }}
            className="border-2 rounded-full px-4 py-2 text-darkBlue font-medium"
            placeholder="Enter your location"
          />
          <button
            className="bg-darkBlue hover:bg-mediumBlue text-white font-semibold py-2 px-6 rounded-full focus:outline-none"
            onClick={() => {
              updateUserProfile(
                selectedTopics,
                includedSources,
                readTime,
                bias,
                fromDate,
                clustering,
                location
              );
              setIsLocationEdited(false); // Reset the edited state
            }}
          >
            Set
          </button>
        </div>

        {/* Sources Section */}
        <div className="flex flex-col items-center mb-4">
          <h1 className="text-xl font-bold">Your Sources</h1>
        </div>
        <div className="w-full flex flex-wrap gap-4 mb-2">
          {sources.map((source) => (
            <button
              key={source}
              className={`border-2 rounded-full px-4 py-2 font-medium focus:outline-none ${
                includedSources.includes(source)
                  ? "bg-darkBlue text-white"
                  : excludedSources.includes(source)
                  ? "bg-red-400 text-white"
                  : "bg-white text-darkBlue"
              }`}
              onClick={() => handleSourceToggle(source)}
            >
              {source}
            </button>
          ))}
        </div>
        <div className="flex flex-col items-center mb-6">
          <button
            className="bg-darkBlue hover:bg-mediumBlue text-white font-semibold py-2 px-6 rounded-full focus:outline-none mt-2"
            onClick={() =>
              updateUserProfile(
                selectedTopics,
                includedSources,
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

        <div className="border-b-2 border-veryLightBlue mb-4 w-full"/>

        <div className="flex flex-row justify-end mb-6">
          <button
            className="bg-darkBlue hover:bg-mediumBlue text-white font-semibold py-2 px-6 rounded-full focus:outline-none"
            onClick={() => handleLogOut()}
          >
            Log Out
          </button>
        </div>
      </div>
    </div>
    </div>
  );
};

export default ProfilePage;