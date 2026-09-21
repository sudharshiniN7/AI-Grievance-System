import { BrowserRouter, Routes, Route } from "react-router-dom";

import AppLayout from "./components/AppLayout";

import LandingPage from "./pages/LandingPage";
import PassengerDashboard from "./pages/PassengerDashboard";
import RegisterComplaint from "./pages/RegisterComplaint";
import ComplaintForm from "./pages/ComplaintForm";
import ComplaintTracking from "./pages/ComplaintTracking";
import ComplaintHistory from "./pages/ComplaintHistory";
import ComplaintDetails from "./pages/ComplaintDetails";
import AIAnalysisResult from "./pages/AIAnalysisResult";
import PassengerNotifications from "./pages/PassengerNotifications";

import "./App.css";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public landing page — no sidebar shell */}
        <Route path="/" element={<LandingPage />} />

        {/* Authenticated passenger area — shares sidebar + topbar layout */}
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<PassengerDashboard />} />
          <Route path="/complaints/register" element={<RegisterComplaint />} />
          <Route path="/complaints/new" element={<ComplaintForm />} />
          <Route path="/complaints/track" element={<ComplaintTracking />} />
          <Route path="/complaints/history" element={<ComplaintHistory />} />
          <Route path="/complaints/:id" element={<ComplaintDetails />} />
          <Route path="/complaints/:id/ai-analysis" element={<AIAnalysisResult />} />
          <Route path="/notifications" element={<PassengerNotifications />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;