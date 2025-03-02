import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

// Configure CORS middleware
// This enables CORS for your application, allowing requests from the origin specified in the environment variable CORS_ORIGIN.
// The 'credentials' option allows for cookies and other credentials to be shared across origins.
app.use(
    cors({
        origin: process.env.CORS_ORIGIN, // The origin that is allowed to access the resources
        credentials: true // Allow credentials (cookies, authorization headers, etc.) to be shared
    })
);

// Common middlewares
// Middleware to parse JSON bodies with a limit of 16kb
app.use(express.json({ limit: "16kb" }));

// Middleware to parse URL-encoded bodies with a limit of 16kb
app.use(express.urlencoded({ extended: true, limit: "16kb" }));

//Serves static files (e.g., images, CSS, JavaScript) from the public directory.
app.use(express.static("public"));

// Middleware to parse cookies
app.use(cookieParser());

// Import routes
import healthCheckRouter from "./routes/healthCheck.route.js";
import userRouter from "./routes/user.routes.js";
import videoRouter from "./routes/video.route.js"
import commentRouter from "./routes/comment.route.js"
import likeRouter from "./routes/like.route.js"
import playlistRouter from "./routes/playlist.route.js"
import tweetRouter from "./routes/tweet.route.js"
import subscriptionRouter from "./routes/subscription.route.js"
import dashboardRouter from "./routes/dashboard.route.js"
import replyRouter from "./routes/reply.route.js"


// Setup routes
app.use("/api/v1/healthcheck", healthCheckRouter);
app.use("/api/v1/users", userRouter);
app.use("/api/v1/videos", videoRouter);
app.use("/api/v1/comments", commentRouter);
app.use("/api/v1/likes", likeRouter)
app.use("/api/v1/playlists", playlistRouter)
app.use("/api/v1/tweets",tweetRouter)
app.use("/api/v1/subscriptions", subscriptionRouter);
app.use("/api/v1/dashboard", dashboardRouter)
app.use("/api/v1/reply",replyRouter)

export { app }; // Export the app instance for use in other modules
