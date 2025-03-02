import { Router } from "express"; // Importing the Router function from express
import { healthCheck } from "../controllers/healthcheck.Controllers.js"; // Importing the healthCheck function

const router = Router(); // Creating a new router instance

router.route("/").get(healthCheck); // Defining a route that handles GET requests to the root URL and uses the healthCheck function

export default router; // Exporting the router as the default export
