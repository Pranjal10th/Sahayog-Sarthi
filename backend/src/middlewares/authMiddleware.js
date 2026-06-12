import jwt from 'jsonwebtoken';

const protect = (req, res, next) => {
  let token;
  
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Request object me payload attach kar do
      req.user = decoded; 
      next();
    } catch (error) {
      return res.status(401).json({ error: 'Not authorized, token validation failed.' });
    }
  }

  if (!token) {
    return res.status(401).json({ error: 'Access denied. No auth token provided.' });
  }
};

export default protect;