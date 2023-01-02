class HttpError extends Error {
  constructor(message, errorCode) {
    super(message); //passing the errorMessage to parents class constructor
    this.code = errorCode; // passing the Error code to  parents class
  }
}

module.exports = HttpError;
