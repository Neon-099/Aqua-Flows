// e:\Aquaflow\backend\src\validators\auth.validator.js



export const validateRegister = (req, res, next) => {
    const { email, password, name, address, phone } = req.body;
    if (!email || !password || !name || !address || !phone) {
        return res.status(400).json({ success: false, message: 'Please provide email, password, name, address, and phone number' });
    }
    const normalizedEmail = String(email).trim();
    const normalizedName = String(name).trim();
    if (normalizedName.length < 6 || normalizedName.length > 30) {
        return res.status(400).json({
            success: false,
            message: 'Name must be between 6 and 30 characters',
        });
    }
    if (normalizedEmail.length < 6 || normalizedEmail.length > 30) {
        return res.status(400).json({
            success: false,
            message: 'Email must be between 6 and 30 characters',
        });
    }
    const strongPassword = /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
    if (!strongPassword.test(password)) {
        return res.status(400).json({
            success: false,
            message: 'Password must be at least 8 characters with 1 uppercase, 1 number, and 1 special character',
        });
    }
    if (!/^\d{11}$/.test(String(phone))) {
        return res.status(400).json({
            success: false,
            message: 'Phone number must be exactly 11 digits',
        });
    }
    next();
};

export const validateLogin = (req, res, next) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }
    const normalizedEmail = String(email).trim();
    if (normalizedEmail.length < 6 || normalizedEmail.length > 30) {
        return res.status(400).json({ success: false, message: 'Email must be between 6 and 30 characters' });
    }
    if(password.length < 8 ){
        return res.status(400).json({ success: false, message: 'Password must be at least 8 characters' });
    }

    next();
};
