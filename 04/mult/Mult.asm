// This file is part of www.nand2tetris.org
// and the book "The Elements of Computing Systems"
// by Nisan and Schocken, MIT Press.
// File name: projects/04/Mult.asm

// Multiplies R0 and R1 and stores the result in R2.
// (R0, R1, R2 refer to RAM[0], RAM[1], and RAM[2], respectively.)
//
// This program only needs to handle arguments that satisfy
// R0 >= 0, R1 >= 0, and R0*R1 < 32768.

@R2
M = 0

// check if R0 > R1 to set left > right
@R0
D = M
@R1
D = D-M
@R0_BIGGER
D ; JGT

// R1 is bigger
@R1
D = M
@left
M = D
@R0
D = M
@right
M = D
@LOOP
0 ; JMP

(R0_BIGGER) // R0 is bigger
@R0
D = M
@left
M = D
@R1
D = M
@right
M = D

(LOOP)
@right
D = M
@END
D ; JLE

@left
D = M

@R2
M = M+D

@right
M = M-1

@LOOP
0 ; JMP

(END)
@END
0 ; JMP