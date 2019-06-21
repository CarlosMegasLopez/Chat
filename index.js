//Instancia de express
const express = require('express');
//Instancia de servidor a partir de ejecutar express
const app = express();
//Para usar sockest debemos instanciar un servidor http o https, seguns ea el caso pasandole como parametro express
const server = require('http').Server(app);
//Instanciamos io que es el core del socket pasandole como parametro el servidor
const io = require('socket.io')(server);

//Instanciando modelo de usuarios
//Los modelos se instancian con la primera letra en mayusculas
const Usuario = require("./modelo_usuarios.js");


//Instancia de mongoose
const mongoose = require("mongoose");
//Mongoose utiliza promesas es necesario declararlo
mongoose.Promise = global.Promise;
//Servidor de mongoclient
const MongoClient = require('mongodb').MongoClient // Para usar conexiones al vuelo
//Ruta de nuestro servidor de base de datos
const dbURI = 'mongodb://localhost/chatconmongoDB';
const opciones_conexion = {
    poolSize: 2,
    reconnectTries: Number.MAX_VALUE,
    reconnectInterval: 1000,
    useNewUrlParser: true
};
mongoose.set('useFindAndModify', false);
//Intentar conectarnos con nuestro servidor de bases de datos
const connection = mongoose.connect(dbURI, opciones_conexion, function(err, db) {
    //Sí no es posible conectarse con la base de datos enviar un mensaje en la consola y detener el proceso
    if (err) {
        console.log('No se ha podido conectar al servidor: ', err.message);
    }
});

//Escuchando evento de conexión, cuando se alcanse la conexión con el servir ejecutar el callback
mongoose.connection.on('connected', function() {
    //Configuraciones iniciales del sistema
    console.log('Mongoose conectado ');

    var usuariosconectados = [];
    //Cuando io detecte una conexón en el frontend, se ejecutara el siguiente callback
    //socket es el socket del cliente
    io.on('connection', function(socket) {
        //clientesconectados.push(socket);

        console.log('Un cliente se ha conectado: '+ socket.id);

        // clientesconectados.push(cliente); 
        // cliente.on('disconnect', function() {
        //     clientesconectados.splice(clientesconectados.indexOf(cliente), 1);
        // });

        // socket.on('desconectado', function() {
        //     console.log('Un cliente se ha desconectado: '+ socket.id);
        //     var i = clientesconectados.indexOf(socket);
        //     clientesconectados.splice(i, 1);
        //  });

        socket.on("nuevo_usuario", (datos) => {
            console.log(datos);
           if (usuariosconectados.indexOf(datos) != -1 ){
            console.log("falso");
           } else {
                console.log("verdadero");
                socket.usuario = datos;
                usuariosconectados.push(socket.usuario);
                console.log("usuarios", usuariosconectados);
                //io.sockets.emit('broadcast',{ id: socket.usuario, mensaje: "Se conecto"});
                actualizarusuariosconectados();
           } 
        });

        socket.on("disconnect", (datos) => {
           if(!socket.usuario) return;
           usuariosconectados.splice(usuariosconectados.indexOf(socket.usuario), 1);
           actualizarusuariosconectados();
         });

         function actualizarusuariosconectados() {
            io.sockets.emit("usuarios", usuariosconectados);
        }

        let cargarmensajes = Usuario.find({}, function(err, resultados){
            if (!err){
                socket.emit("cargando_mensajes_anteriores", resultados);
                } else{throw err;}
             }
        );
    
        //Cuando un cliente nuevo se conecta le avisa a todos que se acaba de conectar
        //Esto se puede probar en la misma pc con dos exploradores distintos o con el mismo en ventana privada
        io.sockets.emit('broadcast',{ id: socket.id, mensaje: "Se conecto el cliente"});
        
        io.sockets.emit("usuarios", usuariosconectados);
        //io.sockets.emit('desconectado',{ id: socket.id, mensaje: "Se desconecto el cliente"});

        //Cuando el cliente se conecta el servidor le saluda
        socket.emit("el_server_saluda",`Hola soy el servidor que esta corriendo en el puerto 3000 y tú tienes el socket id: ${socket.id}`);

        //El servidor se queda a la espera del evento usuario_saludando
        //Cuando el cliente envie este evento por medio del socket se ejecutara el siguiente callback
        socket.on("usuario_saludando",function(nombre, mensaje){
            console.log("El cliente esta saludando");
            
            const saludo = nombre && mensaje ? `${nombre}: ${mensaje}` : `Hola persona sin nombre`;
            //El servidor le contesta al socket conectado, mediante la instruccion emit
            //socket.emit("servidor_responde_saludo",saludo);
            io.sockets.emit("servidor_responde_saludo",saludo);
           
            let nuevo_mensaje = new Usuario ({
                                            usuario: nombre,
                                            mensaje: mensaje                       
                                            });
            nuevo_mensaje.save().then(result =>{
                console.log(result.id);
                }).catch(function(err){
                    console.log("No se pudo guardar el valor en la base de datos");
                                        })
        });

    });

});

//URL de la aplicacion que devolvera un html, ejemplo http://localhost:3000/app
app.get("/", function(req, res){
    const IP = req.headers["x-forwarded-for"] || req.connection.remoteAddress;
    console.log(`Se esta haciendo una petición a la pagina de inicio desde: ${IP}`);
    res.sendFile(__dirname + '/index.html'); //__dirname directorio del proyecto
});

//El servidor esta escuchando en el puerto PUERTO
server.listen(3000, function() {
	console.log(`El servidor esta corriendo sobre el puerto: 3000`);
});

