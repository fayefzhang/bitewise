import React, { useEffect, useState } from "react";
import { Article } from "../common/interfaces";
import Image from "next/image";
import { defaultAIPreferences } from "../common/utils";

type SidebarProps = {
  selectedArticle: Article | null;
  closePanel: () => void;
  isPanelOpen: boolean;
};

const readTimeLabels = ["<2 min", "2-7 min", "7+ min"];
const readTimeOptions = ["short", "medium", "long"];
const biasRatingLabels = [
  "Left",
  "Left-Center",
  "Center",
  "Right-Center",
  "Right",
  "Unknown",
];
const toneOptions = ["formal", "conversational", "technical", "analytical"];
const formatOptions = ["highlights", "bullets", "analysis", "quotes"];

const Sidebar: React.FC<SidebarProps> = ({
  selectedArticle,
  closePanel,
  isPanelOpen,
}) => {
  const userEmail = localStorage.getItem("userEmail");
  const storedPreferences = userEmail
    ? JSON.parse(localStorage.getItem(`preferences_${userEmail}`) || "{}")
    : {};

  const [aiPreferences, setAIPreferences] = useState({
    length: storedPreferences.length || defaultAIPreferences.length,
    tone: storedPreferences.tone || defaultAIPreferences.tone,
    format: storedPreferences.format || defaultAIPreferences.format,
    jargon_allowed:
      storedPreferences.jargon_allowed ?? defaultAIPreferences.jargon_allowed,
  });

  const [tempPreferences, setTempPreferences] = useState(aiPreferences);
  const [isPreferencesPanelOpen, setIsPreferencesPanelOpen] = useState(false);

  useEffect(() => {
    if (userEmail) {
      localStorage.setItem(
        `preferences_${userEmail}`,
        JSON.stringify(aiPreferences)
      );
    }
  }, [aiPreferences, userEmail]);

  const togglePreferencesPanel = () => {
    setIsPreferencesPanelOpen(!isPreferencesPanelOpen);
  };

  const applyPreferences = () => {
    setAIPreferences(tempPreferences);
  };

  return (
    <aside
      className={`text-black fixed right-0 top-24 h-[calc(100vh-4rem)] w-full md:w-[42%] lg:w-[32%] bg-blue-50 p-4 rounded-lg shadow-lg transition-transform duration-300 ease-in-out ${
        isPanelOpen ? "translate-x-0" : "translate-x-full"
      } overflow-y-auto`}
      style={{ zIndex: 50 }}
    >
      <button onClick={closePanel} className="p-2 text-gray-500 rounded-md">
        Close
      </button>
      {selectedArticle && (
        <>
          <h2 className="font-bold">{selectedArticle.title}</h2>
          <p className="text-gray-500">
            {selectedArticle.source} • {selectedArticle.time}
          </p>
          <div className="flex justify-between items-center mt-4">
            <a
              href={selectedArticle.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:underline"
            >
              Read Full Article
            </a>
            <button
              onClick={togglePreferencesPanel}
              className="p-2 text-gray-500 rounded-md"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v1m0 14v1m8-8h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z"
                />
              </svg>
            </button>
          </div>

          {/* Advanced AI Preferences */}
          {isPreferencesPanelOpen && (
            <div className="mt-4 p-3 bg-white shadow rounded-lg">
              <label className="block font-semibold">Read Time</label>
              <div className="flex space-x-2 mt-1">
                {readTimeOptions.map((option) => (
                  <button
                    key={option}
                    className={`px-3 py-1 rounded ${
                      tempPreferences.length === option
                        ? "bg-blue-500 text-white"
                        : "bg-gray-200"
                    }`}
                    onClick={() =>
                      setTempPreferences((prev) => ({
                        ...prev,
                        length: option,
                      }))
                    }
                  >
                    {option}
                  </button>
                ))}
              </div>
              <label className="block font-semibold mt-2">Format</label>
              <select
                className="w-full p-2 border rounded"
                value={tempPreferences.format}
                onChange={(e) =>
                  setTempPreferences((prev) => ({
                    ...prev,
                    format: e.target.value,
                  }))
                }
              >
                {formatOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              <label className="block font-semibold mt-2">Tone</label>
              <select
                className="w-full p-2 border rounded"
                value={tempPreferences.tone}
                onChange={(e) =>
                  setTempPreferences((prev) => ({
                    ...prev,
                    tone: e.target.value,
                  }))
                }
              >
                {toneOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              <div className="flex items-center mt-2">
                <input
                  type="checkbox"
                  id="jargon"
                  checked={tempPreferences.jargon_allowed}
                  onChange={(e) =>
                    setTempPreferences((prev) => ({
                      ...prev,
                      jargon_allowed: e.target.checked,
                    }))
                  }
                />
                <label htmlFor="jargon" className="ml-2">
                  Allow Jargon
                </label>
              </div>
              <button
                onClick={applyPreferences}
                className="mt-4 bg-blue-500 text-white px-4 py-2 rounded"
              >
                Apply
              </button>
            </div>
          )}

          {/* Article Content */}
          <audio controls className="mt-2 w-full">
            <source src="/audio-summary.mp3" type="audio/mpeg" />{" "}
            {/* Replace with actual audio file */}
            Your browser does not support the audio element.
          </audio>
          {selectedArticle.imageUrl && (
            <div className="mt-4">
              <Image
                src={selectedArticle.imageUrl}
                alt={selectedArticle.title}
                width={600}
                height={400}
                className="rounded-lg"
              />
            </div>
          )}

          <ul className="mt-4 list-disc space-y-2">
            {selectedArticle.summaries &&
              selectedArticle.summaries.map((detail, index) => (
                <li key={index} className="text-gray-700 text-sm">
                  {typeof detail === "string" ? detail : JSON.stringify(detail)}
                </li>
              ))}
          </ul>
          {/* Related Articles */}
        </>
      )}
    </aside>
  );
};

export default Sidebar;
