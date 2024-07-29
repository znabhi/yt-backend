import { Router } from "express";
import {
  uploadVideo,
  updateVideoDetails,
  getVideoById,
  deleteVideo,
  togglePublishStatus,
  getAllVideos,
} from "../controllers/video.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/").get(getAllVideos);
router.route("/:videoId").get(getVideoById);

router.use(verifyJWT);

router.route("/upload").post(upload.single("videoFile"), uploadVideo);

router
  .route("/:videoId")
  .patch(upload.single("vidoeThumnail"), updateVideoDetails)
  .post(deleteVideo);

router.route("/toggle/publish/:videoId").patch(togglePublishStatus);
export default router;
