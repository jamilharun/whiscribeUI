import { useEffect, useState, useRef } from "react";
import { useBrowserCompatibility } from "../context/browserCompat";
import type { Mp3Mp4File, Subtitle } from "../types/player-types";
import { convertSRTtoWebVTT, parseSRT } from "../utils/global-utils";
import { FiFilm, FiX } from "react-icons/fi";
import { HeaderMobile } from "../compoents/Mobile/HeaderMobile";
import { MenuDrawerMobile } from "../compoents/Mobile/MenuDrawerMobile";
import { LayoutDesktop } from "../compoents/Desktop/LayoutDesktop";
import { MainContentMp4Desktop } from "../compoents/Desktop/MainContentMp4Desktop";
import { FilesDrawerMobile } from "../compoents/Mobile/FilesDrawerMobile";
import { useDarkMode } from "../context/DarkModeContext";
import { NotFound } from "../compoents/NotFound";

// Extend the HTML input element to include webkitdirectory
declare module "react" {
  interface InputHTMLAttributes<T> extends AriaAttributes, DOMAttributes<T> {
    webkitdirectory?: string;
  }
}

function Mp4() {
  const {
    supportsFileSystemAPI,
    // supportsWebkitDirectory,
    // browserName,
    // isModernBrowser,
    files,
    dirHandle,
    fileType,
    setFileType,
    pickFolderModern,
    handleFileInput,
    isLoading,
  } = useBrowserCompatibility();
  const { darkMode } = useDarkMode();

  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [subtitleUrl, setSubtitleUrl] = useState<string | null>(null);
  const [currentFile, setCurrentFile] = useState<string | null>(null);
  const [subtitles, setSubtitles] = useState<Subtitle[]>([]);
  const [currentSubtitle, setCurrentSubtitle] = useState<string>("");
  const [allFiles, setAllFiles] = useState<File[]>([]);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [showControls, setShowControls] = useState<boolean>(true);

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [filesDrawerOpen, setFilesDrawerOpen] = useState(true);

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

  const toggleMobileMenu = () => setMobileMenuOpen(!mobileMenuOpen);

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
    <div
      className={`min-h-screen transition-colors duration-300 ${
        darkMode ? "dark bg-gray-900 text-gray-100" : "bg-gray-50 text-gray-900"
      }`}
    >
      {/* Mobile Header */}
      <HeaderMobile
        toggleMobileMenu={toggleMobileMenu}
        mobileMenuOpen={mobileMenuOpen}
        fileInputRef={fileInputRef}
        handleFileInputWrapper={handleFileInputWrapper}
      />

      {/* Mobile Menu Drawer */}
      <MenuDrawerMobile
        toggleMobileMenu={toggleMobileMenu}
        pickFolder={pickFolder}
        mobileMenuOpen={mobileMenuOpen}
      />

      {/* Desktop Layout */}
      <LayoutDesktop
        pickFolder={pickFolder}
        playFile={playFile}
        currentFile={currentFile}
      >
        <MainContentMp4Desktop
          videoUrl={videoUrl}
          containerRef={containerRef}
          isFullscreen={isFullscreen}
          handleMouseMove={handleMouseMove}
          setShowControls={setShowControls}
          videoRef={videoRef}
          showControls={showControls}
          subtitleUrl={subtitleUrl}
          currentFile={currentFile}
          toggleFullscreen={toggleFullscreen}
          currentSubtitle={currentSubtitle}
          subtitles={subtitles}
        />
      </LayoutDesktop>

      {/* Mobile Files Drawer */}
      <FilesDrawerMobile
        toggleFilesDrawer={() => setFilesDrawerOpen(!filesDrawerOpen)}
      />

      {filesDrawerOpen && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-20 bg-white dark:bg-gray-800 shadow-lg rounded-t-xl p-4 max-h-[50vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold">Videos</h2>
            <button
              onClick={() => setFilesDrawerOpen(!filesDrawerOpen)}
              className="p-1"
            >
              <FiX size={20} />
            </button>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center h-20 text-gray-500 dark:text-gray-400">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
            </div>
          ) : mp4Files.length > 0 ? (
            <ul className="space-y-2">
              {mp4Files.map((file, index) => (
                <li key={index}>
                  <button
                    onClick={() => {
                      playFile(file);
                      setFilesDrawerOpen(false);
                    }}
                    className={`w-full text-left p-3 rounded-lg flex items-start transition-colors ${
                      file.name === currentFile
                        ? "bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200"
                        : "bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600"
                    }`}
                  >
                    <span className="mr-2 flex-shrink-0 mt-0.5">
                      <FiFilm />
                    </span>
                    <div className="flex-1 min-w-0">
                      <span className="block overflow-hidden text-ellipsis whitespace-nowrap font-medium">
                        {file.name}
                      </span>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <NotFound />
          )}
        </div>
      )}
    </div>
  );
}

export default Mp4;
