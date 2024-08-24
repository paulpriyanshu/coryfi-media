const express = require('express')
const users = require('../models/users')
const nodemailer = require('nodemailer');
const passport = require('passport')
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const dotenv = require('dotenv');
const connectToRedis = require('../config/redisconnection');
const auth = require('../middleware/auth')


dotenv.config();

const router = express.Router()


// router.post(
//     '/register',
//     [
//       body('username')
//         .notEmpty().withMessage('Username is required')
//         .isLength({ min: 3 }).withMessage('Username must be at least 3 characters long'),
//       body('email')
//         .isEmail().withMessage('Email is invalid')
//         .normalizeEmail(),
//       body('password')
//         .isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
//     ],
//     async (req, res) => {
//       const errors = validationResult(req);
//       if (!errors.isEmpty()) {
//         return res.status(400).json({ errors: errors.array() });
//       }

//       const { username, email, password } = req.body;

//       try {

//         const userExists = await users.findOne({email});
//         console.log(userExists)
//         if (userExists) {
//           return res.status(400).json({ message: 'Email already exists' });
//         }

//         const salt = await bcrypt.genSalt(10);
//         const hashedPassword = await bcrypt.hash(password, salt);

//         const user = await users.create({ username, email, password: hashedPassword });

//         res.status(201).json({ message: 'User created', user });
//       } catch (error) {
//         console.error(error);
//         res.status(500).json({ message: 'Server error' });
//       }
//     }
//   );


router.post('/login-with-phone', async (req, res) => {

    const { phone } = req.body;

    try {
        let user = await users.findOne({ phone });

        if (user) {
            const mailid = user.email
            const otp = crypto.randomBytes(3).toString('hex');
            console.log(otp);
            user.otp.code = otpCode.toString();
            user.otp.createdAt = new Date();
            user.otp.attempts = 0;

            const transporter = nodemailer.createTransport({
                service: 'Gmail',
                auth: {
                    user: process.env.EMAIL_USERNAME,
                    pass: process.env.EMAIL_PASSWORD,
                },
            });

            const mailOptions = {
                from: process.env.EMAIL_USERNAME,
                to: mailid,
                subject: 'Your OTP Code',
                text: `Your OTP code is: ${otp}`,
            };

            transporter.sendMail(mailOptions);

            return res.json({ message: 'OTP sent. Please verify your OTP.', userId: user._id });

        }


        return res.redirect(`/phone-number?userId=${user._id}&token=${token}`);

        // user = new users({
        //     phone, email, fullName
        // });
        // await user.save();
        // const otp = crypto.randomBytes(3).toString('hex');
        // console.log(otp);
        // await client.setEx(user._id.toString(), 300, otp);

        // const transporter = nodemailer.createTransport({
        //     service: 'Gmail',
        //     auth: {
        //         user: process.env.EMAIL_USERNAME,
        //         pass: process.env.EMAIL_PASSWORD,
        //     },
        // });

        // const mailOptions = {
        //     from: process.env.EMAIL_USERNAME,
        //     to: user.email,
        //     subject: 'Your OTP Code',
        //     text: `Your OTP code is: ${otp}`,
        // };

        // await transporter.sendMail(mailOptions);

        // res.json({ message: 'OTP sent. Please verify your OTP.', userId: user._id });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    } finally {
        client.disconnect();
    }
});

