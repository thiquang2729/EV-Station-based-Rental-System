import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { loginUser, resetStatus } from "../features/auth/authSlice";

const TEXT = {
  title: "Đăng nhập",
  subtitle: "Sử dụng tài khoản đã đăng ký để tiếp tục.",
  emailRequired: "Vui lòng nhập email.",
  passwordRequired: "Vui lòng nhập mật khẩu.",
  processing: "Đang xử lý...",
  submit: "Đăng nhập",
  noAccount: "Chưa có tài khoản?",
  registerNow: "Đăng ký ngay",
  accountLabel: "Tài khoản:",
  verificationLabel: "Trạng thái xác thực:",
};

const LoginPage = () => {
  const dispatch = useDispatch();
  const { status, error, successMessage, user } = useSelector((state) => state.auth);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [formError, setFormError] = useState(null);

  useEffect(() => {
    dispatch(resetStatus());
    return () => {
      dispatch(resetStatus());
    };
  }, [dispatch]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validate = () => {
    if (!formData.email) {
      return TEXT.emailRequired;
    }
    if (!formData.password) {
      return TEXT.passwordRequired;
    }
    return null;
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const validationError = validate();
    if (validationError) {
      setFormError(validationError);
      return;
    }
    setFormError(null);
    dispatch(loginUser(formData));
  };

  return (
    <section className="auth-section">
      <div className="auth-card">
        <h2>{TEXT.title}</h2>
        <p className="auth-subtitle">{TEXT.subtitle}</p>

        {formError && <div className="auth-alert error">{formError}</div>}
        {error && <div className="auth-alert error">{error}</div>}
        {successMessage && <div className="auth-alert success">{successMessage}</div>}
        {user && (
          <div className="user-summary">
            <p>
              <strong>{TEXT.accountLabel}</strong> {user.fullName || user.email}
            </p>
            <p>
              <strong>Email:</strong> {user.email}
            </p>
            <p>
              <strong>{TEXT.verificationLabel}</strong> {user.verificationStatus}
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="nhapemail@example.com"
            value={formData.email}
            onChange={handleChange}
            disabled={status === "loading"}
          />

          <label htmlFor="password">Mật khẩu</label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            value={formData.password}
            onChange={handleChange}
            disabled={status === "loading"}
          />

          <button type="submit" className="auth-submit" disabled={status === "loading"}>
            {status === "loading" ? TEXT.processing : TEXT.submit}
          </button>
        </form>

        <p className="auth-footer">
          {TEXT.noAccount} <Link to="/register">{TEXT.registerNow}</Link>
        </p>
      </div>
    </section>
  );
};

export default LoginPage;
