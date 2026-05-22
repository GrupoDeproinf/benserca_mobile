/**
 * Corrige react-native-css-interop@0.2.4 con Metro 0.83+ (Expo SDK 55).
 * Sin esto, al guardar archivos Metro crashea: Cannot read 'addedFiles' of undefined.
 * @see https://github.com/nativewind/nativewind/issues/1773
 */
const fs = require('node:fs');
const path = require('node:path');

const target = path.join(
  __dirname,
  '../node_modules/react-native-css-interop/dist/metro/index.js',
);

if (!fs.existsSync(target)) {
  process.exit(0);
}

const source = fs.readFileSync(target, 'utf8');

if (source.includes('modifiedFiles: [[filePath')) {
  console.log('[patch-nativewind-metro] Ya aplicado.');
  process.exit(0);
}

const oldBlock = `            haste.emit("change", {
                eventsQueue: [
                    {
                        filePath,
                        metadata: {
                            modifiedTime: Date.now(),
                            size: 1,
                            type: "virtual",
                        },
                        type: "change",
                    },
                ],
            });`;

const newBlock = `            haste.emit("change", {
                changes: {
                    addedDirectories: new Set(),
                    removedDirectories: new Set(),
                    addedFiles: [],
                    modifiedFiles: [[filePath, { isSymlink: false, modifiedTime: Date.now() }]],
                    removedFiles: [],
                },
                rootDir: process.cwd(),
            });`;

if (!source.includes(oldBlock)) {
  console.warn('[patch-nativewind-metro] Bloque no encontrado; revisa la versión de react-native-css-interop.');
  process.exit(0);
}

fs.writeFileSync(target, source.replace(oldBlock, newBlock));
console.log('[patch-nativewind-metro] Parche aplicado correctamente.');
