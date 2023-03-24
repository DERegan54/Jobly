/** ExpressError extends the normal JS error so we can easily
 *  add a status when we make an instance of it.
 *
 *  The error-handling middleware will return this.
 */

class ExpressError extends Error {
    constructor(message, status) {
      super();
      this.message = message;
      this.status = status;
      console.error(this.stack);
    }
  }

// 404 NOT FOUND Error

class NotFoundError extends ExpressError {
    constructor(message = "NOT FOUND!") {
        super(message, 404);
    }
  }
  
// 400 UNAUTHORIZED Error 

class UnauthorizedError extends ExpressError {
    constructor(message = "UNAUTHORIZED!") {
        super(message, 401);
    }
  }

// 400 BAD REQUEST error

class BadRequestError extends ExpressError {
    constructor(message = "BAD REQUEST!") {
        super(message, 400);
    }
}

// 403 FORBIDDEN error

class ForbiddenError extends ExpressError {
    constructor(message = "FORBIDDEN!") {
        super(message, 403);
    }
}


module.exports = {ExpressError, NotFoundError, UnauthorizedError, BadRequestError, ForbiddenError}