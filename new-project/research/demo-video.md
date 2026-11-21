# Demo video research: cinematic 1979-vs-2026 launch film (retro compass)

Worker: demo-video. Date: 2026-11-21. Scope: reference launch films, verified 1979 anchors, opening concepts, weekend toolchain.
Inspection method: yt-dlp metadata + auto-captions; 240p video-only downloads for ffmpeg contact sheets and scene-cut counts (`select='gt(scene,0.3)'`). Audio was not downloaded, so music descriptions come from captions (`[music]` tags) only. All media deleted after inspection; frame sheets were left in the session scratchpad (temporary).

## 0. What the owner probably meant by "ChatGPT astra 6"

Most likely: **OpenAI, "Introducing GPT-6 Astra: the most intelligent and aligned model in the world."** (YouTube, OpenAI verified channel, uploaded 2026-09-03, 2:43, ~3.8M views). It opens with exactly the device the owner described: a "1979" card over archival MIT footage, then a "2026" card over a modern recreation of the same shot. The name matches ("GPT-6 Astra" -> "ChatGPT astra 6") and so does the opening. Other candidates (ChatGPT Atlas launch film, Oct 2025; Google Project Astra, May 2024) share the name but have no then-vs-now opening. This is an inference; confirm with the owner.

## 1. Reference films

Sorted by usefulness for this brief. "Inspected" says what was actually examined.

### 1. OpenAI, Introducing GPT-6 Astra (top reference)
- URL: https://www.youtube.com/watch?v=1QNsdr-Qx_I. Date 2026-09-03. Length 2:43 (163 s). About 46 scene cuts.
- Inspected: full auto-captions; frames 1 fps for 0:00-0:30, 0.5 s steps for 0:07-0:13, every 4 s for 0:30-end, 1 fps for 0:36-0:44.
- Structure:
  - 0:00-0:09: archival 4:3 footage, pillarboxed in black. A man in an Eames lounge chair faces a big dark screen, from behind. Yellow "1979" card in a heavy grotesque typeface. Original audio: "Create a yellow circle ... there", and a yellow dot appears. The description credits it: "'Put That There' clip courtesy of MIT Media Laboratory, Chris Schmandt, and Eric Hulteen."
  - About 0:09: hard cut to full-bleed 16:9. A modern rebuild of the same room: lounge chair, large wall screen, same camera angle from behind. A person walks across in the foreground and wipes the frame; the "2026" card appears in the same font and position.
  - 0:15-0:37: the same request, made today ("Can you draw me a small yellow circle?"), escalates. The circle becomes a rocket window, then a detailed rocket, then a Blender 3D model. Face close-ups intercut with the wall screen.
  - About 0:38-0:42: a pull-back reveals the film set (crew, stands, lights). The title card "INTRODUCING GPT-6" / "ASTRA" builds from simple shapes (circle, square, triangle) that morph into the letters, calling back to the yellow circle.
  - 0:43-2:30: no presenter or narrator. Three or four "users" speak natural requests to wall-sized screens (presentation, eBay listing, game, legal draft, food order, tennis booking) with music underneath. The tasks interleave and pay off later ("I found an open court at 5 pm" / "Yeah, book it").
  - End: "make a file I can send to my 3D printer", then a physical 3D-printed rocket on a table. OpenAI wordmark, then a CTA card ("For the full Astra experience, download the ChatGPT desktop app").
- Transferable technique: **matched-shot remake.** Recreate a real archival shot (same framing, furniture, action), label both with big year cards, and make the 2026 version answer the same request. A visual motif (the yellow circle) carries through to the title and the final physical object. Note: MIT's own upload calls the clip "Put-That-There, 1982" and says the system was "created ... in 1980"; Schmandt's collection upload says 1979. OpenAI's "1979" card is therefore defensible but contested (see section 2).

### 2. Sony, Walkman 40th Anniversary (Sony Malaysia upload of the global film)
- URL: https://www.youtube.com/watch?v=imOsZgw4mfA. Date 2019-10-16. 1:07. About 30 cuts.
- Inspected: 30 evenly spaced frames (one per ~2.2 s) plus 1 fps for 0:00-0:06. No captions (rate-limited).
- Structure: opens on a white void with a white plinth and the text "WALKMAN® 1979-2019"; a woman walks in. After that it is hands only: hands load a blue-silver TPS-L2 cassette, then each generation in order (cassette, CD Discman, MiniDisc, memory players, NW series). Product grids and split-screens of 3-4 models summarise each era. The end card returns to the woman and plinth ("High quality sound, anytime, anywhere"), then the 40th logo and SONY.
- Transferable technique: **a clean lineage shot in one bright, minimal set.** Hands interact with each device in chronological order, and grid cards compress the eras. Cheap to copy: one table, one light, hands, real or 3D-printed props.

