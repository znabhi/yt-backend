import { Router } from "express";
import {
  addTweet,
  getUserTweet,
  editTweet,
  deleteTweet,
} from "../controllers/tweet.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
const router = Router();

router.use(verifyJWT);

router.route("/add/").post(addTweet);
router.route("/user/:userId").get(getUserTweet);
router.route("/edit/:tweetId").post(editTweet);
router.route("/delete/:tweetId").post(deleteTweet);
export default router;
