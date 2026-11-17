# Vending Machine Product Dispensing Confirmation Message Analysis

## Executive Summary

The strongest current **candidate for a product dropping from a channel into the elevator basket** is an `08:F1` response of the form `08:F1 - 08:00 0E 04 84 <attempt-id> 12 00`, correlated with an earlier `08:00 - 08:F1 0E 0A 02 <attempt-id> <channel> 11 01 0A 50 00 00 00` command. The user reports that the product dropped into the basket in both jam-error videos as well as in `video buy 13.txt`; the jam errors occurred later when the elevator failed to deliver the product to the pickup slot and the machine refunded the coins. This candidate may indicate a drop into the basket, **not successful delivery to the customer**, and needs testing against attempts where no product dropped.

An older candidate, the following VEND-to-controller frame, occurs repeatedly in the buy-named logs:

```
08:30 - 08:00   0E  06   83 <CHANNEL> 49 03 07 00
```

Where:
- **08:30** = Source address (VEND module)
- **08:00** = Destination address (VM ROOT - main controller)
- **0E** = Control field
- **06** = Payload length (6 bytes)
- **83** = Observed response byte; its precise meaning is not established by these logs alone
- **\<CHANNEL\>** = Channel-like byte (values 21-2F observed)
- **49 03 07 00** = Repeating payload suffix

This is a candidate vending-related response pattern, **not proven evidence that a product physically dropped**. The frame repeats periodically—even many times within a single buy-named log—so a matching frame must not be counted as one dispense.

## Handoff summary: question and constraints

### Objective

Determine the exact log message, if one exists, that confirms a product physically dropped into the elevator basket, and determine the channel it came from. Analyze the buy-named text files in `logs/Ebina Food`. The operator reports one purchase per buy log and approximately 12 such logs. In both jam-error videos, channel 7 dispensed into the basket, but the elevator failed to deliver it to the pickup slot and the coins were refunded; these are not negative examples for the basket-drop event.

### Operational sequence supplied by the operator

Treat the display labels (`$: 0004`, etc.) as display values, not the serial-message payload:

1. While idle, the display shows temperature, typically below 10.
2. After money is inserted, it shows the inserted amount, typically divisible by 10.
3. The user enters a selection and the display shows the entered channel number.
4. The user presses ACCEPT. A known older-log key frame is:
   `UI 10KEY - VM ROOT : idle --- B 09:51 - 08:00 0E 03 30 FF FB`.
   Newer logs may label this key as `10key: A`; older logs may not label the key.
5. After ACCEPT, the display returns to the selected channel.
6. During the purchase, the display may show `$: 0000`. In the video for channel 13, the user observed this transition as the drink fell into the basket.
7. When the display returns to the temperature value, the machine has returned to its normal display. This alone does not distinguish successful customer delivery from an elevator failure and refund. Investigate messages after ACCEPT through this transition, and later messages for delivery failure.

The robot may try several physical channels mapped to the entered selection. The channel in a candidate frame, if it is a channel at all, may therefore differ from the user's entered selection. The log named `Buy 14, tries 14 then 15 then finally vends from 13.txt` is a useful known-outcome case.

### Frame interpretation and filtering

A bus frame has source address, destination address, control field, payload length, and payload. For example, in `09:51 - 08:00 0E 03 30 FF FB`, `09:51` is the source and `08:00` the destination; `0E` is control, `03` is payload length, and `30 FF FB` is payload.

Ignore standalone lines with the `05:00,0009`-style pattern when identifying the relevant bus messages. Do not mistake `$:` display labels or periodic status traffic for a vend event.

### Address observations across machine logs

A search of the machine logs under `logs` found `08:F1` traffic only in `Ebina Food` logs, not in logs from other machines. No machine log contained `08:FA`. These observations are limited to the available logs.

### Channel-number constraints and hypotheses

The operator confirms there are at least 30 channels; the exact count may be 30 or 36. The candidate frame byte values observed so far are `21`-`2F`; because this includes `2A`-`2F`, it cannot be a plain packed-BCD channel number. Direct hexadecimal interpretation gives 33-47 decimal, so a direct 1-based channel interpretation does not fit. An offset remains possible: for example, subtracting decimal 30 from the decoded values would map `21`-`2F` to channels 3-17, while subtracting `0x20` maps them to 1-15. Neither mapping has been verified.

No candidate frames with channel bytes `30`-`44` were found in the available logs. This is an observation about the captures, not evidence that the machine lacks those channels.

