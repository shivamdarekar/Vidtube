Vidtube is a robust backend project designed for managing video content, built with Node.js, Express.js, MongoDB, Mongoose, JWT, Bcrypt, and more. It follows industry-standard practices for authentication, authorization, and secure data handling.

## Features

- User authentication with JWT and refresh tokens
- Password hashing with Bcrypt
- Full CRUD operations for video resources
- Modular and scalable folder structure
- Follows best practices for backend development

## Tech Stack

- Node.js
- Express.js
- MongoDB & Mongoose
- JWT (JSON Web Tokens)
- Bcrypt
- (And more...)

- ## Folder Structure

Vidtube
├── .gitignore
├── .prettierignore
├── .prettierrc
├── README.md
├── package.json
├── package-lock.json
├── public/         # Static assets (images, videos, favicon, etc.)
└── src/            # All backend source code
    ├── controllers/   # Route controllers: logic for handling requests
    ├── models/        # Mongoose models: defines data schema
    ├── routes/        # Express route definitions
    ├── middleware/    # Custom Express middleware (auth, error handling, etc.)
    ├── utils/         # Utility/helper functions
    └── index.js       # Entry point for the backend app
