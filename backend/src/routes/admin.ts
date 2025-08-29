import express, { Request, Response } from "express";
import { prisma } from "../db";
import bcrypt from "bcrypt";
import { JWT_Payload } from "../../type";
import jwt from "jsonwebtoken";
import { authMiddleware } from "../middleware/auth";
export const router = express.Router();

import { v2 as cloudinary } from 'cloudinary';
import { upload } from "../cloudinartConfig";
import { Category } from "../generated/prisma";

cloudinary.config({
  cloud_name:process.env.CLOUDINARY_CLOUD_NAME,
  api_key:process.env.CLOUDINARY_API_KEY,
  api_secret:process.env.CLOUDINARY_API_SECRET
});

interface UploadRequestBody {
  title:string,
  category: Category
}

const uploadToCloudinary = (fileBuffer: Buffer) : Promise<any> => {
  return new Promise((resolve,reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder:'portfolio_images',
        resource_type:'image'
      },
      (error,result) => {
        if(error){
          reject(error);
        } else {
          resolve(result);
        }
      }
    );
    uploadStream.end(fileBuffer);
  });
};

//signup route /api/v1/signup
router.post("/signup", async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      console.log("Invaild or missing credentials");
      return res
        .status(401)
        .json({ message: "Invaild or missing credentials " });
    }
    let user = await prisma.user.findUnique({ where: { email: email } });
    if (user) {
      return res.status(400).json({ message: "Email already exist" });
    }
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    user = await prisma.user.create({
      data: {
        name: name,
        email: email,
        password: hashedPassword,
      },
    });
    //generate and send token ? => We generate and set the token and frontend prepare use this token and add it into the auth headers
    const payload: JWT_Payload = {
      userId: user.id,
    };

    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET is not defined");
    }

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "8h",
    });

    // Return user info without password
    const { password: _, ...userWithoutPassword } = user;

    res.json({
      token,
      user: userWithoutPassword,
    });
  } catch (err) {
    console.log("Error while signing up: ", err);
    return res.status(403).json({ message: "Error while signing up !" });
  }
});
//login route
router.post("/login", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(401).json({ message: "Invalid Credentials" });
    }
    let user = await prisma.user.findUnique({ where: { email: email } });
    if (!user) {
      return res.status(401).json({ message: "Invalid Credentials" });
    }
    const hashedPassword = user.password;
    const isMatched = await bcrypt.compare(password, hashedPassword);
    if (!isMatched) {
      return res.status(401).json({ message: "Invalid Credentials" });
    }
    const payload: JWT_Payload = { userId: user.id };
    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET is not defined");
    }

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "8h",
    });

    // Return user info without password
    const { password: _, ...userWithoutPassword } = user;

    res.status(201).json({
      token,
      user: userWithoutPassword,
    });
  } catch (err) {
    console.log("Error while logging In ! ", err);
    return res.status(403).json({ message: "Error while logging In " });
  }
});

//UX idea for frontend => There shouldn't be 2 options like upload image & upload bulk,
//  in frontend only you can check whether it has one or more than one images

//upload route /api/v1/upload
router.post('/upload', upload.single('image') ,async (req:Request,res:Response) =>{
  //file, category{portrait,automobile,street}
    //Upload the image -> store its meta data -> Use this meta data in frontend to reterieve images
    //for example while uploading an image, I take from user the category for the image 
    //we upload this image to cloudinary and save the required meta like publicId etc along with category
    //So in frontend we query our database for a particular category lets say automobile and we will get 
    //publicId through which we can get images of this category and can render it on the frontend !

    //files goes from user-> server's ram -> cloudinary !
  try{
    if(!req.file) {
      return res.status(400).json({message:"No image file provided"});
    }
    const {title , category} = req.body as UploadRequestBody
     if (!title || !category) {
      return res.status(400).json({ message: 'Title and category are required.' });
    }
    if( !Object.values(Category).includes(category)){
      return res.status(400).json({message:"Invalid Category provided."});
    }

    const cloudinaryResult = await uploadToCloudinary(req.file.buffer);

    const newPhoto = await prisma.photo.create({
      data:{
        title,
        category,
        imageURL: cloudinaryResult.secure_url,
        publicId: cloudinaryResult.public_id,
      },
    });
    return res.status(201).json({
      message: 'Image uploaded successfully!',
      photo: newPhoto,
    });
  }catch(err:any){
     console.error('Error while uploading image: ', err);
    return res.status(500).json({ 
        message: 'Server error during image upload.',
        error: err.message 
    });
  }
});

//multiple upload

//delete route
//get route for images of particular category ?
