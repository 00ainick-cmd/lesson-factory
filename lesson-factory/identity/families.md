# Electric Ink color families

Same chrome. Different accent. One family per course, not per lesson.

Locked in every family: `--ink` `#0a0b0d`, `--ink-2` `#111318`, `--ink-3` `#171a21`, `--line` `#262b34`, `--paper` `#eef1f4`, `--paper-2` `#c6ccd6`, `--paper-3` `#a3abba`, `--ok` `#5ddb9a`, `--bad` `#ff6b6b`. Type, dock, cards, checkpoint, field card. Do not add a rail or a HUD to "freshen."

## DC (Fundamentals of Direct Current)

Color **means a quantity**. Do not reassign these.

| Token | Hex | Means |
|---|---|---|
| `--R` | `#ff9e3d` | Resistance (hero on the Resistance lesson) |
| `--I` | `#39d7ff` | Current |
| `--V` | `#b48cff` | Voltage (hero on the Voltage lesson) |

Hero underline, dock playing stripe, and kickers use the lesson's quantity. Correct / wrong stay `--ok` / `--bad`. Nothing else gets a brand color.

## Systems (first gold: ESD, C18)

Nick locked this: the Systems family **starts at ESD**, not at Digital. Clone `electric-ink-chassis/lesson-chassis.html`, pick the day's recipe, retoken chrome `--qty` / `--R` to `--hero`. After ESD ships, later VOR / databus / regs clone that ESD file, not Resistance.

Quantity colors may still appear on a meter or a bus callout. They are no longer the chrome.

Tokens (Nick signs these on the ESD lesson itself; do not ship a third palette):

| Token | Hex | Role |
|---|---|---|
| `--hero` | `#3ee0c8` | Underline, dock stripe, kickers, primary schematic |
| `--spot` | `#e6b84d` | Secondary callout (not Resistance amber) |
| `--dim` | `#1a3d38` | Hero dim, same job as `--R-dim` |

Clone the stencil (or the ESD gold once it exists). Rename the hero token from `--qty` / `--R` to `--hero` in chrome only. Leave `--R` `--I` `--V` in the file if a figure still names those quantities.

If Nick hates `--hero`, stop and pick one replacement. Do not invent a new skin.