### Previous count correction

Do not use the earlier claim of **871 successful dispenses**; it was wrong. It counted matching frames across a broad scan of logs and mislabeled repeated frames as separate drops. A restricted scan found 501 occurrences of the candidate pattern in the 12 buy-named text files, but 501 is also only a raw frame count—not a purchase/drop count. Some files repeat the pattern at roughly two-second intervals.

### Files examined

The targeted scan covered these 12 buy-named text logs in `logs/Ebina Food` (metadata sidecars were excluded):

- `#4 buy 20 for 120 (inserted 130).txt`
- `#4 buy 7 for 120 (inserted 130).txt`
- `#4 buy channel 1 for 120 yen.txt`
- `#4 stream buy 19 completed!.txt`
- `Buy 14, tries 14 then 15 then finally vends from 13.txt`
- `food buy 12.txt`
- `food buy 6, vended from 7 with 30 yen change.txt`
- `food buy 7.txt`
- `Video anim + buy 7.txt`
- `video buy 13.txt`
- `video buy 7 jam error 2.txt`
- `video buy 7 jam error.txt`

The detailed sequence examples in this handoff were read from `food buy 7.txt` and `video buy 7 jam error.txt`. The `Buy 14...` filename was used as the known-outcome channel-mapping lead. The first, erroneous 871 count came from a broad scan of 56 `.txt`/`.log` files under `logs`; it is not a purchase count and should not be used.

## Protocol Structure

Each message follows this format:
```
[Source] - [Destination]  [Control]  [Len]  [Payload...]
```

### Example Breakdown
```
00:03:37:063  VEND - VM ROOT : ---  B  08:30 - 08:00   0E  06   83 21 49 03 07 00
```

- Timestamp: 00:03:37:063
- Source: VEND (vending motor controller)
- Destination: VM ROOT (main machine controller)
- Control field: 0E (standard)
- Payload length: 06 (6 bytes follow)
- Payload: `83 21 49 03 07 00`

## Channel Mapping

The logs show values `21` through `2F` in this byte. Their relationship to user-selected channel numbers should be confirmed against known transactions; repeated sequences mean per-log occurrence counts are not dispense counts.

The observed values include `2A`-`2F`, which are not valid packed-BCD bytes. So this byte is not a plain BCD channel number. Interpreted as direct hexadecimal, `21`-`2F` means decimal 33-47; that is not a direct 1-based channel number for a 30- or 36-channel machine. If it encodes a channel, it must use an offset or other mapping—or the byte may not be a channel number.

The operator reports that the machine has at least 30 channels (possibly 36). If the candidate byte were simply `0x20 + channel number`, channels 16-30 would use `30`-`3E`, and channels 31-36 would use `3F`-`44`. A search of the available logs found no candidate frames with channel bytes in `30`-`44`; only `21`-`2F` appeared. This makes the simple offset mapping unverified and shows that these logs do not establish how the full channel range is represented. The missing values may reflect limited activity in the captured logs, not the machine's channel count.

## Other observed frames (semantics unconfirmed)

### Frames beginning with `82`
```
08:30 - 08:00   0E  04   82 <CHANNEL> 00 00
08:30 - 08:00   0E  04   82 <CHANNEL> 00 01
```
- These appear in the jam-error logs, but their meaning is not established by this analysis.
- They do not use the candidate `83 ... 49 03 07 00` pattern.

### Frames beginning with `81`
```
08:30 - 08:00   0E  12   81 <CHANNEL> FF FF FF FF FF FF FF FF FF FF FF FF FF FF 0D FA
08:30 - 08:00   0E  12   81 <CHANNEL> FF FF FF FF FF FF FF FF FF FF FF FF FF FF <payload_bytes>
```
- These appear in the jam-error logs, but their meaning and relation to a physical drop are not established here.
- Payload length shown in the example is `0x12`.

### Frames beginning with `84`
```
08:30 - 08:00   0E  06   84 <CHANNEL> 01 00 00 00
08:30 - 08:00   0E  06   84 <CHANNEL> 02 00 00 00
08:30 - 08:00   0E  06   84 <CHANNEL> 34 00 01 1C
```
- Their meaning is not established by this analysis.

### Frames beginning with `C0`
```
08:F1 - 08:00   0E  12   C0 <CHANNEL> 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00
```
- A frame with this payload appears in the jam-error logs; its meaning is not established.

