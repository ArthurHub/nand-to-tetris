import { CommandType, MemorySegment, VMCommand } from './entities.js';

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
const PUSH_D_TO_SP = ['@SP', 'A=M', 'M=D', '@SP', 'M=M+1'];

/** push value in A register into the stack */
const PUSH_A_TO_SP = ['D=A', ...PUSH_D_TO_SP];

/** read current M and push it into the stack */
const PUSH_M_TO_SP = ['D=M', ...PUSH_D_TO_SP];

/** pop stack and put value in D reg */
const POP_SP_TO_D = ['@SP', 'M=M-1', 'A=M', 'D=M'];

/** Look at the top element on the stack. as M will read/write it */
const TOP_SP = ['@SP', 'A=M-1'];

/** Store the current value of D in temp register R13 */
const STORE_D_IN_R13 = ['@R13', 'M=D'];

export function getBootstrapLines(name: string): string[] {
    return [
        '// bootstrap',
        '@256',
        'D=A',
        '@SP',
        'M=D',
        '@LCL',
        'M=D',
        '@ARG',
        'M=D-1',
        '@4000',
        'D=A',
        '@THIS',
        'M=D',
        '@5000',
        'D=A',
        '@THAT',
        'M=D',
        '// bootstrap call Sys.init',
        ...getCallCommand(new VMCommand('', 'call Sys.init 0', 0, CommandType.CALL, 'Sys.init', 0)),
        '// infinite loop',
        `(INFILOOP_${name})`,
        `@INFILOOP_${name}`,
        '0;JMP',
        '// end bootstrap',
    ];
}

/**
 * Parse a single VM command text line into VMCommand object
 * @returns VMCommand object or undefined if the line is a comment
 */
export function parseCommandLine(
    name: string,
    commandLine: string,
    lineNum: number
): VMCommand | undefined {
    commandLine = commandLine.trim();
    if (commandLine.length < 1 || commandLine.startsWith('//')) {
        return undefined;
    }
    commandLine = commandLine.split('//')[0].trim();
    // clean and get the 3 parts of the command line
    const commandParts = commandLine.split(' ');
    if (!commandParts) {
        throw new Error(`Invalid command line: ${commandLine}`);
    }
    const commandType = commandParts[0]! as CommandType;

    let arg1: number | string | undefined, arg2: number | undefined;
    if (commandParts.length === 3) {
        arg1 =
            commandType === CommandType.PUSH || commandType === CommandType.POP
                ? (commandParts[1]! as MemorySegment)
                : commandParts[1]!;
        arg2 = parseInt(commandParts[2]!);
    } else {
        arg1 = commandParts[1]! as string;
    }

    return new VMCommand(name, commandLine, lineNum, commandType, arg1, arg2);
}

/**
 * Translate a VM command to assembly code
 * @param command the VM command to translate to assembly code
 * @returns the assembly code lines
 */
export function getAssemlyCode(command: VMCommand): string[] {
    // start with the VM command line as a comment
    let lines: string[];
    // add the actual assembly code for the command
    switch (command.command) {
        case CommandType.PUSH:
            lines = getPushCommand(command);
            break;
        case CommandType.POP:
            lines = getPopCommand(command);
            break;
        case CommandType.NOT:
            lines = getArithmeticUnaryCommand('!M');
            break;
        case CommandType.NEG:
            lines = getArithmeticUnaryCommand('-M');
            break;
        case CommandType.AND:
            lines = getArithmeticBinaryCommand('M&D');
            break;
        case CommandType.OR:
            lines = getArithmeticBinaryCommand('M|D');
            break;
        case CommandType.ADD:
            lines = getArithmeticBinaryCommand('M+D');
            break;
        case CommandType.SUB:
            lines = getArithmeticBinaryCommand('M-D');
            break;
        case CommandType.EQ:
            lines = getBranchCommand('JEQ', command);
            break;
        case CommandType.GT:
            lines = getBranchCommand('JGT', command);
            break;
        case CommandType.LT:
            lines = getBranchCommand('JLT', command);
            break;
        case CommandType.LABEL:
            lines = getLabelCommand(command);
            break;
        case CommandType.GOTO:
            lines = getGotoCommand(command);
            break;
        case CommandType.IF_GOTO:
            lines = getIfGotoCommand(command);
            break;
        case CommandType.FUNCTION:
            lines = getFunctionCommand(command);
            break;
        case CommandType.CALL:
            lines = getCallCommand(command);
            break;
        case CommandType.RETURN:
            lines = getReturnCommand(command);
            break;
        default:
            throw new Error(`Invalid command at line ${command.lineNumber}: "${command.line}"`);
    }
    return ['// ' + command.line, ...lines];
}

