# Nick's AET Certification Book (voice lock)

Authoring skill: `nick-aet-voice` (`~/.claude/skills/nick-aet-voice/`).
**How to write like this book:** `NICK-VOICE-STYLE-GUIDE.md` (read that first on every authoring pass).
Source: Nick Brown, first AET ebook, pasted 2026-08-27, full text re-pasted 2026-08-28.
This file is locked definitions and numbers. The style guide is sentence craft. Improve muddy lines for the screen. Do not flatten into magazine copy.

The GMetrix/USI question bank is the live certification test. Do not open it to write a lesson. Practice items: `PRACTICE-QUESTION-BANK.md`. This book is how the lesson talks.

## How Nick writes
- Name it. Define it in one sentence. Give the symbol and the unit.
- "There are 2 types..." then name them.
- Series formula, then parallel formula, then what happens if you pull a part.
- Then the tool, and the hookup rule. Caps when it matters: ALWAYS, NEVER.
- Walk one number all the way (color code, 20+15+30=65, 9/65=.13 A). Admit rounding (2.6+1.95+3.9=8.45, close to 9).
- Aircraft when it earns the idea (battery on the aircraft, landing gear AND, pressurization OR). Not decoration.
- Short. Direct. Informal where it helps ("oscope", "meat hook", "pretty basic tool").
- Memory devices he actually uses: PIE, Points-iN-Perfectly / Never Points-iN.
- Direct relationship / Indirect relationship, spelled out, often in caps.

Do not write: "Hold onto this." "That is this lesson." "Every wire fights." Fake poetry. Corporate filler.

Water tank analogy: Nick uses it for voltage only. Do not paste it onto resistance.

## Locked definitions (use these words)
- Electricity: the study of the movement of electrons and how that movement causes things to do work.
- Insulators stop the flow of electrons (insulation on the wire). Conductors conduct well. Aircraft wire is copper because it is cheap and conducts well. A conductor has many free electrons.
- Practical circuit needs three things: Voltage Source, Conductor, Load.
- Series: 1 path. Parallel: more than 1 path.
- Ohm's Law: the relationship of Amps, Volts, and Ohms. Parts: Current, Voltage, Resistance. E = I * R.
- Current: the flow of electrons. Unit: Amps. Symbol: I. Electron flow: Negative to Positive. Conventional: Positive to Negative. Series: It = I1 = I2 = In (constant). Parallel: It = I1 + I2 + In (adds). Ammeter in series so current flows thru the meter.
- Voltage: the pressure of electrons. Unit: volts. Symbol: E or V. Series: Et = E1 + E2 + En (adds; batteries in series for more voltage). Parallel: Et = E1 = E2 = En (stays the same). Voltmeter in parallel. If you suspect 0 volts, check it with a voltmeter.
- Resistance: the opposition to the flow (current) of electricity. Unit: Ohms. Symbol: R. 2 types: fixed (set value) and variable (adjustable).
- Power: the work produced. Symbol: P. Unit: Watts. P = I * E (PIE). Series and parallel: power adds. 1 HP = 747 W. Ignore efficiency on that conversion.

## Resistance (this lesson)
Series: Rt = R1 + R2 + Rn. Remove a resistor in series, total resistance decreases.
Parallel: reciprocal of the sum of the individual reciprocals. Remove a resistor in parallel, total resistance increases.
Most common thing to check. Often the easiest way to troubleshoot.

Faults:
- Open: Infinite resistance (blown resistor or other component).
- Short: very little resistance.
- Closed switch: close to 0 ohms.
- Wire: .2-.3 ohms is a good reading.

Color code (4-band): first digit, second digit, multiplier (number of zeros), fourth = tolerance.
Silver and Gold are NEVER the first band. They are only the fourth band (tolerance).
Worked example from the book: Red, Orange, Blue, Silver = 23,000,000 +/- 10%.

