const { io } = require('../server');
const { crearMensaje } = require('../utils/utilidades');
const { Usuarios } = require('../classes/usuarios');

const usuarios = new Usuarios();

io.on('connection', client => {
    client.on('entrarChat', (data, callback) => {
        if (!data.nombre || !data.sala) {
            return callback({
                error: true,
                mensaje: 'El nombre y sala es necesario'
            });
        }

        client.join(data.sala);

        usuarios.agregarPersona(client.id, data.nombre, data.sala);

        client.broadcast
            .to(data.sala)
            .emit('listaPersonas', usuarios.getPersonasPorSala(data.sala));

        client.broadcast
            .to(data.sala)
            .emit(
                'crearMensaje',
                crearMensaje(
                    'Administrador',
                    `${data.nombre} ingreso el chat`
                )
            );

        callback(usuarios.getPersonasPorSala(data.sala));
    });

    client.on('crearMensaje', (data, callback) => {
        let persona = usuarios.getPersona(client.id);

        let mensaje = crearMensaje(persona.nombre, data.mensaje);

        client.broadcast.to(persona.sala).emit('crearMensaje', mensaje);

        callback(mensaje)
    });

    // mensajes Privados
    client.on('mensajePrivado', data => {
        if (!data.para) {
            return callback({
                error: true,
                mensaje: 'El id del usuario es necesario'
            });
        }

        let persona = usuarios.getPersona(client.id);
        client.broadcast
            .to(data.para)
            .emit('crearMensaje', crearMensaje(persona.nombre, data.mensaje));
    });

    client.on('disconnect', () => {
        let personaBorrada = usuarios.borrarPersona(client.id);

        client.broadcast
            .to(personaBorrada.sala)
            .emit(
                'crearMensaje',
                crearMensaje(
                    'Administrador',
                    `${personaBorrada.nombre} abondono el chat`
                )
            );

        client.broadcast
            .to(personaBorrada.sala)
            .emit(
                'listaPersonas',
                usuarios.getPersonasPorSala(personaBorrada.sala)
            );
    });
});