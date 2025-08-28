import express, { Request, Response } from "express";
import { prisma } from "../db";
import bcrypt from "bcrypt";
import { JWT_Payload } from "../../type";
import jwt from "jsonwebtoken";
export const router = express.Router();

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

//upload route



//delete route
//get route for images of particular category ?
