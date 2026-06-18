import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./routes/ProtectedRoute";
import RoleRoute from "./routes/RoleRoute";
import Navbar from "./components/layout/Navbar";

import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import HomePage from "./pages/HomePage";
import SubmitReportPage from "./pages/SubmitReportPage";
import ReportDetailPage from "./pages/ReportDetailPage";
import MapPage from "./pages/MapPage";
import MyReportsPage from "./pages/MyReportsPage";
import NotificationsPage from "./pages/NotificationsPage";
import AdminDashboardPage from "./pages/admin/AdminDashboardPage";
import MaintenanceDashboardPage from "./pages/maintenance/MaintenanceDashboardPage";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Navbar />
        <Routes>
          {/* Public */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Protected — semua role */}
          <Route path="/" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
          <Route path="/submit" element={<ProtectedRoute><SubmitReportPage /></ProtectedRoute>} />
          <Route path="/report/:id" element={<ProtectedRoute><ReportDetailPage /></ProtectedRoute>} />
          <Route path="/map" element={<ProtectedRoute><MapPage /></ProtectedRoute>} />
          <Route path="/my-reports" element={<ProtectedRoute><MyReportsPage /></ProtectedRoute>} />
          <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />

          {/* Admin only */}
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={["admin"]}>
                  <AdminDashboardPage />
                </RoleRoute>
              </ProtectedRoute>
            }
          />

          {/* Maintenance only */}
          <Route
            path="/maintenance"
            element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={["maintenance"]}>
                  <MaintenanceDashboardPage />
                </RoleRoute>
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}