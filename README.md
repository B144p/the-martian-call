# The Martian Call (DEMO)

> *"In the face of overwhelming odds, I'm left with only one option — I'm gonna have to science the shit out of this."*
> — Mark Watney, The Martian (2015)


Inspired by that scene where a guy stuck on Mars rotates a broken antenna, encodes a message in HEX, and just... hopes someone picks it up.

> The real idea is **lost in space** — stranded somewhere in the universe, no idea who's out there, shouting into the dark and waiting.

But that's a lot to take in. So v1 starts on Earth, where continents are the zones and the distances feel familiar. Same loneliness, easier to understand.

## What is this?

A chat app — but not really. You don't have a contact list. You don't pick who you talk to. You don't even know if anyone is out there.

Here's how it works:

1. You get assigned to a **continent** and a random callsign like `OPERATOR-4472`
2. You **rotate your antenna** toward a direction (12 steps, 30° each, 1 step per second — no cheating)
3. You type a message. Watch it convert to **HEX in real time**
4. You hit send. The HEX dial starts spinning. Your message is now *transmitting*
5. After the full transmission delay, it arrives — real-time via WebSocket — to whoever is in range
6. You close the tab, the server keeps transmitting. It doesn't care
7. Nobody responds. Or maybe someone does. You have no idea

> Point the wrong way and your signal goes into a **dead zone**. No error. No warning. It just disappears into the void — which, honestly, is kind of the point.

## The cool parts

- **Transmission takes actual time** — 2 characters per second. 100-char message = 50 seconds of watching a clock-face needle tick through HEX values
- **You can cancel mid-transmission** — the partial message still gets delivered with `[Transmission got interrupted!]` appended
- **Missed signals** — if you were offline when something arrived, you get a banner on login: *"You have X missed signals."* No content shown. Just a direction and a timestamp. Someone was pointing at you
- **Real-time everything** — Socket.io WebSocket, no polling, no Pusher, no third-party relay. Just a persistent NestJS process doing its job
- **Dead zones are intentional** — some directions from some continents reach nobody. That's a feature

> *When have few user: The mood is like => You lost in space => shout out to someone. Even correct direction => if no one on that side online => You don't know other exist.*

## Stack

- **Next.js 16** (App Router)
- **TypeScript** strict
- **Tailwind CSS** + shadcn/ui
- **react-leaflet** — interactive world map
- **socket.io-client** — real-time WebSocket
- Deployed on **Vercel**

## Behind the build

This is my first project built with [Claude Code](https://claude.ai/code) — using AI as a coding partner throughout.

One rule I kept: only work within tech stacks I already know. Like the someone saying, `"Don't invest in what you don't understand."` Claude Code is genuinely useful, but handing the wheel to an AI on unfamiliar ground is how you end up with code you can't read, debug, or trust.

Actually, I just concern about security and cost-spike.

> *Rotate. Transmit. Hope.*
