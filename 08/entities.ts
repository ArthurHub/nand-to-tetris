export enum CommandType {
    PUSH = 'push',
    POP = 'pop',
    ADD = 'add',
    SUB = 'sub',
    NEG = 'neg',
    AND = 'and',
    OR = 'or',
    NOT = 'not',
    EQ = 'eq',
    GT = 'gt',
    LT = 'lt',
    LABEL = 'label',
    GOTO = 'goto',
    IF_GOTO = 'if-goto',
    FUNCTION = 'function',
    RETURN = 'return',
    CALL = 'call'
}

export enum MemorySegment {
    LOCAL = 'local',
    ARGUMENT = 'argument',
    THIS = 'this',
    THAT = 'that',
    POINTER = 'pointer',
    TEMP = 'temp',
    CONSTANT = 'constant',
    STATIC = 'static'
}
// ((10+45)-21) - (36+36) + 510
export enum NamedMemory {
    // stack registers
    SP = 0,
    LCL = 1,
    ARG = 2,
    THIS = 3,
    THAT = 4,
    // 8 registers to hold temporary values
    R5 = 5,
    R6 = 6,
    R7 = 7,
    R8 = 8,
    R9 = 9,
    R10 = 10,
    R11 = 11,
    R12 = 12,
    // 3 general purpose registers
    R13 = 13,
    R14 = 14,
    R15 = 15,
    // screen and keyboard
    SCREEN = 16384,
    KBD = 24576
}

export class VMCommand {
    private _name!: string;
    private _line!: string;
    private _lineNum!: number;
    private _command!: CommandType;
    private _arg1: string | MemorySegment | undefined;
    private _arg2: number | undefined;

    constructor(name: string, line: string, lineNum: number, command: CommandType, arg1?: string | MemorySegment, arg2?: number) {
        this._name = name;
        this._line = line;
        this._lineNum = lineNum;
        this._command = command;
        this._arg1 = arg1;
        this._arg2 = arg2;
    }

    public get name(): string {
        return this._name;
    }

    public get line(): string {
        return this._line;
    }

    public get lineNumber(): number {
        return this._lineNum;
    }

    public get command(): CommandType {
        return this._command;
    }

    public get arg1asMemorySegment(): MemorySegment {
        return this._arg1 as MemorySegment;
    }

    public get arg1asString(): string {
        return this._arg1 as string;
    }

    public get arg2(): number | undefined {
        return this._arg2;
    }
}