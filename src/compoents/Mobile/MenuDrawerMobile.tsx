import { FiFolder, FiMoon, FiSun, FiX } from "react-icons/fi";
import { useBrowserCompatibility } from "../../context/browserCompat";
import { useDarkMode } from "../../hooks/useDarkMode";

type MenuDrawerMobileProp = {
  toggleMobileMenu: () => void;
  pickFolder: () => Promise<void>;
  mobileMenuOpen: boolean;
};

export const MenuDrawerMobile = ({
  toggleMobileMenu,
  pickFolder,
  mobileMenuOpen,
}: MenuDrawerMobileProp) => {
  const {
    supportsFileSystemAPI,
    scanSubfolders,
    setScanSubfolders,
    isLoading,
  } = useBrowserCompatibility();

  const [darkMode, setDarkMode] = useDarkMode();

  return (
    mobileMenuOpen && (
      <div
        className="lg:hidden fixed inset-0 z-20 bg-black bg-opacity-50"
        onClick={toggleMobileMenu}
      >
        <div
          className="w-4/5 max-w-sm h-full bg-white dark:bg-gray-800 shadow-lg p-4"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold">Menu</h2>
            <button onClick={toggleMobileMenu} className="p-1">
              <FiX size={20} />
            </button>
          </div>

          <button
            onClick={pickFolder}
            disabled={isLoading}
            className={`w-full flex items-center gap-2 px-4 py-2 mb-4 rounded-lg ${
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

          <label className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer">
            <input
              type="checkbox"
              checked={scanSubfolders}
              onChange={(e) => setScanSubfolders(e.target.checked)}
              className="cursor-pointer"
            />
            <span>Include subfolders</span>
          </label>

          <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={setDarkMode(!darkMode)}
              className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              {darkMode ? <FiSun /> : <FiMoon />}
              {darkMode ? "Light Mode" : "Dark Mode"}
            </button>
          </div>
        </div>
      </div>
    )
  );
};
