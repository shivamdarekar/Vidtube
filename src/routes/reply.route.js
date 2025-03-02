import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
    createReply,
    updateReply,
    deleteReply,
    GetCommentReply
} from "../controllers/reply.controller.js"

const router = Router()

router.use(verifyJWT)

router.route("/comment/:commentId").post(createReply)

router.route("/update/:replyId").patch(updateReply)

router.route("/delete/:replyId").delete(deleteReply)

router.route("/get/:commentId").get(GetCommentReply)

export default router