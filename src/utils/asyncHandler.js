// Function to handle async request handlers
// This function takes a request handler function and returns a new function
const asyncHandler = (requestHandler) => {
    return (req, res, next) => {
        // Use Promise.resolve() to handle the result of the request handler
        // If the request handler throws an error or returns a rejected promise, catch it and pass it to the next middleware
        Promise.resolve(requestHandler(req, res, next))
        .catch((err) => next(err));
    };
};

export { asyncHandler }; // Export the asyncHandler function




//The asyncHandler function is a higher-order function that wraps an asynchronous request handler. 
// It ensures that any errors thrown inside the handler are caught and passed to Express's error-handling middleware
// asyncHandler forwards any error to Express’s error-handling middleware.
// You don’t need try...catch because Express will log errors and return an appropriate response.