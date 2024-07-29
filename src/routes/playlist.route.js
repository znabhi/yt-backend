import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  addVideoOnPlaylist,
  createPlaylist,
  editPlaylist,
  getPlaylist,
  removePlaylist,
  removePlaylistVideo,
} from "../controllers/playlist.controller.js";
const router = Router();
// router.route('/')

// router.get("/:playlistId", getPlaylist);
router.route("/:playlistId").get(getPlaylist);
router.use(verifyJWT);

router.route("/create").post(createPlaylist);

router
  .route("/:playlistId")
  .patch(addVideoOnPlaylist)
  .delete(removePlaylist)
  .post(editPlaylist);

router.route("/removevideo/:playlistId").patch(removePlaylistVideo);

export default router;
