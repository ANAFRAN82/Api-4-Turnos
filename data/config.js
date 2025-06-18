// Dependencia de mongoose 
const mongoose = require("mongoose");
// Dependencia para el archivo .env
require("dotenv").config();

// Extraer en una url lo que contiene el .env
const URL = process.env.URL;

// Conexion a la base de datos 
const ConnectDB = async () => {
try{
    await mongoose.connect(URL);
    // Mensaje de que la base de datos funciona correctamente
    console.log("Database running");
}catch(error){
    // Mensaje de error si la conexion falla
    console.log("Cant connecto to database "+ error);
}  
}
// Exportacion del modulo
module.exports = {ConnectDB};