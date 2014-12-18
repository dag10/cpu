/*jshint es5: true */

/**
 * The microassembly to assemble.
 * Proper documentation to come... eventually.
 */
var masm = {

  /* ==== Basic Microcode Instructions ==== */

  // Initial state, for loading initial PC.
  // No operation.
  'INIT': {
    control: {},
    next: 'FETCH_DECODE',
  },

  // Reads off of the data bus into the instruction register.
  // IR = *PC
  // Branches based on opcode.
  'FETCH_DECODE': {
    control: {
      address_select: 0, // PC
      read: true,
      ir_write: true,
    },
    next: [
      {
        opcodes: ['NOOP'],
        state: 'INC_PC',
      },
      {
        opcodes: ['LI'],
        state: 'LOAD_IMMEDIATE',
      },
      {
        opcodes: ['JMP'],
        state: 'JUMP_IMMEDIATE',
      },
      {
        opcodes: ['JR'],
        state: 'JUMP_REGISTER',
      },
      {
        opcodes: ['LW'],
        state: 'LOAD_WORD',
      },
      {
        opcodes: ['SW'],
        state: 'STORE_WORD',
      },
      {
        opcodes: ['BEQ'],
        state: 'BRANCH_IF_EQUAL',
      },
      {
        opcodes: ['BZ, BNG'],
        state: 'BRANCH_ZERO_OR_NEGATIVE',
      },
      {
        opcodes: ['ADDI', 'SUBI', 'SFTL', 'SFTR', 'JPI', 'LWO', 'SWO'],
        state: 'FETCH_IMMEDIATE',
      },
      {
        opcodes: ['JRI'],
        state: 'JUMP_INDIRECT_FROM_RS',
      },
      {
        opcodes: ['ADD', 'SUB', 'AND', 'NAND', 'OR', 'NOR', 'XOR'],
        state: 'ALU_INSTR',
      },
      {
        opcodes: ['INC', 'DEC'],
        state: 'ALU_OP_ONE',
      },
      {
        // Default, behave like no-op.
        state: 'INC_PC',
      }
    ],
  },

  // Increments the program counter then continues with fetch.
  // PC = PC + 1
  'INC_PC': {
    control: {
      a_select: 1, // PC
      b_select: 1, // 1
      alu_op_select: 0, // manual opcode
      alu_op: 0, // add
      pc_select: 0, // result
      pc_write: true,
    },
    next: 'FETCH_DECODE',
  },

  // Increments the program counter by two, the continues with fetch.
  // PC = PC + 2
  'INC_PC_TWICE': {
    control: {
      a_select: 1, // PC
      b_select: 2, // 2
      alu_op_select: 0, // manual opcode
      alu_op: 0, // add
      pc_select: 0, // result
      pc_write: true,
    },
    next: 'FETCH_DECODE',
  },

  /* ==== Utility Steps ==== */

  // Fetches an immediate value into the IMM register, then branches.
  // IMM = *(PC + 1)
  'FETCH_IMMEDIATE': {
    control: {
      a_select: 1, // PC
      b_select: 1, // 1
      alu_op_select: 0, // manual opcode
      alu_op: 0, // add
      address_select: 2, // result
      read: true,
      imm_write: true,
    },
    next: [
      {
        opcodes: ['ADDI'],
        state: 'ADD_IMMEDIATE',
      },
      {
        opcodes: ['SUBI'],
        state: 'SUBTRACT_IMMEDIATE',
      },
      {
        opcodes: ['SFTL', 'SFTR'],
        state: 'ALU_INSTR_IMM',
      },
      {
        opcodes: ['JPI'],
        state: 'JUMP_INDIRECT',
      },
      {
        opcodes: ['LWO'],
        state: 'LOAD_WORD_WITH_OFFSET',
      },
      {
        opcodes: ['SWO'],
        state: 'STORE_WORD_WITH_OFFSET',
      },
    ],
  },

  /* ==== Instruction Steps ==== */

  // Stores IMM value in RD register.
  // RD = IMM
  'LOAD_IMMEDIATE': {
    control: {
      a_select: 1, // PC
      b_select: 1, // 1
      alu_op_select: 0, // manual opcode
      alu_op: 0, // add
      address_select: 2, // result
      read: true,
      rd_input_select: 0, // data bus
      register_write: true,
    },
    next: [
      {
        state: 'INC_PC_TWICE',
      },
    ]
  },

  // Fetches the value at the address in RS, storing it in PC.
  // PC = *RS
  'JUMP_INDIRECT_FROM_RS': {
    control: {
      address_select: 1, // RS
      read: true,
      pc_select: 2, // data bus
      pc_write: true,
    },
    next: 'FETCH_DECODE',
  },

  // Loads a word with an added offset.
  // RD = *(RS + IMM)
  'LOAD_WORD_WITH_OFFSET': {
    control: {
      a_select: 0, // RS
      b_select: 3, // IMM
      alu_op_select: 0, // manual opcode
      alu_op: 0, // add
      address_select: 2, // result
      rd_input_select: 0, // data bus
      register_write: true,
    },
    next: 'INC_PC_TWICE',
  },

  // Stores a word with an added offset.
  // *(RS + IMM) = RT
  'STORE_WORD_WITH_OFFSET': {
    control: {
      a_select: 0, // RS
      b_select: 3, // IMM
      alu_op_select: 0, // manual opcode
      alu_op: 0, // add
      address_select: 2, // result
      write: true,
    },
    next: 'INC_PC_TWICE',
  },

  // Jumps to the address in the IMM register.
  // PC = *(PC + 1)
  'JUMP_IMMEDIATE': {
    control: {
      a_select: 1, // PC
      b_select: 1, // 1
      alu_op_select: 0, // manual opcode
      alu_op: 0, // add
      address_select: 2, // result
      read: true,
      pc_select: 2, // data bus
      pc_write: true,
    },
    next: 'FETCH_DECODE',
  },

  // Jumps to a value in the RS register.
  // PC = RS
  'JUMP_REGISTER': {
    control: {
      pc_select: 1, // RS
      pc_write: true,
    },
    next: 'FETCH_DECODE',
  },

  // Jumps to the value at the address in IMM.
  // PC = *IMM
  'JUMP_INDIRECT': {
    control: {
      address_select: 3, // IMM
      read: true,
      pc_select: 2, // data bus
      pc_write: true,
    },
    next: 'FETCH_DECODE',
  },

  // Stores a word from the RD register into the address in RS.
  // RD = *RS
  'LOAD_WORD': {
    control: {
      address_select: 1, // RS
      read: true,
      rd_input_select: 0, // data bus
      register_write: true,
    },
    next: 'INC_PC',
  },

  // Stores a word from the RT register into the address in RS.
  // *RS = RT
  'STORE_WORD': {
    control: {
      address_select: 1, // RS
      write: true,
    },
    next: 'INC_PC',
  },

  // Subtracts RS and RT, storing the zero and negative flags.
  // ZERO = (rs - rt) == 0
  // MINUS = (rs - rt) < 0
  // If ZERO: goto JUMP_IMMEDIATE
  // Else:    goto INC_PC_TWICE
  'BRANCH_IF_EQUAL': {
    control: {
      a_select: 0, // RS
      b_select: 0, // RT
      alu_op_select: 0, // manual opcode
      alu_op: 1, // subtract
      flags_write: true,
    },
    next: [
      {
        opcodes: ['BEQ'],
        zero: true,
        state: 'JUMP_IMMEDIATE',
      },
      {
        opcodes: ['BEQ'],
        zero: false,
        state: 'INC_PC_TWICE',
      },
    ],
  },

  // ZERO = rs == 0
  // MINUS = rs < 0
  // BZ: If ZERO: goto JUMP_IMMEDIATE
  // BZ: Else:    goto INC_PC_TWICE
  // BNG: If NEGATIVE: goto JUMP_IMMEDIATE
  // BNG: Else:        goto INC_PC_TWICE
  'BRANCH_ZERO_OR_NEGATIVE': {
    control: {
      a_select: 0, // RS
      alu_op_select: 0, // manual opcode
      alu_op: 0xA, // passthrough A
      flags_write: true,
    },
    next: [
      {
        opcodes: ['BZ'],
        zero: true,
        state: 'JUMP_IMMEDIATE',
      },
      {
        opcodes: ['BZ'],
        zero: false,
        state: 'INC_PC_TWICE',
      },
      {
        opcodes: ['BNG'],
        negative: true,
        state: 'JUMP_IMMEDIATE',
      },
      {
        opcodes: ['BNG'],
        negative: false,
        state: 'INC_PC_TWICE',
      },
    ],
  },

  // Adds immediate value to a register, storing it.
  // RD = RS + IMM
  'ADD_IMMEDIATE': {
    control: {
      a_select: 0, // RS
      b_select: 3, // IMM
      alu_op_select: 0, // manual opcode
      alu_op: 0, // add
      rd_input_select: 2, // result
      register_write: true,
    },
    next: 'INC_PC_TWICE',
  },

  // Subtracts immediate value to a register, storing it.
  // RD = RS - IMM
  'SUBTRACT_IMMEDIATE': {
    control: {
      a_select: 0, // RS
      b_select: 3, // IMM
      alu_op_select: 0, // manual opcode
      alu_op: 1, // subtract
      rd_input_select: 2, // result
      register_write: true,
    },
    next: 'INC_PC_TWICE',
  },

  // Instruction involving the ALU, taking the ALU opcode from instr opcode.
  // RD = RS <op> RT
  'ALU_INSTR': {
    control: {
      a_select: 0, // RS
      b_select: 0, // RT
      alu_op_select: 1, // instruction's opcode
      rd_input_select: 2, // result
      register_write: true,
    },
    next: 'INC_PC',
  },

  // Instruction involving the ALU and Immediate value.
  // RD = RS <op> IMM
  'ALU_INSTR_IMM': {
    control: {
      a_select: 0, // RS
      b_select: 3, // IMM
      alu_op_select: 1, // instruction's opcode
      rd_input_select: 2, // result
      register_write: true,
    },
    next: 'INC_PC_TWICE',
  },
  
  // Instruction involving the ALU with the literal 1.
  // RD = RS <op> 1
  'ALU_OP_ONE': {
    control: {
      a_select: 0, // RS
      b_select: 1, // 1
      alu_op_select: 1, // instruction's opcode
      rd_input_select: 2, // result
      register_write: true,
    },
    next: 'INC_PC',
  },
};


