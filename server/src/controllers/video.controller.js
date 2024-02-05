import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {deleteFromCloudinary, uploadOnCloudinary} from "../utils/cloudinary.js"

//TODO: get all videos based on query, sort, pagination
const getAllVideos = asyncHandler(async (req, res) => {
    const { 
        page = 1, 
        limit = 10, 
        query = `/^video/`, 
        sortBy = "createdAt", 
        sortType = 1, 
        userId = req.userWithAccessToken._id 
    } = req.query
    
    const user = await User.findById({_id:userId})

    if(!user){
        throw new ApiError(400,"user not found")
    }

   const getAllVideosAggregate = await Video.aggregate([
        {
            $match:{
                owner : new mongoose.Types.ObjectId(userId),
                $or:[
                    { title:{ $regex : query, $options : 'i'}}, // $options : 'i' represent case insensentive
                    { description:{ $regex : query, $options : 'i'} }
                ]
            }
        },
        {
            $sort:{
                [sortBy] : sortType // dynamically sorting document in increasing order on the basis of sortBy field(createdAt) and sortType value(1)
                // if you set sortType = -1 then it will sort in decreasing order
            }
        },
        {
            $skip:(page - 1) * limit
        },
        {
            $limit : parseInt(limit)
        }
    ])

    Video.aggregatePaginate(getAllVideosAggregate, {page, limit})
    .then((result)=>{
        // console.log('result',result)
        return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                result,
                "fetched all videos successfully !!"
            )
        )
    })
    .catch((error)=>{
        console.log("getting error while fetching all videos:",error)
        throw error
    })
//    const sortedVideo = await Video.aggregatePaginate(getAllVideosAggregate,{page,limit})
//    if(!sortedVideo){
//     throw new ApiError(500,"something went wrong while applying aggregatePaginate on video")
//    }
//     return res
//     .status(200)
//     .json(
//         new ApiResponse(200,{sortedVideo},"fetched all video successfully")
//     )
})

    // TODO: get video, upload to cloudinary, create video
const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description} = req.body
    if([title,description].some((item) => item.trim() === "")){
        throw new ApiError(400, "all fields are required")
    }
    //video
    const videoLocalPath =  req.files?.videoFile[0].path

    const cloud_video = await uploadOnCloudinary(videoLocalPath)
    if(!cloud_video.secure_url){
        throw new ApiError(400,"Got error while uploading video on cloudinary")
    }
    //thumbnail
    const thumbnailLocalPath = req.files?.thumbnail[0].path
    const cloud_thumb = await uploadOnCloudinary(thumbnailLocalPath)
    if(!cloud_thumb.secure_url){
        throw new ApiError(400,"Got error while uploading thumbnail on cloudinary")
    }


    const video = await Video.create({
        title,
        description,
        videoFile:{
            public_id: cloud_video.public_id,
            secure_url: cloud_video.secure_url,
        },
        thumbnail:{
            public_id: cloud_thumb.public_id,
            secure_url: cloud_thumb.secure_url
        },
        owner : req.userWithAccessToken._id
    })

    if(!video){
        throw new ApiError(500,"video not created properly")
    }

    return res
    .status(201)
    .json(
        new ApiResponse(200,video,"video created successfully")
    )
})

 //TODO: get video by id
const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    console.log('videoid',videoId)

    if(!isValidObjectId(videoId)){
        throw new ApiError(400,"This video id is incorrect")
    }

  const video = await Video.findById({_id:videoId})
  if(!video){
    throw new ApiError(400,"video not found with the provided Id")
  }
  
  return res
  .status(200)
  .json(
    new ApiResponse(200,video,"video retrieved from db successfully")
  )
   
})

 // Update video details like title, description, thumbnail
 const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const { title, description } = req.body;
    const thumbnail = req.file?.path;

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "video id is not valid");
    }

    if (!thumbnail || !(title || description)) {
        throw new ApiError(400, "All fields are required");
    }

    const isVideoAvailable = await Video.findOne({
        _id: videoId
    });

    if (!isVideoAvailable) {
        throw new ApiError(400, "video not found");
    }

    // Deleting previous thumbnail on Cloudinary
    if (isVideoAvailable.thumbnail?.public_id) {
        await deleteFromCloudinary(isVideoAvailable.thumbnail.public_id, "image");
    }

    // Uploading new thumbnail to Cloudinary
    const updatedNewThumbnail = await uploadOnCloudinary(thumbnail);

    if (!updatedNewThumbnail.secure_url) {
        throw new ApiError(500, "Got some error while uploading new thumbnail on cloudinary");
    }

    // Update video details in the database
    const updatedVideo = await Video.findByIdAndUpdate(
        videoId,
        {
            $set: {
                title,
                description,
                'thumbnail.public_id': updatedNewThumbnail.public_id,
                'thumbnail.secure_url': updatedNewThumbnail.secure_url
            }
        },
        {
            new: true
        }
    );

    if (!updatedVideo) {
        throw new ApiError(500, "video details not updated properly");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, updatedVideo, "video updated successfully")
        );
});


//TODO: delete video
const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    
    if(!isValidObjectId(videoId)){
        throw new ApiError(400,"Video id is not valid")
    }

    const video = await Video.findById({_id:videoId})
    if(!video){
        throw new ApiError(400,"video not found with provided id")
    }

    if(video.owner.toString() !== req.userWithAccessToken._id.toString()){
        throw new ApiError(403,"You have no permission to delete this resources")
    }

    // deleting video and thumbnail from cloudinary
    if(video.videoFile.public_id){
      const delVideo =  await deleteFromCloudinary(video.videoFile.public_id,"video")
    //   console.log('delvideo',delVideo)
    }

    if(video.thumbnail.public_id){
       const delImg = await deleteFromCloudinary(video.thumbnail.public_id,"image")
    //    console.log('delImg',delImg)
    }

    const deletedVideo = await Video.findByIdAndDelete({_id:videoId})

    if(!deletedVideo){
        throw new ApiError(500,"something went wrong while deleting video")
    }
    return res
    .status(200)
    .json(
        new ApiResponse(200,{},"successfully deleted video")
    )
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    if(!isValidObjectId(videoId)){
        throw new ApiError(400,"videoId is not valid")
    }

   const video = await Video.findById({_id : videoId})
   if(!video){
    throw new ApiError(400,"video not found with the provided id")
   }
   if(video.owner._id.toString() !== req.userWithAccessToken._id.toString()){
    throw new ApiError(403,"You can't update video publish status")
   }
   video.isPublished = !video.isPublished
  await video.save({validateBeforeSave:false})

   return res
   .status(200)
   .json(
    new ApiResponse(200,video,"video toggled successfully")
    )
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}