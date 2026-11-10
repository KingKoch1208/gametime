# Out in Athens: iPhone prototype

A clickable prototype of a guide to everything to do in Athens, GA that isn't just the bars downtown: events, trails, parks, museums, courts, food, shows and games. It serves **UGA students** and **Athens locals** in one app, and it never sends someone somewhere they can't get into.

This is a **design and feature prototype for partner pitches** (Visit Athens, UGA Rec, Student Affairs, Office of Sustainability). There is no backend. All content is local mock data, and the dates are generated relative to the phone's clock so the demo always looks current.

> **Prototype — sample data.** Event names, lineups, prices, opponents, hours and deals are made up. Place names and coordinates are real Athens spots.

---

## Run it on an iPhone

**You need:** Node.js 20 or newer, and the **Expo Go** app from the App Store (it must support Expo SDK 58).

```bash
cd out-in-athens
npm install
npx expo start
```

1. A QR code appears in the terminal.
2. Scan it with the iPhone **Camera** app, then tap the banner to open it in Expo Go.
3. Your phone and computer need to be on the same Wi-Fi. If they aren't (for example on campus Wi-Fi that blocks devices from seeing each other), run `npx expo start --tunnel` instead.

Other useful commands:

```bash
npm run typecheck   # TypeScript
npm run lint        # ESLint (expo config)
```

To start over in the app, go to **Profile → Reset demo & restart onboarding**.

### No computer? Share the web preview

The app also builds as a single web page that runs in any phone browser (no Expo Go needed):

```bash
npm run build:web-preview     # → web-preview/out-in-athens.html (one self-contained file)
```

