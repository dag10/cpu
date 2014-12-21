A Logisim CPU
===

This is a simple MIPS-inspired CPU created in [Logisim](http://www.cburch.com/logisim), a logic circuit simulator. It uses microcode, which is generated from a microassembler I wrote in javascript. I created this as a guess as to how microcode works, as I was stuck on an airplane. Most of this was created on a 9-hour flight.

Details
---

The design is documented in arch.txt, and summarized here.

It is a multi-cycle CPU with an 8 general purpose registers. The word size is 16 bits, and the address bus is also 16 bits. Instructions are one word, but some instrutions have an immediate value which occupies the following word.

The instruction format is as follows:
 * 7-bit opcode
 * 3-bit rd (destination register)
 * 3-bit rs (source register 1)
 * 3-bit rt (source register 2)
 
Instructions
---

System:

```
0x00 NOOP
```

Memory:

```
0x04 LW   rd, rs              # Load word into $rd from address in $rs
0x05 SW   rs  rt              # Store word from $rt into address in $rs
0x06 LI   rd, imm             # Load immediate value into $rd
0x07 LWO  rd, rs, imm         # Load word into $rd from address in ($rs + imm)
0x08 SWO  rs, rt, imm         # Store word from $rt into address in ($rs + imm)
```

ALU:

```
0x10 ADD  rd, rs, rt          # $rd = $rs + $rt
0x11 SUB  rd, rs, rt          # $rd = $rs - $rt
 
0x12 AND  rd, rs, rt          # $rd =   $rs & $rt
0x13 NAND rd, rs  rt          # $rd = ~($rs & $rt)
0x14 OR   rd, rs, rt          # $rd =   $rs | $rt
0x15 NOR  rd, rs, rt          # $rd = ~($rs | $rt)
0x16 XOR  rd, rs, rt          # $rd =   $rs ^ $rt

0x18 SFTL rd, rs, imm         # $rd = $rs << imm
0x19 SFTR rd, rs, imm         # $rd = $rs >> imm

0x1A ADDI rd, rs, imm         # $rd = $rs + imm
0x1B SUBI rd, rs, imm         # $rd = $rs - imm

0x20 INC  rd, rs              # $rd = $rs + 1
0x21 DEC  rd, rs              # $rd = $rs - 1
```

Jumping:

```
0x30 JMP  imm                 # $pc = imm
0x31 JR   rs                  # $pc = $rs
0x32 JPI  imm                 # $pc = value at imm
0x33 JRI  rs                  # $pc = value at $rs
```

Branching:

```
0x40 BEQ  rs, rt, imm         # $pc = imm if $rs == $rt
0x41 BZ   rs, imm             # $pc = imm if $rs == 0
0x42 BNG  rs, imm             # $pc = imm if $rs < 0
```

Microassembler
---
I feel that Javascript is a silly choice for a language to write the microassembler in. Even more silly is that the microassembly is a Javascript object embedded in the microassembler source itself! I would normally write this sort of thing in Python, but while stuck on an airplane I felt like whipping this up in Javascript for some unknown reason.

Run the microassembler.js file with [node.js](http://nodejs.org), or run it in a webpage if you choose.
