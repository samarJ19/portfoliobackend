import multer from "multer";

const storage = multer.memoryStorage();

export const upload = multer({
    storage:storage,
    limits:{
        fileSize: 20*1024*1024,     //20 MB file limit
    },
    fileFilter: (req,file,cb) =>{
        
        if(file.mimetype.startsWith('image/')){
            cb(null,true);
        } else {
            cb(new Error('Invalid file type. Only images are allowed'));
        }
    },
})