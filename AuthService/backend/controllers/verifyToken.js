const jwt = require("jsonwebtoken");
const { sendError } = require("../utils/response");

const extractTokenFromHeader = (req) => {
  const authHeader = req.headers.authorization || req.headers.token;
  if (!authHeader) return null;
  if (authHeader.startsWith("Bearer ")) {
    return authHeader.split(" ")[1];
  }
  return authHeader;
};

const verifyToken = (req, res, next) => {
  const token = extractTokenFromHeader(req);
  
  // console.log("=== TOKEN DEBUG ===");
  // console.log("Headers:", req.headers);
  // console.log("Authorization header:", req.headers.authorization);
  // console.log("Token header:", req.headers.token);
  // console.log("Extracted token:", token);

  if (!token) {
    return sendError(res, {
      status: 401,
      message: "Bạn chưa đăng nhập.",
      code: "UNAUTHORIZED",
    });
  }

  return jwt.verify(token, process.env.JWT_ACCESS_KEY, (err, user) => {
    if (err) {
      return sendError(res, {
        status: 403,
        message: "Token không hợp lệ.",
        code: "INVALID_TOKEN",
      });
    }
    req.user = user;
    return next();
  });
};

const verifyTokenAndUserAuthorization = (req, res, next) =>
  verifyToken(req, res, () => {
    if (req.user.id === req.params.id || req.user.role === "ADMIN") {
      return next();
    }
    return sendError(res, {
      status: 403,
      message: "Bạn không có quyền thực hiện hành động này.",
      code: "FORBIDDEN",
    });
  });

const verifyTokenAndAdmin = (req, res, next) =>
  verifyToken(req, res, () => {
    if (req.user.role === "ADMIN") {
      return next();
    }
    return sendError(res, {
      status: 403,
      message: "Bạn không có quyền truy cập.",
      code: "FORBIDDEN",
    });
  });

const verifyTokenAndStaff = (req, res, next) =>
  verifyToken(req, res, () => {
    if (req.user.role === "ADMIN" || req.user.role === "STAFF") {
      return next();
    }
    return sendError(res, {
      status: 403,
      message: "Bạn không có quyền truy cập.",
      code: "FORBIDDEN",
    });
  });

module.exports = {
  verifyToken,
  verifyTokenAndUserAuthorization,
  verifyTokenAndAdmin,
  verifyTokenAndStaff,
};
