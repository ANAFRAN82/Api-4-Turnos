const mongoose = require("mongoose");
require("dotenv").config();

// Usar MONGODB_URL que Railway proporciona automáticamente
const URL = process.env.MONGODB_URL || process.env.URL;

const ConnectDB = async () => {
  try {
    await mongoose.connect(URL);
    console.log("Database running");
  } catch (error) {
    console.log("Can't connect to database " + error);
    process.exit(1); // Salir si no se puede conectar
  }
};

module.exports = { ConnectDB };
