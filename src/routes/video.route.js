import { Router } from "express";
import {
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus,
    getAllVideos
} from "../controllers/video.controller.js";

import { upload } from "../middlewares/multer.Middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/publish").post(
    verifyJWT,
    upload.fields([
        { name: "video", maxCount: 1 },
        { name: "thumbnail", maxCount: 1 }
    ]),
    publishAVideo
);

router.route("/c/:videoId").get( getVideoById);

router.route("/update/:videoId").patch(verifyJWT,upload.single("thumbnail"), updateVideo);

router.route("/delete/:videoId").delete(verifyJWT, deleteVideo);

router.route("/toggle/publish/:videoId").patch(verifyJWT, togglePublishStatus);

router.route("/getall/:userId").get(getAllVideos);

export default router;