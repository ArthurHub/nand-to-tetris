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
    CALL = 'call',
}

export enum MemorySegment {
    LOCAL = 'local',
    ARGUMENT = 'argument',
    THIS = 'this',
    THAT = 'that',
    POINTER = 'pointer',
    TEMP = 'temp',
    CONSTANT = 'constant',
    STATIC = 'static',
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
    KBD = 24576,
}

export class VMCommand {
    constructor(
        public readonly name: string,
        public readonly line: string,
        public readonly lineNumber: number,
        public readonly command: CommandType,
        public readonly arg1?: string | MemorySegment | undefined,
        public readonly arg2?: number
    ) {}

    public get arg1asMemorySegment(): MemorySegment {
        return this.arg1 as MemorySegment;
    }

    public get arg1asString(): string {
        return this.arg1 as string;
    }
}
