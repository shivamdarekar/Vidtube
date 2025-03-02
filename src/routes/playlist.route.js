import { Router } from "express";
import {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    deleteVideoFromPlaylist,
    updatePlaylist,
    toggleStatus
} from "../controllers/playlist.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();
router.use(verifyJWT);

router.route("/create").post(createPlaylist);

router.route("/:userId").get(getUserPlaylists);

router.route("/get/:playlistId").get(getPlaylistById)

router.route("/add/:videoId/:playlistId").patch(addVideoToPlaylist);

router.route("/remove/:videoId/:playlistId").patch(deleteVideoFromPlaylist)

router.route("/update/:playlistId").patch(updatePlaylist)

router.route("/toggle/:playlistId").patch(toggleStatus)

export default router;