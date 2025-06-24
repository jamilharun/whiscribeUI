import type { Subtitle } from "../types/player-types";

export const convertSRTtoWebVTT = (srt: string): string => {
  const lines = srt.split("\n");
  let result = "WEBVTT\n\n";

  for (let i = 0; i < lines.length; i++) {
    if (/^\d+$/.test(lines[i])) continue; // skip index numbers
    if (lines[i].includes("-->")) {
      result += lines[i].replace(/,/g, ".") + "\n";
    } else {
      result += lines[i] + "\n";
    }
  }

  return result;
};

export const parseSRT = (srt: string): Subtitle[] => {
  const blocks = srt.split(/\n\s*\n/);
  const cues: Subtitle[] = [];

  for (const block of blocks) {
    const lines = block.trim().split("\n");
    if (lines.length >= 3) {
      // Valid SRT block has at least 3 lines
      // First line is index, second line is timing
      const timingLine = lines[1];
      if (timingLine && timingLine.includes("-->")) {
        const [start, end] = timingLine.split(" --> ");
        const text = lines.slice(2).join("\n"); // Text starts from third line

        cues.push({
          start: toSeconds(start),
          end: toSeconds(end),
          text,
        });
      }
    }
  }
  return cues;
};

const toSeconds = (time: string): number => {
  const [h, m, s] = time.split(":");
  return (
    parseFloat(h) * 3600 + parseFloat(m) * 60 + parseFloat(s.replace(",", "."))
  );
};
