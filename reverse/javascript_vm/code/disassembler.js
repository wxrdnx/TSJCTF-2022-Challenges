const fs = require('fs');

// Constants
const FILE_LEN = 1052;
const TEXT_START = 0x0;
const TEXT_END = 0x236;
const DESTINATION_SHIFT = 4;
const SOURCE_SHIFT = 6;
const LONG_ADDRESS_SHIFT = 6;
const ADDRESS_SHIFT = 8;
const NOA = { NOP: 0, RET: 1, SYS: 2, HLT: 3 };
const JUMP = { EQ: 0, NEQ: 1, LT: 2, GT: 3, LTE: 4, GTE: 5, ZER: 6, NZE: 7 };
const ARITHMETIC = { ADD: 0, SUB: 1, MUL: 2, DIV: 3, INC: 4, DEC: 5, LSF: 6, RSF: 7, AND: 8, OR: 9, XOR: 10, NOT: 11 };

// Decode grithmetic instructions

const decodeAluArguments = (high8, rs, rd) => {
    const arithmeticOperation = (high8 & 0b00001111);
    const resultMode = (high8 & 0b00010000) >> 4;
    const shiftAmount = (high8 & 0b11100000) >> 5;
    const resultRegister = (resultMode === ARITHMETIC.DESTINATION_MODE) ? rd : rs;
    return [arithmeticOperation, resultRegister, shiftAmount];
}

// Parse general instructions

const splitInstruction = (instruction) => [
    (instruction & 0b0000000000001111),
    (instruction & 0b0000000000110000) >> DESTINATION_SHIFT,
    (instruction & 0b0000000011000000) >> SOURCE_SHIFT,
    (instruction & 0b1111111100000000) >> ADDRESS_SHIFT,
    (instruction & 0b1111111111000000) >> LONG_ADDRESS_SHIFT
];

const REGISTERS = ['REGA', 'REGB', 'REGC', 'REGD'];
const INSTRUCTION_MAP = ['MVR', 'MVV', 'LDR', 'STA', 'ATH', 'CAL', 'JCP', 'PSH', 'POP', 'JMP', 'JMR', 'LDA', 'STR', 'NOA']; 
const NOA_MAP = ['NOP', 'RET', 'SYS', 'HLT'];
const JUMP_MAP = ['JEQ', 'JNE', 'JLT', 'JGT', 'JLE', 'JGE', 'JZE', 'JNE'];
const MOVE_MAP = ['MVI', 'ADI', 'MUI', 'AUI'];
const ARITHMETIC_MAP = ['ADD', 'SUB', 'MUL', 'DIV', 'INC', 'DEC', 'LSF', 'RSF', 'AND', 'OR', 'XOR', 'NOT'];

