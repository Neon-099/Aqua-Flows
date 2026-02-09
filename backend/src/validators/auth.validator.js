// e:\Aquaflow\backend\src\validators\auth.validator.js



export const validateRegister = (req, res, next) => {
    const { email, password, name, address, phone } = req.body;
    if (!email || !password || !name || !address || !phone) {
        return res.status(400).json({ success: false, message: 'Please provide email, password, name, address, and phone number' });
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
