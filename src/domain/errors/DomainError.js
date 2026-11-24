class DomainError extends Error {
  constructor(message, code = "DOMAIN_ERROR") {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
  }
}

class UnauthorizedError extends DomainError {
  constructor(message = "Unauthorized") {
    super(message, "UNAUTHORIZED");
  }
}

class ValidationError extends DomainError {
  constructor(message = "Validation failed") {
    super(message, "VALIDATION_ERROR");
  }
}

class RateLimitError extends DomainError {
  constructor(message = "Too many connections") {
    super(message, "RATE_LIMIT");
  }
}

module.exports = {
  DomainError,
  UnauthorizedError,
  ValidationError,
  RateLimitError,
};
