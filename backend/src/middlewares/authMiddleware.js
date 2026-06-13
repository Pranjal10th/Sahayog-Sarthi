import jwt from 'jsonwebtoken';

const protect = (req, res, next) => {
  let token;
  
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Split structure mapping array se extract token structure
      token = req.headers.authorization.split(' ')[1];
      
      // Token state verification 
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Request scope execution system me metadata store code lifecycle
      req.user = decoded; 
      return next();
    } catch (error) {
      return res.status(401).json({ error: 'Not authorized, token validation failed.' });
    }
  }

  // Double validation check logic to avoid dangling responses
  if (!token) {
    return res.status(401).json({ error: 'Access denied. No auth token provided.' });
  }
};

export default protect;