/** Length of state code. */
var state_bitlength = 5;


/** Length of opcodes. */
var opcode_bitlength = 7;


/** Default control state values. */
var default_control_states = {
  read: false,
  write: false,
  register_write: false,
  imm_write: false,
  ir_write: false,
  pc_write: false,
  flags_write: false,
  address_select: 0,
  b_select: 0,
  pc_select: 0,
  rd_input_select: 0,
  a_select: 0,
  alu_op_select: 0,
  alu_op: 0,
};


/**
 * Mapping of opcodes to their value.
 */
var opcodes = {
  'NOOP': 0x00,

  'LW'  : 0x04,
  'SW'  : 0x05,
  'LI'  : 0x06,
  'LWO' : 0x07,
  'SWO' : 0x08,

  'ADD' : 0x10,
  'SUB' : 0x11,

  'AND' : 0x12,
  'NAND': 0x13,
  'OR'  : 0x14,
  'NOR' : 0x15,
  'XOR' : 0x16,
  
  'SFTL': 0x18,
  'SFTR': 0x19,

  'ADDI': 0x1A,
  'SUBI': 0x1B,

  'INC' : 0x20,
  'DEC' : 0x21,

  'JMP' : 0x30,
  'JR'  : 0x31,
  'JPI' : 0x32,
  'JRI' : 0x33,

  'BEQ' : 0x40,
  'BZ'  : 0x41,
  'BNG' : 0x42,
};

