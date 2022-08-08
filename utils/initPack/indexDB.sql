CREATE TABLE `users` (
  `id` int(1) UNSIGNED NOT NULL AUTO_INCREMENT,
  `idTipo` int(1) UNSIGNED NOT NULL DEFAULT 0,
  `nome` varchar(100) NOT NULL DEFAULT '',
  `user` varchar(50) NOT NULL DEFAULT '',
  `pass` varchar(255) NOT NULL DEFAULT '',
  `cpfcnpj` varchar(20) NOT NULL DEFAULT '',
  `fones` varchar(255) NOT NULL DEFAULT '',
  `emails` varchar(500) NOT NULL DEFAULT '',
  `tags` varchar(255) NOT NULL DEFAULT '',
  `salario` decimal(9,2) NOT NULL DEFAULT 0.00,
  `cep` varchar(10) NOT NULL DEFAULT '',
  `dtNasc` date NOT NULL DEFAULT '0000-00-00',
  `dtCad` datetime NOT NULL DEFAULT current_timestamp(),
  `dtDel` datetime NOT NULL DEFAULT '0000-00-00 00:00:00',
  `dtAcesso` datetime NOT NULL DEFAULT '0000-00-00 00:00:00',
  `ativo` tinyint(1) NOT NULL DEFAULT 1,
  `excluido` tinyint(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `eventos` (
  `id` int(1) UNSIGNED NOT NULL AUTO_INCREMENT,
  `idModulo` int(1) UNSIGNED NOT NULL DEFAULT 0,
  `modulo` varchar(50) NOT NULL DEFAULT '',
  `user` varchar(50) NOT NULL DEFAULT '',
  `msg` varchar(200) NOT NULL DEFAULT '',
  `obs` text NOT NULL DEFAULT '',
  `pid` varchar(20) NOT NULL,
  `dtCad` datetime NOT NULL DEFAULT current_timestamp(),
  `interno` tinyint(1) UNSIGNED NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO `eventos` VALUES
(1,1,'users','','Inseriu','{\"nome\":\"Usu\\u00e1rio Exemplo\",\"user\":\"usuario\",\"fones\":\"(55) 666667777\",\"emails\":\"usuario@mailinator.com,exemplo@mailinator.com\",\"tags\":\"Exemplo,R4init\",\"cpfcnpj\":\"01234567890\",\"idTipo\":10,\"salario\":1250.98,\"cep\":\"01000101\",\"dtNasc\":\"1981-10-29\",\"ativo\":\"1\",\"pass\":\"(oculto)\"}','12333@1659911910','2022-08-07 22:38:30',0),
(2,1,'users','','Alterou','{\"fones\":\"55-111123333\",\"dtNasc\":\"2022-10-29\"}','12285@1659912003','2022-08-07 22:40:03',0),
(3,1,'users','','Alterou','{\"dtNasc\":\"1981-10-29\"}','12287@1659912032','2022-08-07 22:40:32',0),
(4,1,'users','','Alterou','{\"fones\":\"11-22222-3333\",\"cep\":\"01020304\"}','12289@1659998821','2022-08-08 22:47:01',0),
(5,1,'users','','Alterou','{\"pass\":\"(oculto)\"}','12333@1659998862','2022-08-08 22:47:42',0);

INSERT INTO `users` VALUES
(1,10,'Usuário Exemplo','usuario','$2y$10$s9BjDIhdyH/xUyTecG2D2uNE6YVTUll3u1azAbLgs0TFqSodAbyay','01234567890','11-22222-3333','usuario@mailinator.com,exemplo@mailinator.com','Exemplo,R4init',1250.98,'01020304','1981-10-29 00:00:00','2022-08-07 22:38:30','0000-00-00 00:00:00','0000-00-00 00:00:00',1,0);