import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/APIError.js"
import { User } from "../models/user.model.js"
import { uploadOnCloudinary} from "../utils/cloudinary.js"
import { ApiResponse} from "../utils/APIResponse.js"
import jwt from "jsonwebtoken";

const generateAccessAndRefreshTokens = async(userId)=>{
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        user.save({validateBeforeSave: false})

        return {accessToken, refreshToken}

    } catch (error) {
        throw new ApiError(500,"Something went wrong while generating access and refresh token ")
    }
}


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
    //console.log("email", email);
    //console.log("password",password);
    if(
        [fullname, email, username, password].some((field) =>
        field?.trim() === "")
    ){
        throw new ApiError(400,"All fields are required!")
    }
    
    const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    })
    //console.log(existedUser);
    
    if(existedUser){
        throw new ApiError(409,"User with this username or email already exists")
    }

    console.log(req.files);
    

    const avatarLocalPath = req.files?.avatar[0]?.path;
    //const coverImageLocalPath=req.files?.coverImage[0].path;

    let coverImageLocalPath;
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length>0)
    {
        coverImageLocalPath=req.files.coverImage[0].path
    }

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

    const createdUser = await User.findById(user._id).select(
        "-password  -refreshToken"
    )

    if(!createdUser){
        throw new ApiError(500,"Something went wrong while registering User")
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser,"User registered successfully")
    )
})

const loginUser = asyncHandler(async(req,res) => {
    // req body ->data
    // username or email
    // find the user
    // password check
    //access and refresh token
    //send cookie

    const {email, username, password } = req.body

    if(!username && !email)
    {
        throw new ApiError(400,"username or email is required")

    }

    const user = await User.findOne(
        {
            $or: [{ username }, { email }]
        }
    )

    if(!user)
    {
        throw new ApiError(404, "User does not exist")
    }

    const isPasswordValid=await user.isPasswordCorrect(password)
    /*if (!password || !this.password) {
        throw new Error('Both plainPassword and hashed password are required');*/
    if(!isPasswordValid)
    {
        throw new ApiError(401,"Invalid user credentials")
        
    }

    const {accessToken, refreshToken }= await generateAccessAndRefreshTokens(user._id)

    const loggedInUser = await User.findById(user._id).
    select("-password -refreshToken")

    const options = {
        httpOnly: true,
        secure: true
    }
    console.log('Access Token:', typeof accessToken, accessToken);
    console.log('Refresh Token:', typeof refreshToken, refreshToken);

    
    return res.status(200).cookie("accessToken",accessToken,options)
    .cookie("refreshToken",refreshToken,options)
    .json(
        new ApiResponse(
            200,
            {
                user:loggedInUser,accessToken,refreshToken
            },
            "User logged In successfully"
        )
    )
})

const logoutUser = asyncHandler(async(req,res) =>{
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken: undefined
            }
        },
        {
            new: true
        }
    )

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {},"User logged Out"))
})

const refreshAccessToken = asyncHandler(async(req,res)=>{
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if(incomingRefreshToken)
    {
        throw new ApiError(401,"unauthorized request");
        
    }

    try {
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
    
        )
    
        const user = await User.findById(decodedToken?._id)
    
        if(!user)
        {
            throw new ApiError(401,"invalid refresh token")
    
        }
    
        if(incomingRefreshToken !== user?.refreshToken){
            throw new ApiError(401,"Refresh Token expired or used");
            
        }
    
        const options ={
            httpOnly:true,
            secure:true
        }
    
        const {accessToken,newrefreshToken} = await generateAccessAndRefreshTokens(user._id)
    
        return res
        .status(200)
        .cookie("accessToken",accessToken,options)
        .cookie("refreshToken",newrefreshToken,options)
        .json(
            new ApiResponse(
                200,
                {
                    accessToken,refreshToken: newrefreshToken
                },"Access Token refreshed successfully"
            )
        )
    } catch (error) {
        throw new ApiError(401,error?.message || "Invalid refresh Token");
        
    }
})

export {registerUser, loginUser, logoutUser,refreshAccessToken}