import { useEffect } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import Home from './pages/Home';
import Diagnostic from './pages/Diagnostic';
import Results from './pages/Results';
import Dashboard from './pages/Dashboard';
import Progress from './pages/Progress';
import Rankings from './pages/Rankings';
import Profile from './pages/Profile';
import AdminOverview from './pages/admin/AdminOverview';
import AdminCourse from './pages/admin/AdminCourse';
import AdminStudents from './pages/admin/AdminStudents';
import AdminBank from './pages/admin/AdminBank';
import AdminReports from './pages/admin/AdminReports';
import NotFound from './pages/NotFound';
import LoginModal from './components/LoginModal';
import Toasts from './components/Toasts';

function ScrollManager() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (hash) setTimeout(() => document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: 'smooth' }), 80);
    else window.scrollTo(0, 0);
  }, [pathname, hash]);
  return null;
}

export default function App() {
  return (
    <>
      <ScrollManager />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/courses" element={<Home />} />
        <Route path="/diagnostic" element={<Diagnostic />} />
        <Route path="/results" element={<Results />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/progress" element={<Progress />} />
        <Route path="/rankings" element={<Rankings />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/admin" element={<AdminOverview />} />
        <Route path="/admin/course/:courseId" element={<AdminCourse />} />
        <Route path="/admin/students" element={<AdminStudents />} />
        <Route path="/admin/bank" element={<AdminBank />} />
        <Route path="/admin/reports" element={<AdminReports />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <LoginModal />
      <Toasts />
    </>
  );
}
