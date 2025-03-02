import { v2 as cloudinary } from 'cloudinary'; // Importing Cloudinary library
import fs from "fs"; // Importing file system module
import dotenv from "dotenv"

dotenv.config({
    path: "./.env"
});

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.Cloudinary_Cloud_Name, // Setting Cloudinary cloud name from environment variables
    api_key: process.env.Cloudinary_API_Key, // Setting Cloudinary API key from environment variables
    api_secret: process.env.Cloudinary_API_Secret, // Setting Cloudinary API secret from environment variables
});

const uploadOnCloudinary = async (localFilePath) => {
    try {
        // console.log("Clodinary Config", {
        //     cloud_name: process.env.Clodinary_Cloud_Name,
        //     api_key: process.env.Clodinary_API_Key,
        //     api_secret:process.env.Clodinary_API_Secret
        // });
        
        if (!localFilePath) return null; // Return null if no file path is provided
        const response = await cloudinary.uploader.upload(
            localFilePath, {
                resource_type: "auto" // Automatically determine the resource type
            }
        );
        console.log("File uploaded on cloudinary. file src: " + response.url); // Log the URL of the uploaded file
        
        // Delete the file from the server once it's uploaded
        try {
            fs.unlinkSync(localFilePath);
        } catch (fsError) {
            console.log("Error deleting local file:", fsError);
        }
        return response;
    } catch (error) {
        console.log("Error on Cloudinary",error);
        
        await fs.unlinkSync(localFilePath); // Delete the file in case of an error
        return null;
    }
}

const deleteFromCloudinary = async (publicId, resourceType) => {
    try {
        const result = await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
        
        if (result.result !== "ok") {
            console.error("Error deleting from Cloudinary:", result);
            return null;
        }

        console.log("Deleted from cloudinary public id", publicId);
        console.log("delete", result);
        return result;
    } catch (error) {
        console.log("error deleting from cloudinary", error);
        return null;
    }
}
export { uploadOnCloudinary, deleteFromCloudinary }; // Export the uploadOnCloudinary function
