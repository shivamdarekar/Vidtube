import multer from "multer"; // Importing Multer module

const storage = multer.diskStorage({
    destination: function(req, file, cb) { // Define the destination folder for uploaded files
        cb(null, './public/temp'); // Specify the 'public/temp' folder for file storage
    },
    filename: function(req, file, cb) { // Define the filename for the uploaded files
        cb(null, file.originalname); // Use the original filename for the uploaded file
    }
});

const upload = multer({ storage }); // Exporting the Multer middleware configured with the storage engine
export { upload };
