// @ts-check

const fs = require('fs');
const path = require('path');
const parser = require('./parser.js');

var asmFiles = getAllAsmFiles('./06/');
console.log(`Found ${asmFiles.length} .asm files to process:`);
asmFiles.forEach(file => {
    try {
        console.log('Assemble:', file);
        var asmLines = readFileLines(file);
        var binaryLines = parser.parseAsmCode(asmLines);
        writeFileLines(file.replace('.asm', '.hack'), binaryLines);
        console.log('success\n');
    } catch (error) {
        console.error('Error:', error);
    }
});

function getAllAsmFiles(basePath) {
    var files = fs.readdirSync(basePath, { recursive: true });
    // @ts-ignore
    return files.filter(file => path.extname(file) === '.asm').map(file => path.join(basePath, file));
}

function readFileLines(path) {
    return fs.readFileSync(path, 'utf8').split('\n');
}

function writeFileLines(path, lines) {
    fs.writeFileSync(path, lines.join('\n'), 'utf8');
}