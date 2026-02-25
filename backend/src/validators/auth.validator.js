// e:\Aquaflow\backend\src\validators\auth.validator.js



export const validateRegister = (req, res, next) => {
    const { email, password, name, address, phone } = req.body;
    if (!email || !password || !name || !address || !phone) {
        return res.status(400).json({ success: false, message: 'Please provide email, password, name, address, and phone number' });
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
    next();
};
