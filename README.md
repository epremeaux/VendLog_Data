# VendLog data

Vending machine log files and their metadata, managed by the
[VendLog](https://github.com/epremeaux/VendLog_App) app. Use the app's
**Synchronise** page rather than editing this repository by hand.

- Logs are stored in one folder per machine: `<machine>/<file>`.
- Each log has a sidecar `<file>.meta.json` (tags, machine, maker, date, description).
- `tags.json` is the shared tag vocabulary; `vendlog.json` records the data format and the newest app version used.

Hand edits are fine, but keep the JSON valid and do not rename a log without its sidecar.
