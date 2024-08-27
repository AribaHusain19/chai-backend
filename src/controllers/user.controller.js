import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/APIError.js"
import { User } from "../models/user.model.js"
import { uploadOnCloudinary} from "../utils/cloudinary.js"
import { ApiResponse} from "../utils/APIResponse.js"

const registerUser = asyncHandler(async (req,res) =>{
    //get user details from frontend
    //validation - not empty
    //check if user already exists: username, email
    //check for images avatar
    //upload them to cloudinary
    //create user object - create entry in db 
    //remove password and refresh token field from response
    // check for user creation
    // return response
    

    const {fullname, username, email, password}= req.body;
    console.log("email", email);
    //console.log("password",password);
    if(
        [fullname, email, username, password].some((field) =>
        field?.trim() === "")
    ){
        throw new ApiError(400,"All fields are required!")
    }
    
    const existedUser = User.findOne({
        $or: [{ username }, { email }]
    })
    //console.log(existedUser);
    
    if(existedUser){
        throw new ApiError(409,"User with this username or email already exists")
    }

    const avatarLocalPath = req.files?.avatar[0]?.path;
    const coverImageLocalPath=req.files?.coverImage[0].path;

    if(!avatarLocalPath)
    {
        throw new ApiError(400,"Avatar file is required! ");
        
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if(!avatar)
    {
        throw new ApiError(400,"Avatar is required")
        
    }

     const user = await User.create({
        fullname,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase()
    })

    const createdUser = await user.findById(user._id).select(
        "-password  -refreshToken"
    )

    if(!createdUser){
        throw new ApiError(500,"Something went wrong while registering User")
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser,"User registered successfully")
    )
})

export {registerUser}