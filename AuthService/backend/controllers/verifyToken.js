const jwt = require("jsonwebtoken");
const { sendError } = require("../utils/response");

const extractTokenFromHeader = (req) => {
  const authHeader = req.headers.authorization || req.headers.token;
  if (!authHeader) {
    return null;
  }
  if (authHeader.startsWith("Bearer ")) {
    return authHeader.split(" ")[1];
  }
  return authHeader;
};

const verifyToken = (req, res, next) => {
  const token = extractTokenFromHeader(req);

  if (!token) {
    return sendError(res, {
      status: 401,
      message: "You are not signed in.",
      code: "UNAUTHORIZED",
    });
  }

  return jwt.verify(token, process.env.JWT_ACCESS_KEY, (err, user) => {
    if (err) {
      return sendError(res, {
        status: 403,
        message: "Access token is invalid or expired.",
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
      message: "You do not have permission to perform this action.",
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
      message: "Administrator role required.",
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
      message: "Staff or administrator role required.",
      code: "FORBIDDEN",
    });
  });

module.exports = {
  verifyToken,
  verifyTokenAndUserAuthorization,
  verifyTokenAndAdmin,
  verifyTokenAndStaff,
};

