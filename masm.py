"""
masm.py
Copyright 2014 Drew Gottlieb
"""

import json
import re
import argparse
from pprint import pprint


def load_masm_file(filename):
    """
    Read in a masm microassembly file, parsing it into a dictionary.

    Arguments:
      filename: Filename of masm file.

    Returns:
      Dictionary of parsed microassembly file.
    """
    # Read in JSON file.
    with open(filename, 'r') as json_file:
        json_text = json_file.read()

    # Remove end-of-line comments.
    json_text = re.sub(r"//.*$", r"", json_text, flags=re.M)

    # Remove block comments.
    json_text = re.sub(r"/\*[^\*/]*\*/", r"", json_text, flags=re.M|re.S)

    # Surround terms with quotes to form valid JSON.
    json_text = re.sub(
            r"^(\s*)(\w+):", r"\g<1>'\g<2>':", json_text, flags=re.M)

    # Remove trailing commas to form valid JSON.
    json_text = re.sub(r"(,)(\s*[\}\]])", r"\g<2>", json_text, flags=re.M|re.S)

    # Replace single quotes with double quotes to form valid JSON.
    json_text = re.sub(r"'([^']*)'", r'"\g<1>"', json_text, flags=re.M)

    # Replace hex values with decimal values... to form valid JSON.
    json_text = re.sub(
            r"0x([a-fA-F0-9]+)", lambda hex: str(int(hex.group(1), 16)),
            json_text, flags=re.M)

    return json.loads(json_text)


def validate_arch_desc(arch):
    """
    Validates platform description in microassembly file.

    Raises an Exception if invalid.

    Arguments:
      arch: Architecture description.
    """
    if not arch: return Exception('No platform description found.');
    # TODO: Validate everything else.
    return None


def validate_states(states):
    """
    Validates states in microassembly file.

    Raises an Exception if invalid.

    Arguments:
      states: State definition dictionary.
    """
    if not states: return Exception('No state definitions found.');
    # TODO: Validate everything else.
    return None


def state_code_for_name(states, name):
    """
    Gets a state code for a name.

    Arguments:
      states: State dictionary.
      name: Name of state.

    Returns:
      State code.
    """
    assert(states)
    return states.keys().index(name)


def state_name_for_code(states, code):
    """
    Gets a state name for a state code.

    Arguments:
      states: State dictionary.
      code: Numerical code for state.

    Returns:
      State name.
    """
    assert(states)
    return state.keys()[code]


def microassemble_decision_logic(arch, states):
    """
    Microassembles decision logic for a microassembly dictionary.

    Creates an array with an index for every address of the decision ROM. The
    address (index) is comprised of the opcode, current state, and flag bits.
    The value of each element is the next state the CPU control should take
    given its current opcode, state, and flags.

    Arguments:
      arch: Architecture description.
      states: State dictionary.

    Returns:
      Decision array.
    """
    assert(arch)
    assert(states)

    decision_address_bits = (
            arch['opcode_size'] + arch['state_size'] + len(arch['flags']))
    decision_rom = [0 for _ in range(pow(2, decision_address_bits))]

    def decision_address(state, opcode, flags=None, **kwargs):
        address = 0

        pprint({
            'state': state,
            'opcode': opcode,
            'flags': flags,
            'kwargs': kwargs,
            })

        address |= arch['opcodes'][opcode]
        address <<= arch['opcode_size']

        if flags is None:
            for flag_name in arch['flags']:
                address |= kwargs[flag_name]
                address <<= 1
        else:
            address |= flags
            address <<= len(arch['flags'])

        address |= state

        return address

    for state_code, state_name in enumerate(states.keys()):
        state = states[state_name]
        print type(state['next'])
        if isinstance(state['next'], unicode):
            # Next state is always a specific state.
            for cur_state in range(arch['state_size']):
                for opcode_name in arch['opcodes'].keys():
                    for flags in range(pow(2, len(arch['flags']))):
                        address = decision_address(
                                state=cur_state, opcode=opcode_name,
                                flags=flags)
                        print address
                        next_state_code = state_code_for_name(
                                states, state['next'])
                        decision_rom[address] = next_state_code


    return decision_rom


def get_arguments():
    """
    Gets arguments for program.

    Returns:
      Dictionary of program arguments.
    """
    parser = argparse.ArgumentParser(description='Assemble microassembly.')
    parser.add_argument('file', type=str, nargs=1)
    return parser.parse_args()


def main():
    """
    Entry point for program.
    """
    args = get_arguments()
    masm_contents = load_masm_file(args.file[0])

    arch_desc = masm_contents.get('platform', None)
    states = masm_contents.get('states', None)

    validate_arch_desc(arch_desc)
    validate_states(states)

    decision_rom = microassemble_decision_logic(arch_desc, states)
    pprint(decision_rom)


if __name__ == '__main__':
    main()

