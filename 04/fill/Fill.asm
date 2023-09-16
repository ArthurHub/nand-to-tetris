// This file is part of www.nand2tetris.org
// and the book "The Elements of Computing Systems"
// by Nisan and Schocken, MIT Press.
// File name: projects/04/Fill.asm

// Runs an infinite loop that listens to the keyboard input.
// When a key is pressed (any key), the program blackens the screen,
// i.e. writes "black" in every pixel;
// the screen should remain fully black as long as the key is pressed. 
// When no key is pressed, the program clears the screen, i.e. writes
// "white" in every pixel;
// the screen should remain fully clear as long as no key is pressed.


(INPUTLOOP)
// read keyboard
@KBD
D = M

// if D>0 then a key is pressed, pain screen black, otherwise paint white
@BLACK
D ; JGT


// set color to white and jump to coloring loop
(WHITE)
@color
M = 0
@COLORFLOW
0 ; JMP

// set color to black and proceed to coloring loop
(BLACK)
@color
M = -1


// loop to color the screen
// run the loop only if the first pixel is different than the requested color
(COLORFLOW)
@SCREEN
D = M
@color
D = M-D
@INPUTLOOP
D ; JEQ

// init loop indexes
@SCREEN
D = A
@addr
M = D
@8192
D = D+A
@end
M = D

// loop to color the screen
(COLORLOOP) 
@addr
D = M
@end
D = M-D
@INPUTLOOP
D ; JEQ

@color
D = M
@addr
A = M
M = D

@addr
M = M+1
@COLORLOOP
0 ; JEQ