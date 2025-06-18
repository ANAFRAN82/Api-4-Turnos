// 📁 model/turnoModel.js
const mongoose = require("mongoose");

const TurnoSchema = new mongoose.Schema({
  serviceId: { type: String, required: true },
  userId: { type: String, required: true },
  fecha: { type: Date, required: true },
  hora: {
    type: String,
    required: true,
    match: /^([01]\d|2[0-3]):([0-5]\d)$/ // Formato HH:mm
  },
  estado: {
    type: String,
    enum: ["disponible", "reservado", "cancelado"],
    default: "disponible"
  }
}, { timestamps: true });

module.exports = mongoose.model("Turno", TurnoSchema);


// 📁 services/turnoServices.js
const Turno = require("../model/turnoModel");
const axios = require("axios");

const CreateTurno = async (data) => {
  try {
    // Verificar existencia del servicio
    const service = await axios.get(`http://localhost:3008/api-3-services/services/${data.serviceId}`);

    // Verificar existencia del usuario
    const user = await axios.get(`http://localhost:3001/api-1-usuarios/users/${data.userId}`);

    if (!service.data || !user.data) throw new Error("Usuario o servicio no encontrado");

    const newTurno = new Turno(data);
    await newTurno.save();
    return newTurno;
  } catch (error) {
    throw new Error("Error al crear el turno: " + error.message);
  }
};

const GetAllTurnos = async () => {
  try {
    return await Turno.find();
  } catch (error) {
    throw new Error("Error al obtener los turnos: " + error.message);
  }
};

const GetTurnoById = async (turnoId) => {
  try {
    const turno = await Turno.findById(turnoId);
    if (!turno) throw new Error("El turno no existe");
    return turno;
  } catch (error) {
    throw new Error("Error al obtener el turno: " + error.message);
  }
};

const UpdateTurno = async (turnoId, data) => {
  try {
    const turnoActualizado = await Turno.findByIdAndUpdate(turnoId, data, { new: true });
    if (!turnoActualizado) throw new Error("El turno no existe");
    return turnoActualizado;
  } catch (error) {
    throw new Error("Error al actualizar el turno: " + error.message);
  }
};

const DeleteTurno = async (turnoId) => {
  try {
    const eliminado = await Turno.findByIdAndDelete(turnoId);
    if (!eliminado) throw new Error("El turno no existe");
    return eliminado;
  } catch (error) {
    throw new Error("Error al eliminar el turno: " + error.message);
  }
};

module.exports = { CreateTurno, GetAllTurnos, GetTurnoById, UpdateTurno, DeleteTurno };


// 📁 controller/turnoController.js
const { CreateTurno, GetAllTurnos, GetTurnoById, UpdateTurno, DeleteTurno } = require("../services/turnoServices");

const createTurno = async (req, res) => {
  try {
    const turno = await CreateTurno(req.body);
    res.status(201).json(turno);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getAllTurnos = async (req, res) => {
  try {
    const turnos = await GetAllTurnos();
    res.json(turnos);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getTurnoById = async (req, res) => {
  try {
    const turno = await GetTurnoById(req.params.id);
    res.json(turno);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

const updateTurno = async (req, res) => {
  try {
    const turno = await UpdateTurno(req.params.id, req.body);
    res.json(turno);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteTurno = async (req, res) => {
  try {
    const eliminado = await DeleteTurno(req.params.id);
    res.json(eliminado);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createTurno, getAllTurnos, getTurnoById, updateTurno, deleteTurno };


// 📁 routes/turnoRoutes.js
const express = require("express");
const router = express.Router();
const { createTurno, getAllTurnos, getTurnoById, updateTurno, deleteTurno } = require("../controller/turnoController");

router.post("/turnos", createTurno);
router.get("/turnos", getAllTurnos);
router.get("/turnos/:id", getTurnoById);
router.put("/turnos/:id", updateTurno);
router.delete("/turnos/:id", deleteTurno);

module.exports = router;


// 📁 index.js (o app.js)
const express = require("express");
const mongoose = require("mongoose");
const turnoRoutes = require("./routes/turnoRoutes");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());
app.use("/api-4-turnos", turnoRoutes);

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log("Database connected");
  app.listen(3010, () => console.log("Turnos API on http://localhost:3010"));
}).catch(err => console.error("Error DB: ", err));