var opcode_names_for_code = {};
Object.keys(opcodes).forEach(function(name) {
  opcode_names_for_code[opcodes[name]] = name;
});


/**
 * Gets a list of states for microassembly.
 * @param masm Microassembly object.
 * @return Array of state strings.
 */
function get_states(masm) {
  return Object.keys(masm);
  // TODO: Raise error if any state is not a string.
}


/**
 * Formats a number as a padded string.
 */
function num_padded(val, digits, base) {
  var str = Number(val).toString(base);
  while (str.length < digits) {
    str = '0' + str;
  }
  return str;
}


/**
 * TODO: docs
 */
function create_decision_combinations() {
  var combinations = {};

  Object.keys(opcodes).forEach(function(opcode_name) {
    combinations[opcode_name] = [
      // nonzero
      [
        null, // non-negative
        null, // negative
      ],

      // zero
      [
        null, // non-negative
        null, // negative
      ],
    ];
  });

  return combinations;
}


/**
 * TODO: docs
 */
function set_next_state(
    state_combinations, opcode, zero, negative, next_state) {
  state_combinations[opcode][zero ? 1 : 0][negative ? 1 : 0] = next_state;
}


/**
 * TODO: docs
 */
function get_next_state(state_combinations, opcode, zero, negative) {
  return state_combinations[opcode][zero ? 1 : 0][negative ? 1 : 0];
}


/**
 * TODO: docs
 */
function create_state(state) {
  var ret_state = {};
  var default_state_names = Object.keys(default_control_states);

  default_state_names.forEach(function(key) {
    ret_state[key] = default_control_states[key];
  });

  Object.keys(state).forEach(function(key) {
    if (default_state_names.indexOf(key) < 0) {
      throw new Error('Control output ' + key + ' unknown.');
    } else {
      ret_state[key] = state[key];
    }
  });

  return ret_state;
}


/**
 * Assembles a microassembly object.
 * @param masm Microassembly to assemble.
 * @return Object containing decision and control microcode.
 */
