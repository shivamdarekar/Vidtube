import dotenv from "dotenv";
import { app } from "./app.js";
import connectDB from "./db/index.js";

// Load environment variables from .env file
// This loads the environment variables from the specified .env file into process.env
dotenv.config({
    path: "./.env" // Path to your .env file
});

// Set the port number
// This sets the port number for your server. If PORT is not defined in the environment variables, it defaults to 8001.
const port = process.env.PORT || 8001;

// Connect to the database and start the server
// This function connects to the database. Once connected, it starts the server on the specified port.
connectDB()
    .then(() => {
        app.listen(port, () => {
            console.log(`server is running on port ${port}`); // Log that the server is running
        });
    })
    .catch((err) => {
        console.log("mongoDB connection error", err); // Log any errors encountered during the connection
    });