fs.open('chall.bin', 'r', (err, fd) => {
    if (err) {
        throw new Error(`chall.bin not found.`);
        return;
    }
    const buffer = Buffer.alloc(FILE_LEN);
    fs.read(fd, buffer, 0, FILE_LEN, 0, (err, num) => {
        // .TEXT section 
        // Dump Assembly
        process.stdout.write('.TEXT SECTION\n\n');
        for (let offset = TEXT_START; offset < TEXT_END; offset += 2) {
            const instruction = (buffer[offset + 1] << 8) | buffer[offset]; // instruction value (16 bits)
            const [opcode, rd, rs, high8, high10] = splitInstruction(instruction); // parse instructions
            const namedOpcode = INSTRUCTION_MAP[opcode];

            // Print address
            process.stdout.write(Math.floor(offset / 2).toString(16).padStart(4, '0'));
            process.stdout.write('  ');

            // Print instructions
            // See https://github.com/francisrstokes/16bitjs/ for more details
            switch (namedOpcode) {
                    // D
                case 'CAL':
                case 'POP':
                case 'JMR':
                    process.stdout.write(namedOpcode + ' ' + REGISTERS[rd]);
                    break;

                    // S
                case 'PSH':
                    process.stdout.write(namedOpcode + ' ' + REGISTERS[rs]);
                    break;

                    // D, S, A, O
                case 'JCP':
                    const jumpAddress = REGISTERS[high8 & 0x3];
                    process.stdout.write(JUMP_MAP[high8 >> 2] + ' ' + REGISTERS[rd] +
                        ' ' + REGISTERS[rs] + ' ' + jumpAddress.toString(16).padStart(4, '0'));
                    break;

                    // M
                case 'JMP':
                    const jumpOffset = (instruction >> 4);
                    process.stdout.write(namedOpcode + ' ' + jumpOffset.toString(16).padStart(4, '0'));
                    break;

                    // D, S, V
                case 'MVR':
                case 'LDR':
                case 'STR':
                    process.stdout.write(namedOpcode + ' ' + REGISTERS[rd] + ' ' + REGISTERS[rs] + ' ' + high8.toString(16).padStart(4, '0'));
                    break;
                    // D, V, O
                case 'MVV': 
                    process.stdout.write(MOVE_MAP[high10 & 0x3] + ' ' + REGISTERS[rd] + ' ' + high8.toString(16).padStart(4, '0'));
                    break;

                    // D, M
                case 'LDA':
                case 'STA':
                    process.stdout.write(namedOpcode + ' ' + REGISTERS[rd] + ' ' + high10.toString(16).padStart(4, '0'));
                    break;

                    // D, S, O, M, B
                case 'ATH':
                    const [ arithmeticOperation, resultRegister, shiftAmount ] = decodeAluArguments(high8.toString(16).padStart(4, '0'), rs, rd);
                    switch (arithmeticOperation) {
                        case ARITHMETIC.ADD:
                        case ARITHMETIC.SUB:
                        case ARITHMETIC.MUL:
                        case ARITHMETIC.DIV:
                        case ARITHMETIC.AND:
                        case ARITHMETIC.OR:
                        case ARITHMETIC.XOR:
                        case ARITHMETIC.NOT:
                            process.stdout.write(ARITHMETIC_MAP[arithmeticOperation] + ' ' + REGISTERS[rd] + ' ' + REGISTERS[rs]);
                            break;
                        case ARITHMETIC.INC:
                        case ARITHMETIC.DEC:
                            process.stdout.write(ARITHMETIC_MAP[arithmeticOperation] + ' ' + REGISTERS[rd]);
                            break;

                        case ARITHMETIC.LSF:
                        case ARITHMETIC.RSF:
                            process.stdout.write(ARITHMETIC_MAP[arithmeticOperation] + ' ' + REGISTERS[rd] + ' ' + shiftAmount.toString(16).padStart(4, '0'));
                            break;
                    }
                    break;

                    // O
                case 'NOA':
                    process.stdout.write(NOA_MAP[(instruction & 0xf0) >> 4]);
                    break;

                    // owo
                default:
                    throw new Error(`Unknown opcode ${opcode}. Exiting...`);
                    break;
            }
            process.stdout.write('\n');
        }

        process.stdout.write('\n\n');

        // .DATA section
        // The .DATA section starts at TEXT_END, but the offset counts from the start of the page.
        process.stdout.write('.DATA DUMP\n\n');
        for (let offset = 0x200; offset < FILE_LEN; offset += 2) {
            // Print index
            const index = Math.floor(offset / 2) - 0x100; // start at second page, so minus 0x100
            if (index % 16 == 0) {
                process.stdout.write(index.toString(16).padStart(4, '0'));
                process.stdout.write('  ');
            }
            if (offset < TEXT_END) {
                process.stdout.write('....');
            } else {
                const data = (buffer[offset + 1] << 8) | buffer[offset];
                process.stdout.write(data.toString(16).padStart(4, '0'));
            }
            if (index % 16 == 15) {
                process.stdout.write('\n');
            } else {
                process.stdout.write(' ');
            }
        }
        process.stdout.write('\n');
    });
});
