import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import ApiResponse from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

const generateAccesstokenAndRefreshtoken = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while creating access token and refreh token"
    );
  }
};

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
  const existingUser = await User.findOne({
    $or: [{ userName }, { email }],
  });
  // console.log('existingUser',existingUser)

  if (existingUser) {
    throw new ApiError(409, "user with email or userName already exist");
  }

  const avatarLocalPath = req.files?.avatar[0]?.path;
  //  const coverImageLocalPath = req.files?.coverImage[0]?.path
  let coverImageLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImageLocalPath = req.files.coverImage[0].path;
  }

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is required to register");
  }
  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  if (!avatar) {
    throw new ApiError(400, "Avatar file is required");
  }

  const user = await User.create({
    fullName,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    password,
    userName: userName.toLowerCase(),
  });

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );
  if (!createdUser) {
    throw new ApiError(500, "Failed to remove password and refreshtoken");
  }

  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "user created successfully"));
});

const loginUser = asyncHandler(async (req, res) => {
  // req.body -> data
  // userName or email
  // find the user
  // check password
  // access and refresh token
  // send cookie
  const { email, userName, password } = req.body;
  if (!email && !userName) {
    throw new ApiError(400, "email or userName is required");
  }

  const user = await User.findOne({
    $or: [{ email }, { userName }],
  });

  if (!user) {
    throw new ApiError(400, "user does not exist");
  }

  const passwordMatch = await user.isPasswordCorrect(password);

  if (!passwordMatch) {
    throw new ApiError(401, "Entred password not matched");
  }

  const { accessToken, refreshToken } =
    await generateAccesstokenAndRefreshtoken(user._id);

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "User loggedIn successfully"
      )
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  User.findByIdAndUpdate(
    req.userWithAccessToken._id,
    {
      $set: {
        refreshToken: undefined,
      },
    },
    {
      new: true,
    }
  );
  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User loggedOut successfully"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, "Unothorised request, incorrect refresh token");
  }

  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const user = await User.findById(decodedToken?._id);
    if (!user) {
      throw new ApiError(401, "Invalid refresh token");
    }

    if (incomingRefreshToken !== user?.refreshToken) {
      throw new ApiError(401, "Refresh token either expired or used");
    }

    const options = {
      httpOnly: true,
      secure: true,
    };

    const { accessToken, newRefreshToken } =
      await generateAccesstokenAndRefreshtoken(user._id);
    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken: newRefreshToken },
          "Access token refreshed successfully"
        )
      );
  } catch (error) {
    throw new ApiError(400, error?.message || "Invalid refresh token");
  }
});

const changeCurrentUserPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  const user = await User.findById(req.userWithAccessToken?._id);
  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

  if (!isPasswordCorrect) {
    throw new ApiError(400, "Old password is incorrect");
  }

  user.password = newPassword
  await user.save({validateBeforeSave:false})
  return res
  .status(200)
  .json(
    new ApiResponse(200,{}, "successfully changed password")
  )

});

const getCurrentUser = asyncHandler(async(req,res) => {
  // const user = await User.findById(req.userWithAccessToken?._id)
  return res
  .status(200)
  .json(new ApiResponse(200,req.userWithAccessToken,"Current user get successfully"))
})

const updateAccountDetails = asyncHandler(async(req,res) => {
  const {fullName,email} = req.body
  if(!(fullName || email)){
    throw new ApiError(400, "All fields are required")
  }
  const user = await User.findByIdAndUpdate(
    req.userWithAccessToken?._id,
    {
      $set:{
        fullName,
        email
      }
    },
    {new:true}
    ).select("-password")

    return res
    .status(200)
    .json(new ApiResponse(200,user,"User account details updated successfully"))
})

const updateUserAvatar = asyncHandler(async(req,res) => {
 const avatarLocalPath =  req.file?.path
 const avatar = await uploadOnCloudinary(avatarLocalPath)
 if(!avatar.url){
  throw new ApiError(400,"Got error while uploading avatar")
 }

 const user = await User.findByIdAndUpdate(
  req.userWithAccessToken?._id,
  {
    $set:{
      avatar:avatar.url
    }
  },{new:true}
  ).select("-password")
 return res
 .status(200)
 .json(new ApiResponse(200,user,"Updated user avatar successfully"))
})

