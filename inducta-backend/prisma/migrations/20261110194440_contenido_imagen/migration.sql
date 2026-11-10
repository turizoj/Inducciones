-- AlterTable
ALTER TABLE `contenidos` MODIFY `tipo` ENUM('video', 'pdf', 'texto', 'enlace', 'imagen') NOT NULL;
