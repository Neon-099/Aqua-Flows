import express from 'express';
import cookieParser from 'cookie-parser';
import authRoutes from './routes/authRoutes.js';

const app = express();

//STANDARD MIDDLEWARES
app.use(express.json());    //PARSES INCOMING JSON
app.use(cookieParser());  //TO ALLOWS US TO READ req.cookies

//ROUTES
app.use('/api/auth', authRoutes);

//404 HANDLER
app.use((req, res) => {
    res.status(404).json({message: 'Routes not found'});
});

export default app;