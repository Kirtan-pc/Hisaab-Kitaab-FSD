const { validationResult } = require("express-validator");

function allowOnly(fields) {
  const allowed = new Set(fields);

  return (req, res, next) => {
    if (
      !req.body ||
      typeof req.body !== "object" ||
      Array.isArray(req.body)
    ) {
      return res.status(400).json({ message: "The request body must be a JSON object." });
    }

    const unexpectedFields = Object.keys(req.body).filter(
      (field) => !allowed.has(field),
    );

    if (unexpectedFields.length > 0) {
      return res.status(400).json({
        message: "The request contains unsupported fields.",
        errors: unexpectedFields.map((field) => ({
          field,
          message: "This field is not allowed.",
        })),
      });
    }

    return next();
  };
}

function validateRequest(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: "Request validation failed.",
      errors: errors.array().map(({ path, msg }) => ({ field: path, message: msg })),
    });
  }

  return next();
}

module.exports = { allowOnly, validateRequest };