router.post('/verify-otp', async (req, res) => {
    const { userId, otp } = req.body;
    console.log(req.body)
    try {
        
        const user = await user.findById(userId);

        if (!user) {
            return { success: false, message: 'User not found' };
        }

        const oneMinute = 60 * 1000; 
        const otpCreationTime = user.otp.createdAt;
        if (!otpCreationTime || new Date() - otpCreationTime > oneMinute) {
            return { success: false, message: 'OTP has expired' };
        }

        if (user.otp.attempts >= 5) {
            return { success: false, message: 'Max OTP attempts exceeded' };
        }

        if (user.otp.code !== otp) {
            user.otp.attempts += 1; // Increment attempts on failure
            await user.save();
            return { success: false, message: 'Invalid OTP' };
        }

        user.otp = {}; 
        await user.save();
        const token = jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '1h' });
        
        res.header('Authorization', token).json({ message: 'Logged in', token });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

router.get('/google',
    passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get('/google/callback',
    passport.authenticate('google', { session: false }),
    (req, res) => {
        //  JWT was passed in req.user.token
        const { user, token } = req.user;
        if (!user.phone) {
            return res.redirect(`/phone-number?userId=${user._id}&token=${token}`);
        }

        res.json({ token });
    }
);

router.post('/phone-number', async (req, res) => {
    const { userId, phone, email, fullName ,gender} = req.body;

    try {
        let user = await users.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (phone) {
            user.phone = phone;
        }

        if (email) {
            user.email = email;
        }

        if (fullName) {
            user.fullName = fullName;
        }
        if(gender){
            user.gender = gender;
        }

        await user.save();

        const mailid = user.email
        const otp = crypto.randomBytes(3).toString('hex');
        console.log(otp);
        user.otp.code = otpCode.toString();
        user.otp.createdAt = new Date();
        user.otp.attempts = 0;

        const transporter = nodemailer.createTransport({
            service: 'Gmail',
            auth: {
                user: process.env.EMAIL_USERNAME,
                pass: process.env.EMAIL_PASSWORD,
            },
        });

        const mailOptions = {
            from: process.env.EMAIL_USERNAME,
            to: mailid,
            subject: 'Your OTP Code',
            text: `Your OTP code is: ${otp}`,
        };

        transporter.sendMail(mailOptions);

        return res.json({ message: 'OTP sent. Please verify your OTP.', userId: user._id });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});


// router.post('/forgotPassword', async (req, res) => {
//     try {
//       const user = await users.findOne({ email: req.body.email });
//       if (!user) {
//         return res.status(404).json({ status: 'fail', message: 'There is no user with that email address.' });
//       }

//       const resetToken = crypto.randomBytes(32).toString('hex');
//       user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
//       user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes
//       await users.save({ validateBeforeSave: false });

//       const resetURL = `${req.protocol}://${req.get('host')}/api/resetPassword/${resetToken}`;
//       const message = `Forgot your password? Submit a PATCH request with your new password and passwordConfirm to: ${resetURL}\nIf you didn't forget your password, please ignore this email!`;

//       try {
//         await sendEmail({
//           email: user.email,
//           subject: 'Your password reset token (valid for 10 min)',
//           message,
//         });

//         res.status(200).json({ status: 'success', message: 'Token sent to email!' });
//       } catch (err) {
//         user.resetPasswordToken = undefined;
//         user.resetPasswordExpire = undefined;
//         await user.save({ validateBeforeSave: false });

//         return res.status(500).json({ status: 'fail', message: 'There was an error sending the email. Try again later!' });
//       }
//     } catch (err) {
//       res.status(500).json({ status: 'error', message: err.message });
//     }
//   });

// router.post('/resetPassword/:token', async (req, res) => {
//     try {
//       const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

//       const user = await users.findOne({
//         resetPasswordToken: hashedToken,
//         resetPasswordExpires: { $gt: Date.now() },
//       });

//       if (!user) {
//         return res.status(400).json({ status: 'fail', message: 'Token is invalid or has expired' });
//       }

//       user.password = req.body.password;
//       user.resetPasswordToken = undefined;
//       user.resetPasswordExpire = undefined;
//       await user.save();
//       const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });
//       res.header('Authorization', token).json({ message: 'Logged in', token });

//     } catch (err) {
//       res.status(500).json({ status: 'error', message: err.message });
//     }
//   });


router.post('/update-Profile', auth, async (req, res) => {
    const { username, email ,phone,gender} = req.body;
    try {
        const user = await users.findById(req.user.id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Update fields if provided
        if (username) user.username = username;
        if (email) user.email = email;
        if (phone) user.phone = phone;
        if (gender) user.gender = gender;

        await user.save();

        res.status(200).json({ message: 'Profile updated successfully', user });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete user account
router.post('/deleteAccount', auth, async (req, res) => {
    try {
        const user = await users.findByIdAndDelete(req.user.id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json({ message: 'Account deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get user profile
router.post('/profile', auth, async (req, res) => {
    try {
        const user = await users.findById(req.user.id)

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json({ message: 'Profile retrieved successfully', user });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});


// router.post('/changePassword', auth, async (req, res) => {
//     const { currentPassword, newPassword } = req.body;

//     try {
//       const user = await users.findById(req.user.id);

//       if (!user) {
//         return res.status(404).json({ message: 'User not found' });
//       }

//       const validPass = await bcrypt.compare(currentPassword, user.password);
//       if (!validPass) {
//         return res.status(400).json({ message: 'Invalid current password' });
//       }

//       const salt = await bcrypt.genSalt(10);
//       user.password = await bcrypt.hash(newPassword, salt);

//       await user.save();

//       res.status(200).json({ message: 'Password changed successfully' });
//     } catch (error) {
//       console.error(error);
//       res.status(500).json({ message: 'Server error' });
//     }
//   });


router.post('/getallusers', auth, async (req, res) => {
    try {
        const allUsers = await users.find()
        res.status(200).json(allUsers);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});


// router.post('/logout', auth, async (req, res) => {
//     try {
        
//         const token = req.header('Authorization');

//         if (!token) {
//             return res.status(401).json({ message: 'No token provided' });
//         }

//         const decodedToken = jwt.decode(token);
//         // JWT expiration is in seconds, convert to milliseconds
//         const expiry = decodedToken.exp * 1000;

//         const ttl = expiry - Date.now();
//         // TTL in seconds
//         await client.setEx(token, Math.floor(ttl / 1000), 'blacklisted');

//         await client.disconnect();

//         res.status(200).json({ message: 'Logged out successfully' });
//     } catch (error) {
//         console.error('Logout error:', error);
//         res.status(500).json({ message: 'Server error' });
//     }
// });

router.post('/add-address',async(req,res)=>{
    try{
          
    }catch(error){

    }
})

module.exports = router;  