### 3. Casio UK, CASIO x BACK TO THE FUTURE
- URL: https://www.youtube.com/watch?v=SQteBXRiY74. Date 2025-10-14. 1:01. About 14 cuts.
- Inspected: 30 frames across the film; 1 fps for 0:54-1:00.
- Structure: night wide shot of a garage with light spilling out. A teenager in a 1980s-style shirt with a guitar opens a cardboard box of retro objects (boombox, remote control, a newspaper headline "Doc Brown..."), then puts on the CA-53 calculator watch. Macro shot of the watch face, then a blue flash; DeLorean outside with smoke. Logo lockup "BACK TO THE FUTURE x CASIO, LIMITED EDITION". Final shot: DeLorean time-circuit displays showing OCT 26 1985 / OCT 21 2025 / NOV 12 1955.
- Transferable technique: **object-in-a-box nostalgia + a date-display device.** The DeLorean time circuits show "then" and "now" in one diegetic object. For a compass film the equivalent is a split-flap, LED or 7-segment display rolling 1979 -> 2026.

### 4. Google, 25 Years in Search: The Most Searched
- URL: https://www.youtube.com/watch?v=3KtWfp0UopM. Date 2023-12-11. 3:48. About 135 cuts.
- Inspected: 30 evenly spaced frames; caption tracks listed but not parsed (on-screen text read from frames).
- Structure: opens on black with typed text "25 years ago the world started to [search]", then archival footage (Moon landing, Shuttle launch) under "... the rest is history". The whole film runs on one recurring typed overlay, "the most searched ___", over archive and modern clips. Ends "Here's to the ones who set the bar / and the ones who'll raise it", then the "G25gle" logo.
- Transferable technique: **one repeating typed text line as the backbone** (search-box typing as narration), with archive bridging into present. Copy it as one line typed over each era, e.g. "1979: you asked a map. / 2026: ...". Caution: at nearly 4 minutes with 135 cuts this is a montage; too long and busy for a hackathon demo.

### 5. HMD, Nokia 3310 (2017 relaunch)
- URL: https://www.youtube.com/watch?v=3hlhjGMWpYg. Date 2017-02-26. 0:40. About 22 cuts.
- Inspected: 30 evenly spaced frames. Captions rate-limited.
- Structure: pure product film; no people, no voice. Each verb is extruded in the same colour as the background ("Hello", "Talk", "Text", "Play", "Snake"), then the phone rotates in, colour-matched. Macro passes over the keypad and camera. Ends with the NOKIA wordmark on red, then on black.
- Transferable technique: **a retro product told in a few one-word cards on colour fields.** Nostalgia comes from familiar verbs (Snake), not from archive footage. Good model for a 10-15 s product-hero segment after the opening; feasible as a Blender/Keynote render of the student device.

### 6. humane, The Human Experience (Ai Pin)
- URL: https://www.youtube.com/watch?v=XdAlAI9TLww. Date 2023-11-10. 1:00. About 19 cuts.
- Inspected: full captions; 30 frames.
- Structure: handheld street-life cinematography (markets, a family living room, dusk on a hill). A voice-over asks rhetorical questions ("Isn't life about what we experience? ... What if devices weren't the experience?"), interleaved with real device prompts and answers. A small feature label sits lower-left ("Interpreter", "Capture", "Alerts"). The device's laser display appears projected on a palm. Ends on a loading glyph, then the humane and ai pin wordmarks.
- Transferable technique: **"what if" voice-over + tiny feature labels over lifestyle shots**, with no talking head. Caution: the product later failed publicly (discontinued 2025). Use the style as a reference, not the brand.

