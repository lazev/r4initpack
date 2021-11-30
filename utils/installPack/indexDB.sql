CREATE TABLE `apiAccessLog` (
  `id` int(1) UNSIGNED NOT NULL AUTO_INCREMENT,
  `user` varchar(100) NOT NULL,
  `iniPass` varchar(20) NOT NULL,
  `ip` varchar(100) NOT NULL,
  `dtAcesso` datetime NOT NULL DEFAULT current_timestamp(),
  `floodTime` int(1) UNSIGNED NOT NULL,
  `situacao` tinyint(1) UNSIGNED NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


CREATE TABLE `contas` (
  `id` int(1) UNSIGNED NOT NULL AUTO_INCREMENT,
  `serverDB` varchar(100) NOT NULL,
  `nome` varchar(100) DEFAULT NULL,
  `dtCad` datetime NOT NULL DEFAULT current_timestamp(),
  `dtDel` datetime DEFAULT NULL,
  `dtAcesso` datetime DEFAULT NULL,
  `tokenAPI` varchar(255) DEFAULT NULL,
  `bloqueadoAPI` tinyint(1) NOT NULL DEFAULT 0,
  `bloqueado` tinyint(1) UNSIGNED NOT NULL DEFAULT 0,
  `ativo` tinyint(1) UNSIGNED NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


CREATE TABLE `keepLogged` (
  `id` int(1) UNSIGNED NOT NULL AUTO_INCREMENT,
  `idUsuario` int(1) UNSIGNED NOT NULL,
  `random` int(1) UNSIGNED NOT NULL,
  `token` varchar(256) NOT NULL,
  `dtAcesso` datetime NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


CREATE TABLE `usuarios` (
  `id` int(1) UNSIGNED NOT NULL AUTO_INCREMENT,
  `nome` varchar(100) DEFAULT NULL,
  `provider` varchar(20) DEFAULT NULL,
  `providerId` varchar(100) DEFAULT NULL,
  `user` varchar(50) DEFAULT NULL,
  `pass` varchar(200) DEFAULT NULL,
  `fones` varchar(200) DEFAULT NULL,
  `emails` varchar(500) DEFAULT NULL,
  `picture` varchar(500) DEFAULT NULL,
  `dtCad` datetime NOT NULL DEFAULT current_timestamp(),
  `dtDel` datetime DEFAULT NULL,
  `dtAcesso` datetime DEFAULT NULL,
  `bloqueado` tinyint(1) NOT NULL DEFAULT 0,
  `ativo` tinyint(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


CREATE TABLE `usuariosContas` (
  `id` int(1) UNSIGNED NOT NULL AUTO_INCREMENT,
  `idConta` int(1) UNSIGNED NOT NULL,
  `idUsuario` int(1) UNSIGNED NOT NULL,
  `dtCad` datetime NOT NULL DEFAULT current_timestamp(),
  `dono` tinyint(1) UNSIGNED NOT NULL,
  `situAcesso` tinyint(1) UNSIGNED NOT NULL,
  `ativo` tinyint(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;