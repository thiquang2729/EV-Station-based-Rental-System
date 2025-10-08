import { useDispatch, useSelector } from "react-redux";
import { Navigate, Route, Routes, Link } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import { logoutUser } from "./features/auth/authSlice";
import "./App.css";

const LABELS = {
  logout: "Đăng xuất",
  login: "Đăng nhập",
  register: "Đăng ký",
  greeting: "Xin chào, ",
};

function App() {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);

  const handleLogout = () => {
    dispatch(logoutUser());
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <Link to="/" className="brand">
          XDHDT Auth
        </Link>
        <nav className="nav-links">
          {user ? (
            <>
              <span className="welcome-text">
                {LABELS.greeting}
                {user.fullName || user.email}
              </span>
              <button onClick={handleLogout} className="link-button">
                {LABELS.logout}
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="link-button">
                {LABELS.login}
              </Link>
              <Link to="/register" className="link-button secondary">
                {LABELS.register}
              </Link>
            </>
          )}
        </nav>
      </header>
      <main className="app-main">
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
