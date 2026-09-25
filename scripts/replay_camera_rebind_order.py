"""Replay Camera root input, collision rebind and presentation ordering.

Requires unicorn==2.1.4 and the hash-pinned private EUR Camera code.bin. The
fixture uses synthetic objects and explicit service states; it is not a decoder,
GPU upload, renderer or native screen comparison.
"""
import argparse
import hashlib
import json
from pathlib import Path
import struct

from audit_camera_grid import CODE_SHA


def replay(code_path):
    from unicorn import Uc, UC_ARCH_ARM, UC_MODE_ARM, UC_HOOK_CODE, UC_HOOK_MEM_INVALID
    from unicorn.arm_const import (
        UC_ARM_REG_C1_C0_2,
        UC_ARM_REG_FPEXC,
        UC_ARM_REG_LR,
        UC_ARM_REG_PC,
        UC_ARM_REG_R0,
        UC_ARM_REG_R1,
        UC_ARM_REG_R2,
        UC_ARM_REG_R3,
        UC_ARM_REG_S0,
        UC_ARM_REG_SP,
    )

    code = code_path.read_bytes()
    assert hashlib.sha256(code).hexdigest() == CODE_SHA
    machine = Uc(UC_ARCH_ARM, UC_MODE_ARM)
    machine.mem_map(0x100000, 0x420000)
    machine.mem_write(0x100000, code)
    machine.mem_map(0x1000000, 0x200000)
    machine.reg_write(UC_ARM_REG_C1_C0_2, 15 << 20)
    machine.reg_write(UC_ARM_REG_FPEXC, 0x40000000)

    word = lambda address: struct.unpack("<I", machine.mem_read(address, 4))[0]
    half = lambda address: struct.unpack("<H", machine.mem_read(address, 2))[0]
    byte = lambda address: machine.mem_read(address, 1)[0]
    put = lambda address, value: machine.mem_write(
        address, struct.pack("<I", value & 0xFFFFFFFF)
    )
    put_half = lambda address, value: machine.mem_write(
        address, struct.pack("<H", value & 0xFFFF)
    )
    stack, sentinel = 0x11FD000, 0x11FF000

    renderer = 0x1001000
    scene = renderer - 0x120
    owner = 0x1004000
    mapping = 0x100A000
    items = 0x100B000
    order = 0x100C000
    photos = 0x100D000
    identities = 0x100E000
    active_descriptors = 0x1010000
    staged_descriptors = 0x1014000
    retained_pointers = 0x1018000
    controls = 0x1019000
    control_ranges = 0x101A000
    release_queue = 0x101B000
    descriptor_manager = 0x101C000
    worker_service = 0x101D000
    dummy_interface = 0x101E000
    resource_objects = 0x1020000
    control_array = 0x1040000

    # Renderer/cache and owner graph. Helpers receive renderer+4 as the cache,
    # so cache-relative +0x164 is renderer+0x168.
    put(renderer + 0x18, mapping)
    put(renderer + 0x5C, controls)
    put(renderer + 0x118, retained_pointers)
    put(renderer + 0x124, active_descriptors)
    put(renderer + 0x138, staged_descriptors)
    put(renderer + 0x164, descriptor_manager)
    put(renderer + 0x168, owner)
    put(renderer + 0x16C, owner)
    put(renderer + 0x170, dummy_interface)
    put(renderer + 0x2C, control_ranges)
    put(renderer + 8, release_queue)
    put(renderer + 12, release_queue)
    put(renderer + 16, release_queue + 0x100)
    put(controls, control_array)
    put(control_array + 2 * 4, resource_objects + 0x800)
    put_half(control_ranges + 2 * 2, 5)

    put(owner + 0x18, items)
    put(owner + 0x24, order)
    put(owner + 8, photos)
    put(owner + 0x30, photos)
    put(scene + 0x60, owner)
    put(scene + 0x11C, owner)
    put(scene + 0xF4, owner)
    put(scene + 0x27C, owner)
    put(scene + 0x70, 11)
    put(scene + 0x3C, 0)
    put(photos + 0x18, identities)
    put_half(owner + 0x36, 80)
    put_half(owner + 0x2232, 69)
    machine.mem_write(owner + 0x2237, b"\1")
    put_half(order + 5 * 2, 1)
    put_half(order + 69 * 2, 0)
    put_half(items + 8, 3)
    put_half(items + 16 + 8, 1)

    # Control 2 has three descriptor resources. The original 0x1fb8f8 swaps
    # these active/staged pointers and updates a retained matching pointer.
    active_objects = [resource_objects + index * 0x200 for index in range(3)]
    staged_objects = [
        resource_objects + 0x1000 + index * 0x200 for index in range(3)
    ]
    record_offset = 2 * 0x2C
    for index, address in enumerate(active_objects):
        put(active_descriptors + record_offset + index * 4, address)
    for index, address in enumerate(staged_objects):
        put(staged_descriptors + record_offset + index * 4, address)
        put(address + 0xA8, address + 0x180)
        put(address + 0xB8, address + 0x1C0)
    put(retained_pointers + 2 * 4, active_objects[0])

    mode = ""
    allocator_next = 0x1060000
    submissions = []
    selected_submission_replayed = False
    service_status = {
        identities + 1 * 8: 3,  # old logical 5 binding has completed
        identities + 3 * 8: 2,  # current logical 69 binding is still running
    }
    calls = []
    presented_cells = []
    presentation_events = []
    property_dispatches = []
    material_leaves = []
    presentation_pass = 0
    root_update_phase = ""
    root_update_events = []
    slider_writes = []
    instruction_order = []
    recent_instructions = []
    presentation_phase = ""

    def return_from_leaf(result=None):
        if result is not None:
            machine.reg_write(UC_ARM_REG_R0, result)
        machine.reg_write(UC_ARM_REG_PC, machine.reg_read(UC_ARM_REG_LR))

    def hook(current, address, size, data):
        nonlocal allocator_next, selected_submission_replayed, presentation_phase
        del current, size, data
        recent_instructions.append(address)
        if len(recent_instructions) > 96:
            del recent_instructions[0]
        if mode == "presentation" and address in (
            0x2CEA0C,
            0x2CECF8,
            0x2CED60,
            0x2CEDB4,
            0x2CEDE0,
            0x2CEE30,
            0x1FDC20,
            0x2CF018,
            0x2CF034,
            0x2D92AC,
            0x2CF0DC,
            0x2D6834,
            0x2D6898,
            0x26D360,
            0x21D47C,
            0x2D69D0,
            0x2D6928,
            0x2D6798,
            0x1FD8E0,
            0x27098C,
        ):
            presentation_phase = hex(address)
        if mode == "presentation" and address == 0x2CEA0C:
            presentation_events.append(
                {"event": "presentation-start", "pass": presentation_pass}
            )
        elif mode == "presentation" and address == 0x2CF0DC:
            presentation_events.append(
                {
                    "event": "consumer-rewrite-start",
                    "pass": presentation_pass,
                    "consumerReady": bool(word(renderer + 0x80) & (1 << 2)),
                }
            )
        elif mode == "presentation" and address == 0x2CF1BC:
            presentation_events.append(
                {
                    "event": "consumer-rewrite-finished",
                    "pass": presentation_pass,
                    "consumerReady": bool(word(renderer + 0x80) & (1 << 2)),
                }
            )
        if address in (
            0x271FF0,
            0x270CC4,
            0x28455C,
            0x2D5740,
            0x28C358,
            0x2D425C,
            0x2D9450,
            0x2DBB50,
            0x2CC654,
            0x1FB8F8,
            0x2DA370,
            0x2DA6FC,
            0x2DAB00,
        ):
            instruction_order.append(hex(address))
        if mode == "root-update" and address in (
            0x271FF0,
            0x2752C8,
            0x270CC4,
            0x28455C,
            0x2D5740,
            0x28C358,
        ):
            root_update_events.append(
                {
                    "update": root_update_phase,
                    "entry": hex(address),
                    "object": machine.reg_read(UC_ARM_REG_R0),
                }
            )
        if mode == "root-update" and address == 0x2D5984:
            root_update_events.append(
                {"update": root_update_phase, "event": "capture-accepted"}
            )
        elif mode == "root-update" and address == 0x2D5A0C:
            root_update_events.append(
                {"update": root_update_phase, "event": "drag-dispatch"}
            )
        elif mode == "root-update" and address == 0x2D5A64:
            root_update_events.append(
                {"update": root_update_phase, "event": "release"}
            )
        elif mode == "root-update" and address == 0x2D5798:
            root_update_events.append(
                {"update": root_update_phase, "event": "cancel"}
            )

        if mode == "root-update" and address in (
            0x303F64,
            0x275104,
            0x286E94,
            0x285618,
            0x1FB73C,
            0x1FBBA4,
            0x220898,
        ):
            calls.append(
                {
                    "call": hex(address),
                    "mode": mode,
                    "update": root_update_phase,
                }
            )
            return_from_leaf(0)
        elif mode == "root-update" and address == 0x21FD40:
            target_bits = machine.reg_read(UC_ARM_REG_S0)
            target = struct.unpack("<f", struct.pack("<I", target_bits))[0]
            flag = machine.reg_read(UC_ARM_REG_R1)
            slider_writes.append(
                {
                    "update": root_update_phase,
                    "target": target,
                    "flag": flag,
                }
            )
            machine.mem_write(
                machine.reg_read(UC_ARM_REG_R0) + 0x28,
                struct.pack("<f", target),
            )
            return_from_leaf()
        elif mode == "root-update" and address == 0x10A0100:
            root_update_events.append(
                {
                    "update": root_update_phase,
                    "event": "active-owner-released",
                    "owner": machine.reg_read(UC_ARM_REG_R0),
                }
            )
            return_from_leaf()
        elif mode == "allocate" and address == 0x262340:
            allocation_size = machine.reg_read(UC_ARM_REG_R0)
            result = allocator_next
            allocator_next = (allocator_next + allocation_size + 15) & ~15
            machine.mem_write(result, bytes(allocation_size))
            return_from_leaf(result)
        elif mode == "allocate" and address == 0x262338:
            return_from_leaf()
        elif mode == "allocate" and address == 0x2DBB50:
            current_stack = machine.reg_read(UC_ARM_REG_SP)
            submission = {
                "arg1": machine.reg_read(UC_ARM_REG_R1),
                "density": machine.reg_read(UC_ARM_REG_R2),
                "logicalIndex": machine.reg_read(UC_ARM_REG_R3),
                "currentPage": word(current_stack),
                "resource": word(current_stack + 4),
                "outsideBuffer": bool(word(current_stack + 8)),
            }
            submissions.append(submission)
            if submission["logicalIndex"] == 69 and not selected_submission_replayed:
                selected_submission_replayed = True
            else:
                return_from_leaf()
        elif address == 0x1FD598:
            identity = machine.reg_read(UC_ARM_REG_R1)
            status = service_status.get(identity, 3)
            calls.append(
                {
                    "call": "worker-status",
                    "identity": identity,
                    "status": status,
                    "mode": mode,
                }
            )
            return_from_leaf(status)
        elif address == 0x1FD428:
            calls.append(
                {
                    "call": "release",
                    "identity": machine.reg_read(UC_ARM_REG_R1),
                    "mode": mode,
                }
            )
            return_from_leaf()
        elif address in (0x1FACC0, 0x2CE26C, 0x1FAC38, 0x1FD680, 0x1FD628):
            calls.append({"call": hex(address), "mode": mode})
            return_from_leaf(0)
        elif address in (0x1FD230, 0x220114):
            calls.append({"call": hex(address), "mode": mode})
            return_from_leaf()
        elif address == 0x21E7C4:
            calls.append({"call": "request-resource-context", "mode": mode})
            return_from_leaf(0)
        elif address == 0x200E0C:
            calls.append({"call": "request-worker-update", "mode": mode})
            return_from_leaf()
        elif address == 0x2B78E0:
            calls.append({"call": "completion-resource-query", "mode": mode})
            return_from_leaf(1)
        elif address == 0x1FAE34:
            calls.append({"call": "completion-resource-state", "mode": mode})
            return_from_leaf()
        elif address == 0x21E494:
            calls.append({"call": "resource-ready", "mode": mode})
            return_from_leaf(1)
        elif mode == "presentation" and address == 0x2D804C:
            current_stack = machine.reg_read(UC_ARM_REG_SP)
            slot = len(presented_cells) % 64
            global_index = (word(scene + 0x70) - 1) * 6 + slot
            record = mapping + (global_index & 63) * 8
            control = machine.reg_read(UC_ARM_REG_R2)
            presented_cells.append(
                {
                    "pass": presentation_pass,
                    "slot": slot,
                    "globalIndex": global_index,
                    "fullTag": half(record),
                    "control": control,
                    "paddedValid": bool(machine.reg_read(UC_ARM_REG_R3)),
                    "realItem": bool(word(current_stack)),
                    "ready": bool(word(current_stack + 4)),
                    "relativeIndex": word(current_stack + 8),
                    "resourceReady": bool(
                        word(renderer + 0x60) & (1 << control)
                    ),
                }
            )
            if global_index == 69:
                presentation_events.append(
                    {
                        "event": "ring-consumer",
                        "pass": presentation_pass,
                        "globalIndex": global_index,
                        "fullTag": half(record),
                        "control": control,
                        "ready": bool(word(current_stack + 4)),
                    }
                )
            return_from_leaf()
        elif mode == "presentation" and address == 0x1FC78C:
            calls.append({"call": "presentation-item-context", "mode": mode})
            return_from_leaf(0)
        elif mode == "presentation" and address == 0x261588:
            calls.append({"call": "presentation-render-service", "mode": mode})
            return_from_leaf(0)
        elif mode == "presentation" and address == 0x256CA8:
            presentation_events.append({"event": "original-property-copy", "pass": presentation_pass})
        elif mode == "presentation" and address == 0x2567CC:
            retained = machine.reg_read(UC_ARM_REG_R1)
            property_dispatches.append({
                "pass": presentation_pass,
                "storedLength": word(retained + 8),
                "storedBytes": list(machine.mem_read(retained + 12, min(word(retained + 8), 20) + 1)),
                "materialResource": machine.reg_read(UC_ARM_REG_R2),
            })
        elif mode == "presentation" and address == 0x247ED4:
            material_leaves.append({"pass": presentation_pass, "service": "0x247ed4 lookup"})
            return_from_leaf(0x1051000)
        elif mode == "presentation" and address in (0x131254, 0x247CE4):
            material_leaves.append({"pass": presentation_pass, "service": hex(address)})
            return_from_leaf()
        elif mode == "presentation" and address == 0x25A618:
            value = machine.reg_read(UC_ARM_REG_R1)
            presentation_events.append(
                {
                    "event": "presentation-property-publication",
                    "pass": presentation_pass,
                    "source": presentation_phase,
                }
            )
            calls.append(
                {
                    "call": "presentation-property-publication",
                    "source": presentation_phase,
                    "target": machine.reg_read(UC_ARM_REG_R0),
                    "resource": word(value + 4),
                    "mode": mode,
                }
            )
            # Run the original setter, including its retained copy and material
            # dispatch. Resource lookup and the later graphics services above
            # remain explicit synthetic leaves.
        elif mode == "presentation" and address == 0x2DB8D4:
            calls.append({"call": "post-ring-layout", "mode": mode})
            return_from_leaf()
        elif mode == "presentation" and address in (
            0x2D4BCC,
            0x2D1010,
            0x2D4048,
            0x2D2CA0,
            0x2D3B60,
            0x2D36BC,
            0x2DB460,
        ):
            calls.append({"call": hex(address), "mode": mode})
            return_from_leaf()

    machine.hook_add(UC_HOOK_CODE, hook)

    def invalid_memory(current, access, address, size, value, data):
        del current, access, size, value, data
        print(
            f"unmapped access at {address:#x}, pc={machine.reg_read(UC_ARM_REG_PC):#x}, "
            f"mode={mode}, phase={presentation_phase}, presented={len(presented_cells)}, "
            f"recent={[hex(value) for value in recent_instructions]}"
        )
        return False

    machine.hook_add(UC_HOOK_MEM_INVALID, invalid_memory)

    def call(address, *args, extras=(), count=500000):
        for register, value in zip(
            (UC_ARM_REG_R0, UC_ARM_REG_R1, UC_ARM_REG_R2, UC_ARM_REG_R3), args
        ):
            machine.reg_write(register, value)
        for index, value in enumerate(extras):
            put(stack + index * 4, value)
        machine.reg_write(UC_ARM_REG_SP, stack)
        machine.reg_write(UC_ARM_REG_LR, sentinel)
        machine.emu_start(address, sentinel, count=count)
        assert machine.reg_read(UC_ARM_REG_PC) == sentinel
        return machine.reg_read(UC_ARM_REG_R0)

    # Rebind logical 69 over logical 5 in slot 5. During complete 0x2d9450
    # request allocation, the selected 0x2dbb50 submission runs whole; the other
    # 17 submissions are intercepted so they cannot mutate the focused fixture.
    collision_record = mapping + (69 & 63) * 8
    put_half(collision_record, 5)
    put_half(collision_record + 2, 2)
    put(collision_record + 4, 1)
    put(renderer + 0x80, 1 << 2)
    put(owner + 0xC, worker_service)
    machine.mem_write(owner + 0x10, b"\1")
    put(0x41F16C, 0)
    mode = "allocate"
    call(0x2D9450, renderer, 0, 0, 11, extras=(0,), count=2000000)
    assert len(submissions) == 18
    assert {entry["logicalIndex"] for entry in submissions} == set(range(60, 78))
    selected_submission = next(
        entry for entry in submissions if entry["logicalIndex"] == 69
    )
    assert not selected_submission["outsideBuffer"]
    assert selected_submission_replayed
    assert half(collision_record) == 5
    assert half(collision_record + 4) == 0xFF7F
    assert not word(renderer + 0x80) & (1 << 2)
    assert [
        word(active_descriptors + record_offset + index * 4) for index in range(3)
    ] == staged_objects
    assert [
        word(staged_descriptors + record_offset + index * 4) for index in range(3)
    ] == active_objects
    assert word(retained_pointers + 2 * 4) == staged_objects[0]

    # 0x2da338 publishes the full logical tag and executes its complete
    # resource-building body. No instruction bytes are patched.
    mode = "full-tag"
    call(
        0x2DA338,
        renderer,
        selected_submission["arg1"],
        0,
        69,
        extras=(selected_submission["resource"],),
    )
    assert half(collision_record) == 69
    dirty_bitsets_before_completion = {
        "0x2d6898": [
            hex(word(renderer + 0x88)),
            hex(word(renderer + 0x8C)),
        ],
        "0x2d69d0": [
            hex(word(renderer + 0x90)),
            hex(word(renderer + 0x94)),
        ],
    }

    # The completed old identity is not consulted after the tag rebind. While
    # the current identity is status 2, 0x2da6fc leaves readiness clear.
    mode = "stale-old-complete"
    before_calls = len(calls)
    assert call(0x2DA6FC, renderer, 69) == 0
    stale_calls = calls[before_calls:]
    assert any(
        entry.get("identity") == identities + 3 * 8
        and entry.get("status") == 2
        for entry in stale_calls
    )
    assert not any(
        entry.get("identity") == identities + 1 * 8 for entry in stale_calls
    )
    assert not word(renderer + 0x60) & (1 << 2)
    assert not word(renderer + 0x80) & (1 << 2)

    # Once the current identity reaches status 3, the original completion path
    # observes the installed descriptor resource and publishes control 2 ready.
    service_status[identities + 3 * 8] = 3
    mode = "current-complete"
    before_calls = len(calls)
    assert call(0x2DA6FC, renderer, 69) == 1
    current_calls = calls[before_calls:]
    assert any(
        entry.get("identity") == identities + 3 * 8
        and entry.get("status") == 3
        for entry in current_calls
    )
    assert word(renderer + 0x60) & (1 << 2)
    assert not word(renderer + 0x80) & (1 << 2)
    assert byte(renderer + 4 + 0x40 + 2 + 0x94) == 5

    # Connect native root sampling to generic owner-before/child/owner-after
    # traversal. The enclosing SceneBrowse and BrowseThumbnail use their source
    # vtables. Only unrelated owner services and the sound/slider leaves listed
    # above are intercepted.
    root = 0x1080000
    input_manager = root + 0x40
    provider = 0x1090000
    old_active_owner = 0x10A0000
    new_active_owner = 0x10A1000
    active_owner_vtable = 0x10A2000
    scene_owner = 0x10B0000
    put(root, 0x420AF4)
    put(scene_owner, 0x41F8B8)
    put(scene, 0x42044C)
    put(root + 0x10, root)
    put(scene_owner + 0x10, root)
    put(scene + 0x10, scene_owner)
    put(root + 0x28, scene_owner + 4)
    put(root + 0x2C, scene_owner + 4)
    put(scene_owner + 0x28, scene + 4)
    put(scene_owner + 0x2C, scene + 4)
    put(scene + 0x28, scene + 0x28)
    put(scene + 0x2C, scene + 0x28)
    put(word(0x2D5AC4), input_manager)
    put(word(0x2752C4), provider)
    put(word(0x2750F0), provider)
    machine.mem_write(input_manager + 0x254, b"\1")
    machine.mem_write(scene_owner + 0x7B9, b"\2")
    machine.mem_write(scene_owner + 0x3E0, b"\1")
    machine.mem_write(scene_owner + 0x1237, b"\1")
    put(scene_owner + 0x44, scene)
    put(scene_owner + 0x48, scene)
    put(scene + 0x168, owner)
    put(scene + 0x11C, owner)
    put(scene + 0x48, 0)
    put(scene + 0x2CC, 0)
    machine.mem_write(scene + 0x80, struct.pack("<f", 0.0))
    machine.mem_write(scene + 0x84, struct.pack("<f", 0.0))
    machine.mem_write(scene + 0x8C, struct.pack("<f", 320.0))
    machine.mem_write(scene + 0x90, struct.pack("<f", 240.0))
    put(old_active_owner, active_owner_vtable)
    put(new_active_owner, active_owner_vtable)
    put(old_active_owner + 0x10, owner)
    put(new_active_owner + 0x10, owner)
    put(active_owner_vtable + 0xC, 0x10A0100)
    call(0x128508, input_manager + 4)

    slider = 0x1050000
    geometry = 0x1051000
    controls_for_draw = 0x1053000
    put(scene + 0x94, slider)
    put(scene + 0xE0, geometry)
    for index in range(3):
        put(scene + 0xA8 + index * 4, controls_for_draw + index * 0x200)
    put(owner + 0x2500, struct.unpack("<I", struct.pack("<f", 248.0))[0])
    put(owner + 0x2268, struct.unpack("<I", struct.pack("<f", 228.0))[0])
    put(owner + 0x226C, struct.unpack("<I", struct.pack("<f", 132.0))[0])
    put(slider + 0x3C, 14)
    machine.mem_write(slider + 0x78, struct.pack("<f", 248.0))
    put(scene + 0x28C, owner)
    machine.mem_write(owner + 0x2238, b"\1")
    put(owner + 0x223C, 0)
    machine.mem_write(scene + 0x38, struct.pack("<f", 1.0))

    def root_update(label, x, y, held, pending_owner):
        nonlocal mode, root_update_phase
        machine.mem_write(
            provider + 0x58,
            struct.pack("<HH", x, y | (0x8000 if held else 0)),
        )
        put(input_manager + 0x258, pending_owner)
        mode = "root-update"
        root_update_phase = label
        call(0x271FF0, root, count=2000000)
        return {
            "update": label,
            "capture": bool(byte(scene + 0x7C)),
            "drag": bool(byte(scene + 0x7D)),
            "browseState": byte(owner + 4),
            "activeOwner": word(input_manager + 0x25C),
            "touchDistance": struct.unpack(
                "<f", machine.mem_read(input_manager + 0x12C, 4)
            )[0],
            "sceneOwnerFlags": half(scene_owner + 0x30),
            "childFlags": half(scene + 0x30),
            "consumerReady": bool(word(renderer + 0x80) & (1 << 2)),
        }

    put(input_manager + 0x25C, old_active_owner)
    touch_updates = [
        root_update("capture", 100, 100, True, old_active_owner),
        root_update("owner-replacement-drag", 112, 100, True, new_active_owner),
        root_update("release", 112, 100, False, new_active_owner),
    ]
    machine.mem_write(slider + 0xD9, b"\0")
    touch_updates.extend(
        [
        root_update("recapture", 100, 100, True, new_active_owner),
        root_update("drag-before-pass-1", 112, 100, True, new_active_owner),
        ]
    )
    assert touch_updates[0]["capture"] and not touch_updates[0]["drag"]
    assert touch_updates[1]["capture"] and touch_updates[1]["drag"]
    assert touch_updates[1]["activeOwner"] == new_active_owner
    assert touch_updates[1]["touchDistance"] == 12.0
    assert slider_writes[0] == {
        "update": "owner-replacement-drag",
        "target": 236.0,
        "flag": 0,
    }, slider_writes
    assert not touch_updates[2]["capture"] and not touch_updates[2]["drag"]
    assert touch_updates[2]["browseState"] == 2
    assert touch_updates[3]["capture"] and not touch_updates[3]["drag"]
    assert touch_updates[4]["capture"] and touch_updates[4]["drag"]

    # Exercise the complete BrowseThumbnail presentation function twice on the
    # same source owner. The first pass consumes the old consumer bit (clear),
    # reaches the final material setter, draws, then rewrites consumer
    # readiness. Before pass 2, an owner replacement plus SceneBrowse mode
    # interruption runs through the root and cancels the live drag.
    put(0x1051000 + 0x34, 0x1052000)  # lookup-returned synthetic material
    mode = "presentation"
    presentation_pass = 1
    call(0x2D425C, scene, count=4000000)
    assert len(presented_cells) == 64
    first_selected_cell = presented_cells[9]
    assert first_selected_cell["globalIndex"] == 69
    assert first_selected_cell["fullTag"] == 69
    assert first_selected_cell["control"] == 2
    assert first_selected_cell["resourceReady"]
    assert not first_selected_cell["ready"]
    assert word(renderer + 0x80) & (1 << 2)
    assert half(scene + 0x30) & 2

    machine.mem_write(input_manager + 0x254, b"\0")
    interruption_event_start = len(root_update_events)
    touch_updates.append(
        root_update(
            "owner-replacement-interruption-gated",
            112,
            100,
            True,
            old_active_owner,
        )
    )
    first_interruption_events = root_update_events[interruption_event_start:]
    assert not any(
        event.get("entry") == "0x2d5740" for event in first_interruption_events
    )
    assert touch_updates[-1]["capture"] and touch_updates[-1]["drag"]
    assert touch_updates[-1]["childFlags"] == 0, touch_updates[-1]
    cancel_event_start = len(root_update_events)
    touch_updates.append(
        root_update("manager-interruption-cancel", 112, 100, True, old_active_owner)
    )
    cancel_events = root_update_events[cancel_event_start:]
    assert any(event.get("entry") == "0x2d5740" for event in cancel_events)
    assert any(event.get("event") == "cancel" for event in cancel_events)
    assert not touch_updates[-1]["capture"] and not touch_updates[-1]["drag"], (
        touch_updates[-1],
        root_update_events[-16:],
    )
    assert touch_updates[-1]["browseState"] == 2
    assert touch_updates[-1]["activeOwner"] == old_active_owner
    assert touch_updates[-1]["consumerReady"]

    machine.mem_write(input_manager + 0x254, b"\1")
    presentation_pass = 2
    mode = "presentation"
    call(0x2D425C, scene, count=4000000)
    assert len(presented_cells) == 128
    second_selected_cell = presented_cells[64 + 9]
    assert second_selected_cell["globalIndex"] == 69
    assert second_selected_cell["fullTag"] == 69
    assert second_selected_cell["control"] == 2
    assert second_selected_cell["resourceReady"]
    assert second_selected_cell["ready"]
    assert len(property_dispatches) == 3
    assert [entry["storedBytes"] for entry in property_dispatches] == [
        list(b"PicL\0"), list(b"PicL\0"), list(b"PicL_Op\0")
    ]
    assert all(entry["pass"] == 1 and entry["materialResource"] == 0
               for entry in property_dispatches)
    assert [entry["service"] for entry in material_leaves] == [
        service for _ in range(3) for service in
        ("0x247ed4 lookup", "0x131254", "0x247ce4")
    ]

    return {
        "ok": True,
        "codeSha256": CODE_SHA,
        "rootOwnerTouchTraversal": {
            "rootEntry": "0x271ff0",
            "traversalEntry": "0x270cc4",
            "ownerBefore": "0x28455c",
            "childInput": "0x2d5740",
            "ownerAfter": "0x28c358",
            "touchUpdates": touch_updates,
            "sliderWrites": slider_writes,
            "events": root_update_events,
            "ownerReplacementDoesNotCancelExistingCapture": True,
            "managerInterruptionCancelsCaptureAndDrag": True,
            "pass1DisabledChildForFirstInterruptedUpdate": True,
            "parentAfterReenabledChildForCancellation": True,
            "consumerReadySurvivesInputOwnerReplacementAndManagerCancel": True,
        },
        "requestAllocation": {
            "entry": "0x2d9450",
            "page": 11,
            "selectedIndex": 69,
            "submittedIndices": [
                entry["logicalIndex"] for entry in submissions
            ],
            "selectedSubmission": selected_submission,
        },
        "collisionRebind": {
            "slot": 5,
            "oldLogicalTag": 5,
            "newLogicalTag": half(collision_record),
            "control": half(collision_record + 2),
            "retainedMetadata": hex(half(collision_record + 4)),
            "staleReadyClearedBySubmission": True,
            "descriptorPointersSwapped": True,
            "retainedPointerUpdated": True,
        },
        "staleCompletion": {
            "oldIdentityStatus": 3,
            "currentIdentityStatus": 2,
            "queriedCurrentIdentityOnly": True,
            "resourceReadyPublished": False,
            "consumerReadyPublished": False,
            "calls": stale_calls,
        },
        "currentCompletion": {
            "currentIdentityStatus": 3,
            "resourceReadyPublished": True,
            "consumerReadyPublished": False,
            "calls": current_calls,
        },
        "presentationPublication": {
            "entry": "0x2d425c",
            "innerPresentation": "0x2cea0c",
            "sameOwner": owner,
            "sameSceneOwner": scene_owner,
            "dirtyBitsetsBeforeCompletion": dirty_bitsets_before_completion,
            "propertyPublications": [
                entry
                for entry in calls
                if entry.get("call") == "presentation-property-publication"
            ],
            "propertyDispatches": property_dispatches,
            "materialServiceLeaves": material_leaves,
            "firstPassSelectedCell": first_selected_cell,
            "secondPassSelectedCell": second_selected_cell,
            "events": presentation_events,
        },
        "instructionOrder": instruction_order,
        "intercepts": [
            "17 non-selected 0x2dbb50 calls during allocation; selected call runs whole in place",
            "0x262340/0x262338 synthetic allocator/free during request allocation",
            "worker status/release services with explicit per-identity states",
            "descriptor owner/control notification leaves 0x1fd230/0x220114",
            "resource query/state/ready leaves 0x2b78e0/0x1fae34/0x21e494",
            "material lookup 0x247ed4 and services 0x131254/0x247ce4 use synthetic material; no GPU upload",
            "presentation item-context and render-service leaves 0x1fc78c/0x261588",
            "post-ring layout leaf 0x2db8d4",
            "final thumbnail cell writer 0x2d804c (arguments recorded)",
            "root clock service 0x303f64 and analog sampler 0x275104",
            "owner after-child service leaves 0x286e94/0x285618",
            "browse state/sound/slider leaves 0x1fb73c/0x1fbba4/0x220898/0x21fd40",
            "non-rebind BrowseThumbnail presentation helpers 0x2d4bcc/0x2d1010/0x2d4048/0x2d2ca0/0x2d3b60/0x2d36bc/0x2db460",
            "unrelated owner/resource helper leaves listed in call records",
        ],
        "scope": (
            "One Unicorn fixture and one synthetic object graph. Complete request "
            "allocation with the selected submission, original descriptor swap, original "
            "full 0x2da338, complete ready publisher, and two complete 0x2cea0c "
            "presentation bodies reached through complete 0x2d425c calls, including "
            "original ring routing and post-draw consumer rewrite. Original 0x271ff0 "
            "sampling and 0x270cc4 parent-before/child/parent-after traversal execute "
            "capture, 12px drag, release and interrupted cancellation. The original "
            "property setter and material application branch execute, with synthetic "
            "material lookup and downstream service leaves. The final cell writer and "
            "listed unrelated services remain intercepts. Non-selected "
            "submissions are intercepted to keep the collision isolated. Input-owner "
            "replacement is not complete scene-owner teardown, and the fixture has no "
            "browser generation token. This is not decoder/GPU upload, rendered pixels, "
            "browser timing or native visual equivalence."
        ),
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--code", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    assert args.code.is_absolute() and args.output.is_absolute()
    result = replay(args.code)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(result, indent=2) + "\n")
    print(f"Camera combined rebind ordering replay passed: {args.output}")


if __name__ == "__main__":
    main()
