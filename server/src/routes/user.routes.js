import { Router } from "express"
import {changeCurrentUserPassword, getCurrentUser, getUserChannelProfile, getUserWatchHistory, loginUser, logoutUser, refreshAccessToken, registerUser, updateAccountDetails, updateUserAvatar, updateUserCoverImage} from '../controllers/user.controller.js'
import { upload } from "../middlewares/multer.middleware.js"
import  verifyJwt  from "../middlewares/auth.middleware.js"


const router = Router()

router.route("/register").post(
    upload.fields([
        {
            name:"avatar",
            maxCount:1
        },{
            name:"coverImage",
            maxCount:1
        }
    ]),
    registerUser)
// router.post("/register",registerUser)
router.route("/login").post(loginUser)
//secure route
router.route("/logout").post(verifyJwt, logoutUser)
router.route("/refresh-token").post(refreshAccessToken)
router.route("/change-password").post(verifyJwt,changeCurrentUserPassword) 
router.route("/curret-user").get(verifyJwt, getCurrentUser)
router.route("/update-account").patch(verifyJwt,updateAccountDetails)
router.route("/update-avatar").patch(verifyJwt, upload.single("avatar"), updateUserAvatar)
router.route("/update-coverImage").patch(verifyJwt, upload.single("coverImage"), updateUserCoverImage)
router.route("/channelProfile/:userName").get(verifyJwt,getUserChannelProfile)
router.route("/watch-history").get(verifyJwt,getUserWatchHistory)
export default router