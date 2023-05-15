CREATE DATABASE dindin;

CREATE TABLE usuarios(
  	id serial primary key,
  	nome text,
  	email varchar(60) unique,
  	senha text)
  	
CREATE TABLE categorias(
  	id serial primary key,
  	descricao text)
    
CREATE TABLE transacoes (
  	id serial primary key,
  	descricao text,
  	valor int,
  	data timestamp,
  	categoria_id int REFERENCES categorias(id),
	usuario_id int references usuarios(id),
  	tipo varchar(10))

INSERT INTO categorias (descricao) VALUES ('Alimentação')
('Assinaturas e Serviços'),
('Casa'),
('Mercado'),
('Cuidados Pessoais'),
('Educação'),
('Família'),
('Lazer'),
('Pets'),
('Presentes'),
('Roupas'),
('Saúde'),
('Transporte'),
('Salário'),
('Vendas'),
('Outras receitas'),
('Outras despesas')