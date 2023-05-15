const express = require("express");
const rotas = express.Router();
const usuarios = require("./Controladores/Usuario");
const transacoes = require("./Controladores/Transacao");
const categorias = require("./Controladores/categorias");

rotas.post("/usuario", usuarios.cadastrarUsuario);
rotas.post("/login", usuarios.logarUsuario);
rotas.get("/usuario", usuarios.detalharUsuario);
rotas.put("/usuario", usuarios.atualizarUsuario);

rotas.post("/transacao", transacoes.cadastrarTransacoes);
rotas.get("/transacao", transacoes.listarTransacoes);
rotas.put("/transacao/:id", transacoes.atualizarTransacoes);
rotas.get("/extrato/transacao", transacoes.extratoTransacoes);
rotas.get("/transacao/:id", transacoes.detalharTransacoes);
rotas.delete("/transacao/:id", transacoes.excluirTransacoes);


rotas.get("/categoria", categorias.listarCategorias);

module.exports = rotas;