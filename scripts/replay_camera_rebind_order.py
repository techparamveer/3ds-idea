"""Replay Camera collision rebind through two complete presentation passes.

Requires unicorn==2.1.4 and the hash-pinned private EUR Camera code.bin. The
fixture uses synthetic objects and explicit service states; it is not a decoder,
GPU upload, complete owner traversal, renderer or native screen comparison.
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
    presentation_pass = 0
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
            0x2D5740,
            0x2D9450,
            0x2DBB50,
            0x2CC654,
            0x1FB8F8,
            0x2DA370,
            0x2DA6FC,
            0x2DAB00,
        ):
            instruction_order.append(hex(address))

        if mode == "allocate" and address == 0x262340:
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
            return_from_leaf(1)
        elif mode == "presentation" and address == 0x2DB8D4:
            calls.append({"call": "post-ring-layout", "mode": mode})
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

    # Native early cancellation runs in BrowseThumbnail's after-child input
    # handler. This is a complete 0x2d5740 call for the early manager gate.
    touch_scene = 0x1080000
    touch_owner = 0x1081000
    input_manager = 0x1082000
    put(word(0x2D5AC4), input_manager)
    put(touch_scene + 0x11C, touch_owner)
    machine.mem_write(touch_owner + 4, b"\1\xff")
    machine.mem_write(touch_scene + 0x7C, b"\1\1")
    mode = "touch-cancel"
    call(0x2D5740, touch_scene)
    assert machine.mem_read(touch_scene + 0x7C, 2) == b"\0\0"
    assert byte(touch_owner + 4) == 2 and byte(touch_owner + 5) == 1

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

    # Exercise the complete presentation function twice on the same object
    # graph. The first pass consumes the old consumer bit (clear), reaches the
    # final material setter, draws, then rewrites consumer readiness. The next
    # pass is the first one whose ring writer can receive ready=1.
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
    mode = "presentation"
    presentation_pass = 1
    call(0x2CEA0C, scene, count=2000000)
    assert len(presented_cells) == 64
    first_selected_cell = presented_cells[9]
    assert first_selected_cell["globalIndex"] == 69
    assert first_selected_cell["fullTag"] == 69
    assert first_selected_cell["control"] == 2
    assert first_selected_cell["resourceReady"]
    assert not first_selected_cell["ready"]
    assert word(renderer + 0x80) & (1 << 2)

    presentation_pass = 2
    call(0x2CEA0C, scene, count=2000000)
    assert len(presented_cells) == 128
    second_selected_cell = presented_cells[64 + 9]
    assert second_selected_cell["globalIndex"] == 69
    assert second_selected_cell["fullTag"] == 69
    assert second_selected_cell["control"] == 2
    assert second_selected_cell["resourceReady"]
    assert second_selected_cell["ready"]

    return {
        "ok": True,
        "codeSha256": CODE_SHA,
        "ownerTouchCancellation": {
            "entry": "0x2d5740",
            "previousState": 1,
            "nextState": 2,
            "captureCleared": True,
            "dragCleared": True,
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
            "entry": "0x2cea0c",
            "dirtyBitsetsBeforeCompletion": dirty_bitsets_before_completion,
            "propertyPublications": [
                entry
                for entry in calls
                if entry.get("call") == "presentation-property-publication"
            ],
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
            "final property setter 0x25a618 (target/resource recorded; no GPU upload)",
            "presentation item-context and render-service leaves 0x1fc78c/0x261588",
            "post-ring layout leaf 0x2db8d4",
            "final thumbnail cell writer 0x2d804c (arguments recorded)",
            "unrelated owner/resource helper leaves listed in call records",
        ],
        "scope": (
            "One Unicorn fixture and one synthetic object graph. Complete request "
            "allocation with the selected submission, original descriptor swap, original "
            "full 0x2da338, complete ready publisher, and two complete 0x2cea0c "
            "presentation calls including original ring routing and post-draw consumer "
            "rewrite; complete early touch-cancel entry runs first. Final material/cell "
            "services and unrelated leaves are recorded intercepts. Non-selected "
            "submissions are intercepted to keep the collision isolated. This is not the "
            "enclosing parent/child frame dispatcher, current touch capture/release, "
            "decoder/GPU upload, rendered pixels, browser timing or native visual "
            "equivalence."
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