Ohmmeter (Nick's steps):
1. Power is OFF.
2. Device is disconnected from the rest of the circuit. You only want the device, not the whole circuit.
3. Meter in parallel over the device. Polarity does not matter.

Ammeter: power ON, red to A (drop to mA/uA if needed; do not start small or you blow the fuse), dial to A, Fluke yellow button AC/DC, ALWAYS check the LCD, meter in series, red toward anode, black toward cathode. Break at the battery or the light if that is the easy access.

Voltmeter: power ON, red to V, meter in parallel (or over) the device, red toward anode, black toward cathode. That is the voltage drop of the device.

## Circuit calculations takeaways
SERIES: one path. Power consumed. Voltage dropped across the loads. Current stays the same. Total R is the sum.
PARALLEL: more than one path. Power consumed. Voltage stays the same. Current adds (divided amongst the branches). Total R is the reciprocal of the sum of the individual reciprocals.
Kirchhoff: the algebraic sum of all voltage drops will equal the source voltage.

Sample he walks: R1=20, R2=15, R3=30, E=9 V. Rt=65. It=9/65=.13 A. Drops: 2.6 V, 1.95 V, 3.9 V.

## Later modules (do not invent; lift from this book)
AC: sine wave, electrons shift back and forth. Effective / RMS = 0.707 x Peak. Peak = Maximum Instantaneous Voltage. Effective is always LESS than Peak. Frequency = 1/time. Hertz.
Oscope: horizontal = time, vertical = voltage. Divisions. Count blocks for one full cycle (360 deg), times Time/Div, then 1/time. Peak: count to the peak, times Volts/Div. Then x 0.707 for RMS.
Capacitor: 2 metal plates, dielectric (usually paper). Farads, C. Series: reciprocal (opposite of resistors). Parallel: adds. Analog meter, highest ohms: good cap charges then holds around 40k. Leaky: charges then slowly back to zero. Open: infinite.
Inductor: coils of wire. Turns current into a magnetic field. Henrys, L. Series/parallel same as resistors. Parallel total is less than the smallest. Left-Hand Rule for magnetic polarity.
Reactance: opposition to AC from C and L. X, ohms. Xl = 2 pi F L (direct with F and L). Xc = 1 / (2 pi F C) (indirect: F or C up, Xc down). X is the leftover of Xl vs Xc. Impedance Z = sqrt(R^2 + X^2).
Transformer: primary, secondary, core (usually iron). More turns on primary than secondary: step down V, step up I. Less on primary: step up V, step down I. Np/Ns = Ep/Es = Is/Ip. N direct with E, indirect with I. Open: infinite ohms, 0 volts. 0 V on secondary: open primary OR open secondary. Voltage alone is inconclusive. Check resistance. Hysteresis = lag from AC field reversing.
Semiconductors: P and N, PN junction, depletion layer. Reverse bias: high R, no current. Forward bias: low R, current. Electron flow against the arrow.
Diode: one-way valve. LED lights only in forward bias.
Rectifier: AC to DC. Full wave: 2 diodes at DIFFERENT times. Reverse the diodes, circuit fails. Capacitor in parallel filters ripple. Larger C, less ripple. Filter cutoff 70.7%.
Transistor: 2 junctions, PNP or NPN. Base, Emitter (arrow), Collector. Electron flow against the arrow. NPN: Emitter to Collector. PNP: Collector to Emitter. Ie = Ic + Ib. Emitter is 100% of the current. Amplify or switch.
Oscillators: DC in, timing AC pulse out. Tank (L and C in parallel) sets frequency. F = 1 / (2 pi sqrt(LC)). Indirect: L or C up, F down. Hartley: series fed DC tank, tapped coil. Crystal: crystal sets F, no L/C. Damping: amplitude dies; feedback path puts energy back.
Multivibrators: DC in, 1 or 0 out, no in between. Astable auto-flips. Bistable you switch. Monostable one shot (Morse).
EVR: Zener. Reverse bias holds a set voltage. R4 is the output adjust.

Logic: NOT inverts. OR: HIGH if ANY input HIGH (pressurization warning). AND: HIGH only if ALL HIGH (landing gear: airspeed AND switch). XOR: HIGH if ONLY 1 HIGH (PA: one talker, not two). NOR/NAND/XNOR: flip the output column.
Full adder: walk the gates. Example: A=1, B=1, Cin=0 gives S=0, Cout=1.
Flip flops / counters: clocked (synchronous). Positive edge = uptick. Negative = downtick. JK toggle when J, K, and CLOCK are HIGH: Q is 1/2 the clock frequency.

Wiring: coax for antennas, ground both ends. Safety wire: double twist most common; .032 in wire for holes larger than .045 in. AWG up = diameter down. Stranded in avionics (flex, handle, less break). Aircraft wire 600 V. Bonding = return path to ground. Wire chart: voltage vertical (14, 28, 115, 400), feet horizontal, breaker diagonal, pick the bigger diameter (smaller AWG number).
Diagrams: wiring (pins + wire size + harness troubleshoot). Pictorial (physical location). Block (how boxes link). Schematic (functional location, troubleshoot). Landing gear: GREEN/RED are also PUSH-TO-TEST. Wire 7 is both. Open 7 loses both tests.
Records after post-install: 1 weight and balance, 2 update equipment list, 3 enter the installation in maintenance records. STC plus 43-13.1b / 43-13.2b / FARs.

Flight: four forces (thrust/drag, lift/gravity). Cantilever = internal bracing. Semi-monocoque most common. Stabilizer = horizontal stabilizer + elevator. Longitudinal: nose to tail, roll, ailerons. Lateral: wingtip to wingtip, pitch, elevator. Vertical: top to bottom at COG, yaw.

Safety: SDS from the manufacturer. Cradle to the Grave on hazwaste. Lift with legs. PULL a wrench. Electrocution: first break them from the circuit. Hearing: leave the area. REMOVE BEFORE FLIGHT streamers. Corrosion: galvanic (dissimilar metals), pitting (gray/white powder, salt), intergranular (grain boundaries). FOE: tool management. Radar: leave if burning under the skin. ESD: ground tools and people, never handle ESDS by the leads, ESD bags, no nylon.

## OCR / copy issues in the paste (do not ship until Nick confirms)
Formulas in the paste arrived as boxes. Reconstruct from the words around them, not from the boxes.
A few lines in the book contradict themselves or invert a term (oscillator vs inverter, EVR "Zener voltage will increase", binary "one for zero"). Ask Nick before "fixing" those in a lesson. Do not silently rewrite his physics on atoms (insulator = many protons) unless he says to.

## File map
Working resistance lesson: `01-resistance.html`
This lock: `NICK-AET-CERT-BOOK.md`
Bank stems still useful: AET Direct Current question file.
