import { Router } from "express";
import {
    addVideoComment,
    addTweetComment,
    updateComment,
    deleteComment,
    getVideoComments,
    getTweetComments
} from "../controllers/comment.controller.js";
import { upload } from "../middlewares/multer.Middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/add/:videoId").post(verifyJWT, addVideoComment)

router.route("/tweet/:tweetId").post(verifyJWT,addTweetComment)

router.route("/update/:commentId").patch(verifyJWT,updateComment)

router.route("/delete/:commentId").delete(verifyJWT, deleteComment)

router.route("/get/:videoId").get(getVideoComments);

router.route("/getall/:tweetId").get(getTweetComments)

export default router;