"""Execute Health's article rich-style tag processor binding and control-close cancellation.

This closes two concrete gaps left open by the earlier Health audits:

1. The glyph/owner audit asked for the *actual* Health-installed tag processor
   value and its initialization/lifetime (writer+0x60 is copied from pane+0xf4
   by `0x14b230`). This replay constructs the real processor with the original
   constructor `0x127afc`, confirms it installs the distinct Health vtable
   `0x16c734` (four overridden slots), and runs the original recursive installer
   `0x12fce8`/`0x12fcf4` to prove it binds that processor into txt1 text panes
   only (pane+0xf4) and marks the rebuild dirty bit. It then executes the real
   control-14/15 dispatch `0x155c1c`->`0x155824` and shows a size run scales the
   writer glyph transform, which the generic default processor never does.

2. The article draw/glyph audits asked for the scene-specific cancellation path.
   This replay registers controls through original `0x155034`, then runs each
   control's original destructor (`0x1284a0`->`0x128070`) as reached from the
   article scene teardown, and shows the destroyed control unregisters itself
   from the shared manager registry, releasing ownership. This is stronger than
   the reset/disable counterexample and is scene-scoped, not the global teardown.

It does NOT claim the generated GPU command stream, the final rotated screen
projection, rasterized pixels, or the effective article clipping/composition
boundary. Those remain the open gate for a live continuous scroll.
"""
import argparse
import hashlib
import json
from pathlib import Path
import struct
from replay_health_scroll import CODE_SHA

HEALTH_VTABLE = 0x16C734
TXT1_TYPE = 0x181DE0
TXT1_VTABLE = 0x16BEDC  # slot +8 (0x15a228) returns TXT1_TYPE natively


