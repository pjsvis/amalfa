# Micro-Chart Playbook

Text-based visual representations for dense data displays.

## Horizontal Bars

```
[████████████░░░░░░░░░] 60%
[████████████████████░] 90%
[██░░░░░░░░░░░░░░░░░] 15%
```

```css
.bar-60 { --width: 60%; }
.bar-90 { --width: 90%; }
.bar-15 { --width: 15%; }
```

## Vertical Sparklines

```
Memory  ▂▃▅▆▇▇▆▅▃▂
Latency ▁▂▄▅▄▂▁▂▄
```

## Heat Indicators

```
Low   (.)
Med   (o)
High  (O)
Critical [@]
```

## Rules

1. Normalize all data points to the same scale
2. Label with the key metric (the "pivot point")
3. Use consistent character width (20-40 chars)
4. No legends - label directly