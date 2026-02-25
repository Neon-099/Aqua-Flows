
import User from '../models/User.model.js';
import Customer from '../models/Customer.model.js';


export const updateProfile = async (req, res, next) => {
  try {
    //QUERY STRUCTURE 
    const { name, email, phone, address, currentPassword, newPassword, confirmPassword } = req.body || {};

    
    if (!name && !email && !phone && !address  && !newPassword) {
      return res.status(400).json({ success: false, message: 'No profile updates provided' });
    }

    let user = null;

    //PASSWORD VALIDATION 
    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({ success: false, message: 'Current password is required' });
      }
      if (!confirmPassword || newPassword !== confirmPassword) {
        return res.status(400).json({ success: false, message: 'Passwords do not match' });
      }
      if (String(newPassword).length < 6) {
        return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
      }

      user = await User.findById(req.user._id).select('+password');
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      const isMatch = await user.matchPassword(currentPassword);
      if (!isMatch) {
        return res.status(401).json({ success: false, message: 'Current password is incorrect' });
      }
      user.password = newPassword;
    } else {
      user = await User.findById(req.user._id);
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }
    }

    if (name) user.name = name;
    if (email) user.email = email;
    if (phone) user.phone = phone;
    if (address) user.address = address;

    await user.save();

    //DB QUERY STRUCTURE
    if (address) {
      await Customer.findOneAndUpdate(
        { user_id: user._id },
        { default_address: address },
        { upsert: true }
      );
    }

    //RESPONSE STRUCTURE (API RESPONSE FORMAT)
    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        address: user.address,
        phone: user.phone,
        role: user.role,
        createdAt: user.createdAt,
        created_at: user.created_at,
      },
    });
  } catch (error) {
    next(error);
  }
};