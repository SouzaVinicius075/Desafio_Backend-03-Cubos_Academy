const conexao = require("../conexao")
const securePassword = require('secure-password')
const jwt = require("jsonwebtoken")
const jwtSecret = require("../jwt.secret");
const pwd = securePassword()

const listarCategorias = async (req, res) => {
    const { authorization } = req.headers
    let usuario
    let token = authorization.replace('Bearer ', "").trim();
    try {
        usuario = jwt.verify(token, jwtSecret)
    } catch (error) {
        return res.status(400).json(error.message);
    }

    const categorias = await conexao.query('SELECT id, descricao FROM categorias');
    const resultado = categorias.rows;
    res.status(200).json(resultado);
}

module.exports = {
    listarCategorias
}