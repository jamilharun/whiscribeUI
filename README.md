# Whiscribe - Web-Based Media Player

_A solution for smooth audio/video streaming in Discord, Google Meet, and calls_

---

## 🎯 **Why I Built This**

When sharing music or videos through **Discord, Google Meet, or other voice calls**, traditional media players (like VLC or MP3 players) often cause issues:

- **Audio cuts out** or becomes **choppy** for listeners
- **Inconsistent playback quality**
- **No lyrics/subtitle support** when streaming

However, **browser-based players (like YouTube) work flawlessly** in these scenarios.

**Whiscribe solves this problem** by providing a **web-based media player** that:  
✔ **Plays local files** (MP3, MP4) directly from your device  
✔ **Supports LRC (lyrics) & SRT (subtitles)** for synchronized playback  
✔ **Streams smoothly** in Discord/Meet calls (since browsers handle audio better)  
✔ **Works on any device** without extra software

---

## ✨ **Features**

### 🎵 **Music Player (MP3 + LRC Lyrics)**

- Upload songs and sync them with `.lrc` files
- Real-time lyrics highlighting
- No more broken audio when streaming in calls

### 🎬 **Video Player (MP4 + SRT Subtitles)**

- Load videos with embedded/external `.srt` subtitles
- Adjust subtitle delay for perfect sync
- Smooth playback in browser-based screensharing

### 📂 **File Management**

- Browse & play files directly from your device
- Drag-and-drop uploads
- No server storage – everything stays local

### 🎚️ **Playback Controls**

- Play/pause, volume, seek, playback speed
- Dark/Light mode for better viewing

---

## 🚀 **How It Works**

1. **Open Whiscribe** in your browser
2. **Select a file** (MP3/MP4) from your device
3. **Add lyrics/subtitles** (optional)
4. **Play & stream** in Discord/Meet without audio issues!

Since browsers handle audio processing efficiently, Whiscribe ensures **clear, uninterrupted playback** when shared in calls.

---

## 🛠️ **Tech Stack**

- **Frontend**: React, TypeScript, Tailwind CSS
- **Audio/Video**: HTML5 `<audio>` & `<video>`
- **Subtitle Parsing**: Custom LRC/SRT reader
- **State Management**: React Hooks

---

## 📥 **Installation & Usage**

1. Clone the repo:
   ```sh
   git clone https://github.com/jamilharun/whiscribeUI.git
   ```
2. Install dependencies:
   ```sh
   npm install
   ```
3. Run the dev server:
   ```sh
   npm run dev
   ```
4. Open `http://localhost:3000` and start playing!

---

## 🔮 **Future Improvements**

- [ ] **Cloud sync** (optional Dropbox/Google Drive integration)
- [ ] **Auto-fetch lyrics** from online databases
- [ ] **Audio visualization** (waveform/spectrum)

---

## 📜 **License**

MIT
