import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"

//TODO: get all videos based on query, sort, pagination
const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query

})

    // TODO: get video, upload to cloudinary, create video
const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description} = req.body
    if([title,description].some((item) => item.trim() === "")){
        throw new ApiError(400, "all fields are required")
    }
    //video
    const videoLocalPath =  req.files?.videoFile[0].path
    console.log("reqFile",req.files)

    const cloud_video = await uploadOnCloudinary(videoLocalPath)
    if(!cloud_video.url){
        throw new ApiError(400,"Got error while uploading video on cloudinary")
    }
    //thumbnail
    const thumbnailLocalPath = req.files?.thumbnail[0].path
    const cloud_thumb = await uploadOnCloudinary(thumbnailLocalPath)
    if(!cloud_thumb.url){
        throw new ApiError(400,"Got error while uploading thumbnail on cloudinary")
    }


    const video = await Video.create({
        title,
        description,
        videoFile : cloud_video.url,
        thumbnail : cloud_thumb.url,
        owner : req.userWithAccessToken._id
    })

    return res
    .status(201)
    .json(
        new ApiResponse(200,video,"video created successfully")
    )
})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: get video by id
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: update video details like title, description, thumbnail

})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: delete video
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}