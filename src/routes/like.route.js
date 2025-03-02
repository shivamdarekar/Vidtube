import { Router } from "express";
import {
    toggleVideoLike,
    toggleCommentLike,
    toggleTweetLike,
    toggleReplyLike,
    getLikedVideos
} from "../controllers/like.controller.js";
import { upload } from "../middlewares/multer.Middleware.js"
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router()

router.route("/video/:videoId").post(verifyJWT,toggleVideoLike)

router.route("/comment/:commentId").post(verifyJWT, toggleCommentLike)

router.route("/tweet/:tweetId").post(verifyJWT, toggleTweetLike)

router.route("/reply/:replyId").post(verifyJWT,toggleReplyLike)

router.route("/getall/liked").get(verifyJWT,getLikedVideos)

export default router