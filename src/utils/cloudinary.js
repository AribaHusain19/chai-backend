import {v2 as cloudinary} from "cloudinary"
import { response } from "express";
import fs from "fs"

cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET // Click 'View API Keys' above to copy your API secret
});


const uploadOnCloudinary=async (localFilePath) =>{
    try {
        if(!localFilePath)
        {
            return null
        }
        //upload the file on cloudinary
        const response=await cloudinary.uploader.upload(localFilePath,{
            resource_type: "auto"
        })
        //file uploaded successfully
       // console.log("file uploaded successfully on cloudinary",
         //   response.url);
        //console.log(response);
        
         fs.unlinkSync(localFilePath)
            return response;
         
    } catch (error) {
        fs.unlinkSync(localFilePath)//remove the locally saved temporary files as the upload operation failed;
        return null;
        
    }
}

//console.log(uploadOnCloudinary)

export {uploadOnCloudinary}