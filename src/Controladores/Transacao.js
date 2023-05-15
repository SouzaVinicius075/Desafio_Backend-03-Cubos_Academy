const conexao = require("../conexao")
const securePassword = require('secure-password')
const jwt = require("jsonwebtoken")
const jwtSecret = require("../jwt.secret")
const res = require("express/lib/response")
const pwd = securePassword()

const cadastrarTransacoes = async (req, res) => {
    const { descricao, valor, data, categoria_id, tipo } = req.body
    const { authorization } = req.headers
    let token = authorization.replace('Bearer ', "").trim()

    if (!descricao || !valor || !data || !categoria_id || !tipo) {
        return res.status(400).json({ "Mensagem": "Todos os campos obrigatórios devem ser informados" })
    };

    try {
        const usuario = jwt.verify(token, jwtSecret)
        const cadastrarTransacao = await conexao.query('INSERT INTO transacoes (descricao, valor, data, categoria_id, usuario_id, tipo) values ($1,$2,$3,$4,$5,$6)', [descricao, valor, data, categoria_id, usuario.id, tipo])
        const resultado = await conexao.query('SELECT transacoes.id, tipo, transacoes.descricao, valor,data, usuario_id,categorias.id as categorias_id, categorias.descricao as categoria_nome FROM transacoes JOIN categorias ON transacoes.categoria_id = categorias.id ORDER BY id DESC')
        return res.status(201).json(resultado.rows[0])
    } catch {
        return res.status(400).json({ "Mensagem": "Token inválido" })
    }
}


const listarTransacoes = async (req, res) => {
    const { authorization } = req.headers
    let usuario
    let token = authorization.replace('Bearer ', "").trim();
    try {
        usuario = jwt.verify(token, jwtSecret)
    } catch (error) {
        return res.status(400).json(error.message);
    }
    const filtro = req.query.filtro
    if (typeof filtro == 'string')
        return res.status(400).json()
    if (filtro) {

        let transacaoFiltrada = []
        // Explicação desse rolé todo aqui !!!!
        // se eu fizer só um transaçaoFiltrada.push(transacao.rows) ele recebe um monte de array tipo [[[{"Valores"}]]] e o github pedia um unico array tipo [{Valores}] com os objetos, ai foi essa solução q meu cerebro de pombo achou, mas ta pendente a refatoração a aqui
        for (let index = 0; index < filtro.length; index++) {
            try {
                const transacoes = await conexao.query('SELECT transacoes.id, tipo, transacoes.descricao, valor, data, usuario_id, categorias.id AS categorias_id, categorias.descricao AS categoria_nome FROM transacoes JOIN categorias on transacoes.categoria_id = categorias.id  WHERE categorias.descricao = $1 AND transacoes.usuario_id = $2', [filtro[index], usuario.id]);

                let resultado = transacoes.rows
                for (let i = 0; i < resultado.length; i++) {
                    transacaoFiltrada.push(resultado[i])
                }
            }
            catch (error) {
                res.json(error.message)
            }
        }
        if (transacaoFiltrada.length == 0)
            return res.status(400).json({ "Mensagem": "Categoria Inexistente" });
        return res.status(200).json(transacaoFiltrada)
    }

    const transacoes = await conexao.query('SELECT transacoes.id, tipo, transacoes.descricao, valor, data, usuario_id, categorias.id AS categorias_id, categorias.descricao FROM transacoes JOIN categorias ON transacoes.categoria_id = categorias.id  WHERE usuario_id = $1', [usuario.id]);
    res.status(200).json(transacoes.rows);
}

