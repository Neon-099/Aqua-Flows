import jwt from 'jsonwebtoken';

const requireAuth = (req, res, next) => {
  const token = req.cookies.token;

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.currentUser = payload;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Not authorized, invalid token' });
  }
};

export default requireAuth;