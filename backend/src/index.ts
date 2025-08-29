import express from "express";
import cors from "cors";
const app = express();
const path = require('path');
require('dotenv').config({
  path: path.resolve(__dirname, '../../.env')
});
const PORT = process.env.PORT || 3000;
const allowedOrigins = ['http://localhost:5173']

const corsOptions = {
    origin: function (origin:any, callback:any) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  }
};

app.use(cors(corsOptions))
app.use(express.json());
import {router as adminRoutes} from "./routes/admin";
app.use('/api/v1', adminRoutes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});