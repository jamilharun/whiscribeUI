import type { Mp3Mp4File, Subtitle } from "../../types/player-types";
import { SidebarDesktop } from "./SidebarDesktop";
import { MainContentDesktop } from "./MainContentDesktop";

type LayoutDesktopProp = {
  pickFolder: () => Promise<void>;
  playFile: (mp3File: Mp3Mp4File) => Promise<void>;
  currentFile: string | null;
  audioUrl: string | null;
  subtitleUrl: string | null;
  currentSubtitle: string;
  subtitles: Subtitle[];
};

export const LayoutDesktop = ({
  pickFolder,
  playFile,
  currentFile,
  audioUrl,
  subtitleUrl,
  currentSubtitle,
  subtitles,
}: LayoutDesktopProp) => {
  return (
    <div className="hidden lg:flex min-h-screen">
      {/* Sidebar */}
      <SidebarDesktop
        pickFolder={pickFolder}
        playFile={playFile}
        currentFile={currentFile}
      />

      {/* Main Content */}
      <MainContentDesktop
        currentFile={currentFile}
        audioUrl={audioUrl}
        subtitleUrl={subtitleUrl}
        currentSubtitle={currentSubtitle}
        subtitles={subtitles}
      />
    </div>
  );
};
