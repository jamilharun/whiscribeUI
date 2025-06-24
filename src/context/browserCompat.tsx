import { createContext, useContext, useState } from "react";

declare global {
  interface Window {
    showDirectoryPicker(): Promise<FileSystemDirectoryHandle>;
  }

  interface FileSystemDirectoryHandle {
    values(): AsyncIterableIterator<FileSystemHandle>;
    getFileHandle(name: string): Promise<FileSystemFileHandle>;
  }
}

interface BrowserCompatibilityContextType {
  supportsFileSystemAPI: boolean;
  supportsWebkitDirectory: boolean;
  browserName: string;
  isModernBrowser: boolean;
  files: FileInt[];
  dirHandle: FileSystemDirectoryHandle | null;
  fileType: ".mp3" | ".mp4" | undefined;
  setFileType: (type: ".mp3" | ".mp4" | undefined) => void;
  pickFolderModern: () => Promise<void>;
  handleFileInput: (event: React.ChangeEvent<HTMLInputElement>) => void;
  scanSubfolders: boolean;
  setScanSubfolders: (scan: boolean) => void;
  isLoading: boolean;
}

interface FileInt {
  name: string;
  path?: string; // Added to track file location in subfolders
  handle?: FileSystemFileHandle;
  file?: File;
}

const BrowserCompatibilityContext = createContext<
  BrowserCompatibilityContextType | undefined
>(undefined);

export const BrowserCompatibilityProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const [files, setFiles] = useState<FileInt[]>([]);
  const [dirHandle, setDirHandle] = useState<FileSystemDirectoryHandle | null>(
    null
  );
  const [fileType, setFileType] = useState<".mp3" | ".mp4" | undefined>();
  const [scanSubfolders, setScanSubfolders] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Recursive function to scan directories
  const scanDirectory = async (
    handle: FileSystemDirectoryHandle,
    path: string = ""
  ): Promise<FileInt[]> => {
    const foundFiles: FileInt[] = [];

    for await (const entry of handle.values()) {
      const currentPath = path ? `${path}/${entry.name}` : entry.name;

      if (entry.kind === "file") {
        // If no fileType is set, get all files; otherwise filter by extension
        const shouldInclude = !fileType || entry.name.endsWith(fileType);

        if (shouldInclude) {
          foundFiles.push({
            name: entry.name,
            path: currentPath,
            handle: entry as FileSystemFileHandle,
          });
        }
      } else if (entry.kind === "directory" && scanSubfolders) {
        // Recursively scan subdirectories if enabled
        try {
          const subDirHandle = entry as FileSystemDirectoryHandle;
          const subFiles = await scanDirectory(subDirHandle, currentPath);
          foundFiles.push(...subFiles);
        } catch (err) {
          console.warn(`Could not access subdirectory ${currentPath}:`, err);
        }
      }
    }

    return foundFiles;
  };

  // Pick folder using modern File System Access API
  const pickFolderModern = async (): Promise<void> => {
    try {
      setIsLoading(true);
      const handle = await window.showDirectoryPicker();
      setDirHandle(handle);

      const foundFiles = await scanDirectory(handle);

      // Sort files alphabetically by name, then by path
      foundFiles.sort((a, b) => {
        const nameComparison = a.name.localeCompare(b.name);
        if (nameComparison !== 0) return nameComparison;
        return (a.path || "").localeCompare(b.path || "");
      });

      setFiles(foundFiles);
    } catch (err) {
      console.error("Error picking folder:", err);
      if (err instanceof DOMException && err.name === "AbortError") {
        console.log("User cancelled folder selection");
      } else {
        alert(
          "Error accessing folder. Make sure you're using a supported browser (Chrome/Edge) and the page is served over HTTPS or localhost."
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Handle file input for fallback method (webkitdirectory)
  const handleFileInput = (
    event: React.ChangeEvent<HTMLInputElement>
  ): void => {
    setIsLoading(true);
    const fileList = Array.from(event.target.files || []);

    const processedFiles: FileInt[] = fileList
      .filter((file) => {
        // If no fileType is set, include all files; otherwise filter by extension
        return !fileType || file.name.endsWith(fileType);
      })
      .map((file) => ({
        name: file.name,
        path: file.webkitRelativePath || file.name,
        file,
      }))
      .sort((a, b) => {
        const nameComparison = a.name.localeCompare(b.name);
        if (nameComparison !== 0) return nameComparison;
        return (a.path || "").localeCompare(b.path || "");
      });

    setFiles(processedFiles);
    setIsLoading(false);
  };

  const supportsFileSystemAPI = "showDirectoryPicker" in window;
  const supportsWebkitDirectory =
    "webkitdirectory" in document.createElement("input");
  const isModernBrowser = supportsFileSystemAPI || supportsWebkitDirectory;

  const getBrowserName = () => {
    const userAgent = navigator.userAgent;
    let browserName = "unknown";

    if (userAgent.includes("Chrome") && !userAgent.includes("Edg")) {
      browserName = "chrome";
    } else if (userAgent.includes("Edg")) {
      browserName = "edge";
    } else if (userAgent.includes("Firefox")) {
      browserName = "firefox";
    } else if (userAgent.includes("Safari") && !userAgent.includes("Chrome")) {
      browserName = "safari";
    } else if (userAgent.includes("OPR") || userAgent.includes("Opera")) {
      browserName = "opera";
    }
    return browserName;
  };

  return (
    <BrowserCompatibilityContext.Provider
      value={{
        supportsFileSystemAPI,
        supportsWebkitDirectory,
        browserName: getBrowserName(),
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
      }}
    >
      {children}
    </BrowserCompatibilityContext.Provider>
  );
};

export const useBrowserCompatibility = (): BrowserCompatibilityContextType => {
  const context = useContext(BrowserCompatibilityContext);
  if (context === undefined) {
    throw new Error(
      "useBrowserCompatibility must be used within a BrowserCompatibilityProvider"
    );
  }
  return context;
};
