import type { Mp3Mp4File } from "../../types/player-types";
import { SidebarDesktop } from "./SidebarDesktop";
import type { ReactNode } from "react";

type LayoutDesktopProp = {
  pickFolder: () => Promise<void>;
  playFile: (mp3File: Mp3Mp4File) => Promise<void>;
  currentFile: string | null;
  children: ReactNode;
};

export const LayoutDesktop = ({
  pickFolder,
  playFile,
  currentFile,
  children,
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
      {children}
    </div>
  );
};
