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
    //Cuando io detecte una conexón en el frontend, se ejecutara el siguiente callback
    //socket es el socket del cliente
    io.on('connection', function(socket) {
        console.log('Un cliente se ha conectado: '+ socket.id);

        let cargarmensajes = Usuario.find({});
        //socket.emit("cargando_mensajes_anteriores", cargarmensajes);
        console.log("cargar mensajes", cargarmensajes);

        //Cuando un cliente nuevo se conecta le avisa a todos que se acaba de conectar
        //Esto se puede probar en la misma pc con dos exploradores distintos o con el mismo en ventana privada
        io.sockets.emit('broadcast',{ id: socket.id, mensaje: "Se conecto el cliente"});

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

