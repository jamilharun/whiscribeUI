import { useBrowserCompatibility } from "../context/browserCompat";

export const NotFound = () => {
  const { fileType } = useBrowserCompatibility();

  return (
    <div className="text-gray-500 dark:text-gray-400 italic">
      No {fileType} files found
    </div>
  );
};
