"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ProgressSteps from "./progresssteps";

const BASE_URL = "http://localhost:3000";

interface Step2Props {
  title: string;
  options: string[];
  nextPage: string;
}

const Step2: React.FC<Step2Props> = ({ title, options, nextPage }) => {
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [customTopic, setCustomTopic] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const router = useRouter();

  const handleOptionClick = (option: string) => {
    if (selectedOptions.includes(option)) {
      setSelectedOptions(selectedOptions.filter((i) => i !== option));
    } else {
      setSelectedOptions([...selectedOptions, option]);
    }
  };

  const handleContinue = async () => {
    try {
      const userEmail = localStorage.getItem("userEmail");
      const response = await fetch(`${BASE_URL}/api/user/update`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user: {
            email: userEmail,
            preferences: {
              topics: selectedOptions,
            },
          },
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update topics");
      }

      router.push(nextPage);
    } catch (error) {
      console.error("Error updating topics:", error);
    }
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };

  const filteredOptions = options.filter((option) =>
    option.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const combinedOptions = Array.from(new Set([...filteredOptions, ...selectedOptions]));

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-grow flex items-center justify-center bg-gradient-to-b from-blue-100 to-blue-300 p-8">
        <div className="bg-white w-full max-w-7xl rounded-xl shadow-lg p-16 flex flex-col items-center">
          <div className="flex flex-col items-center mb-8">
            <ProgressSteps currentStep={2} totalSteps={3} />
            <h1 className="text-3xl font-bold text-gray-700">{title}</h1>
          </div>
          <div className="flex flex-row items-center gap-4 mb-4">
            <div className="w-full">
              <input
                type="text"
                placeholder="Search topics..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="w-full border-2 rounded-full px-4 py-2 text-darkBlue font-medium focus:outline-none focus:ring-2 focus:ring-darkBlue"
              />
            </div>
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
                if (customTopic && !selectedOptions.includes(customTopic)) {
                  setSelectedOptions([...selectedOptions, customTopic]);
                  setCustomTopic("");
                }
              }}
            >
              Add
            </button>
          </div>
          <div className="w-full flex flex-wrap justify-center gap-4 mb-8">
            {combinedOptions.map((option) => (
              <button
                key={option}
                className={`border-2 rounded-full px-4 py-2 text-darkBlue font-medium hover:bg-darkBlue hover:text-white focus:outline-none ${
                  selectedOptions.includes(option)
                    ? options.includes(option)
                      ? "bg-darkBlue text-white"
                      : "bg-darkBlue text-blue-100"
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

export default Step2;