### Frames beginning with `93` or `94`
```
08:30 - 08:00   0E  12   93 <CHANNEL> 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00
08:30 - 08:00   0E  12   94 <CHANNEL> FF FF FF FF FF FF FF FF FF FF FF FF FF FF FF FF
```
- These are other VEND response patterns; their meaning is not established by this analysis.

## Purchase boundaries and channel assignment

The file named `Buy 14, tries 14 then 15 then finally vends from 13.txt` describes a multi-channel attempt. However, the candidate frame repeats as part of regular sequences, so its channel byte alone cannot establish which attempt produced the drink. The frame must be correlated to the accept event and the end-of-purchase display transition; do not infer a vend channel from an isolated occurrence.

The accept-key event and the display returning to temperature are useful boundaries for examining a single attempt. Within those boundaries, compare the candidate frames in successful examples against the two jam-error examples. The earlier analysis did not perform that transaction-bounded comparison, so it did not establish a successful-drop frame or failure codes.

## Findings and counting limits

The exact pattern `0E 06 83 <CHANNEL> 49 03 07 00` occurs **501 times across the 12 buy-named text files**. This number counts matching log frames only; it is not the number of purchases or successful drops. In `Video anim + buy 7.txt` alone it occurs 190 times, at roughly two-second intervals, demonstrating why counting every match as a vend is invalid.

The previous figure of **871 successful dispenses was wrong**. It came from counting matching frames in an overly broad scan across logs rather than isolating one purchase attempt at a time. The scan also treated repeated frames as separate successful drops without establishing that interpretation.

### What can be concluded

- The frame pattern and its channel-like byte are present in the logs.
- The candidate pattern occurs repeatedly and periodically, including in files with jam-error scenarios.
- The logs must be analyzed within purchase boundaries; occurrence totals cannot establish dispense totals.

### What cannot yet be concluded

- That `83 <CHANNEL> 49 03 07 00` uniquely confirms a physical drop.
- That the channel-like byte identifies the channel that actually dispensed.
- The meanings of the `81`, `82`, `84`, `93`, or `94` frames based solely on these observations.

A reliable drop marker still requires comparing the candidate frames inside each bounded purchase attempt (accept press through return to temperature) against both successful examples and the two jam-error logs.

## Current best guesses and complete examples

These are investigation leads, **not confirmed dispense messages**. The examples below reproduce complete log frames, including direction and both bus addresses.

### 1. `08:F1` drop-event candidate and channel correlation

The user observed `video buy 13.txt`: the machine tried channels 14, 15, and then 13; the drink fell into the basket around `00:41:30`. The command's third payload byte matches each channel as a direct hexadecimal value:

```text
00:40:48:041  08:00 - 08:F1  0E  0A  02 12 0E 11 01 0A 50 00 00 00
00:41:07:206  08:00 - 08:F1  0E  0A  02 14 0F 11 01 0A 50 00 00 00
00:41:26:116  08:00 - 08:F1  0E  0A  02 16 0D 11 01 0A 50 00 00 00
00:41:30:032  08:F1 - 08:00  0E  04  84 16 12 00
00:41:30:052  08:00 - 08:F1  0E  04  05 16 00 84
00:41:30:088  08:00 - 09:01  0E  08  E0 FF FF FF FF FF FF FF  $: 0000
```

The candidate `84 16 12 00` precedes the `0000` display by 56 ms. The shared `16` likely correlates the response to the command whose channel byte is `0D` (13), rather than itself specifying a channel. This correlation is a hypothesis, not a fully decoded protocol.

Working interpretation: `02 <id> <channel> 11 01 0A 50 00 00 00` is a candidate drop request; the third payload byte identifies the channel, and the second is a request/response correlation code. `84 <id> 12 00` is a candidate confirmation that the product dropped into the basket. The remaining request bytes are not yet decoded and must not be discarded from the matching criteria: the five-minute boot log includes `08:00 - 08:F1 0E 0A 02 11 00 E0 00 00 00 00 00 00`, so `02` alone does not uniquely identify a drop request. Boot responses also include `84 <id> 01 00`, `84 <id> 02 00`, and `84 <id> 04 00`, making the `12` status important; `84` alone is not a drop confirmation.

The operator clarified that the jam videos show a successful channel-7 drop into the basket followed by a later elevator-delivery failure and refund. Both logs contain matching command/response pairs:

