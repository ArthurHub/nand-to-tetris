import * as path from 'path';
import * as parser from './parser.js';
import * as fs from 'fs';
import * as readline from 'readline';

const VM_EXT = '.vm';
const ASEMBLY_EXT = '.asm';

export class Transpiler {
    private readonly _fileName: string;
    private readonly _inFilePath: string;
    private readonly _outFilePath: string;

    constructor(filePath: string) {
        this._inFilePath = filePath;
        this._fileName = path.basename(filePath, VM_EXT);
        this._outFilePath = filePath.replace(VM_EXT, ASEMBLY_EXT);
    }

    public get fileName(): string {
        return this._fileName;
    }

    public async transpile(): Promise<number> {
        const lineReader = readline.createInterface(fs.createReadStream(this._inFilePath));
        const writter = fs.createWriteStream(this._outFilePath);

        let vmLineNum = 0;
        let asmLines = 0;
        for await (const line of lineReader) {
            const command = parser.parseCommandLine(this._fileName, line, vmLineNum++);
            if (command) {
                const assemblyLines = parser.getAssemlyCode(command);
                asmLines += assemblyLines.length;
                assemblyLines.forEach((line) => writter.write(line + '\n'));
            }
        }

        writter.close();
        lineReader.close();
        return asmLines;
    }
}
