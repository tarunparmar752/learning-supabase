import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import FileUpload from "./components/FileUpload"; // Ensure the import path is correct
import Home from "./components/Home"; // Ensure the import path is correct

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/file-upload" element={<FileUpload />} />
      </Routes>
    </Router>
  );
}

export default App;
