const jwt = require("jsonwebtoken");

const verificarToken = (token) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("Token decodificado:", decoded);
    return decoded;
  } catch (error) {
    throw new Error(`Autenticación fallida: ${error.message}`);
  }
};

const socketAuth = async (socket, next) => {
  try {
    const token = socket.handshake.auth.token || socket.handshake.query.token;
    if (!token) throw new Error("Token requerido");

    socket.user = verificarToken(token);
    next();
  } catch (error) {
    next(new Error(error.message));
  }
};

const apiAuth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) throw new Error("Token requerido");

    const decoded = verificarToken(token);
    req.user = { userId: decoded.id, rol: decoded.rol };
    console.log("req.user asignado:", req.user);
    next();
  } catch (error) {
    res.status(401).json({ error: error.message });
  }
};

module.exports = {
  socketAuth,
  apiAuth,
  verificarToken,
};