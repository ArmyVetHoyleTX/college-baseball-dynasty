# College Baseball Dynasty

A mobile dynasty management game for college baseball — Android, iOS, and Web.

Built with React Native + Expo. Pick a D1 program, recruit players, manage NIL deals, sim games with a full batter vs. pitcher engine, and chase the College World Series title.

## Getting Started

```bash
npm install
npx expo start
```

Scan the QR code in Expo Go, or press `w` for the web browser version.

## Features

- **At-bat simulation engine** — K%, BB%, HR% driven by 6+ interacting attributes (velocity, movement, control, contact, eye, power) with count pressure, fatigue curves, and L/R splits
- **In-game decisions** — Tired starter? Bunt? Hit-and-run? Interactive scenario prompts mid-game
- **Recruiting + NIL** — Scout pool, transfer portal, NIL budget management
- **Full CWS bracket** — Conference Tournament → Regionals → Super Regionals → Omaha
- **Player Career mode** — Play as a player, earn training points, transition to coaching
- **Coaching staff perks** — Level up your staff to unlock attribute bonuses
- **60+ real D1 programs** — Authentic colors, conferences, prestige ratings
- **Fully offline** — No account or internet needed, saves locally

## Stack

| | |
|---|---|
| Framework | React Native + Expo (managed) |
| Navigation | Expo Router |
| State | Zustand + AsyncStorage |
| UI | NativeWind (Tailwind) |
| Language | TypeScript |
