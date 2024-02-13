import mongoose from "mongoose"
import {Video} from "../models/video.model.js"
import {Subscription} from "../models/subscription.model.js"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

 // Get the channel stats like → total video, likes, views, subscribers, etc.
const getChannelStats = asyncHandler(async (req, res) => {

  try {
     // Get total video
     const getAllVideo = await Video.aggregate([
      {
          $match:{
            owner : new mongoose.Types.ObjectId(req.userWithAccessToken._id)  
          }
      },
      {
          $count:'totalVideo'
      }
     ])
  
      // Get total likes
      const getAllLikes = await Like.aggregate([
          {
              $match:{
                  likedBy : new mongoose.Types.ObjectId(req.userWithAccessToken._id)  
              }
          },
          {
              $group:{
                  _id : null,
                  totalLikedVideos:{
                      $sum:{
                          $cond:[
                              {$ifNull:["$video",false]},
                              1, // if video found then add 1 in accumalator
                              0  // if video not found then add 0
                          ]
                      }
                  },
                  totalLikedTweets:{
                    $sum:{
                      $cond:[
                         { $ifNull : ["$tweet",false] },
                         1, // if tweet found increse with 1
                         0  // if tweet not found in the likes collection just add 0 (i.e don't increase)
                      ]
                    }  
                  },
                  totalLikedComments:{
                      $sum:{
                          $cond:[
                              { $ifNull : ["$comment",false] },
                              1, // if comment availabe add 1
                              0  // if comment not availabe add 0
                          ]
                      }
                  }
              }
          },
      ])
  
      // Get total views
      const getTotalViews = await Video.aggregate([
          {
              $match:{
                  owner:new mongoose.Types.ObjectId(req.userWithAccessToken._id)
              }
          },
          {
              $group:{
                  _id:null,
                  viewsOnAllVideo:{
                      $sum:"$views"
                  }
              }
          }
      ])
  
      // Get total subscribers
      const getTotalSubscribers = await Subscription.aggregate([
          {
              $match:{
                  channel:new mongoose.Types.ObjectId(req.userWithAccessToken._id)
              }
          },
          {
              $count:"subscribers"
          }
      ])
  
      const stats = {
          totalVideos : getAllVideo,
          totalVideoLiked : getAllLikes[0]?.totalLikedVideos,
          totalCommentLiked : getAllLikes[0]?.totalLikedComments,
          totalTweetLiked : getAllLikes[0]?.totalLikedTweets,
          totalVideoViews : getTotalViews.viewsOnAllVideo,
          totalSubscribersOfChannel : getTotalSubscribers
      }
  
  
      return res
      .status(200)
      .json(
          new ApiResponse(200,stats,"Successfully fetched channel stats")
      )
  } catch (error) {
     throw new ApiError(500,error.message)
  }

})

// TODO: Get all the videos uploaded by the channel
const getChannelVideos = asyncHandler(async (req, res) => {
    try {
        const allVideo = await Video.find({
            owner:req.userWithAccessToken._id
        })
        if(!allVideo){
            throw new ApiError(400,"something went wrong while finding video")
        }
        return res
        .status(200)
        .json(
            new ApiResponse(200,allVideo,"fetched all channel video successfully")
        )
    } catch (error) {
        throw new ApiError(500,error.message)
    }
})

export {
    getChannelStats, 
    getChannelVideos
    }