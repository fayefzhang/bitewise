import React from "react";
import { Article } from "../common/interfaces";
import Image from "next/image";

type SidebarProps = {
  selectedArticle: Article | null;
  closePanel: () => void;
  isPanelOpen: boolean;
};

const readTimeLabels = ["<2 min", "2-7 min", "7+ min"];
const biasRatingLabels = ["Left", "Left-Center", "Center", "Right-Center", "Right", "Unknown"];

const Sidebar: React.FC<SidebarProps> = ({
  selectedArticle,
  closePanel,
  isPanelOpen,
}) => {
  return (
    <aside
      className={`text-black fixed right-0 top-24 h-[calc(100vh-4rem)] w-full md:w-[40%] lg:w-[30%] bg-blue-50 p-4 rounded-lg shadow-lg transition-transform duration-300 ease-in-out ${
        isPanelOpen ? "translate-x-0" : "translate-x-full"
      }`}
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
          <p className="text-gray-500">
            {biasRatingLabels[parseInt(selectedArticle.biasRating, 10)]} • {readTimeLabels[parseInt(selectedArticle.readTime, 10)]}
            </p>
          <a
            href={selectedArticle.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block mt-4 text-blue-500 hover:underline"
          >
            Read Full Article
          </a>
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
            {selectedArticle.summaries.map((detail, index) => (
              <li key={index} className="text-gray-700 text-sm">
                {detail}
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