function getPushCommand(command: VMCommand): string[] {
    switch (command.arg1asMemorySegment) {
        case MemorySegment.CONSTANT:
            return [`@${command.arg2}`, ...PUSH_A_TO_SP];
        case MemorySegment.LOCAL:
        case MemorySegment.ARGUMENT:
        case MemorySegment.THIS:
        case MemorySegment.THAT:
            return [
                `@${command.arg2}`,
                'D=A',
                `@${SEGMENT_TO_SYMBOL.get(command.arg1asMemorySegment)}`,
                'A=M+D',
                ...PUSH_M_TO_SP,
            ];
        case MemorySegment.TEMP:
            return [`@R${TEMP_REG_OFFSET + command.arg2!}`, ...PUSH_M_TO_SP];
        case MemorySegment.POINTER:
            return [command.arg2 === 0 ? '@THIS' : '@THAT', ...PUSH_M_TO_SP];
        case MemorySegment.STATIC:
            return [`@${command.name}.${command.arg2}`, ...PUSH_M_TO_SP];
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
                'M=D',
            ];
        case MemorySegment.TEMP:
            return [...POP_SP_TO_D, `@R${TEMP_REG_OFFSET + command.arg2!}`, 'M=D'];
        case MemorySegment.POINTER:
            return [...POP_SP_TO_D, command.arg2 === 0 ? '@THIS' : '@THAT', 'M=D'];
        case MemorySegment.STATIC:
            return [...POP_SP_TO_D, `@${command.name}.${command.arg2}`, 'M=D'];
        default:
            throw new Error(`Invalid command: ${command}`);
    }
}

function getArithmeticUnaryCommand(op: string): string[] {
    return [...TOP_SP, `M=${op}`];
}

function getArithmeticBinaryCommand(op: string): string[] {
    return [...POP_SP_TO_D, ...TOP_SP, `M=${op}`];
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

function getLabelCommand(command: VMCommand): string[] {
    return [`(${command.name}_${command.arg1asString})`];
}

function getGotoCommand(command: VMCommand): string[] {
    return [`@${command.name}_${command.arg1asString}`, '0;JMP'];
}

function getIfGotoCommand(command: VMCommand): string[] {
    return [...POP_SP_TO_D, `@${command.name}_${command.arg1asString}`, 'D;JNE'];
}

function getFunctionCommand(command: VMCommand): string[] {
    var lines = [
        // put label to call the function
        `(FUNC_${command.arg1asString})`,
    ];
    if (command.arg2 > 0) {
        // init local variables to 0 and increment SP
        lines = lines.concat([
            '@SP',
            'A=M',
            ...repeatLines(['M=0', 'A=A+1'], command.arg2),
            'D=A',
            '@SP',
            'M=D',
        ]);
    }
    return lines;
}

function getCallCommand(command: VMCommand): string[] {
    const returnLabel = `FUNC_RETURN_${command.arg1asString}_line${command.lineNumber}`;
    return [
        // push return address
        `@${returnLabel}`,
        ...PUSH_A_TO_SP,
        // push memory segments
        '@LCL',
        ...PUSH_M_TO_SP,
        '@ARG',
        ...PUSH_M_TO_SP,
        '@THIS',
        ...PUSH_M_TO_SP,
        '@THAT',
        ...PUSH_M_TO_SP,
        // set LCL
        'D=M', // M is already on SP
        '@LCL',
        'M=D',
        // set ARG
        `@${5 + command.arg2}`,
        'D=A',
        '@SP',
        'D=M-D',
        '@ARG',
        'M=D',
        // jump to the function
        `@FUNC_${command.arg1asString}`,
        '0;JMP',
        // add return label
        `(${returnLabel})`,
    ];
}

function getReturnCommand(command: VMCommand): string[] {
    let lines: string[] = [
        // store return value in R13 to later push it to SP
        ...POP_SP_TO_D,
        ...STORE_D_IN_R13,
        // store ARG in R14 to later return SP location
        '@ARG',
        'D=M',
        '@R14',
        'M=D',
        // put SP before locals
        '@LCL',
        'D=M',
        '@SP',
        'M=D',
        // restore memory segments
        ...POP_SP_TO_D,
        '@THAT',
        'M=D',
        ...POP_SP_TO_D,
        '@THIS',
        'M=D',
        ...POP_SP_TO_D,
        '@ARG',
        'M=D',
        ...POP_SP_TO_D,
        '@LCL',
        'M=D',
        // store return address in R15 for the jump at the end
        ...POP_SP_TO_D,
        '@R15',
        'M=D',
        // put SP back before the call
        '@R14',
        'D=M',
        '@SP',
        'M=D',
        // push return value to the stack
        '@R13',
        ...PUSH_M_TO_SP,
        // jump to the return address stored in R15
        '@R15',
        'A=M',
        '0;JMP',
    ];
    return lines;
}

function repeatLines(lines: string[], count: number): string[] {
    if (count < 1) {
        return [];
    }
    let repeatLines = lines;
    for (let i = 0; i < count - 1; i++) {
        repeatLines = repeatLines.concat(lines);
    }
    return repeatLines;
}
