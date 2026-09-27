-- CreateTable
CREATE TABLE `roles` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(40) NOT NULL,

    UNIQUE INDEX `roles_nombre_key`(`nombre`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `areas` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(80) NOT NULL,
    `descripcion` VARCHAR(255) NULL,
    `estado` ENUM('activo', 'inactivo') NOT NULL DEFAULT 'activo',
    `jefe_id` INTEGER NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `areas_nombre_key`(`nombre`),
    INDEX `areas_jefe_id_idx`(`jefe_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `cargos` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(80) NOT NULL,
    `area_id` INTEGER NOT NULL,
    `estado` ENUM('activo', 'inactivo') NOT NULL DEFAULT 'activo',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `cargos_area_id_nombre_key`(`area_id`, `nombre`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `usuarios` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `documento` VARCHAR(20) NOT NULL,
    `nombres` VARCHAR(80) NOT NULL,
    `apellidos` VARCHAR(80) NOT NULL,
    `email` VARCHAR(120) NOT NULL,
    `password_hash` VARCHAR(255) NOT NULL,
    `telefono` VARCHAR(20) NULL,
    `fecha_ingreso` DATE NOT NULL,
    `rol_id` INTEGER NOT NULL,
    `cargo_id` INTEGER NULL,
    `estado` ENUM('activo', 'inactivo') NOT NULL DEFAULT 'activo',
    `acepta_datos_at` DATETIME(3) NULL,
    `ultimo_acceso` DATETIME(3) NULL,
    `intentos_fallidos` INTEGER NOT NULL DEFAULT 0,
    `bloqueado_hasta` DATETIME(3) NULL,
    `reset_token_hash` VARCHAR(255) NULL,
    `reset_token_expira` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `usuarios_documento_key`(`documento`),
    UNIQUE INDEX `usuarios_email_key`(`email`),
    INDEX `usuarios_rol_id_idx`(`rol_id`),
    INDEX `usuarios_cargo_id_idx`(`cargo_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `programas` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `titulo` VARCHAR(150) NOT NULL,
    `descripcion` TEXT NULL,
    `imagen_url` VARCHAR(255) NULL,
    `duracion_horas` INTEGER NOT NULL,
    `obligatorio` BOOLEAN NOT NULL DEFAULT true,
    `estado` ENUM('borrador', 'publicado', 'archivado') NOT NULL DEFAULT 'borrador',
    `creado_por` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `programas_creado_por_idx`(`creado_por`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `modulos` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `programa_id` INTEGER NOT NULL,
    `titulo` VARCHAR(150) NOT NULL,
    `descripcion` TEXT NULL,
    `orden` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `modulos_programa_id_idx`(`programa_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `contenidos` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `modulo_id` INTEGER NOT NULL,
    `titulo` VARCHAR(150) NOT NULL,
    `tipo` ENUM('video', 'pdf', 'texto', 'enlace') NOT NULL,
    `url` VARCHAR(255) NULL,
    `texto` TEXT NULL,
    `orden` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `contenidos_modulo_id_idx`(`modulo_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `evaluaciones` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `modulo_id` INTEGER NOT NULL,
    `nota_minima` DECIMAL(4, 1) NOT NULL DEFAULT 3.5,
    `intentos_max` INTEGER NOT NULL DEFAULT 3,
    `tiempo_limite_min` INTEGER NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `evaluaciones_modulo_id_key`(`modulo_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `preguntas` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `evaluacion_id` INTEGER NOT NULL,
    `enunciado` TEXT NOT NULL,
    `tipo` ENUM('unica', 'multiple', 'verdadero_falso') NOT NULL,
    `orden` INTEGER NOT NULL,

    INDEX `preguntas_evaluacion_id_idx`(`evaluacion_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `opciones` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `pregunta_id` INTEGER NOT NULL,
    `texto` VARCHAR(255) NOT NULL,
    `es_correcta` BOOLEAN NOT NULL DEFAULT false,

    INDEX `opciones_pregunta_id_idx`(`pregunta_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `asignaciones` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `usuario_id` INTEGER NOT NULL,
    `programa_id` INTEGER NOT NULL,
    `asignado_por` INTEGER NOT NULL,
    `fecha_asignacion` DATE NOT NULL,
    `fecha_limite` DATE NOT NULL,
    `estado` ENUM('pendiente', 'en_curso', 'completada', 'vencida') NOT NULL DEFAULT 'pendiente',
    `porcentaje_avance` DECIMAL(5, 2) NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `asignaciones_usuario_id_idx`(`usuario_id`),
    INDEX `asignaciones_programa_id_idx`(`programa_id`),
    INDEX `asignaciones_asignado_por_idx`(`asignado_por`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `progreso_contenido` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `asignacion_id` INTEGER NOT NULL,
    `contenido_id` INTEGER NOT NULL,
    `visto_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `progreso_contenido_contenido_id_idx`(`contenido_id`),
    UNIQUE INDEX `progreso_contenido_asignacion_id_contenido_id_key`(`asignacion_id`, `contenido_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `intentos_evaluacion` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `asignacion_id` INTEGER NOT NULL,
    `evaluacion_id` INTEGER NOT NULL,
    `numero_intento` INTEGER NOT NULL,
    `nota` DECIMAL(4, 1) NULL,
    `aprobado` BOOLEAN NOT NULL DEFAULT false,
    `iniciado_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `finalizado_at` DATETIME(3) NULL,

    INDEX `intentos_evaluacion_asignacion_id_idx`(`asignacion_id`),
    INDEX `intentos_evaluacion_evaluacion_id_idx`(`evaluacion_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `respuestas` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `intento_id` INTEGER NOT NULL,
    `pregunta_id` INTEGER NOT NULL,
    `opcion_id` INTEGER NOT NULL,

    INDEX `respuestas_intento_id_idx`(`intento_id`),
    INDEX `respuestas_pregunta_id_idx`(`pregunta_id`),
    INDEX `respuestas_opcion_id_idx`(`opcion_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `certificados` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `asignacion_id` INTEGER NOT NULL,
    `codigo_verificacion` VARCHAR(40) NOT NULL,
    `fecha_emision` DATE NOT NULL,
    `pdf_url` VARCHAR(255) NULL,

    UNIQUE INDEX `certificados_asignacion_id_key`(`asignacion_id`),
    UNIQUE INDEX `certificados_codigo_verificacion_key`(`codigo_verificacion`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `notificaciones` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `usuario_id` INTEGER NOT NULL,
    `titulo` VARCHAR(150) NOT NULL,
    `mensaje` VARCHAR(255) NOT NULL,
    `leida` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `notificaciones_usuario_id_idx`(`usuario_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `areas` ADD CONSTRAINT `areas_jefe_id_fkey` FOREIGN KEY (`jefe_id`) REFERENCES `usuarios`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cargos` ADD CONSTRAINT `cargos_area_id_fkey` FOREIGN KEY (`area_id`) REFERENCES `areas`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `usuarios` ADD CONSTRAINT `usuarios_rol_id_fkey` FOREIGN KEY (`rol_id`) REFERENCES `roles`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `usuarios` ADD CONSTRAINT `usuarios_cargo_id_fkey` FOREIGN KEY (`cargo_id`) REFERENCES `cargos`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `programas` ADD CONSTRAINT `programas_creado_por_fkey` FOREIGN KEY (`creado_por`) REFERENCES `usuarios`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `modulos` ADD CONSTRAINT `modulos_programa_id_fkey` FOREIGN KEY (`programa_id`) REFERENCES `programas`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `contenidos` ADD CONSTRAINT `contenidos_modulo_id_fkey` FOREIGN KEY (`modulo_id`) REFERENCES `modulos`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `evaluaciones` ADD CONSTRAINT `evaluaciones_modulo_id_fkey` FOREIGN KEY (`modulo_id`) REFERENCES `modulos`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `preguntas` ADD CONSTRAINT `preguntas_evaluacion_id_fkey` FOREIGN KEY (`evaluacion_id`) REFERENCES `evaluaciones`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `opciones` ADD CONSTRAINT `opciones_pregunta_id_fkey` FOREIGN KEY (`pregunta_id`) REFERENCES `preguntas`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `asignaciones` ADD CONSTRAINT `asignaciones_usuario_id_fkey` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `asignaciones` ADD CONSTRAINT `asignaciones_programa_id_fkey` FOREIGN KEY (`programa_id`) REFERENCES `programas`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `asignaciones` ADD CONSTRAINT `asignaciones_asignado_por_fkey` FOREIGN KEY (`asignado_por`) REFERENCES `usuarios`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `progreso_contenido` ADD CONSTRAINT `progreso_contenido_asignacion_id_fkey` FOREIGN KEY (`asignacion_id`) REFERENCES `asignaciones`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `progreso_contenido` ADD CONSTRAINT `progreso_contenido_contenido_id_fkey` FOREIGN KEY (`contenido_id`) REFERENCES `contenidos`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `intentos_evaluacion` ADD CONSTRAINT `intentos_evaluacion_asignacion_id_fkey` FOREIGN KEY (`asignacion_id`) REFERENCES `asignaciones`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `intentos_evaluacion` ADD CONSTRAINT `intentos_evaluacion_evaluacion_id_fkey` FOREIGN KEY (`evaluacion_id`) REFERENCES `evaluaciones`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `respuestas` ADD CONSTRAINT `respuestas_intento_id_fkey` FOREIGN KEY (`intento_id`) REFERENCES `intentos_evaluacion`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `respuestas` ADD CONSTRAINT `respuestas_pregunta_id_fkey` FOREIGN KEY (`pregunta_id`) REFERENCES `preguntas`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `respuestas` ADD CONSTRAINT `respuestas_opcion_id_fkey` FOREIGN KEY (`opcion_id`) REFERENCES `opciones`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `certificados` ADD CONSTRAINT `certificados_asignacion_id_fkey` FOREIGN KEY (`asignacion_id`) REFERENCES `asignaciones`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notificaciones` ADD CONSTRAINT `notificaciones_usuario_id_fkey` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
