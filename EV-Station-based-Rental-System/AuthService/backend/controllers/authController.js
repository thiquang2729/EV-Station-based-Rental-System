const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { randomUUID } = require("crypto");
const UserRepository = require("../repositories/UserRepository");
const { sendSuccess, sendError } = require("../utils/response");

const DEFAULT_ROLE = "RENTER";
const DEFAULT_VERIFICATION_STATUS = "PENDING";
const DEFAULT_RISK_STATUS = "NONE";
const isProduction = process.env.NODE_ENV === "production";
const JWT_ISSUER = process.env.JWT_ISSUER || "auth-service";
const JWT_AUDIENCE = process.env.JWT_AUDIENCE;
const ACCESS_TOKEN_TTL = process.env.JWT_ACCESS_TTL || "1h";
const REFRESH_TOKEN_TTL = process.env.JWT_REFRESH_TTL || "365d";
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: isProduction,
  path: "/",
  sameSite: isProduction ? "none" : "lax",
};

const MESSAGES = {
  VALIDATION_GENERIC: "Dữ liệu không hợp lệ.",
  FULL_NAME_REQUIRED: "Vui lòng nhập họ tên.",
  EMAIL_REQUIRED: "Vui lòng nhập email.",
  PASSWORD_REQUIRED: "Vui lòng nhập mật khẩu.",
  EMAIL_IN_USE: "Email này đã được sử dụng.",
  REGISTER_SUCCESS:
    "Tài khoản đã được tạo thành công. Vui lòng upload giấy tờ để xác thực.",
  REGISTER_FAILURE: "Không thể tạo tài khoản. Vui lòng thử lại sau.",
  LOGIN_INVALID: "Thông tin đăng nhập không chính xác.",
  LOGIN_SUCCESS: "Đăng nhập thành công.",
  LOGIN_FAILURE: "Không thể đăng nhập. Vui lòng thử lại sau.",
  UNAUTHENTICATED: "Bạn chưa đăng nhập.",
  REFRESH_INVALID: "Refresh token không hợp lệ.",
  REFRESH_SUCCESS: "Làm mới phiên đăng nhập thành công.",
  REFRESH_FAILURE: "Không thể làm mới phiên đăng nhập.",
  LOGOUT_SUCCESS: "Đăng xuất thành công.",
  LOGOUT_FAILURE: "Không thể đăng xuất.",
};

const formatUserResponse = (user) => ({
  id: user.id,
  fullName: user.fullName,
  email: user.email,
  phoneNumber: user.phoneNumber,
  role: user.role,
  verificationStatus: user.verificationStatus,
  riskStatus: user.riskStatus,
});

const sendValidationError = (res, details) =>
  sendError(res, {
    status: 400,
    message: MESSAGES.VALIDATION_GENERIC,
    code: "VALIDATION_ERROR",
    details,
  });

