import { useEffect, useState, useRef } from "react";
import { useBrowserCompatibility } from "../context/browserCompat";
import type { Mp3Mp4File, Subtitle } from "../types/player-types";
import { convertSRTtoWebVTT, parseSRT } from "../utils/global-utils";

function Mp3() {
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

  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [subtitleUrl, setSubtitleUrl] = useState<string | null>(null);
  const [currentFile, setCurrentFile] = useState<string | null>(null);
  const [subtitles, setSubtitles] = useState<Subtitle[]>([]);
  const [currentSubtitle, setCurrentSubtitle] = useState<string>("");
  const [allFiles, setAllFiles] = useState<File[]>([]);

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
    <div className="p-5 font-sans max-w-6xl mx-auto">
      <header className="mb-5 border-b border-gray-300 pb-4">
        <h1 className="m-0 text-gray-800 text-2xl font-bold">
          MP3 Audio Player
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
                ⚠ Limited file support - please select all MP3 and SRT files
              </span>
            )}
          </div>
        </div>

        {/* Hidden file input for fallback */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".mp3,.srt"
          onChange={handleFileInputWrapper}
          style={{ display: "none" }}
          {...(supportsWebkitDirectory && !supportsFileSystemAPI
            ? { webkitdirectory: "true" }
            : {})}
        />
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(250px,1fr)_minmax(0,2fr)] gap-5 mt-5">
        {/* Left panel - Files List */}
        <div className="bg-gray-100 rounded-lg p-4 max-h-[70vh] overflow-y-auto">
          <h2 className="mt-0 text-lg font-semibold text-gray-800">
            MP3 Files {mp3Files.length > 0 && `(${mp3Files.length})`}
          </h2>
          {isLoading ? (
            <div className="text-center py-4 text-gray-500">
              <div className="animate-spin inline-block w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full mr-2"></div>
              Loading files...
            </div>
          ) : mp3Files.length > 0 ? (
            <ul className="list-none p-0 m-0">
              {mp3Files.map((file, index) => (
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
                      {file.name === currentFile ? "▶️" : "🎵"}
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
              No MP3 files found. Please select a folder containing MP3 files.
            </div>
          )}
        </div>

        {/* Right panel - Player & Subtitles */}
        <div className="flex flex-col gap-4">
          {audioUrl ? (
            <>
              <div className="bg-gray-100 rounded-lg p-5">
                <h2 className="m-0 mb-4 text-lg font-semibold text-gray-800">
                  Now Playing: {currentFile}
                </h2>
                <audio controls className="w-full mb-2" preload="metadata">
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

              {/* Subtitle Display */}
              <div className="min-h-[100px] flex items-center justify-center">
                {currentSubtitle ? (
                  <div className="w-full p-4 text-black rounded-lg text-5xl italic text-center leading-tight">
                    {currentSubtitle}
                  </div>
                ) : subtitles.length === 0 && currentFile ? (
                  <div className="p-2.5 text-orange-600 bg-orange-50 rounded-lg w-full text-center">
                    No subtitles available for this audio file
                  </div>
                ) : null}
              </div>
            </>
          ) : (
            <div className="h-48 flex items-center justify-center bg-gray-100 rounded-lg text-gray-500">
              {mp3Files.length > 0
                ? "Select an MP3 file to play"
                : "Select a folder to load MP3 files"}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Mp3;
