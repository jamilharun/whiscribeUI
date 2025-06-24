import { useNavigate } from "react-router-dom";
import { FiSun, FiMoon, FiHeadphones, FiFilm } from "react-icons/fi";
import { Button } from "../compoents/whiscribeButton";
import { useDarkMode } from "../hooks/useDarkMode";
import { ButtonEnum } from "../types/button";

const Home = () => {
  const navigate = useNavigate();

  const [darkMode, setDarkMode] = useDarkMode();

  return (
    <div
      className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-200 p-4 sm:p-6
    dark:from-gray-800 dark:to-gray-900"
    >
      {/* Theme Toggle */}
      <Button
        onPress={() => setDarkMode(!darkMode)}
        type={ButtonEnum.CUSTOM}
        style="absolute top-4 right-4 p-2 rounded-full bg-gray-200 text-gray-700 hover:bg-gray-300
        dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 transition-colors duration-200"
        aria_label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
      >
        {darkMode ? <FiSun size={20} /> : <FiMoon size={20} />}
      </Button>

      <div className="text-center mb-8 md:mb-12">
        <h1
          className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-800 mb-3 md:mb-4
        dark:text-white"
        >
          Whiscribe UI
        </h1>
        <p
          className="text-base sm:text-lg md:text-xl text-gray-600 max-w-2xl mx-4
        dark:text-gray-300"
        >
          Transform your media experience with powerful transcription tools
        </p>
      </div>

      <div className="w-full flex justify-center items-center flex-col space-y-4 sm:space-y-6 md:space-y-8">
        <Button
          text="Audio Transcription"
          type={ButtonEnum.MAIN}
          onPress={() => navigate("/mp3")}
          icon={<FiHeadphones className="inline-block" />}
        />
        <Button
          text="Video Transcription"
          type={ButtonEnum.MAIN}
          onPress={() => navigate("/mp4")}
          icon={<FiFilm className="inline-block" />}
        />
      </div>

      <div className="mt-12 md:mt-16 text-sm text-gray-500 dark:text-gray-400">
        <p>Select an option to get started</p>
      </div>
    </div>
  );
};

export default Home;
