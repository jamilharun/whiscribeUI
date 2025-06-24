import { FiFolder, FiMoon, FiMusic, FiSun } from "react-icons/fi";
import { useDarkMode } from "../../hooks/useDarkMode";
import { useBrowserCompatibility } from "../../context/browserCompat";
import type { Mp3Mp4File } from "../../types/player-types";

type SidebarDesktopProp = {
  pickFolder: () => Promise<void>;
  playFile: (mp3File: Mp3Mp4File) => Promise<void>;
  currentFile: string | null;
};

export const SidebarDesktop = ({
  pickFolder,
  playFile,
  currentFile,
}: SidebarDesktopProp) => {
  const {
    supportsFileSystemAPI,
    files,
    scanSubfolders,
    setScanSubfolders,
    isLoading,
  } = useBrowserCompatibility();
  const [darkMode, setDarkMode] = useDarkMode();

  const mp3Files: Mp3Mp4File[] = files.filter((file) =>
    file.name.toLowerCase().endsWith(".mp3")
  );

  return (
    <aside className="w-64 bg-white dark:bg-gray-800 shadow-md p-4 flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold">MP3 Player</h1>
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
        >
          {darkMode ? <FiSun size={20} /> : <FiMoon size={20} />}
        </button>
      </div>

      <button
        onClick={pickFolder}
        disabled={isLoading}
        className={`flex items-center gap-2 px-4 py-2 mb-4 rounded-lg ${
          isLoading
            ? "bg-gray-400 cursor-not-allowed"
            : "bg-blue-600 hover:bg-blue-700"
        } text-white`}
      >
        <FiFolder />
        {isLoading
          ? "Loading..."
          : supportsFileSystemAPI
          ? "Pick Folder"
          : "Select Files"}
      </button>

      <label className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer mb-6">
        <input
          type="checkbox"
          checked={scanSubfolders}
          onChange={(e) => setScanSubfolders(e.target.checked)}
          className="cursor-pointer"
        />
        <span>Include subfolders</span>
      </label>

      <div className="flex-1 overflow-y-auto">
        <h2 className="text-lg font-semibold mb-2">
          MP3 Files {mp3Files.length > 0 && `(${mp3Files.length})`}
        </h2>
        {isLoading ? (
          <div className="flex items-center justify-center h-20 text-gray-500">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
          </div>
        ) : mp3Files.length > 0 ? (
          <ul className="space-y-1">
            {mp3Files.map((file, index) => (
              <li key={index}>
                <button
                  onClick={() => playFile(file)}
                  className={`w-full text-left p-2 rounded-lg flex items-start transition-colors ${
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
                    {file.path && file.path !== file.name && (
                      <span className="block text-xs text-gray-500 dark:text-gray-400 mt-1 overflow-hidden text-ellipsis whitespace-nowrap">
                        {file.path}
                      </span>
                    )}
                  </div>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-gray-500 dark:text-gray-400 italic">
            No MP3 files found
          </div>
        )}
      </div>
    </aside>
  );
};
