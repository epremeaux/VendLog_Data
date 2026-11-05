# Serial Console Commands

Commands typed into the USB serial monitor (921600 baud), handled in `src/main.cpp` (operator input section, starting at `PUBX`). Commands are case-sensitive and end with Enter.

## MQTT / modem (BG95)

| Command | What it does |
|---|---|
| `PUBX` | Sends a ping message (`SMARTVEND_PING`) to the server |
| `CONX` | Connects to the MQTT server |
| `DCONX` | Disconnects from the MQTT server |
| `MQCK` | Asks the modem for waiting MQTT messages (`AT+QMTRECV?`) and handles them |
| `CSQ` | Checks the cellular signal strength |
| `CCLK` | Gets the time from the cellular network |
| `CGMR` | Prints the modem firmware version |
| `SLAM` | Restarts the modem and LTE connection; MQTT reconnects afterwards |
| `ATH` | Disconnects MQTT and hangs up the LTE connection (for testing reconnects) |
| `GETGPS` | Gets the position (lat/lng) from the cell network |
| `EANT` | Switches to the external LTE antenna |
| `SELANT` | Tries the board and external antennas (3 s each) and keeps the one with the better signal |
| `BANT` | ⚠️ Does **not** switch antennas: the switching code is commented out and it runs `testsales()`, which writes a test sale record |

## STM32

| Command | What it does |
|---|---|
| `VER` | Asks the STM32 for its firmware version (`-V`) and prints the reply and response time |
| `ERR` | Asks the STM32 for its error status (`-ERR`) and prints the reply |
| `STM` | Sends `??` to check the STM32 is responding |
| `KICK` | Resets the STM32 (pulses the reset pin for 1 s) |
| `TICK` | Turns on the STM32's `00` heartbeat message (`HBINT1`) |
| `ST1` / `ST0` | Sends `ST1` / `ST0` to the STM32 (start / end) |
| `GET33` | Asks the STM32 for column data (`GET33:00`) |
| `GETLOC` | Asks the STM32 for the VMID and location code |
| `LAV` | Sends `LAV:02` to the STM32 (prints "dropped") |
| `PCR` | Test: sets column 14's price to 120 (`NEWPCR:14,120`) and updates the local price list |

## Message, amp and system logs

| Command | What it does |
|---|---|
| `MSGS` | Prints the saved STM32 message log (`/data/messages.log`) |
| `MSGDEL` | Deletes the message log and adds a `00:00,0000` marker |
| `SETMSG` | Adds a `00:00,0000` test entry to the message log |
| `AMPS` | Prints the amp (current) log with timestamps |
| `DUMP` | Prints the system log (`/data/system.log`) |
| `CLOG` | Deletes and recreates the system log |

## Sales

| Command | What it does |
|---|---|
| `GETSALES` | Prints the sales total |
| `SHS` | Prints all drink sales from `/data/drinksales.log` |
| `SENDMSG` | Sends the next unsent sale to the server |
| `CLEARSALES` | ⚠️ Deletes the sales log and clears the totals |
| `CLEARX` | Repairs the sales log by fixing the top bit of each product ID (prints "Resetting sales") |
| `DSD` | Test: adds a fake sale for a random column to the sales log |
| `DSX` | Test: builds a fake sale, sends it straight to the server and adds it to the totals |
| `OOS` | Test: sends an out-of-stock alert for a random column |
| `RESTOCK` | Test: sends a restock message for the last out-of-stock column |

## Machine config and products

| Command | What it does |
|---|---|
| `GETVM` | Prints the current VMID and location, plus the VMID saved in NVS |
| `GETCOLS` | Prints the number of columns (`VMCOLS`) |
| `BTNS` | Prints the button-to-column map |
| `PRX` | Prints the product list (PID, price, electronic-money price, out-of-stock flag) |
| `CRX` | Prints the channel (column → PID) table and saves it |
| `PRDS` | Prints the products array and looks up the product for button 30 |
| `RECIPE` / `RECIPE1` / `RECIPE2` | Runs a built-in test button sequence on the keypad |
| `FMW` | Test: overwrites the stored `firmware` string with a fixed value |
| `33TEST` | Test: parses a fixed `33:` line into the product list and decodes a sample screen |

## Storage, BLE and time

| Command | What it does |
|---|---|
| `LDIR` | Lists the files on the FAT partition |
| `DF` | Shows storage total, free and used (KB) |
| `REFORMAT` | ⚠️ Erases the whole storage partition (all logs and sales) and mounts it again |
| `ADVSTART` | Restarts BLE advertising |
| `ADVCHECK` | Shows whether BLE is advertising |
| `TIME` | Prints the board's current time |

## Cautions

- `BANT` writes a test sale instead of switching antennas.
- `REFORMAT` and `CLEARSALES` delete data with no confirmation.
- Several test commands send fake sales or alerts to the live server: `DSX`, `OOS`, `RESTOCK`, and `SENDMSG` after a `DSD`.
