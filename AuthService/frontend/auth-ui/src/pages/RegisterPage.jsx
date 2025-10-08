import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { registerUser, resetStatus } from "../features/auth/authSlice";

const TEXT = {
  title: "Tạo tài khoản",
  subtitle: "Đăng ký tài khoản mới để sử dụng hệ thống XDHDT.",
  fullNameRequired: "Vui lòng nhập họ tên.",
  emailRequired: "Vui lòng nhập email.",
  passwordRequired: "Vui lòng nhập mật khẩu.",
  confirmMismatch: "Mật khẩu xác nhận không khớp.",
  processing: "Đang xử lý...",
  submit: "Đăng ký",
  phoneOptional: "Số điện thoại (không bắt buộc)",
  alreadyHaveAccount: "Đã có tài khoản?",
  loginNow: "Đăng nhập",
};

const RegisterPage = () => {
  const dispatch = useDispatch();
  const { status, error, successMessage } = useSelector((state) => state.auth);

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    phoneNumber: "",
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
    if (!formData.fullName) {
      return TEXT.fullNameRequired;
    }
    if (!formData.email) {
      return TEXT.emailRequired;
    }
    if (!formData.password) {
      return TEXT.passwordRequired;
    }
    if (formData.password !== formData.confirmPassword) {
      return TEXT.confirmMismatch;
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
    dispatch(
      registerUser({
        fullName: formData.fullName,
        email: formData.email,
        password: formData.password,
        phoneNumber: formData.phoneNumber || undefined,
      })
    );
  };

  return (
    <section className="auth-section">
      <div className="auth-card">
        <h2>{TEXT.title}</h2>
        <p className="auth-subtitle">{TEXT.subtitle}</p>

        {formError && <div className="auth-alert error">{formError}</div>}
        {error && <div className="auth-alert error">{error}</div>}
        {successMessage && (
          <div className="auth-alert success">
            {successMessage} <Link to="/login">Đăng nhập ngay</Link>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <label htmlFor="fullName">Họ tên</label>
          <input
            id="fullName"
            name="fullName"
            type="text"
            placeholder="Nguyễn Văn A"
            value={formData.fullName}
            onChange={handleChange}
            disabled={status === "loading"}
          />

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

          <label htmlFor="phoneNumber">{TEXT.phoneOptional}</label>
          <input
            id="phoneNumber"
            name="phoneNumber"
            type="tel"
            placeholder="0123456789"
            value={formData.phoneNumber}
            onChange={handleChange}
            disabled={status === "loading"}
          />

          <label htmlFor="password">Mật khẩu</label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            placeholder="••••••••"
            value={formData.password}
            onChange={handleChange}
            disabled={status === "loading"}
          />

          <label htmlFor="confirmPassword">Xác nhận mật khẩu</label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            placeholder="••••••••"
            value={formData.confirmPassword}
            onChange={handleChange}
            disabled={status === "loading"}
          />

          <button type="submit" className="auth-submit" disabled={status === "loading"}>
            {status === "loading" ? TEXT.processing : TEXT.submit}
          </button>
        </form>

        <p className="auth-footer">
          {TEXT.alreadyHaveAccount} <Link to="/login">{TEXT.loginNow}</Link>
        </p>
      </div>
    </section>
  );
};

export default RegisterPage;
