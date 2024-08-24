const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const jwt = require('jsonwebtoken');
const users = require('../models/users'); 
// const dotenv = require('dotenv')


require('dotenv').config();


passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "/api/google/callback",
    scope: ['profile', 'email'],
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      let user = await users.findOne({ email: profile.emails[0].value });
      
      if (!user) {
        // Create a new user if one doesn't exist
        user = await users.create({
        //   googleId: profile.id,
          email: profile.emails[0].value,
          fullName: profile.displayName,
          phone:null
        });
      } 
    //   else if (!user.googleId) {
    //     // Update the existing user with the googleId if it doesn't have one
    //     user.googleId = profile.id;
    //     await user.save();
    //   }

      if (!user.phone) {
        // Redirect to phone number input page
        return done(null, { user, needsPhoneNumber: true });
      }


      // Generate a JWT token
      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

      return done(null, { user, token });
    } catch (err) {
      return done(err, null);
    }
  }
));


// passport.use(new GoogleStrategy({
//     clientID: process.env.GOOGLE_CLIENT_ID,
//     clientSecret: process.env.GOOGLE_CLIENT_SECRET,
//     callbackURL: "/api/google/callback",
//     scope: ['profile', 'email'],
//   },
//   async (accessToken, refreshToken, profile, done) => {
//     try {
//       let user = await users.findOne({ googleId: profile.id });
//       if (!user) {
//         user = await users.create({
//           googleId: profile.id,
//           email: profile.emails[0].value,
//           fullName: profile.displayName,
//         });
//       }
//       const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
//       return done(null, { user, token });
//     } catch (err) {
//       return done(err, null);
//     }
//   }
// ));

// passport.serializeUser((user, done) => {
//   done(null, user.id);
// });

// passport.deserializeUser(async (id, done) => {
//   try {
//     const user = await users.findById({id});
//     done(null, user);
//   } catch (err) {
//     done(err, null);
//   }
// });
