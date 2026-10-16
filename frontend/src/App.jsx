import { BrowserRouter, Routes, Route } from "react-router-dom";

import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import AppLayout from "./components/AppLayout";

import LandingPage from "./pages/LandingPage";
import Login from "./pages/Login";
import Register from "./pages/Register";
import AdminLayout from "./components/AdminLayout";
import AdminOverview from "./pages/AdminOverview";
import AdminComplaints from "./pages/AdminComplaints";
import AdminAnalytics from "./pages/AdminAnalytics";

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
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Passenger-only area */}
          <Route element={<ProtectedRoute allowedRoles={["passenger"]} />}>
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
          </Route>

          {/* Admin-only area */}
          <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminOverview />} />
              <Route path="complaints" element={<AdminComplaints />} />
              <Route path="analytics" element={<AdminAnalytics />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;