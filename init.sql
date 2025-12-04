-- -----------------------------------------------------
-- Tabela `user`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `user` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `nome` VARCHAR(255) NOT NULL,
  `senha` VARCHAR(255) NOT NULL, -- Recomendado 255 para hashes de senha (ex: bcrypt)
  `role` VARCHAR(50) NOT NULL,    -- Ex: 'admin', 'aluno'
  `email` VARCHAR(255) NOT NULL UNIQUE,
  PRIMARY KEY (`id`)
) ENGINE = InnoDB;

-- -----------------------------------------------------
-- Tabela `course`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `course` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `idCreator` INT NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `description` TEXT NULL,
  `urlImage` VARCHAR(255) NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `modified_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `fk_course_user_idx` (`idCreator` ASC),
  CONSTRAINT `fk_course_user`
    FOREIGN KEY (`idCreator`)
    REFERENCES `user` (`id`)
    ON DELETE RESTRICT -- Impede a exclusão de um usuário que criou cursos
    ON UPDATE CASCADE
) ENGINE = InnoDB;

-- -----------------------------------------------------
-- Tabela `userCourse` (Tabela de Relacionamento N:M)
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `userCourse` (
  `id` INT NOT NULL AUTO_INCREMENT, -- Coluna ID adicional para chave primária (melhor prática em alguns frameworks)
  `iduser` INT NOT NULL,
  `idcourse` INT NOT NULL,
  `watched_at` TIMESTAMP NULL, -- Quando o curso foi marcado como assistido/completo
  PRIMARY KEY (`id`),
  UNIQUE INDEX `uk_usercourse` (`iduser`, `idcourse`), -- Garante que um usuário só se relacione com um curso uma vez
  INDEX `fk_userCourse_course_idx` (`idcourse` ASC),
  INDEX `fk_userCourse_user_idx` (`iduser` ASC),
  CONSTRAINT `fk_userCourse_user`
    FOREIGN KEY (`iduser`)
    REFERENCES `user` (`id`)
    ON DELETE CASCADE  -- Se o usuário for excluído, remove seus registros nesta tabela
    ON UPDATE CASCADE,
  CONSTRAINT `fk_userCourse_course`
    FOREIGN KEY (`idcourse`)
    REFERENCES `course` (`id`)
    ON DELETE CASCADE -- Se o curso for excluído, remove seus registros nesta tabela
    ON UPDATE CASCADE
) ENGINE = InnoDB;

INSERT INTO `user` (`nome`, `email`, `senha`, `role`)
VALUES ('admin', 'admin@admin.com', 'admin', 'admin');