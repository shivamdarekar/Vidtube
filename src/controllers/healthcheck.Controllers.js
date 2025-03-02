import { ApiResponse } from "../utils/ApiResponse.js"; // Importing the ApiResponse class
import { asyncHandler } from "../utils/asyncHandler.js"; // Importing the asyncHandler utility

const healthCheck = asyncHandler(async (req, res) => { 
    return res
        .status(200) // Setting HTTP status code to 200 (OK)
        .json(new ApiResponse(200, "ok", "Health check passed")); // Returning a JSON response with status, data, and message
});

export { healthCheck }; // Exporting the healthCheck function
