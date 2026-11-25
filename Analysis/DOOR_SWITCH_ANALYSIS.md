# Door Switch Analysis

## Objective
Analyze door switch message patterns across three Ebina machines to verify door switch detection works consistently.

## Status
Follow-up analysis is ongoing. The earlier conclusion that detection was confirmed across all machines was too strong; see the Sancha Lab Red findings below.

> **Evidence caution:** The historical sections below contain unsupported conclusions. In particular, the Ebina Blue `0E 09` payloads do not establish door states; see the reassessment and experimental pseudocode below.

---

## Historical Analysis (Superseded)

The following original findings are retained as notes, **not confirmed results**. The Ebina Red and White logs do show a useful `0E:C0` candidate described in the pseudocode below, but the prior `08:80` state mapping and production-readiness claims are unsupported.

### Door Switch Detection Pattern

Based on analysis from [logs/NOTEBOOK/door switch with chatgpt.txt](../NOTEBOOK/door%20switch%20with%20chatgpt.txt):

**Primary Indicator: VM ROOT → -------- (08:00 → 08:80)**
- **Control Field:** 0E 09
- **Data Pattern:** 50 [varies...]

This message alternates between two **distinct payload families**:
1. **Door Closed Pattern:** `50 7F/DF/F7/FD... [various bytes]` - Random-looking bit patterns
2. **Door Open Pattern:** `50 55 55 55... [mostly 55 55 55]` - Regular repeating 55 pattern

### Key Characteristic
The second byte (after the initial 50) is the most significant indicator:
- When door **CLOSES**: Changes TO `7F`, `DF`, `F7`, `FD`, etc. (high variation)
- When door **OPENS**: Changes TO `55` (consistent repeating pattern)

---

## Machine-by-Machine Analysis

