import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import CoursesPage from './pages/CoursesPage.jsx';
import CourseDetailPage from './pages/CourseDetailPage.jsx';
import SlidePage from './pages/SlidePage.jsx';
import UploadSlidePage from './pages/UploadSlidePage.jsx';
import DirectoryPage from './pages/DirectoryPage.jsx';

export default function App() {
  return (
    <BrowserRouter>
      <div className="app-layout">
        <Navbar />
        <div className="app-content">
          <Routes>
            <Route path="/" element={<CoursesPage />} />
            <Route path="/courses/:courseId" element={<CourseDetailPage />} />
            <Route path="/slides/:slideId" element={<SlidePage />} />
            <Route path="/upload" element={<UploadSlidePage />} />
            <Route path="/directory" element={<DirectoryPage />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}
