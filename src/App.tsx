import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Mp3 from "./pages/Mp3";
import Mp4 from "./pages/Mp4";

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/mp3" element={<Mp3 />} />
        <Route path="/mp4" element={<Mp4 />} />
      </Routes>
    </>
  );
}

export default App;
