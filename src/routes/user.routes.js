import { Router } from "express";
import {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateAvatar,
    updateCoverImage,
    getUserChannelProfile,
    getWatchHistory,
    deleteUserChannel
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.Middleware.js"; // Check the file name and path
import { verifyJWT } from "../middlewares/auth.middleware.js"


const router = Router();

router.route("/register").post(
    upload.fields([
        { name: "avatar", maxCount: 1 },
        { name: "coverImage", maxCount: 1 }
    ]),
    registerUser
);


router.route("/login").post(loginUser);

router.route("/refresh-token").post(refreshAccessToken)


//secure routes

router.route("/logout").post(verifyJWT, logoutUser)

router.route("/change-password").post(verifyJWT, changeCurrentPassword)

router.route("/current-user").get(verifyJWT, getCurrentUser)

router.route("/c/:username").get( getUserChannelProfile)

router.route("/update-acc").patch(verifyJWT, updateAccountDetails)

router.route("/avatar").patch(verifyJWT,upload.single("avatar"), updateAvatar)

router.route("/cover-image").patch(verifyJWT, upload.single("coverImage"), updateCoverImage)

router.route("/history").get(verifyJWT, getWatchHistory)

router.route("/channel/delete").delete(verifyJWT,deleteUserChannel)

export default router;
