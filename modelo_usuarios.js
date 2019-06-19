const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const usuario_schema = new Schema({
    usuario: {
        type: String,
        required: true,
    },
    mensaje: {
        type: String
    }
});

const Usuario = mongoose.model("Usuario", usuario_schema);

module.exports = Usuario;