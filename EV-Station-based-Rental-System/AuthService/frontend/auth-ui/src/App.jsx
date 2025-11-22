import { useState } from "react";
import { useSelector } from "react-redux";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import HomePage from "./pages/HomePage";
import AboutUser from "./pages/AboutUser";
import Reports from "./pages/Reports";
import AdminPage from "./pages/AdminPage";
import AdminLayout from "layouts/admin";
import AuthLayout from "layouts/auth";
import RTLLayout from "layouts/rtl";
import initialTheme from "theme/theme";
import { hasAdminAccess } from "./utils/auth";

const RequireAdmin = ({ children }) => {
  const location = useLocation();
  const { user } = useSelector((state) => state.auth);

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (!hasAdminAccess(user)) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location.pathname, reason: "unauthorized" }}
      />
    );
  }

  return children;
};

const App = () => {
  const { user } = useSelector((state) => state.auth);
  const [dashboardTheme, setDashboardTheme] = useState(initialTheme);
  const isAdmin = hasAdminAccess(user);

  const getDefaultRedirect = () => {
    if (!user) return "/login";
    return isAdmin ? "/admin/default" : "/home";
  };

  const defaultRedirect = getDefaultRedirect();

  return (
    <Routes>
      <Route path="/" element={<Navigate to={defaultRedirect} replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/home" element={<HomePage />} />
      <Route path="/about-user" element={<AboutUser />} />
      <Route path="/reports" element={<Reports />} />
      <Route
        path="/admin"
        element={
          <RequireAdmin>
            <AdminPage />
          </RequireAdmin>
        }
      />
      <Route
        path="/admin/*"
        element={
          <RequireAdmin>
            <AdminLayout theme={dashboardTheme} setTheme={setDashboardTheme} />
          </RequireAdmin>
        }
      />
      <Route path="/auth/*" element={<AuthLayout />} />
      <Route
        path="/rtl/*"
        element={<RTLLayout theme={dashboardTheme} setTheme={setDashboardTheme} />}
      />
      <Route path="*" element={<Navigate to={defaultRedirect} replace />} />
    </Routes>
  );
};

export default App;
