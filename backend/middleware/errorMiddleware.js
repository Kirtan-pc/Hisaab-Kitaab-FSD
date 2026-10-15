function notFound(_req, res) {
  return res.status(404).json({ message: "API route not found." });
}

function errorHandler(error, req, res, next) {
  if (res.headersSent) {
    return next(error);
  }

  if (error.type === "entity.parse.failed") {
    return res.status(400).json({ message: "Request body contains invalid JSON." });
  }
  if (error.type === "entity.too.large") {
    return res.status(413).json({ message: "Request body is too large." });
  }
  if (error.name === "ValidationError" || error.name === "CastError") {
    return res.status(400).json({ message: "The submitted data is invalid." });
  }
  if (error.code === 11000) {
    return res.status(409).json({
      message: "A record with that unique value already exists.",
    });
  }

  const status =
    Number.isInteger(error.status) && error.status >= 400 && error.status < 500
      ? error.status
      : 500;
  if (status >= 500) {
    console.error(`[api-error] ${req.method} ${req.path}: ${error.name || "Error"}`);
    return res.status(500).json({ message: "An unexpected server error occurred." });
  }

  return res.status(status).json({ message: error.message || "Request failed." });
}

module.exports = { errorHandler, notFound };
