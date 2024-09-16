import mongoose,{Schema} from "mongoose";

const playlistSchema = new Schema(
    {
        name:{
            type:String,
            req:true
        },
        description:{
            type:String,
            req:true
        },
        videos:{
            type:Schema.Types.ObjectId,
            ref:"Video"
        },
        owner:{
            type:Schema.Types.ObjectId,
            ref:"Owner"
        }
    },
    {
        timestamps:true
    }
)

export const Playlist = mongoose.model("Playlist",playlistSchema)