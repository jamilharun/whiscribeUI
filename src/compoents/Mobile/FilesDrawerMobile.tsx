import { FiMusic } from "react-icons/fi";

type FilesDrawerMobileProp = {
  toggleFilesDrawer: () => void;
};

export const FilesDrawerMobile = ({
  toggleFilesDrawer,
}: FilesDrawerMobileProp) => {
  return (
    <div className="lg:hidden fixed bottom-4 right-4 z-10">
      <button
        onClick={toggleFilesDrawer}
        className="p-4 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-colors"
      >
        <FiMusic size={24} />
      </button>
    </div>
  );
};
