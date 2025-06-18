const Turno = require("../model/turnoModel");
const axios = require("axios");
const { verificarToken } = require("../middleware/authMiddleware");

class TurnoService {
  constructor() {
    this.apiServicios = process.env.API3SERVICES || "http://localhost:3008/api-3-services/services";
    this.apiUsuarios = process.env.API1USERS || "http://localhost:3006/api-1-user/users";
  }

  async validarServicio(servicioId, token) {
    try {
      const response = await axios.get(`${this.apiServicios}/${servicioId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    } catch (error) {
      throw new Error("Servicio no encontrado");
    }
  }

  async validarUsuario(usuarioId, token) {
    try {
      const response = await axios.get(`${this.apiUsuarios}/${usuarioId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.data) {
        throw new Error("Usuario no encontrado: respuesta vacía");
      }
      return response.data;
    } catch (error) {
      console.error("Error al validar usuario:", {
        usuarioId,
        url: `${this.apiUsuarios}/${usuarioId}`,
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });
      throw new Error(`Usuario no encontrado: ${error.message}`);
    }
  }

  async verificarDisponibilidad(servicioId, fecha, hora) {
    const turno = await Turno.findOne({
      servicio: servicioId,
      fecha: new Date(fecha),
      hora,
      estado: "reservado", // Solo verificamos contra turnos reservados
    });
    return !turno;
  }

  async crearTurno(data, userId, token, io) {
    try {
      const { servicio, fecha, hora, notas } = data;

      // Validar datos de entrada
      if (!servicio || !fecha || !hora) {
        throw new Error("Faltan campos requeridos: servicio, fecha, hora");
      }

      // Validar servicio y usuario
      await this.validarServicio(servicio, token);
      await this.validarUsuario(userId, token);

      // Verificar disponibilidad
      if (!(await this.verificarDisponibilidad(servicio, fecha, hora))) {
        throw new Error("El turno ya está reservado");
      }

      // Buscar si existe un turno disponible para reutilizar
      let turnoExistente = await Turno.findOne({
        servicio,
        fecha: new Date(fecha),
        hora,
        estado: "disponible"
      });

      let nuevoTurno;
      
      if (turnoExistente) {
        // Actualizar turno existente
        turnoExistente.estado = "reservado";
        turnoExistente.usuario = userId;
        turnoExistente.notas = notas || turnoExistente.notas;
        turnoExistente.metadata.ultimaModificacion = new Date();
        nuevoTurno = await turnoExistente.save();
      } else {
        // Crear nuevo turno
        nuevoTurno = await Turno.create({
          servicio,
          usuario: userId,
          fecha: new Date(fecha),
          hora,
          estado: "reservado",
          notas,
          metadata: {
            creadoPor: userId,
            tokenUsed: token,
          },
        });
      }

      // Emitir evento en tiempo real
      io.emit("turno:created", { ...nuevoTurno._doc, id: nuevoTurno._id });

      return nuevoTurno;
    } catch (error) {
      throw new Error(error.message);
    }
  }

  async cancelarTurno(turnoId, userId, token, io) {
    try {
      const turno = await Turno.findById(turnoId);
      if (!turno) throw new Error("Turno no encontrado");

      // Verificar si el usuario es el dueño del turno
      if (turno.usuario !== userId) {
        throw new Error("No autorizado para cancelar este turno");
      }

      // Cambiar estado a disponible en lugar de cancelado
      const updatedTurno = await Turno.findByIdAndUpdate(
        turnoId,
        {
          estado: "disponible",
          $set: {
            "metadata.ultimaModificacion": new Date(),
          },
          $unset: {
            usuario: 1,
            notas: 1
          }
        },
        { new: true }
      );

      // Emitir evento en tiempo real
      io.emit("turno:updated", { ...updatedTurno._doc, id: updatedTurno._id });

      return updatedTurno;
    } catch (error) {
      throw new Error(error.message);
    }
  }

  async listarTurnos(filtros = {}, userId, token) {
    try {
      // Solo mostrar los turnos del usuario autenticado
      filtros.usuario = userId;
      filtros.estado = "reservado"; // Solo mostrar turnos reservados

      const turnos = await Turno.find(filtros).sort({ fecha: 1, hora: 1 });

      // Enriquecer con datos de las APIs externas
      const enrichedTurnos = await Promise.all(
        turnos.map(async (turno) => {
          const [servicio, usuario] = await Promise.all([
            this.validarServicio(turno.servicio, token),
            this.validarUsuario(turno.usuario, token),
          ]);
          return {
            ...turno._doc,
            id: turno._id,
            servicio: { nombre: servicio.nombre, duracion: servicio.duracion },
            usuario: { nombre: usuario.nombre, email: usuario.email },
          };
        })
      );

      return enrichedTurnos;
    } catch (error) {
      throw new Error(error.message);
    }
  }

  async generarTurnosDisponibles(servicioId, fecha, token) {
    try {
      // Validar servicio
      await this.validarServicio(servicioId, token);

      const fechaObj = new Date(fecha);
      if (isNaN(fechaObj.getTime())) throw new Error("Fecha inválida");

      // Obtener solo turnos reservados para esa fecha
      const turnosReservados = await Turno.find({
        servicio: servicioId,
        fecha: fechaObj,
        estado: "reservado"
      });

      // Generar todos los posibles horarios
      const todosLosHorarios = [];
      for (let hora = 8; hora < 20; hora++) {
        for (let minuto = 0; minuto < 60; minuto += 30) {
          todosLosHorarios.push(`${hora.toString().padStart(2, "0")}:${minuto.toString().padStart(2, "0")}`);
        }
      }

      // Filtrar horarios ocupados
      const horariosDisponibles = todosLosHorarios.filter(hora => {
        return !turnosReservados.some(turno => turno.hora === hora);
      });

      return horariosDisponibles;
    } catch (error) {
      throw new Error(error.message);
    }
  }
}

module.exports = new TurnoService();