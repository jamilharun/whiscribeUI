import { FiFilm, FiMaximize, FiMinimize } from "react-icons/fi";
import type { Mp3Mp4File, Subtitle } from "../../types/player-types";
import { useBrowserCompatibility } from "../../context/browserCompat";
import type { RefObject, SetStateAction } from "react";

type MainContentMp4DesktopProp = {
  videoUrl: string | null;
  containerRef: RefObject<HTMLDivElement | null>;
  isFullscreen: boolean;
  handleMouseMove: () => void;
  setShowControls: (value: SetStateAction<boolean>) => void;
  videoRef: RefObject<HTMLVideoElement | null>;
  showControls: boolean;
  subtitleUrl: string | null;
  currentFile: string | null;
  toggleFullscreen: () => Promise<void>;
  currentSubtitle: string;
  subtitles: Subtitle[];
};

export const MainContentMp4Desktop = ({
  videoUrl,
  containerRef,
  isFullscreen,
  handleMouseMove,
  setShowControls,
  videoRef,
  showControls,
  subtitleUrl,
  currentFile,
  toggleFullscreen,
  currentSubtitle,
  subtitles,
}: MainContentMp4DesktopProp) => {
  const { files } = useBrowserCompatibility();

  const mp4Files: Mp3Mp4File[] = files.filter((file) =>
    file.name.toLowerCase().endsWith(".mp4")
  );
  return (
    <main className="flex-1 p-6 overflow-y-auto">
      <div className="max-w-6xl mx-auto">
        {videoUrl ? (
          <div className="space-y-6">
            {/* Video Player Container */}
            <div
              ref={containerRef}
              className={`relative bg-black rounded-xl shadow-lg overflow-hidden ${
                isFullscreen ? "fixed inset-0 z-40 bg-black" : ""
              }`}
              onMouseMove={handleMouseMove}
              onMouseLeave={() => !isFullscreen && setShowControls(true)}
            >
              <video
                ref={videoRef}
                className="w-full h-auto"
                controls={showControls || !isFullscreen}
                preload="metadata"
              >
                <source src={videoUrl} type="video/mp4" />
                {subtitleUrl && (
                  <track
                    kind="subtitles"
                    src={subtitleUrl}
                    default
                    label="English"
                    srcLang="en"
                  />
                )}
              </video>

              {/* Custom Controls Overlay */}
              <div
                className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 transition-opacity duration-300 ${
                  showControls || !isFullscreen ? "opacity-100" : "opacity-0"
                }`}
              >
                <div className="flex items-center justify-between text-white">
                  <h3 className="text-sm font-medium truncate mr-4">
                    {currentFile}
                  </h3>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={toggleFullscreen}
                      className="p-2 hover:bg-white/20 rounded transition-colors"
                      title="Toggle Fullscreen (F)"
                    >
                      {isFullscreen ? (
                        <FiMinimize size={18} />
                      ) : (
                        <FiMaximize size={18} />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Subtitle Overlay */}
              {currentSubtitle && (
                <div className="absolute bottom-16 left-0 right-0 text-center px-4">
                  <div className="inline-block bg-black/70 text-white px-4 py-2 rounded-lg text-xl font-medium max-w-4xl">
                    {currentSubtitle}
                  </div>
                </div>
              )}
            </div>

            {/* Video Info & Shortcuts */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4">
              <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">
                Keyboard Shortcuts
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-gray-600 dark:text-gray-400">
                <div>
                  <kbd className="bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">
                    Space
                  </kbd>{" "}
                  Play/Pause
                </div>
                <div>
                  <kbd className="bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">
                    F
                  </kbd>{" "}
                  Fullscreen
                </div>
                <div>
                  <kbd className="bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">
                    ←
                  </kbd>{" "}
                  Seek -10s
                </div>
                <div>
                  <kbd className="bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">
                    →
                  </kbd>{" "}
                  Seek +10s
                </div>
              </div>
              {subtitles.length > 0 && (
                <div className="mt-2 text-xs text-green-600 dark:text-green-400">
                  ✓ Subtitles loaded ({subtitles.length} cues)
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="h-96 flex flex-col items-center justify-center bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 text-center">
            <FiFilm
              size={48}
              className="text-gray-400 dark:text-gray-500 mb-4"
            />
            <p className="text-lg text-gray-600 dark:text-gray-400">
              {mp4Files.length > 0
                ? "Select a video to play"
                : "Select a folder to load videos"}
            </p>
          </div>
        )}
      </div>
    </main>
  );
};
