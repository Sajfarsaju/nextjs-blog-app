const jwt = require('jsonwebtoken')
const User = require('../models/userModel')

module.exports = {
    generateToken: (id) => {
        const token = jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '1h' });
        return token;
      },
    
      verifyTokenUser: async (req, res, next) => {
        try {
          console.log("verifying..");
          
          let token = req.headers['authorization'];
          console.log("token;",token);
          
          if (!token || !token.startsWith('Bearer ')) {
            return res.status(403).json({ jwtErrMsg: 'Access Denied' });
          }
    
          token = token.slice(7).trim();
          const verified = jwt.verify(token, process.env.JWT_SECRET);
          req.payload = verified;
          
          next();
        } catch (error) {
          console.error(error);
    
          if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ jwtErrMsg: 'Unauthorized access' });
          } else if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ jwtErrMsg: 'Session expired. Please log in again.' });
          } else {
            return res.status(500).json({ jwtErrMsg: 'Server error' });
          }
        }
      }
}