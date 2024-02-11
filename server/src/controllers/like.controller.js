import mongoose, {isValidObjectId} from "mongoose"
import {Like} from "../models/like.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { Tweet } from "../models/tweet.model.js"

// toggle like on video
const toggleVideoLike = asyncHandler(async (req, res) => {
    const {videoId} = req.params
    
    if(!isValidObjectId(videoId)){
        throw new ApiError(400,"video id is not valid")
    }

   const isVideoLiked = await Like.findOne({
        video:videoId
    })

    let like;
    let unlike;

    if(isVideoLiked){
       unlike = await Like.deleteOne({
            video:videoId
        })

    if(!unlike){
            throw new ApiError(400,"something went wrong while unlike video")
        }
    }else{
      like = await Like.create({
            video:videoId,
            likedBy:req.userWithAccessToken._id
        })

        if(!like){
            throw new ApiError(500,"something went wrong while like video")
        }
    }
    return res
    .status(201)
    .json(
        new ApiResponse(200,{},`User ${like ? "like" : "unlike"} video successfully`)
    )
})
// get(read) 202,  post(create) 201, put/patch(update) 203, delete 204

// toggle like on comment
const toggleCommentLike = asyncHandler(async (req, res) => {
    const {commentId} = req.params

    if(!isValidObjectId(commentId)){
        throw new ApiError(400,"comment id is not valid")
    }

   const isLikedComment = await Like.findOne({
        comment:commentId
    })

    let like;
    let unlike;

    if(isLikedComment){
     unlike = await Like.deleteOne({
            comment:commentId
        })

        if(!unlike){
            throw new ApiError(500,"something went wrong while unlike video")
        }
    }else{
      like = await  Like.create({
            comment:commentId,
            likedBy:req.userWithAccessToken._id
            
        })

        if(!like){
            throw new ApiError(500,"something went wrong while like video")
        }
    }

    return res
    .status(201)
    .json(
        new ApiResponse(200,{},`comment ${like ? "like" : "unlike"}  successfully`)
    )
    

})

 // toggle like on tweet
const toggleTweetLike = asyncHandler(async (req, res) => {
    const {tweetId} = req.params
   
 if(!isValidObjectId(tweetId)){
    throw new ApiError(400,"tweet id is not valid")
 }

 const isTweetLiked = await Like.findOne({
    tweet:tweetId,
 })

 let like;
 let unlike;

 if(isTweetLiked){
    unlike = await Like.deleteOne({
        tweet:tweetId
    })
    if(!unlike){
        throw new ApiError(400,"something went wrong while unlike video")
    }
 }else{
   like = await Like.create({
        tweet:tweetId,
        likedBy:req.userWithAccessToken._id
    })
    if(!like){
        throw new ApiError(500,"something went wrong while like tweet")
    }
 }
 return res
 .status(200)
 .json(
    new ApiResponse(200,{},`tweet ${like?"like":"unlike"} successfully`)
 )

})

// get all liked videos
const getLikedVideos = asyncHandler(async (req, res) => {
    try {

        // 1st approach by populate method
        // const likedVideos = await Like.find({ video: { $exists: true } }).populate('video');

        // second approach using aggregation pipeline
        const likedVideos = await Like.aggregate([
            {
                $match: { video: { $exists: true } }
            },
            {
                $lookup: {
                    from: 'videos',
                    localField: 'video',
                    foreignField: '_id',
                    as: 'video' //
                }
            },
            {
                $unwind: '$video' // Unwind the resulting array field 'video' to get individual documents
            }
        ]);

       return res
       .status(200)
       .json(
        new ApiResponse(200,likedVideos,"Get liked video successfully")
       );
    } catch (error) {
        throw new ApiError(500,"something went wrong while getting liked video",error)
    }
});

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}