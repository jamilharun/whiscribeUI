import { FiMusic } from "react-icons/fi";
import { useBrowserCompatibility } from "../../context/browserCompat";
import type { Mp3Mp4File, Subtitle } from "../../types/player-types";

type MainContentDesktopProp = {
  currentFile: string | null;
  audioUrl: string | null;
  subtitleUrl: string | null;
  currentSubtitle: string;
  subtitles: Subtitle[];
};

export const MainContentMp3Desktop = ({
  currentFile,
  audioUrl,
  subtitleUrl,
  currentSubtitle,
  subtitles,
}: MainContentDesktopProp) => {
  const { files } = useBrowserCompatibility();

  const mp3Files: Mp3Mp4File[] = files.filter((file) =>
    file.name.toLowerCase().endsWith(".mp3")
  );

  return (
    <main className="flex-1 p-6 overflow-y-auto">
      <div className="max-w-4xl mx-auto">
        {audioUrl ? (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
              <h2 className="text-xl font-bold mb-4">
                Now Playing:{" "}
                <span className="text-blue-600 dark:text-blue-400">
                  {currentFile}
                </span>
              </h2>
              <audio controls className="w-full mb-4" preload="metadata">
                <source src={audioUrl} type="audio/mpeg" />
                {subtitleUrl && (
                  <track
                    kind="subtitles"
                    src={subtitleUrl}
                    default
                    label="English"
                    srcLang="en"
                  />
                )}
              </audio>
            </div>

            <div className="min-h-[200px] flex items-center justify-center bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
              {currentSubtitle ? (
                <div className="w-full p-4 text-center text-4xl md:text-5xl font-serif italic leading-tight">
                  {currentSubtitle}
                </div>
              ) : subtitles.length === 0 && currentFile ? (
                <div className="p-4 text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900 rounded-lg w-full text-center">
                  No subtitles available for this audio file
                </div>
              ) : null}
            </div>
          </div>
        ) : (
          <div className="h-64 flex flex-col items-center justify-center bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 text-center">
            <FiMusic
              size={48}
              className="text-gray-400 dark:text-gray-500 mb-4"
            />
            <p className="text-lg text-gray-600 dark:text-gray-400">
              {mp3Files.length > 0
                ? "Select an MP3 file to play"
                : "Select a folder to load MP3 files"}
            </p>
          </div>
        )}
      </div>
    </main>
  );
};
