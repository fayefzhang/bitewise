import React, { useEffect, useState } from "react";
import { Article } from "../common/interfaces";
import Image from "next/image";
import Link from "next/link";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import SpeedIcon from "@mui/icons-material/Speed";
import PsychologyAltIcon from "@mui/icons-material/PsychologyAlt";
import Tooltip from "@mui/material/Tooltip";
import Spinner from "../common/Spinner";
import { fetchArticleSummary } from "./searchUtils";
import { defaultAIPreferences } from "../common/utils";
import {
  biasRatingLabels,
  readTimeLabels,
  difficultyLabels,
} from "../common/utils";
import ReactMarkdown from "react-markdown";

type SidebarProps = {
  selectedArticle: Article | null;
  setSelectedArticle: Function;
  closePanel: () => void;
  isPanelOpen: boolean;
};

const toneOptions = ["Formal", "Conversational", "Technical", "Analytical"];
const formatOptions = ["Highlights", "Bullets", "Analysis", "Quotes"];

const Sidebar: React.FC<SidebarProps> = ({
  selectedArticle,
  setSelectedArticle,
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
  const [reportAcknowledged, setReportAcknowledged] = useState(false);

  useEffect(() => {
    if (userEmail) {
      localStorage.setItem(
        `preferences_${userEmail}`,
        JSON.stringify(aiPreferences)
      );
    }
  }, [aiPreferences, userEmail]);

  useEffect(() => {
    console.log("fetchArticleSummary: ", aiPreferences);
    fetchArticleSummary(selectedArticle, setSelectedArticle, aiPreferences);
  }, [aiPreferences]);

  const togglePreferencesPanel = () => {
    setIsPreferencesPanelOpen(!isPreferencesPanelOpen);
  };

  const applyPreferences = () => {
    if (selectedArticle) {
      selectedArticle.summaries = [];
    }
    setAIPreferences(tempPreferences);
  };

  return (
    <aside
      className={`text-black fixed right-0 top-24 h-[calc(100vh-4rem)] w-[34%] bg-white p-4 rounded-lg shadow-lg transition-transform duration-300 ease-in-out ${
        isPanelOpen ? "translate-x-0" : "translate-x-full"
      } overflow-y-auto`}
      style={{ zIndex: 50 }}
    >
      <div className="p-5">
        <div className="p-2">
          <button
            onClick={closePanel}
            className="absolute top-4 right-4 p-2 text-darkBlue rounded-full hover:bg-lightBlue text-xl font-bold"
            aria-label="Close"
          >
            X
          </button>
        </div>
        {selectedArticle && (
          <>
            <h2 className="font-bold hover:underline text-xl mb-4">
              <a
                href={selectedArticle.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                {selectedArticle.title}
              </a>
            </h2>
            <div className="border-b-2 border-veryLightBlue mb-4 w-full" />
            <div className="flex justify-between">
              <span>{selectedArticle.source}</span>
              <span>{selectedArticle.authors[0]}</span>
            </div>

            <div>
              <div className="flex justify-between mt-1">
                {biasRatingLabels[parseInt(selectedArticle.biasRating, 10)] ? (
                  <Tooltip
                    title="Political Bias: The article and source's political leaning (Left, Left-Center, Center, Right-Center, or Right)"
                    arrow
                  >
                    <div className="flex items-center space-x-1">
                      <SpeedIcon fontSize="small" />
                      <p>
                        {
                          biasRatingLabels[
                            parseInt(selectedArticle.biasRating, 10)
                          ]
                        }
                      </p>
                    </div>
                  </Tooltip>
                ) : (
                  <div className="flex items-center space-x-1"></div>
                )}
                {difficultyLabels[parseInt(selectedArticle.difficulty, 10)] && (
                  <Tooltip
                    title="Reading Difficulty: The complexity of the language (Easy, Medium, or Hard)"
                    arrow
                  >
                    <div className="flex items-center space-x-1">
                      <PsychologyAltIcon fontSize="small" />
                      <p>
                        {
                          difficultyLabels[
                            parseInt(selectedArticle.difficulty, 10)
                          ]
                        }
                      </p>
                    </div>
                  </Tooltip>
                )}
                <Tooltip
                  title="Read Time: Estimated time to read the article (Short, Medium, or Long)"
                  arrow
                >
                  <div className="flex items-center space-x-1">
                    <AccessTimeIcon fontSize="small" />
                    <p>
                      {readTimeLabels[parseInt(selectedArticle.readTime, 10)]}
                    </p>
                  </div>
                </Tooltip>
              </div>
            </div>
            <div className="flex justify-between items-center mt-4">
              <a
                href={selectedArticle.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-darkBlue hover:underline"
              >
                Read Full Article
              </a>
              <button
                onClick={togglePreferencesPanel}
                className="text-darkBlue rounded-md"
              >
                ⚙️ AI Preferences
              </button>
            </div>

            {/* Advanced AI Preferences */}
            {isPreferencesPanelOpen && (
              <div className="mt-4 bg-veryLightBlue shadow rounded-lg p-4">
                <div className="flex justify-start items-center space-x-2">
                  <label className="block font-semibold">Length</label>
                  {readTimeLabels.map((option) => (
                    <button
                      key={option}
                      className={`px-3 py-2 rounded-full ${
                        tempPreferences.length === option
                          ? "bg-darkBlue text-white"
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
                    className="w-50% border-2 rounded-full px-4 py-2"
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
                    className="w-25% border-2 rounded-full px-4 py-2"
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
                    onClick={() => {
                      applyPreferences();
                      togglePreferencesPanel();
                    }}
                    className="mt-4 p-2 bg-darkBlue text-white px-4 rounded-full"
                  >
                    Apply
                  </button>
                </div>
              </div>
            )}

            {/* Article Content */}
            {selectedArticle?.s3Url ? (
              <audio
                key={selectedArticle.s3Url}
                controls
                className="mt-2 w-full"
              >
                <source src={selectedArticle.s3Url} type="audio/mpeg" />
                Your browser does not support the audio element.
              </audio>
            ) : (
              selectedArticle?.summaries &&
              selectedArticle.summaries.length > 0 &&
              selectedArticle.summaries[0] !==
                '{"error":"Internal server error","details":"Request failed with status code 500"}' && (
                <p className="text-gray-500 text-center mt-16 flex items-center justify-center">
                  <Spinner /> Generating summary audio...
                </p>
              )
            )}
            <ul className="mt-6 list-disc space-y-2 mb-8">
              {selectedArticle?.summaries &&
              selectedArticle.summaries.length > 0 ? (
                <>
                  {typeof selectedArticle.summaries[0] === "string" ? (
                    selectedArticle.summaries[0] ===
                    '{"error":"Internal server error","details":"Request failed with status code 500"}' ? (
                      <p className="text-red-500 text-sm">
                        Unable to generate summary.
                      </p>
                    ) : (
                      selectedArticle.summaries[0]
                        .split("- ")
                        .map((part, index) => (
                          <p key={index} className="text-sm">
                            {part.trim().replace(/^-+/, "").trim()}
                          </p>
                        ))
                    )
                  ) : JSON.stringify(selectedArticle.summaries[0]) ===
                    '{"error":"Internal server error","details":"Request failed with status code 500"}' ? (
                    <p className="text-red-500 text-sm">
                      Unable to generate summary.
                    </p>
                  ) : (
                    JSON.stringify(selectedArticle.summaries[0])
                      .split("- ")
                      .map((part, index) => (
                        <p key={index} className="text-sm">
                          <ReactMarkdown>
                            {part.trim().replace(/^-+/, "").trim()}
                          </ReactMarkdown>
                        </p>
                      ))
                  )}

                  {/* Report Inaccurate AI Summary Button */}
                    <div className="mt-8 text-right">
                    <a
                      href="#"
                      className="text-darkBlue hover:underline text-sm"
                      onClick={(e) => {
                      e.preventDefault();
                      setReportAcknowledged(true);
                      }}
                    >
                      Report Inaccurate AI Summary
                    </a>
                    {reportAcknowledged && (
                      <p className="text-sm text-gray-600 mt-2">
                        The Bitewise team has been notified and will review this
                        summary.
                      </p>
                    )}
                  </div>
                </>
              ) : (
                <p className="text-gray-500 text-center mt-16 flex items-center justify-center">
                  <Spinner /> Generating summary...
                </p>
              )}
            </ul>
            {/* Related Articles */}
          </>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