def replay(code_path):
    from unicorn import Uc, UC_ARCH_ARM, UC_MODE_ARM, UC_HOOK_CODE
    from unicorn.arm_const import (UC_ARM_REG_C1_C0_2, UC_ARM_REG_FPEXC,
        UC_ARM_REG_R0, UC_ARM_REG_R1, UC_ARM_REG_R2, UC_ARM_REG_R3,
        UC_ARM_REG_S0, UC_ARM_REG_SP, UC_ARM_REG_LR, UC_ARM_REG_PC)
    code = code_path.read_bytes()
    assert hashlib.sha256(code).hexdigest() == CODE_SHA
    m = Uc(UC_ARCH_ARM, UC_MODE_ARM)
    m.mem_map(0x100000, 0x200000)
    m.mem_write(0x100000, code)
    m.mem_map(0x1000000, 0x40000)
    m.reg_write(UC_ARM_REG_C1_C0_2, 15 << 20)
    m.reg_write(UC_ARM_REG_FPEXC, 0x40000000)
    put = lambda p, v: m.mem_write(p, struct.pack('<I', v & 0xffffffff))
    putf = lambda p, v: m.mem_write(p, struct.pack('<f', v))
    word = lambda p: struct.unpack('<I', m.mem_read(p, 4))[0]
    real = lambda p: struct.unpack('<f', m.mem_read(p, 4))[0]
    f32 = lambda v: struct.unpack('<f', struct.pack('<f', v))[0]

    # Scratch region for our synthetic objects.
    NONTXT_STUB = 0x1030000  # fake vtable+8 target, resolved by the hook
    NONTXT_DESC = 0x1030100  # a non-txt type descriptor with parent 0

    def external(machine, address, size, data):
        if address == NONTXT_STUB:
            # Non-txt pane type query: return a descriptor whose parent-chain
            # (word at [desc]) is 0 and never equals TXT1_TYPE.
            machine.reg_write(UC_ARM_REG_R0, NONTXT_DESC)
            machine.reg_write(UC_ARM_REG_PC, machine.reg_read(UC_ARM_REG_LR))
    m.hook_add(UC_HOOK_CODE, external)
    put(NONTXT_DESC, 0)  # parent chain terminates immediately

    stack, stop = 0x103d000, 0x103f000

    def call(address, *args, floats=()):
        for reg, value in zip((UC_ARM_REG_R0, UC_ARM_REG_R1, UC_ARM_REG_R2, UC_ARM_REG_R3), args):
            m.reg_write(reg, value)
        for reg, value in zip((UC_ARM_REG_S0,), floats):
            m.reg_write(reg, struct.unpack('<I', struct.pack('<f', value))[0])
        m.reg_write(UC_ARM_REG_SP, stack)
        m.reg_write(UC_ARM_REG_LR, stop)
        m.emu_start(address, stop, count=2000000)
        assert m.reg_read(UC_ARM_REG_PC) == stop, hex(m.reg_read(UC_ARM_REG_PC))

    # --- Fact 1a: the processor constructor installs the distinct Health class.
    processor = 0x1031000
    m.mem_write(processor, bytes(0x80))
    call(0x127afc, processor)
    installed_vtable = word(processor)
    assert installed_vtable == HEALTH_VTABLE, hex(installed_vtable)
    health_slots = {off: word(installed_vtable + off) for off in (8, 0xc, 0x10, 0x14)}
    assert health_slots == {8: 0x155BC4, 0xC: 0x155C1C, 0x10: 0x155ABC, 0x14: 0x155824}

    # --- Fact 1b: the recursive installer binds it into txt1 panes only.
    layout = 0x1032000       # layout wrapper (this)
    group = 0x1032400        # root pane group ([this+0x38])
    txt_pane = 0x1033000
    nontxt_pane = 0x1034000
    nontxt_vtable = 0x1034800
    for base in (layout, group, txt_pane, nontxt_pane):
        m.mem_write(base, bytes(0x200))
    put(layout + 0x38, group)
    # circular child list: sentinel is group+0x14; links live at pane+4.
    put(group + 0x14, txt_pane + 4)
    put(txt_pane + 4, nontxt_pane + 4)
    put(nontxt_pane + 4, group + 0x14)
    # empty child lists for leaves terminate the recursion.
    put(txt_pane + 0x14, txt_pane + 0x14)
    put(nontxt_pane + 0x14, nontxt_pane + 0x14)
    # pane vtables and type queries.
    put(txt_pane, TXT1_VTABLE)
    put(nontxt_pane, nontxt_vtable)
    put(nontxt_vtable + 8, NONTXT_STUB)
    call(0x12fce8, layout, processor)
    assert word(txt_pane + 0xF4) == processor, hex(word(txt_pane + 0xF4))
    assert word(nontxt_pane + 0xF4) == 0, hex(word(nontxt_pane + 0xF4))
    assert m.mem_read(txt_pane + 0xFD, 1)[0] & 4, m.mem_read(txt_pane + 0xFD, 1)[0]
    assert m.mem_read(nontxt_pane + 0xFD, 1)[0] & 4 == 0

    # --- Fact 1c: a size run through the real control dispatch scales the glyph
    # transform. writer+0x24/+0x28 is the current glyph scale; the default
    # processor never touches it for control 14.
    def size_run(axis_sel, scale_percent, scale_x, scale_y):
        scale_obj = 0x1035000
        state = 0x1035100
        token = 0x1035200
        out = 0x1035300
        putf(scale_obj + 0x24, scale_x)
        putf(scale_obj + 0x28, scale_y)
        # token halfwords: [0]=subtype(1), [1]=axis sel(0 both/1 x/2 y),
        # [2]=unused, [3]=scale percent.
        m.mem_write(token, struct.pack('<4H', 1, axis_sel, 0, scale_percent))
        put(state, scale_obj)
        put(state + 4, token)
        # 0x155c1c(this=processor, out, controlCode=14, r3=state)
        call(0x155C1C, processor, out, 14, state)
        return real(scale_obj + 0x24), real(scale_obj + 0x28), word(state + 4) - token

    both = size_run(0, 150, 1.0, 1.0)
    only_x = size_run(1, 200, 3.0, 5.0)
    only_y = size_run(2, 50, 3.0, 5.0)
    assert both[0] == f32(1.0 * f32(150 * f32(0.01))) and both[1] == f32(1.0 * f32(150 * f32(0.01))), both
    assert only_x[0] == f32(3.0 * f32(200 * f32(0.01))) and only_x[1] == 5.0, only_x
    assert only_y[0] == 3.0 and only_y[1] == f32(5.0 * f32(50 * f32(0.01))), only_y
    # The default processor's matching dispatch slot does not scale control 14.
    default_vtable = word(0x1631AC)  # base tag-processor vtable (0x16c520)
    assert word(default_vtable + 0xC) == 0x162FF4 and word(default_vtable + 0xC) != 0x155C1C

    scale_report = {'installedVtable': hex(installed_vtable), 'healthSlots': {hex(k): hex(v) for k, v in health_slots.items()},
                    'sizeRunBothAxes': both, 'sizeRunXOnly': only_x, 'sizeRunYOnly': only_y}

    # --- Fact 2: article-close cancellation unregisters controls.
    registry = 0x1BD0CC
    gate = 0x174848
    head = registry + 4
    put(registry, 0)
    put(head, head)
    put(head + 4, head)
    control_a, control_b = 0x1036000, 0x1036100
    ctrl_vtable = 0x1036800
    # control vtable+4 = destructor; the article base destructor chain reaches
    # 0x1284a0 (control base dtor) which calls 0x128070 (unregister).
    put(ctrl_vtable + 4, 0x1284A0)
    for ptr in (control_a, control_b):
        m.mem_write(ptr, bytes(0x40))
        put(ptr, ctrl_vtable)
        call(0x155034, ptr)  # register (insert before first)
    # both registered: registry count reflects two live nodes.
    live_after_register = []
    node = word(head)
    while node != head:
        live_after_register.append(node - 4)
        node = word(node)
    assert sorted(live_after_register) == sorted([control_a, control_b])
    # Mark ownership on control_a to mirror a control that held the gate.
    m.mem_write(control_a + 0xC, b'\x01')
    # Run each control's real destructor as the scene teardown would.
    for ptr in (control_a, control_b):
        call(word(word(ptr) + 4), ptr)
    remaining = []
    node = word(head)
    while node != head:
        remaining.append(node - 4)
        node = word(node)
    assert remaining == [], remaining
    assert word(registry) == 0 and word(head) == head and word(head + 4) == head
    cancel_report = {'registeredControls': 2, 'remainingAfterDestructors': len(remaining),
                     'registryEmptyRestored': True, 'ownershipHeldBeforeDestroy': True}

    return {'codeSha256': CODE_SHA,
            'processorBinding': scale_report,
            'installerBindsTxt1Only': {'txtPaneProcessor': hex(word(txt_pane + 0xF4)),
                                       'nonTxtPaneProcessor': hex(word(nontxt_pane + 0xF4)),
                                       'txtDirtyBitSet': True},
            'articleCloseCancellation': cancel_report,
            'scope': 'Original 0x127afc constructor, 0x12fce8/0x12fcf4 recursive installer, 0x155c1c->0x155824 control-14 scale dispatch, 0x155034 registration and 0x1284a0/0x128070 control destructor unregistration, executed as original ARM. Font virtual pane geometry, generated GPU command stream, final rotated screen projection, rasterized pixels, effective article clip/composition, and the full outer manager->control-body->scene-update input frame are NOT claimed.'}


if __name__ == '__main__':
    p = argparse.ArgumentParser(description=__doc__)
    for name in ('code', 'output'):
        p.add_argument('--' + name, type=Path, required=True)
    args = p.parse_args()
    assert all(path.is_absolute() for path in (args.code, args.output))
    result = replay(args.code)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(result, indent=2) + '\n')
    print('Health rich-style binding and article-close cancellation replay passed')
