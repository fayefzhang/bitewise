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
      <button onClick={closePanel} className="p-2 text-blue-700 rounded-md">
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
              className="p-2 text-blue-700 rounded-md"
            >
              ⚙️ AI Preferences
            </button>
          </div>

          {/* Advanced AI Preferences */}
          {isPreferencesPanelOpen && (
            <div className="mt-4 bg-white shadow rounded-lg p-4">
              <div className="flex justify-start items-center space-x-2">
                <label className="block font-semibold">Read Time</label>
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

              <div className="flex items-center mt-4 space-x-2">
                <label className="block font-semibold">Format</label>
                <select
                  className="w-50% p-2 border rounded"
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
              </div>

              <div className="flex items-center mt-4 space-x-2">
                <label className="block font-semibold">Tone</label>
                <select
                  className="w-25% p-2 border rounded"
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
              </div>

              <div className="flex justify-between items-center mt-4 space-x-2">
                <div className="flex items-center space-x-2">
                  <label htmlFor="jargon" className="block font-semibold">
                    Allow Jargon
                  </label>
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
                </div>
                <button
                  onClick={applyPreferences}
                  className="mt-4 bg-blue-500 text-white px-4 rounded"
                >
                  Apply
                </button>
              </div>
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

          <ul className="mt-4 list-disc space-y-2 p-4">
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
