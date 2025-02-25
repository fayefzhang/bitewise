import express, { Application, Request, Response } from 'express';
import axios from 'axios';
import routes from './routes/APIRoutes';
import cors from "cors";
import { connectDB } from './config/db';

const app: Application = express();
const PORT = process.env.PORT || 3000;

connectDB();

// increase body size limit to prevent "PayloadTooLargeError"
app.use(express.json({ limit: "100mb" })); 
app.use(express.urlencoded({ limit: "100mb", extended: true }));

app.use(
	cors({
		origin: "http://localhost:3001",
		credentials: true,
	})
);

app.use("/api", routes);

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});