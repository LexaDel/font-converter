import fs from 'fs/promises';
import path from 'path';
import ttf2woff2 from 'ttf2woff2';
import ttf2woff from 'ttf2woff';

/**
 * Конвертирует все .ttf файлы из входной директории в .woff2 и .woff и сохраняет их в выходную директорию.
 * @param {string} inputDir - Путь к директории с исходными .ttf файлами.
 * @param {string} outputDir - Путь к директории для сохранения .woff2 и .woff файлов.
 */
async function convertTtfToWoff(inputDir, outputDir) {
    try {
        try {
            const stats = await fs.stat(inputDir);
            if (!stats.isDirectory()) {
                console.error(`Указанный путь не является директорией: ${inputDir}`);
                return;
            }
        } catch (error) {
            console.error(`Входная директория не существует или недоступна: ${inputDir}`);
            console.error(`Ошибка: ${error.message}`);
            return;
        }

        try {
            await fs.mkdir(outputDir, { recursive: true });
        } catch (error) {
            console.error(`Ошибка при создании выходной директории: ${error.message}`);
            return;
        }

        try {
            const files = await fs.readdir(inputDir);

            const ttfFiles = files.filter(file => path.extname(file).toLowerCase() === '.ttf');

            if (ttfFiles.length === 0) {
                console.log('В директории нет .ttf файлов.');
                return;
            }

            console.log(`Найдено ${ttfFiles.length} .ttf файлов для конвертации.`);

            const conversionPromises = ttfFiles.map(async (ttfFile, index) => {
                const ttfPath = path.join(inputDir, ttfFile);
                const woff2Path = path.join(outputDir, `${path.basename(ttfFile, '.ttf')}.woff2`);
                const woffPath = path.join(outputDir, `${path.basename(ttfFile, '.ttf')}.woff`);

                try {
                    // Проверяем, был ли файл уже сконвертирован
                    const [woff2Exists, woffExists] = await Promise.all([
                        fs.access(woff2Path).then(() => true).catch(() => false),
                        fs.access(woffPath).then(() => true).catch(() => false),
                    ]);

                    if (woff2Exists && woffExists) {
                        console.log(`[${index + 1}/${ttfFiles.length}] Файлы уже сконвертированы: ${path.basename(woff2Path)} и ${path.basename(woffPath)}`);
                        return;
                    }

                    console.log(`[${index + 1}/${ttfFiles.length}] Начинаю конвертацию файла: ${ttfFile}`);

                    const ttfBuffer = await fs.readFile(ttfPath);

                    // Конвертируем .ttf в .woff2
                    if (!woff2Exists) {
                        const woff2Buffer = ttf2woff2(ttfBuffer);
                        await fs.writeFile(woff2Path, woff2Buffer);
                        console.log(`[${index + 1}/${ttfFiles.length}] Файл успешно сконвертирован: ${path.basename(woff2Path)}`);
                    }

                    // Конвертируем .ttf в .woff
                    if (!woffExists) {
                        const woffResult = ttf2woff(ttfBuffer);
                        const woffBuffer = Buffer.from(woffResult.buffer);
                        await fs.writeFile(woffPath, woffBuffer);
                        console.log(`[${index + 1}/${ttfFiles.length}] Файл успешно сконвертирован: ${path.basename(woffPath)}`);
                    }
                } catch (error) {
                    console.error(`[${index + 1}/${ttfFiles.length}] Ошибка при конвертации файла ${ttfFile}:`, error.message);
                }
            });

            await Promise.all(conversionPromises);

            console.log('Конвертация завершена.');
        } catch (error) {
            console.error('Произошла ошибка при обработке файлов:', error.message);
        }
    } catch (error) {
        console.error('Произошла непредвиденная ошибка:', error.message);
    }
}

// Аргументы командной строки
const args = process.argv.slice(2);

if (args.length < 2) {
    console.log('Использование: node index.mjs <входная_директория> <выходная_директория>');
    process.exit(1);
}

const [inputDir, outputDir] = args;

// Запускаем конвертацию
convertTtfToWoff(inputDir, outputDir);