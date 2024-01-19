import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import ApiResponse from "../utils/ApiResponse.js";

const registerUser = asyncHandler(async (req, res) => {
  // get user details from frontend
  // validation - not empty
  // check if user already exist - email, userName
  // check for image, and avatar
  // upload them to cloudinary, check avatar
  // create user object - create entry in db
  // remove password and refresh token field from response
  // check for user creation
  // return response

  const { fullName, email, userName, password } = req.body;
  if (
    [fullName, email, userName, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All fields are required");
  }
  const existingUser = User.findOne({
    $or: [{ userName }, { email }],
  });

  if (existingUser) {
    throw new ApiError(409, "user with email or userName already exist");
  }

 const avatarLocalPath = req.files?.avatar[0]?.path
 const coverImageLocalPath = req.files?.coverImage[0]?.path

 if(!avatarLocalPath){
    throw new ApiError(400,"Avatar file is required to register")
 }
 const avatar = await uploadOnCloudinary(avatarLocalPath)
 const coverImage = await uploadOnCloudinary(coverImageLocalPath)
 
 if(!avatar){
    throw new ApiError(400,"Avatar file is required")
 }

 const user = await User.create({
    fullName,
    avatar:avatar.url,
    coverImage:coverImage?.url || "",
    email,
    password,
    userName:userName.toLowerCase()
 })

 const createdUser = await User.findById(user._id).select("-password -refreshToken")
 if(!createdUser){
    throw new ApiError(500,"Failed to remove password and refreshtoken")
}

return res.status(201).json(
    new ApiResponse(200,createdUser,"user created successfully")
)
});



export { registerUser };
