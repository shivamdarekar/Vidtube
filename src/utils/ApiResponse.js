// Defining the ApiResponse class to encapsulate standard API response structures
class ApiResponse {
    constructor(statuscode, data, message = "success") {
        this.statuscode = statuscode; // Set the HTTP status code property
        this.data = data; // Set the data property to hold the response data
        this.message = message; // Set the message property, defaulting to "success" if not provided
        this.success = statuscode < 400; // Determine success based on the status code (true if status code is less than 400)
    }
}

// Export the ApiResponse class to be used in other modules
export { ApiResponse };
