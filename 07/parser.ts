import { MemoryAccessCommand, MemorySegment, VMCommand } from "./entities.js";

/** The index of the first of 8 temp registers */
const TEMP_REG_OFFSET = 5;

/** Map memery segment VM name to the assembly register symbol */
const SEGMENT_TO_SYMBOL = new Map<MemorySegment, string>([
    [MemorySegment.LOCAL, 'LCL'],
    [MemorySegment.ARGUMENT, 'ARG'],
    [MemorySegment.THIS, 'THIS'],
    [MemorySegment.THAT, 'THAT'],
]);

/** push value in D register into the stack */
const PUSH_D_TO_SP = [
    '@SP',
    'A=M',
    'M=D',
    '@SP',
    'M=M+1'
];

/** read current M and push it into the stack */
const PUSH_M_TO_SP = [
    'D=M',
    ...PUSH_D_TO_SP
];

/** pop stack and put value in D reg */
const POP_SP_TO_D = [
    '@SP',
    'M=M-1',
    'A=M',
    'D=M'
];

/** Look at the top element on the stack. as M will read/write it */
const TOP_SP = [
    '@SP',
    'A=M-1'
];

/** Store the current value of D in temp register R13 */
const STORE_D_IN_R13 = [
    '@R13',
    'M=D'
]

/**
 * Parse a single VM command text line into VMCommand object
 * @returns VMCommand object or undefined if the line is a comment
 */
export function parseCommandLine(name: string, commandLine: string, lineNum: number): VMCommand | undefined {
    commandLine = commandLine.trim();
    if (commandLine.length < 1 || commandLine.startsWith('//')) {
        return undefined;
    }
    // clean and get the 3 parts of the command line
    const commandParts = commandLine.split('//')[0]?.trim().split(' ');
    if (!commandParts) {
        throw new Error(`Invalid command line: ${commandLine}`);
    }
    const memoryAccessCommand = commandParts[0]! as MemoryAccessCommand;

    let arg1;
    if (commandParts.length === 3) {
        arg1 = memoryAccessCommand === MemoryAccessCommand.PUSH || memoryAccessCommand === MemoryAccessCommand.POP
            ? commandParts[1]! as MemorySegment
            : commandParts[1]!;
    }

    const arg2 = commandParts.length === 3 ? parseInt(commandParts[2]!) : undefined;

    return new VMCommand(name, commandLine, lineNum, memoryAccessCommand, arg1, arg2);
}

/**
 * Translate a VM command to assembly code
 * @param command the VM command to translate to assembly code
 * @returns the assembly code lines
 */
export function getAssemlyCode(command: VMCommand): string[] {
    // start with the VM command line as a comment
    let lines: string[] = ["// " + command.line];
    // add the actual assembly code for the command
    switch (command.command) {
        case MemoryAccessCommand.PUSH:
            lines = lines.concat(getPushCommand(command));
            break;
        case MemoryAccessCommand.POP:
            lines = lines.concat(getPopCommand(command));
            break;
        case MemoryAccessCommand.NOT:
            lines = lines.concat(getArithmeticUnaryCommand('!M'));
            break;
        case MemoryAccessCommand.NEG:
            lines = lines.concat(getArithmeticUnaryCommand('-M'));
            break;
        case MemoryAccessCommand.AND:
            lines = lines.concat(getArithmeticBinaryCommand('M&D'));
            break;
        case MemoryAccessCommand.OR:
            lines = lines.concat(getArithmeticBinaryCommand('M|D'));
            break;
        case MemoryAccessCommand.ADD:
            lines = lines.concat(getArithmeticBinaryCommand('M+D'));
            break;
        case MemoryAccessCommand.SUB:
            lines = lines.concat(getArithmeticBinaryCommand('M-D'));
            break;
        case MemoryAccessCommand.EQ:
            lines = lines.concat(getBranchCommand('JEQ', command));
            break;
        case MemoryAccessCommand.GT:
            lines = lines.concat(getBranchCommand('JGT', command));
            break;
        case MemoryAccessCommand.LT:
            lines = lines.concat(getBranchCommand('JLT', command));
            break;

        default:
            throw new Error(`Invalid command: ${command}`);
    }
    return lines;
}

function getPushCommand(command: VMCommand): string[] {
    switch (command.arg1asMemorySegment) {
        case MemorySegment.CONSTANT:
            return [
                `@${command.arg2}`,
                'D=A',
                ...PUSH_D_TO_SP
            ];
        case MemorySegment.LOCAL:
        case MemorySegment.ARGUMENT:
        case MemorySegment.THIS:
        case MemorySegment.THAT:
            return [
                `@${command.arg2}`,
                'D=A',
                `@${SEGMENT_TO_SYMBOL.get(command.arg1asMemorySegment)}`,
                'A=M+D',
                ...PUSH_M_TO_SP
            ];
        case MemorySegment.TEMP:
            return [
                `@R${TEMP_REG_OFFSET + command.arg2!}`,
                ...PUSH_M_TO_SP
            ];
        case MemorySegment.POINTER:
            return [
                command.arg2 === 0 ? "@THIS" : "@THAT",
                ...PUSH_M_TO_SP
            ];
        case MemorySegment.STATIC:
            return [
                `@${command.name}.${command.arg2}`,
                ...PUSH_M_TO_SP
            ];
        default:
            throw new Error(`Invalid command: ${command}`);
    }
}

function getPopCommand(command: VMCommand): string[] {
    switch (command.arg1asMemorySegment) {
        case MemorySegment.LOCAL:
        case MemorySegment.ARGUMENT:
        case MemorySegment.THIS:
        case MemorySegment.THAT:
            return [
                `@${command.arg2}`,
                'D=A',
                `@${SEGMENT_TO_SYMBOL.get(command.arg1asMemorySegment)}`,
                'D=M+D',
                ...STORE_D_IN_R13,
                ...POP_SP_TO_D,
                '@R13',
                'A=M',
                'M=D'
            ];
        case MemorySegment.TEMP:
            return [
                ...POP_SP_TO_D,
                `@R${TEMP_REG_OFFSET + command.arg2!}`,
                'M=D'
            ];
        case MemorySegment.POINTER:
            return [
                ...POP_SP_TO_D,
                command.arg2 === 0 ? "@THIS" : "@THAT",
                'M=D'
            ];
        case MemorySegment.STATIC:
            return [
                ...POP_SP_TO_D,
                `@${command.name}.${command.arg2}`,
                'M=D'
            ];
        default:
            throw new Error(`Invalid command: ${command}`);
    }
}

function getArithmeticUnaryCommand(op: string): string[] {
    return [
        ...TOP_SP,
        `M=${op}`
    ];
}

function getArithmeticBinaryCommand(op: string): string[] {
    return [
        ...POP_SP_TO_D,
        ...TOP_SP,
        `M=${op}`
    ];
}

function getBranchCommand(op: string, command: VMCommand): string[] {
    const marker = `${command.name}_${command.lineNumber}`;
    return [
        ...POP_SP_TO_D,
        ...TOP_SP,
        'D=M-D',
        `@IF_${marker}`,
        `D;${op}`,
        'D=0',
        `@IFEND_${marker}`,
        '0;JMP',
        `(IF_${marker})`,
        'D=-1',
        `(IFEND_${marker})`,
        ...TOP_SP,
        'M=D',
    ];
}