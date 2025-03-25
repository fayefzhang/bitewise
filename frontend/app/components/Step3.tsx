"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import ProgressSteps from "./progresssteps";
import Link from "next/link";

const BASE_URL = "http://localhost:3000";

interface Step3Props {
  title: string;
  options: string[];
  nextPage: string;
}

const Step3: React.FC<Step3Props> = ({ title, options, nextPage }) => {
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [excludedOptions, setExcludedOptions] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const router = useRouter();

  const handleOptionClick = (option: string) => {
    if (selectedOptions.includes(option)) {
      setSelectedOptions(selectedOptions.filter((s) => s !== option));
      setExcludedOptions([...excludedOptions, option]);
    } else if (excludedOptions.includes(option)) {
      setExcludedOptions(excludedOptions.filter((s) => s !== option));
    } else {
      setSelectedOptions([...selectedOptions, option]);
    }
  };

  const handleContinue = async () => {
    try {
      const userEmail = localStorage.getItem("userEmail");
      const userPrefResponse = await fetch(`${BASE_URL}/api/user/preferences?email=${userEmail}`);
      if (!userPrefResponse.ok) {
        throw new Error("Failed to get existing user preferences");
      }
      const preferences = await userPrefResponse.json();

      const updatedPreferences = {
        ...preferences,
        sources: selectedOptions,
        exclude_domains: excludedOptions,
      };

      const response = await fetch(`${BASE_URL}/api/user/update`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user: {
            email: userEmail,
            preferences: updatedPreferences,
          },
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update sources");
      }

      router.push(nextPage);
    } catch (error) {
      console.error("Error updating sources:", error);
    }
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };

  const filteredOptions = options.filter((option) =>
    option.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-grow flex items-center justify-center bg-gradient-to-b from-blue-100 to-blue-300 p-8">
        <div className="bg-white w-full max-w-7xl rounded-xl shadow-lg p-16 flex flex-col items-center">
          <div className="flex flex-col items-center mb-8">
            <ProgressSteps currentStep={3} totalSteps={3} />
            <h1 className="text-3xl font-bold text-gray-700">{title}</h1>
          </div>
          <div className="flex flex-row items-center gap-4 mb-4">
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="w-full border-2 rounded-full px-4 py-2 text-darkBlue font-medium focus:outline-none focus:ring-2 focus:ring-darkBlue"
            />
          </div>
          <div className="w-full flex flex-wrap justify-center gap-4 mb-8">
            {filteredOptions.map((option) => (
              <button
                key={option}
                className={`border-2 rounded-full px-4 py-2 text-darkBlue font-medium focus:outline-none ${
                  selectedOptions.includes(option)
                    ? "bg-darkBlue text-white"
                    : excludedOptions.includes(option)
                    ? "bg-red-400 text-white"
                    : "bg-white"
                }`}
                onClick={() => handleOptionClick(option)}
              >
                {option}
              </button>
            ))}
          </div>
          <div className="flex flex-col items-center">
            <button
              className="bg-darkBlue hover:bg-mediumBlue text-white font-semibold py-2 px-6 rounded-full focus:outline-none"
              onClick={handleContinue}
            >
              Continue
            </button>
            <Link href="/profile">
              <button className="mt-4 text-darkBlue underline">Skip</button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Step3;