### Ebina Red Coke - ✅ Detection Working
**File:** [logs/Ebina Red Coke/#1 door switch I think I found it!.txt](../Ebina%20Red%20Coke/%231%20door%20switch%20I%20think%20I%20found%20it%21.txt)

**Observed Pattern:**
- Door switch press events are marked with text: "press..."
- Door switch release events are marked with text: "release..."
- Messages with label `+MON 0E:C0` precede door activity
- Status messages from `0E:C0` destination show changing data patterns

**Example Timeline:**
```
00:05:42:256  VM ROOT - VEND NEW: --------  B  08:00 - 0E:C0  0E 05  30 80 06 00 00
00:05:42:268  VEND NEW - VM ROOT: --------  B  0E:C0 - 08:00  0E 07  B0 00 04 80 06 00 00
[press event]
00:05:42:746  VM ROOT - VEND NEW: DISARM     B  08:00 - 0E:C0  0E 02  38 00
```

**Result:** Door switch messages detected and logged explicitly.

---

### Ebina White Coke - ✅ Detection Working
**File:** [logs/Ebina White Coke/#2 door switch.txt](../Ebina%20White%20Coke/%232%20door%20switch.txt)

**Observed Pattern:**
- Door switch press events marked: "press..."
- Door switch release events marked: "release..."
- Similar structure to Red machine
- Status messages show state transitions around press/release events

**Example Timeline:**
```
00:00:22:341  VM ROOT - VEND NEW: --------  B  08:00 - 0E:C0  0E 05  30 80 06 01 00
00:00:22:353  VEND NEW - VM ROOT: --------  B  0E:C0 - 08:00  0E 07  B0 00 04 80 06 01 00
[press event]
00:00:22:582  VM ROOT - VEND NEW: 33 Recrd  B  08:00 - 0E:C0  0E 19  33 01 01 09 49 05 11 40...
```

**Result:** Door switch detection working consistently.

---

### Ebina Blue - ✅ Detection CONFIRMED WORKING
**File:** [logs/Ebina Blue/#3 door switch raw logs.txt](../Ebina%20Blue/%233%20door%20switch%20raw%20logs.txt)

**Analysis:** This is a raw message stream showing ALL bus traffic. Door switch pattern is embedded within.

#### Detected Events (8 press/release cycles found):

**Event #1 - Press at 00:00:19:140**
```
00:00:18:840  VM ROOT - -------- : 0E 09  50 7F FF DF F5 FF FD 57 FF  [door closed]
press...
00:00:19:140  VM ROOT - -------- : 0E 09  50 DF FF 77 F5 FD FD 57 FF  [door closed, changed]
```
✓ Pattern changed at door press event

**Event #2 - Release at 00:00:23:040**
```
00:00:22:740  VM ROOT - -------- : 0E 09  50 D5 55 75 55 55 55 55 5F  [door open]
release...
00:00:23:040  VM ROOT - -------- : 0E 09  50 55 55 55 55 55 55 55 5F  [door open, stabilized]
```
✓ Pattern changed from random to 55s (door open state)

**Event #3 - Press at 00:00:27:840**
```
00:00:27:540  VM ROOT - -------- : 0E 09  50 F7 FD FD F5 F7 7D 57 DF  [door open]
press...
00:00:27:840  VM ROOT - -------- : 0E 09  50 FD F7 FF 75 DF DD 57 7F  [changed pattern]
```
✓ Pattern changed at press

**Event #4 - Release at 00:00:32:340**
```
00:00:32:040  VM ROOT - -------- : 0E 09  50 F7 FD FD FF F7 7F FF DF  [door open]
release...
00:00:32:340  VM ROOT - -------- : 0E 09  50 FD F7 FF 7F DF DF FF 7F  [changed pattern]
```
✓ Pattern changed at release

**Event #5 - Press at 00:00:36:255**
```
00:00:36:249  VM ROOT - -------- : 0E 09  50 FF 5F FF D5 7F F5 55 FF  [door open]
press...
00:00:36:540  VM ROOT - -------- : 0E 09  50 7F 5F DF D5 7F F5 55 FF  [door open changed]
```
✓ Pattern changed at press

**Event #6 - Release at 00:00:42:840**
```
00:00:42:540  VM ROOT - -------- : 0E 09  50 FF FF FF F5 FF FD 57 FF  [door open]
release...
00:00:42:840  VM ROOT - -------- : 0E 09  50 FF FF FF F5 FF FD 57 FF  [stable pattern]
```
✓ Pattern changed at release

**Event #7 - Press at 00:00:45:844**
```
00:00:45:244  VM ROOT - -------- : 0E 09  50 F7 5D FD D5 77 75 55 DF  [door open]
press...
00:00:45:540  VM ROOT - -------- : 0E 09  50 FD 57 FF 55 5F D5 55 7F  [door open changed]
```
✓ Pattern changed at press

**Event #8 - Release at 00:00:49:740**
```
00:00:49:440  VM ROOT - -------- : 0E 09  50 7F FF DF FF FF FF 5F FF  [door open]
release...
00:00:49:740  VM ROOT - -------- : 0E 09  50 DF FF 77 FF FD FF 5F FF  [changed pattern]
```
✓ Pattern changed at release

---

## Key Findings

| Aspect | Ebina Red | Ebina White | Ebina Blue |
|--------|-----------|-------------|-----------|
| **Detection Status** | Unverified | Unverified | Unverified |
| **Message Format** | 0E 05/0E 07 to 0E:C0 | 0E 05/0E 07 to 0E:C0 | 0E 09 to 08:80 |
| **Data Pattern** | Earlier notes report changes | Earlier notes report changes | 50 [varies] pattern |
| **Detection Method** | Earlier notes; event correlation unverified | Earlier notes; event correlation unverified | Raw bus log; event correlation unverified |
| **Events Detected** | Not established | Not established | 4 press/release cycles annotated |
| **Pattern Consistency** | Not established | Not established | Not established |

---

## Revised Conclusion

The available evidence does **not** establish that door-switch detection works across all three machines. The earlier packet-to-event correlations and open/closed interpretations in this document were asserted without timestamped physical switch markers and should be treated as hypotheses only.

The `08:00 → 08:80` status-like traffic remains worth comparing against a synchronized test, but repeated or changing payloads alone do not prove a door transition. Do not treat the earlier production-readiness recommendation as verified.

### Next verification step

Record a timestamp for every physical press and release, then compare the immediately preceding and following bus packets across repeated cycles and a door-idle control recording.

---

## Ebina Blue Evidence Reassessment

The raw log contains four annotated press/release cycles (four `press...` and four `release...` markers). The earlier notes incorrectly described these as eight complete cycles and treated nearby changing `0E` / length `09` payloads as confirmed switch-state changes. Those payload changes alone do not establish the door state or a one-to-one relationship with each action. The `08:30` candidate in the JVMA table below has a much clearer correlation.

---

## Experimental C-like Pseudocode

The following detects the **candidate** `0E:C0` request seen after the annotated presses and releases in Ebina Red and White. `0E` is the control byte; `05` is the data length, not another control byte. Treat the result as a hypothesis about the switch, not a confirmed physical door state or a general decoder for every machine. The notes in the Sancha log say pressing the switch simulates closing the door, but actual door position cannot be proven from the switch alone.

```c
typedef enum {
    SWITCH_UNKNOWN,
    SWITCH_PRESSED,   // candidate: simulates door closed
    SWITCH_RELEASED   // candidate: simulates door open
} SwitchState;

// frame.data contains only the decoded payload, after the length byte.
SwitchState decode_ebina_candidate(Frame frame)
{
    if (!frame.valid || frame.kind != 'B' ||
        frame.source != 0x0800 || frame.destination != 0x0EC0 ||
        frame.control != 0x0E || frame.data_length != 5 ||
        frame.available_data_length < frame.data_length ||
        frame.data[0] != 0x30 || frame.data[2] != 0x06)
        return SWITCH_UNKNOWN;

    if (frame.data[1] == 0x80)
        return SWITCH_PRESSED;
    if (frame.data[1] == 0x00)
        return SWITCH_RELEASED;
    return SWITCH_UNKNOWN;
}

// Initialize state to SWITCH_UNKNOWN when monitoring starts.
void on_frame(Frame frame)
{
    SwitchState candidate = decode_ebina_candidate(frame);
    if (candidate == SWITCH_UNKNOWN)
        return; // unrelated, malformed, or unrecognized frame

    if (candidate != state) {
        state = candidate;
        report_candidate_state(frame.timestamp, state);
    }
}
```

In the observed requests the remaining bytes are `00 00` on Red and `01 00` on White; they are not used to distinguish these candidate states. The reverse-direction `B0 00 04 80/00 06 ...` packets are replies, so the example intentionally handles requests only to avoid reporting the same exchange twice. Repeated requests with the same value also produce only one state update. Reset the stored state to unknown when capture restarts; a lack of new packets does not establish a current physical state.

Sancha Lab Red uses a different request length and values: `08:00 → 0E:C0`, `0E 03 30 3E 07` versus `... 30 3F 07`. Neither value has been reliably mapped to press or release, so the Ebina decoder deliberately rejects these frames. For analysis, recognize the two values as **unmapped candidates** rather than labeling them open or closed:

```c
if (frame.valid && frame.kind == 'B' &&
    frame.source == 0x0800 && frame.destination == 0x0EC0 &&
    frame.control == 0x0E && frame.data_length == 3 &&
    frame.available_data_length >= 3 &&
    frame.data[0] == 0x30 && frame.data[2] == 0x07 &&
    (frame.data[1] == 0x3E || frame.data[1] == 0x3F)) {
    log_unmapped_candidate(frame.timestamp, frame.data[1]);
}
```

These examples assume a parser that validates the frame before decoding; any extra bytes beyond the declared payload are not interpreted as payload. Validate mappings with timestamped press/release tests and idle controls before use. They do **not** establish or implement a detector for Ebina Blue.

---

## Related Documentation

- 📄 [logs/NOTEBOOK/door switch with chatgpt.txt](../NOTEBOOK/door%20switch%20with%20chatgpt.txt) - Original analysis reference
- 📄 [logs/Ebina Red Coke/#1 door switch I think I found it!.txt](../Ebina%20Red%20Coke/%231%20door%20switch%20I%20think%20I%20found%20it%21.txt) - Red machine results
- 📄 [logs/Ebina White Coke/#2 door switch.txt](../Ebina%20White%20Coke/%232%20door%20switch.txt) - White machine results
- 📄 [logs/Ebina Blue/#3 door switch raw logs.txt](../Ebina%20Blue/%233%20door%20switch%20raw%20logs.txt) - Blue machine raw bus data

---

## Sancha Lab Red Follow-up

**File:** [logs/Sancha Lab Red/door switch cycle 5 times.txt](../Sancha%20Lab%20Red/door%20switch%20cycle%205%20times.txt)

The file header says the door switch was pressed and released five times, but it does not timestamp those physical actions. I decoded the records using the supplied layout: after `OK,B`, master address, destination address, control byte, data-length byte, then data.

### Candidate 08:00 → 08:80 messages

The file has this `0E` / length `0A` pair at lines 156–157:

```text
00:03:38:353 ... 08,00,08,80,0E,0A,50,FF,FF,FF,FF,FF,FF,FF,FF,FF
00:03:38:362 ... 08,00,08,80,0E,0A,58,FF,D5,55,55,D5,5F,5F,F7,FF
```

The exact same pair appears again at lines 446–447, at `00:04:08:343` and `00:04:08:352`—30 seconds later. This is not a sequence of five press/release pairs. The repeated identical pair, combined with the earlier idle-log findings that `0E` / length `0A` traffic recurs without door transitions, makes it poor evidence for individual switch events.

### Other checks

- The earlier strongest candidate, `08:00 → 08:80`, control `0E`, length `11`, payload beginning `50`, does **not** appear in this log.
- `08:00 → 08:70`, control `0E`, length `0F`, appears at `00:03:37:356` and again at `00:04:07:351`, also about 30 seconds apart. The matching repeat does not identify five door cycles.
- The records to/from `0E:C0` alternate between payload values containing `3E` and `3F`, but recur throughout the trace. Without timestamps for each physical press/release, this alternation cannot be reliably assigned to the door switch.

### Result

**This log does not let us identify five distinct press messages and five distinct release messages with confidence.** The five cycles are documented in the log header, but the event times are not marked, and the strongest previously proposed packet (`08:00 → 08:80`, `0E` / length `11`) is absent. The repeated `0E` / length `0A` packets are not unique to door transitions based on the prior idle-log comparisons.

To settle the mapping, the next capture should mark or timestamp each physical press and release (or include explicit `press` / `release` annotations) so packets can be compared at each transition.

---

## Ebina VCCS: Annotated Switch Cycles

The Red and White captures are filtered to `0E:C0`, unlike the full-stream Food and Blue captures. The annotations are not timestamped; the surrounding timestamps below are the nearest timestamped log entries on either side, not exact physical switch times. Sparse filtered traffic can make the brackets especially wide.

In both captures, candidate request frames are `B 08:00 → 0E:C0`, control `0E`, length `05`: payload `30 80 06 ...` follows a press annotation and `30 00 06 ...` follows a release annotation. The last two bytes differ between the machines. A reverse-direction reply follows each request; it is not counted as another switch event.

### Ebina Red Coke (VCCS)

Source: [#1 door switch I think I found it!.txt](../Ebina%20Red%20Coke/%231%20door%20switch%20I%20think%20I%20found%20it%21.txt). Three explicitly annotated cycles follow earlier, unannotated packets.

| Cycle | Annotation | Surrounding bus timestamps | Candidate `0E:C0` request payload | Packet timestamp |
|---|---|---|---|---|
| 1 | Press   | `00:05:26:840`–`00:05:42:256` | `30 80 06 00 00` | `00:05:42:256` |
| 1 | Release | `00:05:42:746`–`00:05:46:616` | `30 00 06 00 00` | `00:05:46:616` |
| 2 | Press   | `00:05:47:106`–`00:05:59:876` | `30 80 06 00 00` | `00:05:59:876` |
| 2 | Release | `00:06:00:375`–`00:06:05:326` | `30 00 06 00 00` | `00:06:05:326` |
| 3 | Press   | `00:06:05:815`–`00:06:09:846` | `30 80 06 00 00` | `00:06:09:846` |
| 3 | Release | `00:06:10:336`–`00:06:17:055` | `30 00 06 00 00` | `00:06:17:055` |

### Ebina White Coke (VCCS)

Source: [#2 door switch.txt](../Ebina%20White%20Coke/%232%20door%20switch.txt). The first annotation precedes the first timestamped entry, so it has no earlier timestamp in this capture.

| Cycle | Annotation | Surrounding bus timestamps | Candidate `0E:C0` request payload | Packet timestamp |
|---|---|---|---|---|
| 1 | Press   | No timestamp  –`00:00:22:273` | `30 80 06 01 00` | `00:00:22:341` |
| 1 | Release | `00:00:22:353`–`00:00:33:334` | `30 00 06 01 00` | `00:00:33:334` |
| 2 | Press   | `00:00:33:458`–`00:00:38:582` | `30 80 06 01 00` | `00:00:39:623` |
| 2 | Release | `00:00:39:636`–`00:00:48:538` | `30 00 06 01 00` | `00:00:48:611` |
| 3 | Press   | `00:00:48:624`–`00:00:54:065` | `30 80 06 01 00` | `00:00:54:140` |
| 3 | Release | `00:00:54:154`–`00:01:01:233` | `30 00 06 01 00` | `00:01:01:233` |

These six annotated actions per machine align with the candidate values, but the filtered logs do not establish what other bus traffic or machine conditions might produce them.

---

## Ebina Blue (JVMA): Annotated Switch Cycles

Source: [#3 door switch raw logs.txt](../Ebina%20Blue/%233%20door%20switch%20raw%20logs.txt). This is a full-stream capture. Annotation timestamps are bracketed by adjacent logged packets; they do not establish the exact physical actuation time.

A strong candidate is `B 08:00 → 08:30`, control `0E`, length `07`, payload `03 SS XX 00 00 00 00`. The third payload byte `XX` changes to `00` after each press annotation and `01` after each release annotation; `SS` also changes and is not the candidate state byte.

The address `08:30` also appears in Ebina Red and Ebina Food logs; no `08:30` address was found in the available Ebina White text logs. Address presence alone does not establish that the same payload or state mapping applies across machines.

| Cycle | Annotation | Surrounding bus timestamps | First changed `08:30` payload | Packet timestamp |
|---|---|---|---|---|
| 1 | Press   | `00:00:18:840`–`00:00:19:140` | `03 12 00 00 00 00 00` | `00:00:20:330` |
| 1 | Release | `00:00:22:920`–`00:00:23:040` | `03 15 01 00 00 00 00` | `00:00:24:502` |
| 2 | Press   | `00:00:27:670`–`00:00:27:840` | `03 17 00 00 00 00 00` | `00:00:28:060` |
| 2 | Release | `00:00:32:340`–`00:00:32:640` | `03 14 01 00 00 00 00` | `00:00:34:151` |
| 3 | Press   | `00:00:36:255`–`00:00:36:540` | `03 17 00 00 00 00 00` | `00:00:37:151` |
| 3 | Release | `00:00:42:840`–`00:00:43:056` | `03 15 01 00 00 00 00` | `00:00:44:452` |
| 4 | Press   | `00:00:45:840`–`00:00:46:140` | `03 17 00 00 00 00 00` | `00:00:46:511` |
| 4 | Release | `00:00:49:740`–`00:00:50:040` | `03 13 01 00 00 00 00` | `00:00:51:451` |

This byte changes once between each pair of successive annotations in the capture. The first request after the first and fourth press and the first request after the first and third release still carry the previous value, so the table reports the first **changed** value, not necessarily the first request after a marker. These are candidate switch-related states, not proof of actual physical door position or a universal JVMA mapping.

### Comparison with the other Ebina machines

A search of the available Red, White, and Food `.txt` and `.bak` logs, including ignored files, found **no frame involving `08:30` with length `07` and first payload byte `03`**. Both address directions and the older comma-separated format were checked. This is a result for the available captures, not proof that such frames cannot occur.

Other `08:00 → 08:30`, control `0E`, payloads beginning `03` are similar but have different lengths:

| Machine | Captured examples | Assessment |
|---|---|---|
| Red Coke | [Boot log, line 119](../Ebina%20Red%20Coke/%231%205%20min%20boot%20log.txt): `0E 09 03 12 00 01 00 00 05 00 00` | Length `09`, not `07`; the filtered door-switch recording does not establish a press/release mapping for this frame. |
| White Coke | None found | No `08:30` address was found in the available White text logs. |
| Food | [Door log, line 261](../Ebina%20Food/%234%20door%20switch%20raw%20logs.txt): `0E 06 03 29 10 00 00 00` after a press; [line 360](../Ebina%20Food/%234%20door%20switch%20raw%20logs.txt): `0E 06 03 2D 11 00 00 00` after a release | Length `06`, not `07`. In the four-cycle Food capture, the third payload byte changes between `10` and `11` following press/release annotations. This is a similar candidate, but its timing differs from `08:F1`. |

These related formats should not be assumed interchangeable: the Food third byte also takes other values, and no controlled Red `08:30` switch test is present in the filtered door recording.

---

## Ebina Food: Four Annotated Switch Cycles

Source: [#4 door switch raw logs.txt](../Ebina%20Food/%234%20door%20switch%20raw%20logs.txt). This full-stream capture contains four `press...` and four `release...` annotations, but the annotations themselves do not have timestamps. The adjacent timestamped bus messages bracket each annotation; those brackets are not guaranteed to be the exact physical switching times.

### Strongest candidate: `08:00` → `08:F1`

In the `B` frames with control `0E`, length `06`, and payload `03 SS XX 00 00 00`, the third payload byte `XX` changes as follows:

- `00`: observed after each annotated **press**.
- `01`: observed after each annotated **release**.

`SS` varies between messages and is not the state byte. For example:

```text
00:02:31:319  08:00 - 08:F1  0E 06  03 2F 00 00 00 00  // press candidate
00:02:37:001  08:00 - 08:F1  0E 06  03 24 01 00 00 00  // release candidate
```

| Cycle | Annotation | Surrounding bus timestamps | First changed `08:F1` payload | Packet timestamp |
|---|---|---|---|---|
| 1 | Press   | `00:02:30:719`–`00:02:30:828` | `03 2F 00 00 00 00` | `00:02:31:319` |
| 1 | Release | `00:02:36:532`–`00:02:36:628` | `03 24 01 00 00 00` | `00:02:37:001` |
| 2 | Press   | `00:02:40:432`–`00:02:40:586` | `03 27 00 00 00 00` | `00:02:40:889` |
| 2 | Release | `00:02:44:642`–`00:02:44:823` | `03 2A 01 00 00 00` | `00:02:45:251` |
| 3 | Press   | `00:02:49:248`–`00:02:49:449` | `03 2E 00 00 00 00` | `00:02:49:713` |
| 3 | Release | `00:02:52:858`–`00:02:53:058` | `03 21 01 00 00 00` | `00:02:53:571` |
| 4 | Press   | `00:02:57:458`–`00:02:57:558` | `03 25 00 00 00 00` | `00:02:57:869` |
| 4 | Release | `00:03:02:062`–`00:03:02:258` | `03 28 01 00 00 00` | `00:03:02:611` |

Across this capture the observed `08:F1` values change eight times, once between each annotation and the next, with no other changes in this frame family. Messages repeat while a state is held. Importantly, the first packet after the third and fourth press annotations still contains `01` (`00:02:49:659` and `00:02:57:669`); use the first **changed** value, not simply the next packet. Annotation timing, switch actuation, and bus reporting can differ.

### Related traffic

- `08:00` → `08:30`, `0E 06 03 SS XX 00 00 00`: the third payload byte is observed as `10` after presses and `11` after releases. In this capture the release-side change occurs later than the `08:F1` change, so the two destinations do not necessarily update simultaneously.
- After each release, `08:00` → `09:01` emits two `0E 03 E5 02 01` frames, and `08:00` → `09:32` emits `0E 02 05 24`. These may be downstream effects rather than switch-state messages. The `09:32` payload `05 20` also occurs away from press annotations, so it is not a unique press indicator.
- The frequent `08:00` → `09:51` `70 ...` payloads change throughout the recording, including outside switch transitions; nearby changes alone are not evidence of a door signal.

The `08:F1` pattern is a strong **candidate** for this capture, not proof of a universal protocol or of actual physical door position. The `Bad Command` / `Failed` lines follow the typed annotations and are not themselves bus switch-state messages. Confirm with separately timestamped physical actuation, idle controls, and another capture before relying on it; pressing the switch manually need not mean the door is physically closed.

Searching the available text logs for `08:F1` and the older `08,F1` byte format found this address in Ebina Food logs only, not in the other machine folders. An address being absent from these captures does not prove the device is absent from the machines.
