const express = require("express");
const app = express();
const rotas = require("./rotas")
app.use(express.json());
app.use(rotas)
app.listen(process.env.PORTAPP, () => {
    console.log(`App iniciada no link http://${process.env.HOST}:${process.env.PORTAPP}`);
});