Host that one file anywhere (it's what powers the shareable preview link). In the web version, the map is an illustrated stand-in, because real map tiles and Apple Maps can't load in a hosted page. Haptics, the iPhone calendar sheet and story-card sharing only work in the native app. The web-only swaps live in `web/` and `metro.config.js`; the iPhone app doesn't use them.

---

## A 3-minute pitch demo

1. **Onboarding:** pick *UGA student*, tap a few interests, choose *Walk*, set an age. (You can skip; skipping defaults to Local mode, the safest choice.)
2. **Now tab → "I'm bored."** Cards are dealt with a shuffle sound. Swipe right to save, left to skip, or tap **Let's go** for Apple Maps directions.
3. **Map tab:** live pins pulse and busy areas glow. Drag the **time slider** from *Now → Tonight → This weekend* and watch pins come and go. Tap a pin, then swipe the bottom card sideways through nearby spots.
4. **Pitch Mode:** long-press the **Out in Athens** logo (or turn it on in Profile → Settings). A floating **STUDENT | LOCAL** switch appears at the top of every screen.
   - Flip to **Local**. Ramsey Center and dining hall items disappear, and Tate trivia gets a "w/ student guest" stamp.
   - In Events, tap **"Show them (locked)"** to reveal UGA-only items greyed out with a lock and no RSVP or directions.
   - Tap the ☀/☂ button on the switch to fake **rain**. The Now feed moves indoor picks to the top and says why.
5. **Event detail:** tap **Share** to make a poster-style story card, **Calendar** to add it to the iPhone calendar, or **Make a plan** to invite mock friends and poll a time.
6. **Explore → a place → Check in.** A passport stamp slams down, and badges fill up in **Profile / Passport**.
7. **Profile → Partner Portal (demo):** shows what Visit Athens or UGA Rec would see: views, saves, "going" counts, audience mix, **Post an event**, and **Request Featured**.
8. **Profile → Theme → After dark** to switch to the dark theme.

---

## What's in the app

| Area | Highlights |
|---|---|
| **Onboarding** | 4 skippable steps: Access Mode, interests, how you get around (sets the "near me" radius), and an optional age range |
| **Access Mode** | `open / uga_id / uga_guest_ok / 18+ / 21+ / ticketed` on every item. Locals don't see `uga_id` by default; the "Show UGA-only stuff" toggle shows them locked. Students get **Dawg perk** badges. Known-too-young age gates hide items for everyone. |
| **Now** | Live greeting line (day, weather, count open nearby), the **I'm bored** deck, time chips, Happening, Featured (always labeled), Free this week, **Not a bar crowd**, friends going, new this week, curated guides, and a late-night "get home safe" block |
| **Events** | Category sections, quick chips, a filter bottom sheet (free, open to me, walkable, car-free, indoor/outdoor, all-ages, sober-friendly, accessible, pet-friendly, price, date range), a list ↔ 14-day calendar strip, and ticket-stub skeleton loaders |
| **Event detail** | Poster header with date stamp, access stamps, Interested/Going with friend avatars, Calendar / Share / Directions / Make a plan, a mini map, walk/bike/bus times, lineup or opponent, student ticket note, watch parties for away games, review tags, source badge, and "Report outdated info" |
| **Map** | Custom illustrated pins (brick = events, ivy = places, mustard = food), pulsing live pins, heat glow, friend bubbles, Ghost Mode, filter chips, grid clustering when zoomed out, re-center, a time slider, and a swipeable pin sheet |
| **Explore** | 9 category tiles, flyer-style place cards (hours, cost, access, good-for, travel badges), car-free picks, 7 magazine-style guides, and the Athens Passport |
| **Food** | Open now / cheap / late / deals / coffee / sweet / healthy / dietary, deals by day, farmers market, trucks spotted today, dining halls (Dawg perk), and a discreet food-resources section |
| **Profile** | Access Mode, age, transport, interests, a "My plans" agenda, saved items, passport rings, friends plus Ghost Mode, followed orgs, submissions (pending), notifications, theme, text size, reduce motion, sounds, Pitch Mode, and the "Prototype — sample data" footer |
| **Social** | Make a Plan (invite, time poll, shared card), Add something (form → *Pending review*), org pages with follow and a verified badge, review-lite tags |

---

## Project structure

```
out-in-athens/
  src/
    app/                 expo-router screens (every file is a route)
      (tabs)/            Now, Events, Map, Explore, Food + custom tab bar
      event/[id].tsx     place/[id].tsx  guide/[id].tsx  org/[id].tsx
      onboarding.tsx     bored.tsx  profile.tsx  passport.tsx
      plan.tsx           submit.tsx  partner.tsx
    data/                ALL mock content + shared types
    services/
      dataService.ts     the only module screens read content through  ← backend seam
    lib/                 access logic, time/hours, geo/travel times, haptics + sounds
    state/AppState.tsx   profile, prefs, saves, check-ins, plans (AsyncStorage)
    theme/               tokens (palette, fonts) + Paper / After-dark themes
    components/          ticket stubs, stamps, flyer cards, icon set, sheets, pins…
  assets/                paper grain, shuffle/stamp sounds, icon, splash
```

**The backend seam:** screens call `getEvents(filters)`, `getPlaces(filters)`, `getBoredDeck(...)`, `getOrgAnalytics(...)` and the rest from `src/services/dataService.ts`. Each is marked `// TODO: backend`. Firebase, partner feeds or a scraper can replace those function bodies without touching any screen. Access filtering (`lib/access.ts`) runs on every result, so the "never push people to things they can't enter" rule holds whatever the data source is.

**Expo Go compatible:** every native module used ships in Expo Go: react-native-maps (Apple Maps, no API key), expo-haptics, expo-audio, expo-calendar (system "New Event" sheet), react-native-view-shot + expo-sharing (story card), expo-image-picker, AsyncStorage and react-native-svg.

---

## Backend decisions still open

1. **Who updates events?** The options are the team, partners posting directly (Partner Portal), student and local submissions, or an AI scraper of partner sites and venue calendars. The prototype marks the source on every listing (*Listed by Visit Athens*, *Student submitted ✓ verified*, *From venue calendar (auto)*) because the answer is probably "all of the above, with different trust levels." Scraping needs permission from each venue, and someone has to own freshness.
2. **Moderation flow.** Submissions land as *Pending review* (`submit.tsx` has a TODO). Still to decide: who reviews, the expected turnaround, auto-checks (duplicates, spam, wrong access level, bar crawls dressed up as events), whether trusted partners skip review, and how "Report outdated info" reports are triaged.
3. **Real UGA login (EITS / UGA SSO) vs. self-declared Access Mode.** Today Access Mode is self-declared, which is fine for discovery. The risk is a local flipping to Student and showing up at Ramsey, but the venue still checks IDs, so the cost is low. Verified login would unlock trustworthy Dawg perks and student-only RSVPs. It needs EITS approval and has FERPA implications.
4. **Location-sharing privacy.** Friends-on-map is opt-in with Ghost Mode. Still to decide: whether location is shared with friends only or friends-of-friends, precise or fuzzed to the block, how long location is kept, whether it should expire automatically at night, a minimum age, and how to keep students safe from being tracked by someone they've blocked. The prototype uses a fixed mock "you" on North Campus.
5. **Also open:** featured-placement policy and pricing (the prototype allows one labeled slot per feed and never puts paid items in the "I'm bored" ranking), photo rights for place images, push notification infrastructure (Thursday Weekend Drop), analytics consent, real transit data (Athens Transit + UGA buses), and real weather (NWS API).

---

## Notable design and build decisions

- **Look:** an Athens telephone-pole gig flyer crossed with a ticket stub. The palette is brick, ivy, cream paper, ink and a little mustard. Type is Fraunces (display), Oswald (labels and stamps) and DM Sans (body). The paper grain is a 160px tile generated for the app. There are no gradients, glass effects or emoji, and the cards have hard edges and offset ink shadows instead of soft rounded app cards.
- **One custom line-icon set** (`components/Icon.tsx`): about 75 glyphs on a 24px grid with round caps, drawn for this app.
- **Rubber stamps** carry access status (FREE, OPEN TO ALL, UGA ID, 21+, DAWG PERK, LOCK). They're slightly rotated and spring in when shown, and Reduce Motion turns that off.
- **Skipping onboarding defaults to Local mode,** so a skipper never sees UGA-only items as available.
- **Locked items have no calls to action.** UGA-only items shown to locals have no RSVP, directions, check-in or plan buttons, only an explanation.
- **Known-too-young = hidden.** If the age is unknown, 18+/21+ items show with an age stamp instead.
- **"Not a bar crowd"** uses a `soberFriendly` flag on events (21+ events default to false) plus late-night food spots.
- **Mock location** is fixed on North Campus so demos look the same wherever the pitch happens. "Near me" radius: walk 1.1 mi, bike 3.1 mi, bus 4.3 mi, car 12 mi.
- **Travel times** (walk/bike/bus/car) are estimated from straight-line distance with a street-grid factor and an average bus wait. They power the car-free picks and the sustainability badges.
- **Bottom sheets, the swipe deck and the time slider** are built on React Native `Animated` + `PanResponder`. That avoids adding gesture/reanimated dependencies and keeps everything Expo Go-safe.
- **Accessibility:** VoiceOver labels and roles on controls, Skip / Save buttons as an alternative to swiping, an adjustable time slider, iOS Dynamic Type plus an in-app text-size setting, Reduce Motion support, and contrast-checked colors (notes in `theme/tokens.ts`).

## Known limitations

- Only the iPhone in Expo Go was targeted. Android should mostly work but wasn't checked. Web isn't supported (react-native-maps has no web view).
- The location is a fixed mock, not GPS.
- Friends, plans, analytics, weather and reviews are all mock.
- Add to Calendar opens the system event sheet. If Expo Go has been denied calendar access, it shows a friendly alert instead.