```text
video buy 7 jam error.txt:
00:24:43:214  08:00 - 08:F1  0E  0A  02 17 07 11 01 0A 50 00 00 00
00:24:47:616  08:F1 - 08:00  0E  04  84 17 12 00

video buy 7 jam error 2.txt:
00:32:25:604  08:00 - 08:F1  0E  0A  02 12 07 11 01 0A 50 00 00 00
00:32:29:920  08:F1 - 08:00  0E  04  84 12 12 00
```

The operator also confirmed that `Video anim + buy 7.txt` went directly to channel 7, dropped the drink, and delivered it normally:

```text
00:13:34:440  08:00 - 08:F1  0E  0A  02 12 07 11 01 0A 50 00 00 00
00:13:38:878  08:F1 - 08:00  0E  04  84 12 12 00
00:13:38:936  08:00 - 09:01  0E  08  E0 FF FF FF FF FF FF FF  $: 0000
```

In this example, the candidate response precedes the `0000` display by 58 ms.

Across the 12 buy-named food text logs, `08:F1 - 08:00 0E 04 84 <id> 12 00` appears once in each of 11 files and does not appear in `#4 buy channel 1 for 120 yen.txt`. The operator reports that this exception is incomplete and data was lost after the 120 yen was inserted; it cannot establish whether a drop occurred or a confirmation was missed. The captured portion contains an ACCEPT and a channel-1 request `08:00 - 08:F1 0E 0A 02 12 01 11 01 0A 50 00 00 00`; the same ID receives statuses `01`, `02`, `42`, and `44`, but not `12`. The candidate response is absent from all seven non-buy food text logs examined, including the boot, door and button logs.

These observations support the basket-drop hypothesis but do not prove that `12` is exclusive to a drop; compare an observed no-drop attempt. A later elevator jam/refund does not contradict a prior basket drop and must not be used as evidence of a successful customer delivery.

### 2. Repeated `83` response: not a unique drop signal

In `food buy 7.txt`, the controller request and VEND response are followed by an acknowledgement:

```text
00:03:37:053  VM ROOT  - VEND     : -------- ---  B  08:00 - 08:30   0E  06   03 21 15 01 04 01
00:03:37:063  VEND     - VM ROOT  : -------- ---  B  08:30 - 08:00   0E  06   83 21 49 03 07 00
00:03:37:087  VM ROOT  - VEND     : -------- ---  B  08:00 - 08:30   0E  04   05 21 00 83
```

The same response family also appears in the jam-error log:

```text
00:24:23:856  VM ROOT  - VEND     : -------- ---  B  08:00 - 08:30   0E  06   03 27 10 00 04 01
00:24:23:866  VEND     - VM ROOT  : -------- ---  B  08:30 - 08:00   0E  06   83 27 49 03 07 00
00:24:23:885  VM ROOT  - VEND     : -------- ---  B  08:00 - 08:30   0E  04   05 27 00 83
```

It also repeats in channel-like sequences at regular intervals. In the first example, a `$: 0004` temperature display frame occurs at `00:03:37:048`, just before the `83` response. That timing is outside the proposed accept-to-return-to-temperature window, further cautioning against treating each `83` response as a drop confirmation.

### 3. Longer VEND status/event-looking frames

These complete VEND-to-controller frames occur near the repeated response sequence and may be useful for comparison across known successful and jammed attempts. Their meanings are not decoded:

```text
00:03:36:565  VEND     - VM ROOT  : -------- ---  B  08:30 - 08:00   0E  11   80 22 25 10 00 00 00 00 00 00 00 00 00 00 00 00 42
00:03:36:592  VEND     - VM ROOT  : -------- ---  B  08:30 - 08:00   0E  12   93 21 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00
```

Compare these frames only within bounded purchase attempts; their appearance in a log is not enough to assign a meaning.

### 4. Frames observed in the jam-error log

These are useful failure-side comparators. Their semantics are also unconfirmed:

```text
00:24:24:882  VEND     - VM ROOT  : -------- ---  B  08:30 - 08:00   0E  04   82 8D 00 00
00:24:35:674  VEND     - VM ROOT  : -------- ---  B  08:30 - 08:00   0E  12   81 86 FF FF FF FF FF FF FF FF FF FF FF FF FF 0D FA
```

### Suggested next analysis

For each known purchase, find the ACCEPT frame and the subsequent return-to-temperature frame, then compare complete frames across the interval. Record the entered selection, candidate command channel and attempt identifier, and subsequent `08:F1` responses. Compare the candidate drop event with video-confirmed no-drop attempts, and analyze later messages separately for elevator delivery failures and refunds. Do not infer a mapping from the older recurring VEND-response byte range alone.
