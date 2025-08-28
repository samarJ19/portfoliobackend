import "express";

declare global {
  namespace Express {
    interface Request {
      userId?: string; // add your custom property
    }
  }
}

export interface JWT_Payload{
    userId:string
}