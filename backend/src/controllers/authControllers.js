import jwt from 'jsonwebtoken';
import User from '../models/user.js';

export const register = async (req, res) => {
  const { email, password } = req.body;

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already in use' });
    }

    const user = new User({ email, password });
    await user.save();

    // Generate JWT
    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Set as HTTP-Only Cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', 
      maxAge: 3600000 // 1 hour
    });

    res.status(201).json({ user });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

export const login = async (req, res) => {
    const {email, password} = req.body;

    try {
        const user = await User.findOne({ email });
        if(!user){
            return res.status(400).json({message: "Invalid credentials"});
        }

        //SAME METHOD DEFINED IN USER MODEL
        const isMatch = await user.comparePassword(password);
        if(!isMatch){
            return res.status(400).json({message: "Invalid credentials"});
        }

        const token = jwt.sign(
            {id: user._id, email: user.email},
            process.env.JWT_SECRET,
            { expiresIn: '1h'}
        );

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 3600000
        });

        res.status(200).json({user});
    } catch (error) {
        res.status(500).json({message: 'Server Error', error: error.message});
    }
}

export const logout = (req, res) => {
    //CLEAR THE COOKIE BY SETTING IT TO EXPIRE IMMEDIATELY
    res.cookie('token', '', { expires: new Date(0), httpOnly: true });
    res.status(200).json({message: 'Logged out successfully'});
}