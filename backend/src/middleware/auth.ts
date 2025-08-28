import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { prisma } from "../db";
import { JWT_Payload } from "../../type";

export const authMiddleware = () => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const token = req.headers.authorization?.replace("Bearer ", "");
      if (!token) {
        return res.status(401).json({ message: "No token found" });
      }

      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET as string
      ) as JWT_Payload;

      const { userId } = decoded;

      const user = await prisma.user.findUnique({ where: { id: userId } });

      if (!user) {
        return res.status(404).json({ message: "User not found!" });
      }

      req.userId = userId; 
      next();
    } catch (err) {
      console.error("Error in auth middleware:", err);
      res.status(403).json({ message: "Invalid or expired token" });
    }
  };
};
