// Defining a custom error class named apiError that extends the built-in Error class
class apiError extends Error {
    constructor(
        statuscode, // HTTP status code of the error
        message = "Something Went Wrong", // Default error message
        errors = [], // Array to hold additional error details
        stack = "" // Optional stack trace
    ) {
        super(message); // Call the parent Error constructor with the message
        
        this.statuscode = statuscode; // Set the status code property
        this.data = null; // Initialize data property to null
        this.message = message; // Set the message property
        this.success = false; // Flag indicating success status, set to false for errors
        this.errors = errors; // Set the errors property to the provided errors array

        if (stack) {
            this.stack = stack; // If a stack trace is provided, set the stack property
        } else {
            Error.captureStackTrace(this, this.constructor); // Otherwise, capture the current stack trace
        }
    }
}

// Export the apiError class to be used in other modules
export { apiError };

//this apiError stop execution of code when error throw by apiError 