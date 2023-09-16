// @ts-check

const { ALU_TO_BIN, JMP_TO_BIN, BASIC_SYMBOLS } = require("./consts");

// parse the asm code and return the binary code
function parseAsmCode(asmLines) {
    // remove comments and empty lines
    var asmLines = this.getCanonicalLines(asmLines);
    console.log('Canonical lines:', asmLines.length);

    // get the symbol table
    var symbolTable = this.getSymbolTable(asmLines);
    console.log('Symbolic table size:', symbolTable.size);

    // remove jump labels
    asmLines = asmLines.filter(line => line[0] !== '(');
    console.log('code lines:', asmLines.length);

    // convert each line to binary code
    var binaryLines = [];
    asmLines.forEach(line => {
        var binLine = this.getBinaryCodeForLine(line, symbolTable);
        binaryLines.push(binLine);
    });
    return binaryLines;
}

// read asm file and return only the lines that contain code
var getCanonicalLines = function (asmCode) {
    if (!asmCode)
        return null;
    return asmCode
        .map(line => line.trim())
        .map(line => line.split('//')[0])
        .map(line => line.trim())
        .filter(line => line !== '');
}

// get the symbol table for the given asm code with jump labels and variables
function getSymbolTable(asmLines) {
    var lineNum = 0;
    var tmpVarNum = 16;
    var symbolTable = getBaseSymbolicTable();
    // first pass - add all jump labels to the symbol table
    asmLines.forEach(line => {
        if (line[0] === '(') {
            symbolTable.set(line.slice(1, -1), lineNum);
        } else {
            lineNum++;
        }
    });
    // second pass - add all variables to the symbol table
    asmLines.forEach(line => {
        if (line[0] === '@') {
            var symbol = line.slice(1).trim();
            if (isNaN(symbol) && !symbolTable.has(symbol)) {
                symbolTable.set(symbol, tmpVarNum++);
            }
        }
    });
    return symbolTable;
}

// get the basic symbolic table that contains the predefined symbols
function getBaseSymbolicTable() {
    // @ts-ignore
    var symbolTable = new Map(BASIC_SYMBOLS);
    // R0 - R15
    for (let i = 0; i < 16; i++) {
        symbolTable.set(`R${i}`, i);
    }
    return symbolTable;
}

// get a single line of ASM code and return the binary code for it
var getBinaryCodeForLine = function (line, symbolTable) {
    var binaryCode = '';
    if (line[0] === '@') {
        var symbol = line.slice(1).trim();
        var value = parseInt(symbol);
        if (isNaN(value)) {
            value = symbolTable.get(symbol);
        }
        binaryCode = '0' + value.toString(2).padStart(15, '0');
    } else {
        var parts = getCommandParts(line);
        binaryCode = '111'
            + getCommandCode(parts[0])
            + getDestinationCode(parts[1])
            + getJumpCode(parts[2]);
    }
    return binaryCode;
};

function getCommandParts(line) {
    var parts = line.split(';');
    var jmpPart = parts.length === 1 ? '' : parts[1].trim();
    parts = parts[0].split('=');
    var destPart = parts.length === 1 ? '' : parts[0].trim();
    var aluPart = parts[parts.length - 1].trim();
    return [aluPart, destPart, jmpPart];
}

function getCommandCode(aluPart) {
    return ALU_TO_BIN.get(aluPart);
}

function getDestinationCode(destPart) {
    var code = '';
    code = destPart.includes('A') ? code + '1' : code + '0';
    code = destPart.includes('D') ? code + '1' : code + '0';
    code = destPart.includes('M') ? code + '1' : code + '0';
    return code

}

function getJumpCode(jmpPart) {
    return JMP_TO_BIN.get(jmpPart);
}


module.exports = {
    parseAsmCode: parseAsmCode,
    getCanonicalLines: getCanonicalLines,
    getSymbolTable: getSymbolTable,
    getBinaryCodeForLine: getBinaryCodeForLine,
};