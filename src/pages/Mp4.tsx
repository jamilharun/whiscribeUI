import { useEffect, useState, useRef } from "react";
import { useBrowserCompatibility } from "../context/browserCompat";
import type { Mp3Mp4File, Subtitle } from "../types/player-types";
import { convertSRTtoWebVTT, parseSRT } from "../utils/global-utils";

// Extend the HTML input element to include webkitdirectory
declare module "react" {
  interface InputHTMLAttributes<T> extends AriaAttributes, DOMAttributes<T> {
    webkitdirectory?: string;
  }
}

function Mp4() {
  const {
    supportsFileSystemAPI,
    supportsWebkitDirectory,
    browserName,
    isModernBrowser,
    files,
    dirHandle,
    fileType,
    setFileType,
    pickFolderModern,
    handleFileInput,
    scanSubfolders,
    setScanSubfolders,
    isLoading,
  } = useBrowserCompatibility();

  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [subtitleUrl, setSubtitleUrl] = useState<string | null>(null);
  const [currentFile, setCurrentFile] = useState<string | null>(null);
  const [subtitles, setSubtitles] = useState<Subtitle[]>([]);
  const [currentSubtitle, setCurrentSubtitle] = useState<string>("");
  const [allFiles, setAllFiles] = useState<File[]>([]);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [showControls, setShowControls] = useState<boolean>(true);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Filter files to show only MP4 files
  const mp4Files: Mp3Mp4File[] = files.filter((file) =>
    file.name.toLowerCase().endsWith(".mp4")
  );

  // Set file type to MP4 on component mount
  useEffect(() => {
    if (fileType !== ".mp4") {
      setFileType(".mp4");
    }
  }, [fileType, setFileType]);

  const pickFolder = async (): Promise<void> => {
    if (supportsFileSystemAPI) {
      await pickFolderModern();
    } else {
      pickFolderFallback();
    }
  };

  const pickFolderFallback = (): void => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileInputWrapper = (
    event: React.ChangeEvent<HTMLInputElement>
  ): void => {
    // Store all files for subtitle lookup
    const fileList = Array.from(event.target.files || []);
    setAllFiles(fileList);

    // Call the context's handleFileInput
    handleFileInput(event);
  };

  const findSubtitleFile = async (baseName: string): Promise<string | null> => {
    const srtFileName = `${baseName}.srt`;

    try {
      if (dirHandle) {
        // Modern API - try to find SRT file in directory
        try {
          const srtHandle = await dirHandle.getFileHandle(srtFileName);
          const srtFile = await srtHandle.getFile();
          const srtText = await srtFile.text();
          console.log("Found subtitle via modern API:", srtFileName);
          return srtText;
        } catch (srtErr) {
          console.log(
            "Subtitle file not found via modern API:",
            srtFileName,
            srtErr
          );
        }
      } else {
        // Fallback - find SRT file in uploaded files
        const srtFile = allFiles.find((f) => f.name === srtFileName);
        if (srtFile) {
          const srtText = await srtFile.text();
          console.log("Found subtitle via fallback:", srtFile.name);
          return srtText;
        }
      }
    } catch (err) {
      console.warn("Error finding subtitle file:", err);
    }

    return null;
  };

  const playFile = async (mp4File: Mp3Mp4File): Promise<void> => {
    let file: File;

    if (mp4File.handle) {
      // Modern API
      file = await mp4File.handle.getFile();
    } else if (mp4File.file) {
      // Fallback API
      file = mp4File.file;
    } else {
      console.error("No file handle or file object available");
      return;
    }

    // Clean up previous URLs
    if (videoUrl) {
      URL.revokeObjectURL(videoUrl);
    }
    if (subtitleUrl) {
      URL.revokeObjectURL(subtitleUrl);
    }

    setVideoUrl(URL.createObjectURL(file));
    setCurrentFile(mp4File.name);
    setSubtitleUrl(null);
    setSubtitles([]);
    setCurrentSubtitle("");

    const baseName = mp4File.name.replace(/\.mp4$/i, "");
    console.log("Looking for subtitle file:", `${baseName}.srt`);

    try {
      const srtText = await findSubtitleFile(baseName);

      if (srtText) {
        const parsedSubtitles = parseSRT(srtText);
        console.log("Parsed subtitles count:", parsedSubtitles.length);

        const vttBlob = new Blob([convertSRTtoWebVTT(srtText)], {
          type: "text/vtt",
        });
        setSubtitles(parsedSubtitles);
        setSubtitleUrl(URL.createObjectURL(vttBlob));
      }
    } catch (err) {
      console.warn("Error reading subtitle file", err);
      setSubtitleUrl(null);
      setSubtitles([]);
    }
  };

  const toggleFullscreen = async (): Promise<void> => {
    if (!containerRef.current) return;

    try {
      if (!document.fullscreenElement) {
        await containerRef.current.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (err) {
      console.error("Fullscreen error:", err);
    }
  };

  const handleMouseMove = (): void => {
    setShowControls(true);

    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }

    if (isFullscreen) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }
  };

  const handleKeyDown = (event: KeyboardEvent): void => {
    if (!videoRef.current) return;

    switch (event.code) {
      case "Space":
        event.preventDefault();
        if (videoRef.current.paused) {
          videoRef.current.play();
        } else {
          videoRef.current.pause();
        }
        break;
      case "KeyF":
        event.preventDefault();
        toggleFullscreen();
        break;
      case "ArrowLeft":
        event.preventDefault();
        videoRef.current.currentTime -= 10;
        break;
      case "ArrowRight":
        event.preventDefault();
        videoRef.current.currentTime += 10;
        break;
      case "Escape":
        if (isFullscreen) {
          document.exitFullscreen();
        }
        break;
    }
  };

  useEffect(() => {
    const handleFullscreenChange = (): void => {
      setIsFullscreen(!!document.fullscreenElement);
      if (!document.fullscreenElement) {
        setShowControls(true);
        if (controlsTimeoutRef.current) {
          clearTimeout(controlsTimeoutRef.current);
        }
      }
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("keydown", handleKeyDown);
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [isFullscreen]);

  useEffect(() => {
    if (!videoUrl || subtitles.length === 0) return;

    const video = videoRef.current;
    if (!video) return;

    const updateSubtitle = (): void => {
      const time = video.currentTime;
      const active = subtitles.find(
        (cue) => time >= cue.start && time <= cue.end
      );
      setCurrentSubtitle(active ? active.text : "");
    };

    video.addEventListener("timeupdate", updateSubtitle);
    return () => video.removeEventListener("timeupdate", updateSubtitle);
  }, [videoUrl, subtitles]);

  // Clean up URLs on unmount
  useEffect(() => {
    return () => {
      if (videoUrl) {
        URL.revokeObjectURL(videoUrl);
      }
      if (subtitleUrl) {
        URL.revokeObjectURL(subtitleUrl);
      }
    };
  }, [videoUrl, subtitleUrl]);

  return (
    <div className="p-5 font-sans max-w-7xl mx-auto">
      <header className="mb-5 border-b border-gray-300 pb-4">
        <h1 className="m-0 text-gray-800 text-2xl font-bold">
          MP4 Video Player
        </h1>
        <div className="flex items-center gap-3 mt-2 flex-wrap">
          <button
            onClick={pickFolder}
            disabled={isLoading}
            className="px-4 py-2 bg-blue-600 text-white border-none rounded cursor-pointer hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading
              ? "Loading..."
              : supportsFileSystemAPI
              ? "Pick Folder"
              : "Select Files"}
          </button>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={scanSubfolders}
              onChange={(e) => setScanSubfolders(e.target.checked)}
              className="cursor-pointer"
            />
            <span>Include subfolders</span>
          </label>

          <div className="flex items-center gap-2 text-sm">
            {isModernBrowser ? (
              <span className="text-green-600 bg-green-50 px-2 py-1 rounded">
                ✓{" "}
                {browserName === "chrome" || browserName === "edge"
                  ? "Full folder support"
                  : "File selection supported"}
              </span>
            ) : (
              <span className="text-orange-600 bg-orange-50 px-2 py-1 rounded">
                ⚠ Limited file support - please select all MP4 and SRT files
              </span>
            )}
          </div>
        </div>

        {/* Hidden file input for fallback */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".mp4,.srt"
          onChange={handleFileInputWrapper}
          style={{ display: "none" }}
          {...(supportsWebkitDirectory && !supportsFileSystemAPI
            ? { webkitdirectory: "true" }
            : {})}
        />
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(250px,1fr)_minmax(0,3fr)] gap-5 mt-5">
        {/* Left panel - Files List */}
        <div className="bg-gray-100 rounded-lg p-4 max-h-[70vh] overflow-y-auto">
          <h2 className="mt-0 text-lg font-semibold text-gray-800">
            MP4 Files {mp4Files.length > 0 && `(${mp4Files.length})`}
          </h2>
          {isLoading ? (
            <div className="text-center py-4 text-gray-500">
              <div className="animate-spin inline-block w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full mr-2"></div>
              Loading files...
            </div>
          ) : mp4Files.length > 0 ? (
            <ul className="list-none p-0 m-0">
              {mp4Files.map((file, index) => (
                <li key={index} className="mb-2">
                  <button
                    onClick={() => playFile(file)}
                    className={`w-full text-left p-2.5 border border-gray-300 rounded cursor-pointer flex items-start transition-colors ${
                      file.name === currentFile
                        ? "bg-blue-100 border-blue-300"
                        : "bg-white hover:bg-gray-50"
                    }`}
                  >
                    <span className="mr-2 text-lg flex-shrink-0 mt-0.5">
                      {file.name === currentFile ? "▶️" : "🎬"}
                    </span>
                    <div className="flex-1 min-w-0">
                      <span className="block overflow-hidden text-ellipsis whitespace-nowrap font-medium">
                        {file.name}
                      </span>
                      {file.path && file.path !== file.name && (
                        <span className="block text-xs text-gray-500 mt-1 overflow-hidden text-ellipsis whitespace-nowrap">
                          {file.path}
                        </span>
                      )}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-gray-500 italic">
              No MP4 files found. Please select a folder containing MP4 files.
            </div>
          )}
        </div>

        {/* Right panel - Video Player */}
        <div className="flex flex-col gap-4">
          {videoUrl ? (
            <div
              ref={containerRef}
              className={`relative bg-black rounded-lg overflow-hidden ${
                isFullscreen ? "fixed inset-0 z-50 rounded-none" : ""
              }`}
              onMouseMove={handleMouseMove}
              onMouseLeave={() => !isFullscreen && setShowControls(true)}
            >
              {/* Video Element */}
              <video
                ref={videoRef}
                className="w-full h-auto max-h-[70vh]"
                controls={showControls || !isFullscreen}
                preload="metadata"
                style={{
                  maxHeight: isFullscreen ? "100vh" : "70vh",
                }}
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
                      {isFullscreen ? "🗗" : "⛶"}
                    </button>
                  </div>
                </div>
              </div>

              {/* Subtitle Overlay */}
              {currentSubtitle && (
                <div className="absolute bottom-16 left-0 right-0 text-center px-4">
                  <div className="inline-block bg-black/80 text-white px-3 py-2 rounded text-lg font-medium max-w-4xl">
                    {currentSubtitle}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="h-96 flex items-center justify-center bg-gray-100 rounded-lg text-gray-500">
              {mp4Files.length > 0
                ? "Select an MP4 file to play"
                : "Select a folder to load MP4 files"}
            </div>
          )}

          {/* Video Info & Keyboard Shortcuts */}
          {videoUrl && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-gray-800 mb-2">
                Keyboard Shortcuts
              </h3>
              <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                <div>
                  <kbd className="bg-gray-200 px-1 rounded">Space</kbd>{" "}
                  Play/Pause
                </div>
                <div>
                  <kbd className="bg-gray-200 px-1 rounded">F</kbd> Fullscreen
                </div>
                <div>
                  <kbd className="bg-gray-200 px-1 rounded">←</kbd> Seek -10s
                </div>
                <div>
                  <kbd className="bg-gray-200 px-1 rounded">→</kbd> Seek +10s
                </div>
              </div>
              {subtitles.length > 0 && (
                <div className="mt-2 text-xs text-green-600">
                  ✓ Subtitles loaded ({subtitles.length} cues)
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Mp4;
