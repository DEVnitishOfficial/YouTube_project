import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

// build a healthcheck response that simply returns the OK status as json with a message
const healthcheck = asyncHandler(async (req, res) => {
    const healthCheck = {
        uptime:process.uptime(),
        responsetime:process.hrtime(),
        message:"ok",
        timestamp:Date.now()
    }
    try {
        return res
        .status(200)
        .json(
            new ApiResponse(200,healthCheck,"Server health is Good")
        )
    } catch (error) {
        console.error("Error in healthcheck",error)
       throw new ApiError(400,"got error while checking server health") 
    }
    
})

export {
    healthcheck
    }