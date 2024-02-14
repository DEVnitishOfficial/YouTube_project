import mongoose, {isValidObjectId} from "mongoose"
import {Playlist} from "../models/playlist.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { Video } from "../models/video.model.js"


// create playlist
const createPlaylist = asyncHandler(async (req, res) => {
    const {name, description} = req.body

    if(!(name && description) || (name.trim()==="" && description.trim() === "")){
        throw new ApiError(400,'all fields are required to create playlist')
    }
    const playlist = await Playlist.create({
        name,
        description,
        owner:req.userWithAccessToken._id
    })
    if(!playlist){
        throw new ApiError(500,"something went wrong while creating playlist")
    }

    return res
    .status(201)
    .json(
        new ApiResponse(200,{playlist},"playlist created successfully")
    )


})

// get user playlists
const getUserPlaylists = asyncHandler(async (req, res) => {
    const {userId} = req.params

    if(!isValidObjectId(userId)){
        throw new ApiError(400,"user Id is not valid")
    }

    const playList = await Playlist.aggregate([
        {
            $match:{
                owner:new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $lookup:{
                from:"videos",
                localField:"video",
                foreignField:"_id",
                as:"videos"
            }
        }
    ])

    if(!playList){
        throw new Error(error.message)
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200,{playList},"fetched playlist successfully")
    )
    

})

const getPlaylistById = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    //TODO: get playlist by id
})

// add video to playlist
const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params

    if(!isValidObjectId(playlistId && videoId)){
        throw new ApiError(400,"Either playlistId or videoId is invalid")
    }

    const playList = await Playlist.findById({
        _id:playlistId
    })

    if(!playList){
        throw new ApiError(400,"playlist not found")
    }

    if(playList.owner.toString() !== req.userWithAccessToken._id.toString()){
        throw new ApiError(403,"you are not authorized to make change in playlist")
    }

    const video = await Video.findById({
        _id:videoId
    })

    if(!video){
        throw new ApiError(400,"video not found with the provided id")
    }
    
    if(playList.video.includes(videoId)){
        throw new ApiError(400,"The video, you are trying to add, already exist in your playlist")
    }

    const addVideoToPlaylist = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $push:{
                video:videoId
            }
        },
        {
            new:true
        }
    )
    if(!addVideoToPlaylist){
        throw new ApiError(500,"something went wrong while adding video to playlist")
    }

    return res
    .status(200)
    .json(
    new ApiResponse(200,addVideoToPlaylist,"video added to playlist successfully")
    )

})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    // TODO: remove video from playlist

})

const deletePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    // TODO: delete playlist
})

const updatePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    const {name, description} = req.body
    //TODO: update playlist
})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}