const authController = {
  registerUser: async (req, res) => {
    try {
      const { fullName, email, password, phoneNumber, role } = req.body;

      const missingFields = [];
      if (!fullName) {
        missingFields.push({ field: "fullName", message: MESSAGES.FULL_NAME_REQUIRED });
      }
      if (!email) {
        missingFields.push({ field: "email", message: MESSAGES.EMAIL_REQUIRED });
      }
      if (!password) {
        missingFields.push({ field: "password", message: MESSAGES.PASSWORD_REQUIRED });
      }

      if (missingFields.length > 0) {
        return sendValidationError(res, missingFields);
      }

      const existingUser = await UserRepository.findByEmail(email);
      if (existingUser) {
        return sendValidationError(res, [
          {
            field: "email",
            message: MESSAGES.EMAIL_IN_USE,
          },
        ]);
      }

      const saltRounds = Number(process.env.BCRYPT_SALT_ROUNDS || 10);
      const passwordHash = await bcrypt.hash(password, saltRounds);

      const userRecord = await UserRepository.create({
        id: randomUUID(),
        fullName,
        email,
        passwordHash,
        phoneNumber,
        role: role || DEFAULT_ROLE,
        verificationStatus: DEFAULT_VERIFICATION_STATUS,
        riskStatus: DEFAULT_RISK_STATUS,
        refreshToken: null,
      });

      return sendSuccess(res, {
        status: 201,
        message: MESSAGES.REGISTER_SUCCESS,
        data: formatUserResponse(userRecord),
      });
    } catch (error) {
      console.error("registerUser error", error);
      return sendError(res, {
        message: MESSAGES.REGISTER_FAILURE,
      });
    }
  },

  generateAccessToken: (user) => {
    const payload = {
      iss: JWT_ISSUER,
      sub: user.id,
      id: user.id,
      role: user.role,
      fullName: user.fullName || user.name || null,
    };

    if (JWT_AUDIENCE) {
      payload.aud = JWT_AUDIENCE;
    }

    return jwt.sign(payload, process.env.JWT_ACCESS_KEY, { expiresIn: ACCESS_TOKEN_TTL });
  },

  generateRefreshToken: (user) => {
    const payload = {
      iss: JWT_ISSUER,
      sub: user.id,
      id: user.id,
      role: user.role,
      fullName: user.fullName || user.name || null,
    };

    if (JWT_AUDIENCE) {
      payload.aud = JWT_AUDIENCE;
    }

    return jwt.sign(payload, process.env.JWT_REFRESH_KEY, { expiresIn: REFRESH_TOKEN_TTL });
  },

  loginUser: async (req, res) => {
    try {
      const { email, password } = req.body;

      const loginMissingFields = [];
      if (!email) {
        loginMissingFields.push({ field: "email", message: MESSAGES.EMAIL_REQUIRED });
      }
      if (!password) {
        loginMissingFields.push({ field: "password", message: MESSAGES.PASSWORD_REQUIRED });
      }

      if (loginMissingFields.length > 0) {
        return sendValidationError(res, loginMissingFields);
      }

      const user = await UserRepository.findByEmail(email);

      if (!user) {
        return sendError(res, {
          status: 401,
          message: MESSAGES.LOGIN_INVALID,
          code: "UNAUTHORIZED",
        });
      }

      const validPassword = await bcrypt.compare(password, user.passwordHash);
      if (!validPassword) {
        return sendError(res, {
          status: 401,
          message: MESSAGES.LOGIN_INVALID,
          code: "UNAUTHORIZED",
        });
      }

      const accessToken = authController.generateAccessToken(user);
      const refreshToken = authController.generateRefreshToken(user);
      await UserRepository.updateRefreshToken(user.id, refreshToken);

      res.cookie("refreshToken", refreshToken, COOKIE_OPTIONS);
      return sendSuccess(res, {
        message: MESSAGES.LOGIN_SUCCESS,
        data: {
          user: formatUserResponse(user),
          accessToken,
          refreshToken,
        },
      });
    } catch (error) {
      console.error("loginUser error", error);
      return sendError(res, {
        message: MESSAGES.LOGIN_FAILURE,
      });
    }
  },

  requestRefreshToken: async (req, res) => {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
      return sendError(res, {
        status: 401,
        message: MESSAGES.UNAUTHENTICATED,
        code: "UNAUTHORIZED",
      });
    }

    return jwt.verify(refreshToken, process.env.JWT_REFRESH_KEY, async (err) => {
      if (err) {
        console.error("requestRefreshToken verify error", err);
        return sendError(res, {
          status: 403,
          message: MESSAGES.REFRESH_INVALID,
          code: "INVALID_TOKEN",
        });
      }

      try {
        const user = await UserRepository.findByRefreshToken(refreshToken);

        if (!user) {
          return sendError(res, {
            status: 403,
            message: MESSAGES.REFRESH_INVALID,
            code: "INVALID_TOKEN",
          });
        }

        const newAccessToken = authController.generateAccessToken(user);
        const newRefreshToken = authController.generateRefreshToken(user);
        await UserRepository.updateRefreshToken(user.id, newRefreshToken);
        res.cookie("refreshToken", newRefreshToken, COOKIE_OPTIONS);
        return sendSuccess(res, {
          message: MESSAGES.REFRESH_SUCCESS,
          data: {
            accessToken: newAccessToken,
            refreshToken: newRefreshToken,
          },
        });
      } catch (error) {
        console.error("requestRefreshToken error", error);
        return sendError(res, {
          message: MESSAGES.REFRESH_FAILURE,
        });
      }
    });
  },

  logOut: async (req, res) => {
    try {
      let userId = req.user?.id || req.body?.userId;
      const refreshTokenFromCookie = req.cookies?.refreshToken;
      const refreshTokenFromBody = req.body?.refreshToken;
      const refreshToken = refreshTokenFromCookie || refreshTokenFromBody;

      if (!userId && refreshToken) {
        const user = await UserRepository.findByRefreshToken(refreshToken);
        if (user) {
          userId = user.id;
        }
      }

      if (userId) {
        await UserRepository.clearRefreshToken(userId);
      }

      res.clearCookie("refreshToken", COOKIE_OPTIONS);
      return sendSuccess(res, {
        message: MESSAGES.LOGOUT_SUCCESS,
        data: null,
      });
    } catch (error) {
      console.error("logOut error", error);
      return sendError(res, {
        message: MESSAGES.LOGOUT_FAILURE,
      });
    }
  },
};

module.exports = authController;
