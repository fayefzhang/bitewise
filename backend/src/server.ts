import express, { Application, Request, Response } from 'express';
import axios from 'axios';
import routes from './routes/APIRoutes';
import cors from "cors";
import { connectDB } from './config/db';



const app: Application = express();
const PORT = process.env.PORT || 3000;

connectDB();

app.use(
	cors({
		origin: "http://localhost:3001",
		credentials: true,
	})
);
app.use(express.json());
app.use("/api", routes);


app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});