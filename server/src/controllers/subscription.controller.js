import mongoose, {isValidObjectId} from "mongoose"
import {User} from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

// toggle subscription
const toggleSubscription = asyncHandler(async (req, res) => {
    const {channelId} = req.params
    if(!isValidObjectId(channelId)){
        throw new ApiError(400,"channel id is not valid")
    }

    // here every user can be a channel similar to youtube
   const channel = User.findById({_id:channelId})
   if(!channel){
    throw new ApiError(404,"channel not found with the give id")
   }

   let subscribe;
   let unsubscribe;

   const isSubscribedChannel = await Subscription.findOne({
    subscriber : req.userWithAccessToken._id,
    channel : channelId
   })

   if(isSubscribedChannel){
    unsubscribe = await Subscription.findOneAndDelete({
        subscriber : req.userWithAccessToken._id,
        channel : channelId
    })
    if(!unsubscribe){
        throw new ApiError(400,"something went wrong while unsubscribe channel")
    }
    return res
    .status(200)
    .json(
        new ApiResponse(200,unsubscribe,"Channel unsubscribed successfully")
    )
   }else{
    subscribe = await Subscription.create({
        subscriber : req.userWithAccessToken._id,
        channel : channelId  
    })
    if(!subscribe){
        throw new ApiError(400,"something went wrong while subscribe channel")
    }
    return res
    .status(200)
    .json(
        new ApiResponse(200,subscribe,"channel subscribed successfully")
    )
   }
    
})


// subscribers of the loggedIn users i.e extracting all the subscribers of a channel
// here we(who is loggedIn currently) are trying to find out that how many users subscribed my channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const {subscriberId} = req.params

    if(!isValidObjectId(subscriberId)){
        throw new ApiError(400,"channel id is not valid")
    }

   
    const subscription = await Subscription.aggregate([
        {
            $match:{
                channel: new mongoose.Types.ObjectId(subscriberId)
            }
        },
        {
            $lookup:{
                from: "users",
                localField: "subscriber",
                foreignField: "_id",
                as: "subscribersOfMyChannel",
            }
        },
        {
            $project:{
                subscribersOfMyChannel:{
                    userName: 1,
                    email : 1,
                    fullName : 1,
                    avatar: 1
                }
            }
        },
    ])

    if(!subscription){
        throw new ApiError(400,"something went wrong while applying aggregation")
    }
    return res
    .status(200)
    .json(
        new ApiResponse(200,subscription," Get all the subscribers of userChannel successfully")
    )
})

// channel subscribed by the loggedIn users i.e channels subscribed another channels
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params

    if(!isValidObjectId(subscriberId)){
        throw new ApiError(400,"channel id is not valid")
    }
    const subscription = await Subscription.aggregate([
        {
            $match:{
                subscriber: new mongoose.Types.ObjectId(subscriberId.trim())
            }
        },
        {
            $lookup:{
                from:"users",
                localField:"channel",
                foreignField:"_id",
                as:"subscribedChannel"
            }
        },
        {
            $project:{
                subscribedChannel:{
                    userName: 1,
                    email : 1,
                    fullName : 1,
                    avatar: 1
                }
            }
        }
    ])

    if(!subscription){
        throw new ApiError(400,"something went wrong while applying aggregation")
    }
    return res
    .status(200)
    .json(
        new ApiResponse(200,subscription," Got all channels which has been subscribed by me")
    )
    

})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}