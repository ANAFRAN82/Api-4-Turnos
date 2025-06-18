const TurnoService = require("../services/turnoServices");

const createTurno = async (req, res) => {
  try {
    const turno = await TurnoService.crearTurno(
      req.body,
      req.user.userId,
      req.headers.authorization?.split(" ")[1],
      req.io
    );
    res.status(201).json(turno);
  } catch (error) {
    res.status(400).json({ 
      error: error.message,
      code: error.code // Agregar código de error para mejor manejo en frontend
    });
  }
};

const cancelTurno = async (req, res) => {
  try {
    const turno = await TurnoService.cancelarTurno(
      req.params.id,
      req.user.userId,
      req.headers.authorization?.split(" ")[1],
      req.io
    );
    res.json(turno);
  } catch (error) {
    res.status(400).json({ 
      error: error.message,
      code: error.code
    });
  }
};

const listTurnos = async (req, res) => {
  try {
    const turnos = await TurnoService.listarTurnos(
      req.query,
      req.user.userId,
      req.headers.authorization?.split(" ")[1]
    );
    res.json(turnos);
  } catch (error) {
    res.status(400).json({ 
      error: error.message,
      code: error.code
    });
  }
};

const getAvailableTurnos = async (req, res) => {
  try {
    const { servicioId, fecha } = req.query;
    const horarios = await TurnoService.generarTurnosDisponibles(
      servicioId,
      fecha,
      req.headers.authorization?.split(" ")[1]
    );
    res.json(horarios);
  } catch (error) {
    res.status(400).json({ 
      error: error.message,
      code: error.code
    });
  }
};

module.exports = {
  createTurno,
  cancelTurno,
  listTurnos,
  getAvailableTurnos,
};