import * as path from 'path';
import * as parser from './parser.js';
import * as fs from 'node:fs';
import * as readline from 'readline';
import * as utils from './utils.js';
import { pipeline } from 'node:stream/promises';
import { CommandType } from './entities.js';

const VM_EXT = '.vm';
const ASEMBLY_EXT = '.asm';

export class Transpiler {
    private readonly _inFolderPath: string;
    private readonly _outFilePath: string;

    constructor(filePath: string) {
        this._inFolderPath = filePath;
        this._outFilePath = path.join(filePath, path.basename(filePath) + ASEMBLY_EXT);
    }

    public get folderPath(): string {
        return this._inFolderPath;
    }

    public async transpile(): Promise<number> {
        let totalAsmLines = 0;
        const writter = fs.createWriteStream(this._outFilePath);
        try {
            // write bootstrap
            const name = path.basename(this._outFilePath, ASEMBLY_EXT);
            const bootstrapLines = parser.getBootstrapLines(name);
            bootstrapLines.forEach((line) => writter.write(line + '\n'));

            // transpile all .vm files
            for (const vmFile of utils.getAllVmFiles(this._inFolderPath)) {
                totalAsmLines += await transpileFileStream(vmFile, writter);
            }
        } finally {
            writter.close();
        }
        return totalAsmLines;
    }
}

async function transpileFileStream(vmFilePath: string, writter: fs.WriteStream): Promise<number> {
    let asmLines = 0;
    const reader = fs.createReadStream(vmFilePath);
    try {
        await pipeline(
            reader,
            async function* (source: NodeJS.ReadableStream) {
                const fileName = path.basename(vmFilePath, VM_EXT);
                yield (asmLines = await transpileFileImpl(fileName, source, writter));
            },
            writter,
            { end: false }
        );
    } finally {
        reader.close();
    }
    return asmLines;
}

async function transpileFileImpl(
    fileName: string,
    reader: NodeJS.ReadableStream,
    writter: fs.WriteStream
) {
    let asmLines = 0;
    let vmLineNum = 0;
    let funcName: string;
    const lineReader = readline.createInterface(reader);
    for await (const line of lineReader) {
        const command = parser.parseCommandLine(fileName, line, vmLineNum++);
        if (command) {
            const assemblyLines = parser.getAssemlyCode(command);
            asmLines += assemblyLines.length;
            assemblyLines.forEach((line) => writter.write(line + '\n'));

            // handle function name replacing file name for labels inside the function
            if (command.command === CommandType.FUNCTION) {
                funcName = `${fileName}_${command.arg1asString}`;
            } else if (command.command === CommandType.RETURN) {
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                funcName = undefined;
            }
        }
    }
    return asmLines;
}
