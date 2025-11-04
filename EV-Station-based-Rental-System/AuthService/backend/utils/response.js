const sendSuccess = (res, { status = 200, message, data = null, pagination }) => {
  const payload = {
    success: true,
    message,
    data,
  };

  if (pagination) {
    payload.pagination = pagination;
  }

  return res.status(status).json(payload);
};

const sendError = (
  res,
  { status = 500, message, code = "INTERNAL_ERROR", details = [] }
) => {
  const payload = {
    success: false,
    message,
    error: {
      code,
    },
  };

  if (details.length > 0) {
    payload.error.details = details;
  }

  return res.status(status).json(payload);
};

module.exports = {
  sendSuccess,
  sendError,
};
