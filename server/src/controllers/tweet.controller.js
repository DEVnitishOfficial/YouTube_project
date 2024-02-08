import mongoose, { isValidObjectId } from "mongoose"
import {Tweet} from "../models/tweet.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

// create tweet
const createTweet = asyncHandler(async (req, res) => {
    const {content} = req.body

    if(!content || content.trim() === ""){
        throw new ApiError(400,"tweet content is required")
    }

  const tweet = await Tweet.create({
        content,
        owner : req.userWithAccessToken._id
    })

    if(!tweet){
        throw new ApiError(500, "Something went wrong while creating tweet")
    }

    return res
    .status(201)
    .json(
        new ApiResponse(200,{tweet},"tweet created successfully")
    )


     
})

// get user tweets
const getUserTweets = asyncHandler(async (req, res) => {

    // here we have not taken userId from params because we have already userId in token from token we have extraced that id and saved a database call and save eletricity bill of db.😂

   const tweet = await Tweet.aggregate([
        {
            $match:{
                owner:req.userWithAccessToken._id
            }
        }
    ])

    if(!tweet){
        throw new ApiError(500,"something went wrong while finding tweet")
    }
    
    return res
    .status(200)
    .json(
        new ApiResponse(200,tweet,"Got all tweet successfully")
    )
})

 // update tweet
const updateTweet = asyncHandler(async (req, res) => {
    const {content} = req.body
    const {tweetId} = req.params

    if(!content || content.trim() === ""){
        throw new ApiError(400,"tweet content is required")
    }

    if(!isValidObjectId(tweetId)){
        throw new ApiError(400,"tweet id is not valid")
    }

    const tweet = await Tweet.findById({_id:tweetId})

    if(!tweet){
        throw new ApiError(400,"tweet not found with provided id")
    }

    if(tweet.owner._id.toString() !== req.userWithAccessToken._id.toString()){
        throw new ApiError(403,"You are not authorized to make change in this tweet")
    }

   await Tweet.findByIdAndUpdate(
    tweetId,
    {
        $set:{
            content
        }
    },
    {
        new:true
    })
    .then((result) => {
        return res
        .status(200)
        .json(
            new ApiResponse(200,{result},"tweet updated successfully")
        )
    })
    .catch((error) => {
        throw new ApiError(500,"something went wrong while updating tweet",error)
    })   
})

// delete tweet
const deleteTweet = asyncHandler(async (req, res) => {
    const {tweetId} = req.params

    if(!isValidObjectId(tweetId)){
        throw new ApiError(400,"tweet id is not valid")
    }

    const tweet = await Tweet.findById({_id:tweetId})
    if(!tweet){
        throw new ApiError(400,"tweet not found with provided id")
    }

    if(tweet.owner._id.toString() !== req.userWithAccessToken._id.toString()){
        throw new ApiError(403,"You are not authorized to delete this tweet")
    }

   await Tweet.findByIdAndDelete({_id:tweetId})
   .then((deletedTweet)=> {
    return res
    .status(200)
    .json(
        new ApiResponse(200,deletedTweet,"tweet deleted successfully")
    )
   })
   .catch((error) => {
    throw new ApiError(400,"something went wrong while deleting tweet",error)
   })

})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}