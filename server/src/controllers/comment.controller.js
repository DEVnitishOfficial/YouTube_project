import mongoose, { isValidObjectId, mongo } from "mongoose"
import {Comment} from "../models/comment.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {Video} from "../models/video.model.js"

//TODO: get all comments for a video
const getVideoComments = asyncHandler(async (req, res) => {
 
    const {videoId} = req.params
    const {page = 1, limit = 10} = req.query

    if(!isValidObjectId(videoId)){
        throw new ApiError(400,"videoId is not valid")
    }

    const video = await Video.findById({_id : videoId})
    if(!video){
        throw new ApiError(400,"video not found")
    }

  const commentAggregate = await Comment.aggregate([
        {
            $match:{
                video : new mongoose.Types.ObjectId(videoId)
            }
        }
    ])

    Comment.aggregatePaginate(commentAggregate,{page,limit})
        .then((aggregateResult)=>{
            return res
            .status(200)
            .json(
                new ApiResponse(200,aggregateResult,"got video comments successfully")
            )
        })
        .catch((error) => {
            throw new ApiError(500,"something went worng while getting video comment", error)
        })




})

//  add a comment to a video
const addComment = asyncHandler(async (req, res) => {
    const {videoId} = req.params
    const {comment} = req.body
    const userId = req.userWithAccessToken._id

    if(!isValidObjectId(videoId)){
        throw new ApiError(400,"videoId is not valid")
    }

    if(!comment || comment?.trim() === ""){
  throw new ApiError(400,"comment field is required")
    }

  const videoComment = await  Comment.create({
        content : comment,
        video : videoId,
        owner : userId
    })

    if(!videoComment){
        throw new ApiError(500,"something went wrong while creating video comment")
    }

    return res
    .status(201)
    .json(
        new ApiResponse(200,videoComment,"created comment successfully")
    )  
})

//  update a comment
const updateComment = asyncHandler(async (req, res) => {
   const {updateComment} = req.body
   const {commentId} = req.params

   if(!updateComment || updateComment.trim() === ""){
    throw new ApiError(400,"updateComment field is required")
   }

   if(!isValidObjectId(commentId)){
    throw new ApiError(400,"Given commentId is not valid")
   }

  const comment = await Comment.findById({_id : commentId})
  if(!comment){
    throw new ApiError(404,"comment not found with provided commentId")
  }
    
  if(comment.owner.toString() !== req.userWithAccessToken._id.toString()){
    throw new ApiError(403,"You have no authority to update this comment")
  }

  const updatedComment = await Comment.findByIdAndUpdate(
    commentId,
    {
        $set:{
            content : updateComment
        }
    },
    {
        new:true
    }
  )

  if(!updatedComment){
    throw new ApiError(400,"Something went wrong while updating comment")
  }

  return res
  .status(202)
  .json(
    new ApiResponse(200,{updatedComment},"Comment updated successfully")
  )


})

 //delete a comment
const deleteComment = asyncHandler(async (req, res) => {
   const {commentId} = req.params

   if(!isValidObjectId(commentId)){
    throw new ApiError(400,"commentId is not valid")
   }

   const comment = await Comment.findById({_id:commentId})

   if(comment.owner.toString() !== req.userWithAccessToken._id.toString()){
    throw new ApiError(403,"You can't perform this action")
   }
   
   Comment.findByIdAndDelete(commentId)
  .then((deletedComment) => {
    return res
    .status(200)
    .json(
        new ApiResponse(200,deletedComment,"comment deleted successfully")
    )
  })
  .catch((error) => {
    throw new ApiError(500,"something went wrong while deleteing comment",error)
  })

})

export {
    getVideoComments, 
    addComment, 
    updateComment,
     deleteComment
    }