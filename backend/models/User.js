import mongoose from "mongoose";
import passportLocalMongoose from "passport-local-mongoose";

const UserSchema = new mongoose.Schema({
  name:{
    type:String,
    trim:true,
    default:""
  },
  profilePicture: {
    type: String,
    default: ""
  },
  bio:{
    type: String,
    trim: true,
    maxLength : 300,
    default: ""
  },
  headline: {
    type: String,
    trime:true,
    default:""
  },
  profilePicture: {
    type:String,
    default:""
  },
  location:{
    type:String,
    trim: true,
    default:""
  },
  skills: {
        type: [String],
        default: []
    },

  education: {
        type: String,
        trim: true,
        default: ""
    },

  website: {
      type: String,
      trim: true,
      default: ""
  }
},
  { timestamps: true },

);

UserSchema.plugin(passportLocalMongoose.default);

const User = mongoose.model("User", UserSchema);

export default User;