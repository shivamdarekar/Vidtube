import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

// Function to connect to the MongoDB database
// This function uses mongoose to connect to the MongoDB database
const connectDB = async () => {
    try {
        // Attempt to connect to the MongoDB database using the URI from environment variables and the DB_NAME constant
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
        
        // Log a message indicating that the database connection was successful
        console.log(`mongoDB connected! DB host: ${connectionInstance.connection.host}`);
    } catch (error) {
        // Log any errors that occur during the connection attempt
        console.log("mongoDB connection error ", error);

        // Exit the process with a failure code (1) if there's an error connecting to the database
        process.exit(1);
    }
};

// Export the connectDB function as the default export of this module
export default connectDB;