const atualizarTransacoes = async (req, res) => {
    const { authorization } = req.headers
    const id = req.params.id
    const { descricao, valor, data, categoria_id, tipo } = req.body
    if (!descricao || !valor || !data || !categoria_id || !tipo)
        return res.status(400).json({ "Mensagem": "Todos os campos obrigatórios devem ser informados." })
    let token = authorization.replace('Bearer ', "").trim();
    try {
        const usuario = jwt.verify(token, jwtSecret)
        let transacoes = await conexao.query('SELECT * FROM transacoes WHERE id = $1', [id])
        let transacao = transacoes.rows
        if (transacoes.rowCount == 0)
            return res.status(400).json({ "Mensagem": "Transação não encontrada" })
        if (transacao[0].usuario_id != usuario.id)
            return res.status(404).json({ "Mensagem": "Usuário não tem acesso a esta transação" })

        if (tipo !== 'entrada' && tipo !== 'saida') {
            return res.status(400).json({ "Mensagem": "O tipo informado deve ser 'entrada' ou 'saida'" })
        }

        const resultado = await conexao.query('UPDATE transacoes SET descricao = $1, valor = $2, data = $3, categoria_id = $4, tipo = $5 WHERE id = $6', [descricao, valor, data, categoria_id, tipo, id])
        return res.status(204).json()
    } catch (error) {
        return res.status(400).json(error.message);
    }
}
const detalharTransacoes = async (req, res) => {
    const { authorization } = req.headers
    const id = req.params.id
    let token = authorization.replace('Bearer ', "").trim();
    try {
        const usuario = jwt.verify(token, jwtSecret)
        let transacoes = await conexao.query('SELECT * FROM transacoes WHERE id = $1', [id])
        let transacao = transacoes.rows
        if (transacoes.rowCount == 0)
            return res.status(400).json({ "Mensagem": "TransaçãO não encontrada." })
        if (transacao[0].usuario_id != usuario.id)
            return res.status(404).json({ "Mensagem": "Usuário não tem acesso a esta transação" })
        const resultado = await conexao.query('SELECT transacoes.id, tipo, transacoes.descricao AS transacao_descricao, valor, data, usuario_id, categorias.id AS categorias_id, categorias.descricao AS categorias_descricao FROM transacoes JOIN categorias ON transacoes.categoria_id = categorias.id  WHERE transacoes.id = $1', [id])
        return res.status(200).json(resultado.rows[0])
    } catch (error) {
        return res.status(400).json(error.message);
    }
}

const excluirTransacoes = async (req, res) => {
    const { authorization } = req.headers
    const id = req.params.id

    let token = authorization.replace('Bearer ', "").trim();
    try {
        const usuario = jwt.verify(token, jwtSecret)
        let transacoes = await conexao.query('SELECT * FROM transacoes WHERE id = $1', [id])
        let transacao = transacoes.rows
        if (transacoes.rowCount == 0)
            return res.status(400).json({ "Mensagem": "Transação não encontrada" });
        if (transacao[0].usuario_id != usuario.id)
            return res.status(404).json({ "Mensagem": "Usuário não tem acesso a esta transação" })

        const transacaoExcluida = await conexao.query('DELETE FROM transacoes WHERE id = $1', [id])
        return res.status(204).json()
    } catch (error) {
        return res.status(400).json(error.message);
    }
}

const extratoTransacoes = async (req, res) => {
    const { authorization } = req.headers
    const id = req.params.id
    let token = authorization.replace('Bearer ', "").trim();

    try {
        const usuario = jwt.verify(token, jwtSecret)
        let transacoes = await conexao.query('SELECT * FROM transacoes WHERE usuario_id = $1 and tipo = $2', [usuario.id, 'entrada']);
        let transacao = transacoes.rows
        if (transacoes.rowCount == 0)
            return res.status(400).json({ "Mensagem": "Transacao nao encontrada." })
        if (transacao[0].usuario_id != usuario.id)
            return res.status(404).json({ "Mensagem": "Acesso não permitdo." })

        const resultadoEntradas = await conexao.query('SELECT sum(valor) AS entradas FROM transacoes WHERE transacoes.usuario_id = $1 and tipo = $2', [usuario.id, 'entrada']);
        const resultadoSaidas = await conexao.query('SELECT sum(valor) AS saidas FROM transacoes WHERE transacoes.usuario_id = $1 and tipo = $2', [usuario.id, 'saida']);
        const resultado = {
            entradas: resultadoEntradas.rows[0].entradas,
            saidas: resultadoSaidas.rows[0].saidas
        }
        return res.status(200).json(resultado);
    } catch (error) {
        return res.status(400).json(error.message);
    }




}


module.exports = {
    cadastrarTransacoes,
    listarTransacoes,
    atualizarTransacoes,
    detalharTransacoes,
    excluirTransacoes,
    extratoTransacoes
}