const updateUserCoverImage = asyncHandler(async(req,res) => {
  const coverImageLocalPath = req.file?.path
  if(!coverImageLocalPath){
    throw new ApiError(400, "Cover image is missing")
  }
try {
  const coverImage = await uploadOnCloudinary(coverImageLocalPath)
  console.log('coverImage',coverImage.url)
  
  if(!coverImage.url){
    throw new ApiError(400,"Got error while uploading avatar")
   }
  
  const user = await User.findByIdAndUpdate(
    req.userWithAccessToken?._id,
    {
      $set:{
        coverImage:coverImage.url
      }
    },{new:true}
    ).select("-password")
  
    return res
    .status(200)
    .json(new ApiResponse(200,user,"Updated user cover image successfully"))
} catch (error) {
 return res
 .status(500)
 .json(
  new ApiError(500,{error:error.message},"something went wrong while updating coverImage")
 )
}
})

const getUserChannelProfile = asyncHandler(async(req,res) => {
  const {userName} = req.params
  if(!userName.trim()){
    throw new ApiError(400, "userName is missing")
  }
  const channel = await User.aggregate([
    // here in the first pipeline i have find a single document
    {
        $match:{
          userName:userName?.toLowerCase()
        }
    }, 
    // here in the second pipeline we will find out the subscribers of a particular channel
    {
      $lookup:{
        from:"subscriptions",
        localField:"_id",
        foreignField:"channel",
        as:"subscribers"
      }
    },
    //here in the third pipeline we will find out the subscribed channel by a channel
    // eg: nitishOfficial is a channel and it has also subscribed the channel like "chai aur code","dhruv rathee", "world affairs" etc.
    {
      $lookup:{
        from:"subscriptions",
        localField:"_id",
        foreignField:"subscriber",
        as:"subscribedTo"
      }
    },
    // here we have added two new extra field in our db 
    {
      $addFields:{
        subscriberCount:{
          $size:"$subscribers" // here subscribers is a field that's why we add a $ sign before it
        },
        channelSubscribedToCount:{
          $size:"$subscribedTo"
        },
        isSubscribed:{
          $cond:{
            if:{$in:[req.userWithAccessToken?._id,"$subscribers.subscribe"]},
            then:true,
            else:false
          }
        }
      }
    },
    {
      $project:{
        fullName:1,
        userName:1,
        email:1,
        subscriberCount:1,
        channelSubscribedToCount:1,
        avatar:1,
        coverImage:1
        


      }
    }
  ])

  if(!channel?.length){
    throw new ApiError(400, "channel does not exist")
  }

  return res
  .status(200)
  .json(
    new ApiResponse(200, channel[0], "User channel fetched successfully")
  )

})

const getUserWatchHistory = asyncHandler(async(req,res) => {
  const user = await User.aggregate([
    {
      $match:{
        _id: new mongoose.Types.ObjectId(req.userWithAccessToken._id)
      }
    },
    {
      $lookup:{
        from:"videos",
        localField:"watchHistory",
        foreignField:"_id",
        as:"watchHistory",
        pipeline:[
          {
            $lookup:{
              from:"users",
              localField:"owner",
              foreignField:"_id",
              as:"owner",
              pipeline:[
                {
                  $project:{
                    fullName:1,
                    userName:1,
                    avatar:1
                  }
                }
              ]
            }
          },
          {
            $addFields:{
              owner:{
                $first:"$owner"
              }
            }
          }
        ]
      }
    }
  ])

  return res
  .status(200)
  .json(
    new ApiResponse(
      200,
      user[0].watchHistory,
      "watch history fetched successfully"
    )
  )
})
export { registerUser, loginUser, logoutUser, refreshAccessToken, changeCurrentUserPassword,getCurrentUser, updateAccountDetails, updateUserAvatar, updateUserCoverImage, getUserChannelProfile,
getUserWatchHistory };
