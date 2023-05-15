const conexao = require("../conexao")
const securePassword = require('secure-password')
const jwt = require("jsonwebtoken")
const jwtSecret = require("../jwt.secret");
const pwd = securePassword()

const cadastrarUsuario = async (req, res) => {
    const { nome, email, senha } = req.body;
    //Verificação se todos dados foram preenchidos
    if (!nome || !email || !senha)
        return res.status(400).json({ "Message": "Dados insuficientes para realizar o cadastro do usuário favor revisar" });

    //Verificação se já existe email no BD
    const usuarios = await conexao.query('SELECT email FROM usuarios WHERE email = $1', [email])
    if (usuarios.rowCount > 0)
        return res.status(400).json({ "Mensagem": "Email já cadastrado" })
    //Cripografia da senha
    try {
        const hash = (await pwd.hash(Buffer.from(senha))).toString("hex")
        const usuarios = await conexao.query('INSERT INTO usuarios (email, nome, senha) VALUES ($1, $2, $3)', [email, nome, hash])

        const usuarioCadastrado = await conexao.query('SELECT id, nome, email FROM usuarios WHERE email = $1', [email])

        return res.status(201).json(usuarioCadastrado.rows[0])

    } catch (error) {
        res.status(400).json(error.message)
    }
}
const logarUsuario = async (req, res) => {
    let { email, senha } = req.body
    if (!email || !senha)
        return res.status(400).json({ "Message": "Preencha o usuário e senha" });
    //Validação se o email existe no BD
    let usuarios = await conexao.query('SELECT * FROM usuarios WHERE email = $1', [email])
    if (usuarios.rowCount == 0)
        return res.status(400).json({ "Mensagem": "Email ou senha inválidos" })

    const usuario = usuarios.rows[0]
    try {
        const result = await pwd.verify(Buffer.from(senha), Buffer.from(usuario.senha, "hex"))

        switch (result) {
            case securePassword.INVALID_UNRECOGNIZED_HASH:
            case securePassword.INVALID:
                return res.status(400).json({ "Mensagem": "Email ou senha inválidos" })
            case securePassword.VALID:
                break;
            case securePassword.VALID_NEEDS_REHASH:
                try {
                    const hash = (await pwd.hash(Buffer.from(senha))).toString("hex")
                    const cadastro = await conexao.query('UPDATE usuarios SET senha = $1 WHERE email = $2', [hash, email])
                } catch (error) {
                    res.json(error.message)
                }
        }
    } catch{}
    const token = jwt.sign({
        nome: usuario.nome,
        email: usuario.email,
        id: usuario.id
    }, jwtSecret, {
        expiresIn: "1h"
    })

    // REFATORAR
    const usuarioSemSenha = {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email
    }

    return res.json({
        usuario: usuarioSemSenha,
        token
    })
}
const detalharUsuario = (req, res) => {
    const { authorization } = req.headers
    let token = authorization.replace('Bearer ', "").trim()
    try {
        const usuario = jwt.verify(token, jwtSecret)
        const {id, nome, email} = usuario
        res.json({
            id,
            nome,
            email
        })
    } catch {
        return res.status(401).json({ "Mensagem": "Token inválido, favor revisar e tentar novamente" })
    }
}

const atualizarUsuario = async (req, res) => {
    const { authorization } = req.headers
    let usuario
    let token = authorization.replace('Bearer ', "").trim();
    try {
        usuario = jwt.verify(token, jwtSecret)
    } catch {
        return res.status(401).json({ "Mensagem": "Token inválido, favor revisar e tentar novamente" })
    }
    const { nome, email, senha } = req.body;
    if (!nome || !email || !senha)
        return res.status(400).json({ "Mensagem": "Dados insuficientes para realizar atualização" })

    const usuarios = await conexao.query('SELECT * FROM usuarios WHERE email = $1', [email])
    if (usuarios.rowCount > 0)
        return res.status(400).json({ "Mensagem": "Email já existente" })

    const hash = (await pwd.hash(Buffer.from(senha))).toString("hex")
    const usuarioAtualizado = await conexao.query('UPDATE usuarios SET nome = $1, email = $2, senha = $3 WHERE id = $4', [nome, email, hash, usuario.id])
    return res.status(204).json()
}



module.exports = {
    cadastrarUsuario,
    logarUsuario,
    detalharUsuario,
    atualizarUsuario
}

