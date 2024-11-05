import pino from 'pino';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const upperDir = resolve(__dirname, '../../logs');

if (!fs.existsSync(upperDir)) {
    fs.mkdirSync(upperDir, { recursive: true });
}

const fileTransport = pino.transport({
    targets: [
        {
            target: 'pino/file',
            options: { destination: `${upperDir}/server.log` },
        },
    ]
});

export default pino(
    {
        level: process.env.PINO_LOG_LEVEL || 'info',
        formatters: {
            level: (label) => {
                return { level: label.toUpperCase() };
            },
        },
        timestamp: pino.stdTimeFunctions.isoTime,
    },
    fileTransport
);
