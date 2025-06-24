import { FiMenu, FiMoon, FiSun, FiX } from "react-icons/fi";
import { useBrowserCompatibility } from "../../context/browserCompat";
import type { RefObject } from "react";
import { useDarkMode } from "../../context/DarkModeContext";

type HeaderMobileProp = {
  toggleMobileMenu: () => void;
  mobileMenuOpen: boolean;
  fileInputRef: RefObject<HTMLInputElement | null>;
  handleFileInputWrapper: (event: React.ChangeEvent<HTMLInputElement>) => void;
};

export const HeaderMobile = ({
  toggleMobileMenu,
  mobileMenuOpen,
  fileInputRef,
  handleFileInputWrapper,
}: HeaderMobileProp) => {
  const { supportsFileSystemAPI, supportsWebkitDirectory, fileType } =
    useBrowserCompatibility();

  const { darkMode } = useDarkMode();
  return (
    <header className="lg:hidden sticky top-0 z-10 bg-white dark:bg-gray-800 shadow-md p-4 flex justify-between items-center">
      <button
        onClick={toggleMobileMenu}
        className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
      >
        {mobileMenuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
      </button>
      <h1 className="text-xl font-bold">{fileType} Player</h1>
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
      <button
        // onClick={toggleDarkMode}
        className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 opacity-0"
      >
        {darkMode ? <FiSun size={24} /> : <FiMoon size={24} />}
      </button>
    </header>
  );
};