### 7. OpenAI, Introducing ChatGPT Atlas (short launch film)
- URL: https://www.youtube.com/watch?v=Ej6hnsQgV_c. Date 2025-10-21. 1:38. Only about 5 hard cuts (mostly animated UI). A 22-minute livestream also exists (8UWKxJbjriY), not inspected.
- Inspected: captions (music only, no speech); 30 frames.
- Structure: a macOS dock with the Atlas icon, then "Meet ChatGPT Atlas" on white. After that it is all screen recording: real browser UI on soft gradient backgrounds, cropped and zoomed into the active area. Benefit cards in between ("Unlock the web with ChatGPT", "Assists when you need it", "Picks up where you left off"), then an agent shopping flow ending in "Go to checkout". End card: icon plus "download now / chatgpt.com/atlas".
- Transferable technique: **the product section of a student film.** Screen capture on a gradient backdrop, zoom/crop to the cursor, three benefit cards, and no voice. It is the most reproducible format for a weekend team (Screen Studio-style auto-zoom, or manual zooms in an editor).

### 8. Google, Project Astra: Our vision for the future of AI assistants
- URL: https://www.youtube.com/watch?v=nXVvvRhiGjI. Date 2024-05-14. 2:17.
- Inspected: full captions and description only (no frames).
- Structure (per description and captions): "two continuous takes", one on a Pixel phone and one on prototype glasses, in real time. A tester walks around an office and asks about what the camera sees: a speaker tweeter, code on a monitor, a view of King's Cross ("This appears to be the King's Cross area of London"), "where did I leave my glasses". Ends "Nice. Thanks, Gemini."
- Transferable technique: **the honest single-take demo.** It proves the product is real, which judges value after a cinematic opening. For a compass product, one unbroken POV take walking from the Strand campus (KCL) to a landmark, with the device guiding, is the equivalent. Also a London (King's Cross) precedent.

### 9. Apple, "1984" Macintosh commercial
- URL (archival upload): https://www.youtube.com/watch?v=VtvjbmoDx-I (Mac History channel, uploaded 2012; ad aired Jan 1984). 1:00.
- Inspected: captions and description only.
- Structure: dystopian grey world, Big Brother speech, a runner in colour smashes the screen. The single text and voice line "On January 24th Apple Computer will introduce Macintosh. And you'll see why 1984 won't be like 1984."
- Transferable technique: **turn the year itself into the argument.** The film plays on the meaning of "1984". For this project: "1979 won't be like 2026" is a weaker copy; better, the year becomes a real measured fact (see magnetic declination below). Also proof that a famous launch film can have zero product footage.

### 10. rabbit, "rabbit r1: $199, no subscription."
- URL: https://www.youtube.com/watch?v=vp52L6UlmJY. Date 2024-01-09. 0:57. The full keynote (22wlLy7hKP4, 25:30) has a founder on stage; not a fit.
- Inspected: metadata only.
- Technique: a sub-minute cut-down that sells the object plus one hook line in the title. Relevant because the hackathon device is also a small physical gadget. Caution: like Humane, the product was widely criticised after launch.

### 11. teenage engineering, introducing OP-1 field
- URL: https://www.youtube.com/watch?v=Fab7sp30pg0. Date 2022-05-12. 0:29.
- Inspected: metadata only (frames not taken).
- Technique (from brand knowledge, not verified in this session): a short, deadpan product loop with a minimal set. Listed as a style reference for a 15-30 s teaser cut.

Not found or not usable: no official 2017 Nokia 3310 film with a then-vs-now split was found (only fan remasters). Polaroid relaunch films on the official channel are tutorials or 15 s spots. The Casio G-Shock anniversary search returned only promo product films.

## 2. 1979 anchors for a compass story

### Verified (source checked this session)

| Fact | Evidence | Use |
|---|---|---|
| A compass in central London pointed about **6.0 degrees west** of true north in mid-1979; in mid-2026 it points about **1.2 degrees east**. | NOAA NCEI declination calculator, IGRF model, lat 51.5007, lon -0.1246: 1979.5 = -6.04 degrees (DGRF75), 2026.5 = +1.15 degrees (IGRF2025). | The strongest compass-specific 1979 vs 2026 fact: same street, same needle, a different north. |
| The zero-declination (agonic) line crossed Greenwich in **September 2019**, the first time in about 360 years. It is moving west at about 20 km per year. | BGS announcement (Aug 2019) and coverage (bgs.ac.uk, New Atlas, Bodleian maps blog). | Explains why north "moved" between the two shots. |
| Modelled **north magnetic (dip) pole** in 1979: 76.76 N, 101.47 W (Canadian Arctic). In 2025: 85.78 N, 138.06 E (heading to Siberia). About **1,760 km** apart (haversine, computed here). | NOAA NCEI pole series https://www.ngdc.noaa.gov/geomag/data/poles/NP.xy (1979 and 2025 rows; no 2026 row yet). | Animated map line for the title or the bridge. |
| **Sony Walkman TPS-L2** went on sale in Japan on **1 July 1979**. | Multiple consistent sources (Network World, Sound & Vision, TechRadar, Wikipedia TPS-L2). | Gadget-of-the-year cue. |
| ...but in the **UK it was sold as the "Stowaway", arriving about April 1980**. | Secondary sources only (Shapers of the 80s citing the Evening Standard; Wikipedia). | **Anachronism risk**: a Walkman on a London street in 1979 is unlikely. Set that scene in Tokyo or keep the Walkman in a box or on a poster. |
| **NTT launched the world's first commercial cellular service** (car-mounted) in Tokyo in **1979**. | Japan MIC White Paper 2022, ch. 1 (PDF text checked): "NTT Public Corporation launched the first-generation mobile telephone service using a cellular system in 1979 as the first commercial service of this kind in the world." The day, 1 Dec 1979, comes from secondary sources only. | A "phone in a car, 1979" vs "phone in your pocket that is also a compass" contrast. |
| **Navstar GPS Block I**: launches on 22 Feb, 13 May, 7 Oct and 11 Dec **1978**, then 9 Feb and 26 Apr **1980**. **No GPS launch in 1979.** | JPL Mission and Spacecraft Library; Wikipedia list; Gunter's Space Page. | You can say "1979: four GPS test satellites already orbiting, and no civilian could use them". Do **not** show a "GPS launch, 1979". |
| **Voyager 1** closest approach to Jupiter on **5 March 1979**; **Voyager 2** on **9 July 1979**. | NASA Voyager fact sheet; NASA NSSDC. | 1979 as a year of navigating by stars and gravity; NASA imagery is usually free to use (check guidelines). |
| **Ordnance Survey 1:50,000 maps were rebranded "Landranger"** around **1979** (winter 1979/80 per Fieldenmaps; "from 1979" per an Oxfordshire CC history). | fieldenmaps.info, Oxfordshire CC PDF, CUL 1980 leaflet. | The pink-cover OS map is a faithful prop for a UK 1979 hiker shot. Say "1979/80" if it is captioned. |
| The **baseplate (orienteering) compass**: Tillander's design from 1928; Silva founded 1932/33; liquid-damped model 1933. | Silva history page; Wikipedia; American Swedish Historical Foundation. | A Silva-type baseplate compass is period-correct in 1979 (by then it was already decades old). |
| **Put-That-There** (MIT Architecture Machine Group: Bolt, Schmandt, Hulteen), the clip OpenAI used. | MIT Media Lab channel: "Put-That-There, 1982", "created ... in 1980"; Bolt's SIGGRAPH paper 1980; Schmandt-collection upload (Stefan Marti) says "1979". | **Date contested (1979/1980/1982).** Avoid copying it; the team should anchor its own 1979 card on a firmer fact. |

### Not from 1979 (do not put a 1979 card on these)
- **Honda Electro Gyrocator**: announced **24 Aug 1981** (Honda heritage page; IEEE Milestone 2017). Inertial plus transparent map film, no GPS. A good "two years later" footnote, not a 1979 shot.
- Etak Navigator (1985), handheld GPS receivers (late 1980s-1990s) and Pac-Man (1980) are all later. Speak & Spell (1978) and Space Invaders (1978) are earlier.

## 3. Opening concepts (1979 shot -> 2026 shot)

All three follow the Astra grammar: 4:3 pillarboxed, warm, grainy "1979" card, then a hard cut or person-wipe to 16:9 full-bleed "2026" in the same framing, with the same big year-card typeface in both.

**A. "Same street, different north"** (recommended; uses the strongest compass fact)
- 1979 (about 6 s): close-up from above of a hand holding a baseplate compass over a pink OS Landranger sheet on a London pavement or the Embankment wall. The needle settles. Small lower-third: "London, 1979. Magnetic north: 6 degrees west." Card: **1979**.
- Bridge: a passer-by wipes the frame (Astra), or the needle swings.
- 2026 (about 6 s): same framing, same wall, same hand, now holding the team's device; the needle or arrow settles a little east of before. Lower-third: "London, 2026. Magnetic north: 1 degree east." Card: **2026**.
- Line or VO: "North moved. Your compass didn't notice. Ours does." Optional 3 s map insert of the magnetic-pole track: Canadian Arctic 1979 to near Siberia 2025, about 1,760 km.
- Feasibility: fully shootable on a phone near KCL Strand. 1979 look from a grade (desaturate, warm, grain, 4:3). No AI or archive licences needed.

**B. "The room, rebuilt"** (closest to GPT-6 Astra)
- 1979: a 1979-style desk or kitchen table (paper OS map, baseplate compass, mug, landline phone, printed timetable). A student plans a route by hand with a pencil line. Card **1979**.
- 2026: the identical table and framing, same student, same mug; the map is gone, the device or app is on the table, and the student just says the destination. The pencil line from 1979 reappears as the route on screen: **the motif carry-over** (Astra's yellow circle).
- Feasibility: one location and a few props; the art direction is the work.

**C. "Time circuits"** (Casio/BTTF device)
- 1979: macro shot of an analogue compass bezel, or a real 1979 archive clip (only if a properly licensed or public-domain one is found, e.g. Prelinger, and its date is verified).
- Bridge: a 7-segment or split-flap display rolls **1979 -> 2026** (diegetic date device), then the product reveal on a colour field with one-word cards, Nokia 3310 style ("Point. Walk. Arrive.").
- Feasibility: the date display can be After Effects/Motion or CSS animation; the reveal is a render of the device or the app.

Not recommended: a Walkman-in-London 1979 street scene (UK launch 1980 as "Stowaway"), or "GPS launched in 1979" (false).

Suggested runtime: opening 15-20 s, title 3 s, product section 60-90 s (Atlas-style screen capture plus one Astra/Project-Astra-style real take), end card 5 s. Total under 2:00-2:30, which fits the Devpost norm below.

## 4. Practical toolchain (weekend)

Source: a bounded sub-research worker fetched official pages on 2026-11-21. I re-checked the two decisive claims myself (Sora shutdown, Flow free credits). Reddit was not reachable, so the "community" verdicts come from third-party reviews and vendor blogs. Treat them as weaker evidence.

### AI video generation (Nov 2026)

| Tool | Free tier (verified unless marked) | Watermark / terms | Verdict for this film |
|---|---|---|---|
| **Google Flow** (Omni Flash 1.2, Veo 3.1 Lite) | **50 credits per day** (re-checked: support.google.com/labs/answer/16526234). Omni Flash 1.2 costs 1 credit/s at 360p or 3 credits/s at 720p, for clips up to 10 s, so about 16 s of 720p per day. Veo 3.1 Lite costs 10 credits per 4/6/8 s clip at 720p, so about 5 clips per day. No 1080p upscaling. Video may be blocked during peak hours (about 14:00-17:00 UTC). Veo 3.1 Fast/Quality and Omni 1.1 retire on 5 Dec 2026. | Always carries the invisible SynthID mark; the visible watermark is optional (forced only in India, Korea and Vietnam). UK supported, but video editing and Avatars are not available there. 18+. No real public figures. Google claims no ownership of output. | **Best free option.** Use it only for atmosphere B-roll (a 1979 street or a magnetic-pole flyover). Third-party test (Atlas Cloud, May 2026): text comes out garbled and objects split mid-shot, so do not generate the compass needle, map text or year cards. UK students 18+ get a free year of Google AI Plus (gemini.google/students; redeem by 31 Dec 2026; then £4.49/month unless cancelled). The claim that Plus adds 200 Flow credits per month is unverified. |
| **OpenAI Sora** | **Discontinued**: web and app on 26 Apr 2026, API on 24 Sep 2026 (re-checked: help.openai.com/en/articles/20001152). | n/a | Not available. |
| **Runway** | 125 one-time credits ("a selection" of models) per runway.com/pricing. A third-party review (Aug 2026) says free accounts were refused video generation. | Free output is watermarked (help-centre snippet only). The cheapest plan without a watermark is $15/month. | Do not count on it. |
| **Kling** | About 66 credits **per month** (third-party). A 5 s clip costs about 45 credits at 720p, so about 1 clip per month. Free queue about 2 minutes. | Watermarked. The user policy (21 Apr 2026) bans commercial use without permission and requires a "Kling AI" label. Minimum age 13. | Strong 16mm look per a vendor blog, but free volume is too small. |
| **Luma** | Free tier is non-commercial. | Watermark cannot be removed even after upgrading. | Skip. |
| **Hailuo** | One-time trial credits only. | Watermarked. | Skip. |
| **Pika** | Third-party reports say the free plan has had no credits since about Sep 2026. | | Skip. |
| **Wan 2.2** (open weights, Apache-2.0) | Free if you have a GPU with about 24 GB of memory. | No watermark. | Not practical on a laptop over a weekend; not verified on a Mac. |

Prompting for a 1970s look (third-party guides): name the decade, the film stock and the framing (for example "1979, 16mm Kodak, 4:3, handheld") rather than "vintage". Make a still first, then animate it. Add grain and the 4:3 crop in the editor. Never ask the model for text or year cards; add those in the edit.

### Archive and stock footage
- **Prelinger / Internet Archive**: reuse is allowed under each item's own licence (many are public domain). Check every item page. Suggested credit: "Archival footage supplied by Internet Archive (at archive.org) in association with Prelinger Archives". My own search of the collection's API found only **42 Prelinger items dated 1975-1982**: US home movies, safety films, and "Bradley: Second to None" (1982). Most have no licence field. There are two "How to Read a Map" films, undated. **No real 1979 UK compass/map footage is available there.** Shoot the 1979 shot yourselves.
- **British Pathé**: embedding the YouTube player is free; cutting footage into your own film needs a paid per-second licence, even for non-commercial use (snippets only; the site blocks fetches).
- **NASA** (e.g. Voyager 1979 imagery): generally not copyrighted; credit NASA and do not imply endorsement. No logos. The brand page (updated 27 Oct 2026) now bars the NASA insignia next to AI-generated imagery.
- **Pexels / Pixabay video**: free, no attribution required; no implied endorsement by brands. Some Pixabay music is registered with YouTube Content ID, so claims can happen; dispute them with the licence certificate.

### Capture, editing, music (macOS)
- Screen capture: **Cmd-Shift-5 / QuickTime** (free, no watermark) or **OBS**. **Cap** has a free personal-use plan with Studio mode and 4K/60 export. For the Atlas-style zoom-to-cursor look, either use Cap's Studio mode or keyframe the zooms in the editor.
- Editing: **DaVinci Resolve free** (no watermark, UHD export; has film-grain and colour tools for the 1979 grade) or **iMovie**. Avoid **CapCut** for original team footage: there has been controversy since June 2025 over its broad, perpetual licence to user content.
- Music: the **YouTube Audio Library** is safe on YouTube (Creative Commons tracks need credit in the description); Devpost needs a YouTube or Vimeo upload anyway. Pixabay Music is free but may get Content ID claims. Devpost rule texts ban copyrighted music used without permission.

### Hackathon video length (Devpost norm)
- Gemini 3 Hackathon rules: "should not be longer than 3 minutes ... only the first 3 minutes may be evaluated." Snap Games Lensathon: "less than three (3) minutes. Judges are not required to watch beyond three minutes", and it must show the project running; no third-party trademarks or copyrighted music without permission. LMA EDGE: "around three (3) minutes". SwampHacks XI: "no longer than 2 minutes."
- **Devpost's own guidance** (help.devpost.com, "Video-making best practices", updated 27 May 2026): "Snazzy marketing videos ... don't help others understand and evaluate your app"; it recommends a narrated screencast that opens with the elevator pitch. **This tension matters**: keep the cinematic 1979/2026 opening to about 15-20 s, then show the real working product clearly (screen capture plus one real take). The full film should stay at or under 2:00-2:30.
- The KCL First Year Hackathon's own video rule was **not found** (no Devpost or rules page surfaced; the closest match was Enactus KCL "FirstYearHack 2025.2" on Luma). Check the event brief.

## 5. Limits of this research
- Music and sound design were not heard (video-only downloads). The `[music]` tags in captions are the only audio evidence.
- Captions were rate-limited (HTTP 429) for Nokia 3310, Sony Walkman, Casio, GPT-6 Astra-for-developers and Sora clips. Their structure comes from frames only.
- OP-1 field, rabbit r1 and Apple 1984 were not frame-inspected (metadata and captions only).
- Reddit and Hacker News were not reachable, or held no relevant threads, so there is no direct community sentiment.
- The GPT-6 Astra film and most tool facts post-date the model's training. They were taken from live pages and inspection this session; re-check before quoting publicly.
