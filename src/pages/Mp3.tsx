import { useEffect, useState, useRef } from "react";
import { useBrowserCompatibility } from "../context/browserCompat";
import type { Mp3Mp4File, Subtitle } from "../types/player-types";
import { convertSRTtoWebVTT, parseSRT } from "../utils/global-utils";
import { FiMusic, FiX } from "react-icons/fi";
import { HeaderMobile } from "../compoents/Mobile/HeaderMobile";
import { MenuDrawerMobile } from "../compoents/Mobile/MenuDrawerMobile";
import { LayoutDesktop } from "../compoents/Desktop/LayoutDesktop";
import { FilesDrawerMobile } from "../compoents/Mobile/FilesDrawerMobile";
import { MainContentMp3Desktop } from "../compoents/Desktop/MainContentMp3Desktop";
import { useDarkMode } from "../context/DarkModeContext";
import { NotFound } from "../compoents/NotFound";

function Mp3() {
  const {
    supportsFileSystemAPI,
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

  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [subtitleUrl, setSubtitleUrl] = useState<string | null>(null);
  const [currentFile, setCurrentFile] = useState<string | null>(null);
  const [subtitles, setSubtitles] = useState<Subtitle[]>([]);
  const [currentSubtitle, setCurrentSubtitle] = useState<string>("");
  const [allFiles, setAllFiles] = useState<File[]>([]);

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [filesDrawerOpen, setFilesDrawerOpen] = useState(true);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filter files to show only MP3 files
  const mp3Files: Mp3Mp4File[] = files.filter((file) =>
    file.name.toLowerCase().endsWith(".mp3")
  );

  // Set file type to MP3 on component mount
  useEffect(() => {
    if (fileType !== ".mp3") {
      setFileType(".mp3");
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
        } else {
          console.log(
            "Available files:",
            allFiles.map((f) => f.name)
          );
          console.log("Looking for:", srtFileName);
        }
      }
    } catch (err) {
      console.warn("Error finding subtitle file:", err);
    }

    return null;
  };

  const playFile = async (mp3File: Mp3Mp4File): Promise<void> => {
    let file: File;

    if (mp3File.handle) {
      // Modern API
      file = await mp3File.handle.getFile();
    } else if (mp3File.file) {
      // Fallback API
      file = mp3File.file;
    } else {
      console.error("No file handle or file object available");
      return;
    }

    // Clean up previous URLs
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    if (subtitleUrl) {
      URL.revokeObjectURL(subtitleUrl);
    }

    setAudioUrl(URL.createObjectURL(file));
    setCurrentFile(mp3File.name);
    setSubtitleUrl(null);
    setSubtitles([]);
    setCurrentSubtitle("");

    const baseName = mp3File.name.replace(/\.mp3$/i, "");
    console.log("Looking for subtitle file:", `${baseName}.srt`);

    try {
      const srtText = await findSubtitleFile(baseName);

      if (srtText) {
        const parsedSubtitles = parseSRT(srtText);
        console.log("Parsed subtitles count:", parsedSubtitles.length);
        console.log("First few subtitles:", parsedSubtitles.slice(0, 3));

        const vttBlob = new Blob([convertSRTtoWebVTT(srtText)], {
          type: "text/vtt",
        });
        setSubtitles(parsedSubtitles);
        setSubtitleUrl(URL.createObjectURL(vttBlob));
      } else {
        console.log("No subtitle text found");
      }
    } catch (err) {
      console.warn("Error reading subtitle file", err);
      setSubtitleUrl(null);
      setSubtitles([]);
    }
  };

  const toggleMobileMenu = () => setMobileMenuOpen(!mobileMenuOpen);
  const toggleFilesDrawer = () => setFilesDrawerOpen(!filesDrawerOpen);

  useEffect(() => {
    console.log("Parsed subtitles:", subtitles);
    if (!audioUrl || subtitles.length === 0) return;

    const audio = document.querySelector("audio");
    if (!audio) return;

    const updateSubtitle = (): void => {
      const time = audio.currentTime;
      const active = subtitles.find(
        (cue) => time >= cue.start && time <= cue.end
      );
      setCurrentSubtitle(active ? active.text : "");
    };

    audio.addEventListener("timeupdate", updateSubtitle);
    return () => audio.removeEventListener("timeupdate", updateSubtitle);
  }, [audioUrl, subtitles]);

  // Clean up URLs on unmount
  useEffect(() => {
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
      if (subtitleUrl) {
        URL.revokeObjectURL(subtitleUrl);
      }
    };
  }, [audioUrl, subtitleUrl]);

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
        <MainContentMp3Desktop
          currentFile={currentFile}
          audioUrl={audioUrl}
          subtitleUrl={subtitleUrl}
          currentSubtitle={currentSubtitle}
          subtitles={subtitles}
        />
      </LayoutDesktop>

      {/* Mobile Files Drawer */}
      <FilesDrawerMobile toggleFilesDrawer={toggleFilesDrawer} />

      {filesDrawerOpen && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-10 bg-white dark:bg-gray-800 shadow-lg rounded-t-xl p-4 max-h-[50vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold">MP3 Files</h2>
            <button onClick={toggleFilesDrawer} className="p-1">
              <FiX size={20} />
            </button>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center h-20 text-gray-500">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
            </div>
          ) : mp3Files.length > 0 ? (
            <ul className="space-y-2">
              {mp3Files.map((file, index) => (
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
                      <FiMusic />
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

export default Mp3;
