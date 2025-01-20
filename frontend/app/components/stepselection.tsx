"use client";

import React, { useState } from "react";
import Link from "next/link";
import ProgressSteps from "./progresssteps";

interface StepSelectionProps {
  title: string;
  options: string[];
  nextPage: string;
  stepNo: number;
}

const StepSelection: React.FC<StepSelectionProps> = ({
  title,
  options,
  nextPage,
  stepNo,
}) => {
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");

  const handleOptionClick = (option: string) => {
    if (selectedOptions.includes(option)) {
      setSelectedOptions(selectedOptions.filter((i) => i !== option));
    } else {
      setSelectedOptions([...selectedOptions, option]);
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
            <ProgressSteps currentStep={stepNo} totalSteps={3} />
            <h2 className="text-lg text-gray-700">{title}</h2>
          </div>
          <div className="w-full mb-4">
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="w-full border-2 rounded-full px-4 py-2 text-blue-500 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="w-full flex flex-wrap justify-center gap-4 mb-8">
            {filteredOptions.map((option) => (
              <button
                key={option}
                className={`border-2 rounded-full px-4 py-2 text-blue-500 font-medium hover:bg-blue-500 hover:text-white focus:outline-none ${
                  selectedOptions.includes(option)
                    ? "bg-blue-500 text-white"
                    : "bg-white"
                }`}
                onClick={() => handleOptionClick(option)}
              >
                {option}
              </button>
            ))}
          </div>
          <div className="flex flex-col items-center">
            <Link href={nextPage}>
              <button className="bg-blue-500 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-full focus:outline-none">
                Continue
              </button>
            </Link>
            <button className="mt-4 text-blue-500 underline">Skip</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StepSelection;