function assemble(masm) {
  var decision = {};
  var control = {};

  // Get list of states.
  var state_names = get_states(masm);

  // Create decision tree.
  for (var i = 0; i < state_names.length; i++) {
    var state_name = state_names[i];
    decision[state_name] = create_decision_combinations();
  }

  // Evaluate each next state in masm.
  state_names.forEach(function(state) {
    var tree = decision[state];
    var next = masm[state]['next'];

    // TODO: Raise error if no next.

    // If state always has a particular next state:
    if (typeof next === 'string') {
      Object.keys(opcodes).forEach(function(opcode) {
        for (var zero = 0; zero <= 1; zero++) {
          for (var negative = 0; negative <= 1; negative++) {
            set_next_state(tree, opcode, zero, negative, next);
          }
        }
      });
    }

    // If state is an array of conditional next states
    else if (Array.isArray(next)) {
      // Add final condition to make self as next state if all conditions fail.
      next.push({
        state: state,
      });

      next.forEach(function(condition) {
        var cond_keys = Object.keys(condition);
        var next_state = condition.state;
        
        Object.keys(opcodes).forEach(function(opcode) {
          if (condition.opcodes && condition.opcodes.indexOf(opcode) < 0) {
            return;
          }

          for (var zero = 0; zero <= 1; zero++) {
            if (condition.zero !== undefined &&
                !!zero != condition.zero) {
              continue;
            }

            for (var negative = 0; negative <= 1; negative++) {
              if (condition.negative !== undefined &&
                  !!negative != condition.negative) {
                continue;
              }

              var existing_next_state = get_next_state(
                tree, opcode, zero, negative);

              if (!existing_next_state) {
                set_next_state(tree, opcode, zero, negative, next_state);
              }
            }
          }
        });
      });
    }

    // TODO: Raise error if unexpected next type.
  });

  // Evaluate each state's control.
  state_names.forEach(function(state) {
    control[state] = create_state(masm[state].control);
  });

  return {
    states: state_names,
    decision: decision,
    control: control,
  };
}


function print_decision_code(microcode) {
  var num_addrs = Math.pow(2, opcode_bitlength + 1 + 1 + state_bitlength);
  var decision_hex_str = '';

  for (var addr = 0; addr < num_addrs; addr++) {
    var current_state_code = addr & 0x1F;
    var state_name = microcode.states[current_state_code];

    var negative = !!((addr >> 5) & 0x01);
    var zero = !!((addr >> 6) & 0x01);

    var opcode = (addr >> 7) & 0x7F;
    var opcode_name = opcode_names_for_code[opcode];

    var state_tree = microcode.decision[state_name];

    var valid_combination = (
      typeof opcode_name !== 'undefined' &&
      typeof state_tree !== 'undefined');

    var next_state;
    if (valid_combination) {
      var next_name = get_next_state(state_tree, opcode_name, zero, negative);
      next_state = microcode.states.indexOf(next_name);
    } else {
      // If current state does not exist, just keep returning to current state.
      next_state = current_state_code;
    }

    var next_state_hex = Number(next_state).toString(16).toUpperCase();
    if (next_state_hex.length === 1) {
      next_state_hex = '0' + next_state_hex;
    }

    decision_hex_str += next_state_hex + ' ';
  }

  console.log(decision_hex_str);
}

/**
 * TODO: docs
 */
function print_control_code(microcode) {
  var max_states = Math.pow(2, state_bitlength);
  var num_states = microcode.states.length;
  var control_str = '';

  for (var state = 0; state < max_states && state < num_states; state++) {
    var state_name = microcode.states[state];
    var control = microcode.control[state_name];

    var val = 0x00;

    val <<= 4;
    val |= control.alu_op & 0x0F;

    val <<= 1;
    val |= control.alu_op_select & 0x01;

    val <<= 1;
    val |= control.a_select & 0x01;

    val <<= 2;
    val |= control.rd_input_select & 0x03;

    val <<= 2;
    val |= control.pc_select & 0x03;

    val <<= 2;
    val |= control.b_select & 0x03;

    val <<= 2;
    val |= control.address_select & 0x03;

    val <<= 1;
    val |= control.flags_write ? 1 : 0;

    val <<= 1;
    val |= control.pc_write ? 1 : 0;

    val <<= 1;
    val |= control.ir_write ? 1 : 0;

    val <<= 1;
    val |= control.imm_write ? 1 : 0;

    val <<= 1;
    val |= control.register_write ? 1 : 0;

    val <<= 1;
    val |= control.write ? 1 : 0;

    val <<= 1;
    val |= control.read ? 1 : 0;
    
    control_str += num_padded(val, 8, 16).toUpperCase() + ' ';
  }

  console.info(control_str);
};


var microcode = assemble(masm);

if (process.argv.indexOf('decision') >= 0) {
  print_decision_code(microcode);
}

if (process.argv.indexOf('control') >= 0) {
  print_control_code(microcode);
}

