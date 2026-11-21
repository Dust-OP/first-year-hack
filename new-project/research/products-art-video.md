# Prior art: compass reinventions in products, art and video

Worker slice: commercial products, crowdfunding, design/art, apps, YouTube/Bilibili. Devpost/GitHub hackathon entries are excluded because another worker covers them.
Date: 2026-11-21. Read-only research. Fetched pages are treated as data.

Status key:
- **page read**: the original or primary page was opened.
- **video captions read**: yt-dlp auto-captions and metadata were read, with top comments where they were fetched.
- **metadata only**: known only from search-result summaries or listings.
- **lead only**: named but not checked.


## A. Crowdfunded and commercial "compass that points elsewhere"

### 1. Truest North Compass (points to one place you pick)
- URL: https://newatlas.com/good-thinking/truest-north-gps-compass/ ; Kickstarter tracker https://www.kicktraq.com/projects/karljpsmith/truest-north-compass-a-custom-destination-compass/ ; videos https://www.youtube.com/watch?v=L-7MY4SWaAE , https://www.youtube.com/watch?v=nnvnaF7mlNQ , https://www.youtube.com/watch?v=zyuUHQaV8fI , https://www.youtube.com/watch?v=IqpFD-rp6kQ
- Platform and date: Kickstarter, 18 Jun to 18 Jul 2024. Raised $136,139 from 571 backers against a $10k goal. Karl J. P. Smith, Buffalo NY.
- Reinvents: the brass pocket compass, kept as a sentimental keepsake. It points to "where we got engaged", home or a grave instead of north.
- How it works: a maple and brass body holds a GPS chip (two constellations), an IMU, a light sensor and a 1000 mAh battery. A red hand gives the bearing and a black hand the distance. To retarget it, the owner opens a web page and lays the compass face-down on the phone screen, which flashes the new latitude and longitude in binary for about 20 seconds. A charge lasts about a week. A $180 pledge bought one; retail is $200. The origin video shows the first prototype, an Arduino Nano with a GPS module, a digital compass and an LED ring, made for a treasure-hunt mystery for the founder's niece and nephew.
- Reception:
  - Firsthand user, YouTube comment of Nov 2025 on the reprogramming video: "Got it as a gift for my wife for our anniversary. Points nowhere near the spot … Points opposite direction and never drops below 1k in distance."
  - Launch-video commenters asked for it to point to a partner's beacon ("I would buy right freaking now if it could always point to my partner"), to the Kaaba, and to run on harvested energy.
  - Radio show The Woody Show (Nov 2025, "Aww babe or eye roll") called it "useless" and "so dumb", partly as a joke, after seeing social-media ads.
- Status: page read, video captions read.
- Lesson: this is the closest commercial match to "points to what matters". Flashing data from the phone screen is a strong demo moment. Avoid a fixed single target, and test that the pointer is actually accurate.

### 2. Beeline (Smart Compass 2015/16, then Moto and Moto II)
- URL: https://techcrunch.com/2017/01/18/beeline-is-all-about-the-journey-to-the-destination ; https://road.cc/content/tech-news/170075-beeline-launches-gps-cycling-navigation-compass-kickstarter ; https://bennetts.co.uk/bikesocial/reviews/products/motorcycle-technology/beeline-moto-review-navigation-sat-nav
- Platform and date: Kickstarter, launched 28 Oct 2015 and raised about $225k. It shipped to about 5,000 backers in Jan 2017; reports had promised Aug 2016. The Moto Kickstarter in 2020 hit its goal in 10 hours. Moto II followed in 2024.
- Reinvents: the compass as a bike navigator. The original version had no turn-by-turn directions, just an arrow to the destination and a distance readout, so the rider picks the route. Later models added turn-by-turn and kept compass mode.
- How it works: a phone app does the routing and talks to the handlebar unit over BLE. The unit has a small round display and a magnetometer.
- Reception: editorial reviews were positive (T3 Platinum award, Bennetts). The Moto lacks speed-camera warnings and closed-road awareness. The company itself moved away from pure compass mode, which hints that the arrow alone was not enough for many riders.
- Status: page read (TechCrunch launch piece, not a hands-on review). The Kickstarter and Medium pages returned 403. Moto review details are metadata only.
- Lesson: "as the crow flies" is charming but impractical. The market added routing back.

### 3. Haize by Onomo (LED "magic compass" for cyclists)
- URL: https://road.cc/content/tech-news/169847-haize-urban-cycle-compass-hits-kickstarter ; https://www.dezeen.com/2015/10/29/onomo-haize-compass-cycling-accessory-kickstarter-campaign-design/
- Platform and date: Kickstarter, Oct 2015, £50k goal reached with 5 days left. Promised delivery was Jun 2016. It came from Imperial College IDE students in London.
- Twist and tech: a handlebar LED ring shows the bearing to the destination, linked to a phone app.
- Status: metadata only. I found no delivery outcome.
- Lesson: a London precedent, and the same idea as Beeline in the same season.

### 4. SmartHalo (smart bike ring with compass mode)
- URL: https://www.digitaltrends.com/health-fitness/smarthalo-bike-gps/ ; https://uk.trustpilot.com/review/smarthalo.bike
- Date: Kickstarter 2015; SmartHalo 2 in 2019.
- Twist and tech: a handlebar light ring with turn-by-turn and a compass mode that shows the direction to the goal.
- Reception: in user-generated reviews, compass mode drifted ("had them spinning around in circles"). From 2021 the website was down and backers asked for refunds without reply.
- Status: metadata only.
- Lesson: drift and abandoned hardware are common failure stories. Software-only or web demos avoid the hardware-support trap.

### 5. LynQ (compass that points to your friends)
- URL: https://gizmodo.com/this-digital-compass-will-find-your-friends-in-a-crowd-1840053320
- Platform and date: shown at CES 2019; Indiegogo raised about $1.7M; Gizmodo review Nov 2019. It cost $109 and shipping slipped from Jun to Dec 2019.
- Twist: a dot on the dial points to a chosen friend instead of north, with the distance in the centre. Up to 12 units can be synced.
- How it works: GPS plus a proprietary low-power radio between units, so no cellular or wifi is needed. Range is about 3 miles and a charge lasts about 24 hours of active use.
- Reception (reviewer hands-on): accuracy at long range was within about 0.01 km of Google Maps. Within about 30 ft it only shows "nearby", and it does not work indoors.
- Status: page read.
- Lesson: "points to a person" is already a funded product. Close-range and indoor accuracy is the known weak spot.

### 6. Lover's Compass (iOS app)
- URL: https://apps.apple.com/app/id6760949268
- Platform and date: App Store, developer Luca Thomas Wheeler; the app ID suggests 2026. It has one rating (5.0).
- Twist and tech: two partners pair with an invite link. A cupid's arrow points at the partner, with distance, a photo dial and "poke" messages. It stores only the latest location and updates only while the app is open.
- Status: page read.
- Lesson: a phone app that points to your partner already exists and is trivial. It is not a differentiator on its own.

### 6b. Friend Compass (Sean Hardesty Lewis, portfolio project)
- URL: https://portfolio-2025-2pg.pages.dev/projects/friend-compass
- Date: sketches dated Nov 2025.
- Twist: a "Seeker" and a "Target" pair of handhelds that point at each other indoors, where GPS fails.
- How it works: two Raspberry Pi 5s. Wi-Fi RSSI is fused with a gyro (6-axis, no magnetometer), and a 360° spin around the friend calibrates it. The planned motor needle was dropped for a display.
- Results (maker's own tests): it usually points right in open rooms. It goes about 15° off from multipath and metal, follows reflections, and drifts after about 10 minutes. Users found it playful, like "hot and cold", and liked having no distance readout.
- Status: page read.
- Lesson: indoor pointing to a person by radio is fragile. If the demo is indoors, fake or simplify the target rather than rely on RSSI.

### 7. Lodestar Compass (Oceanus Brass)
- URL: https://www.pledgebox.com/projects/lodestar-compass
- Platform: Kickstarter, 1 Sep to 15 Oct; year not shown. Raised $198,772 from 1,321 backers against a $2k goal.
- Twist: none technically. It is a premium analog brass compass with a sapphire crystal.
- Status: page read (tracker page only).
- Lesson: there is strong market appetite for the look and feel of the old object. A faithful physical aesthetic sells even with no smart features.

## B. Assistive, wearable and sensory compasses

### 8. feelSpace naviBelt
- URL: https://feelspace.de/en ; study https://pmc.ncbi.nlm.nih.gov/articles/PMC8587958
- Platform: commercial (Germany). It grew out of University of Osnabrück research and is covered by German health insurance with a prescription.
- Twist: the compass is moved from the hand to the waist. Sixteen vibration motors give 360° coverage.
- How it works: without the app, the motor facing north buzzes, so it works as a tactile compass. With the app over BLE, it buzzes toward the next waypoint. It also has a street-crossing mode, lasts at least 8 hours and is meant to be used with a white cane.
- Reception: in a 7-week study, 11 blind users reported less discomfort and more confidence. Testimonials are on the vendor page. The app warns about phone battery drain.
- Status: page read.
- Lesson: this is the gold standard for a faithful but surprising remake of the compass. A haptic north is well covered; don't pitch a haptic belt as new.

### 9. North Sense (Cyborg Nest)
- URL: https://www.vice.com/en/article/cyborg-implant-north-sense-fitted-on-humans ; https://en.wikipedia.org/wiki/CyborgNest
- Date: announced 2016; the first wearers were fitted in Dec 2016. It cost $350 to $419.
- Twist: a silicone module bar-pierced to the chest vibrates when the wearer faces magnetic north, as "a new sense".
- Reception: launch coverage was mostly uncritical. Tom's Guide questioned what effect it really has. Biohackers disliked the mass-market sale. I found no long-term user reviews.
- Status: page read. The videos were found only in search (Cyborg Nest channel, HOLOLIFE talk).
- Lesson: "become the compass" has strong press appeal, but there is little evidence it works.

### 10. North Paw (Sensebridge, Eric Boyd), haptic compass anklet
- URL: https://www.youtube.com/watch?v=D4shfNufqSg (Quantified Self talk, May 2010, posted 2011)
- Twist and tech: an anklet with a ring of vibration motors, where the north-facing motor buzzes. It was inspired by the German feelSpace research belt.
- Reception (firsthand, the maker): it does not give "an unerring sense of direction" ("I think [the claim was] oversold"). It revealed that his indoor sense of direction was "hopelessly terribly bad". Escalator and BART train motors make it "go haywire".
- Status: video captions read.
- Lesson: honest firsthand evidence that the "sixth sense" claim is overstated. Magnetometers are disturbed by motors and metal, so a demo near laptops and steel needs care.

### 11. Wayband / HapticNav (WearWorks)
- URL: https://www.pratt.edu/news/solved-three-industrial-design-alumni-tackle-a-haptics-challenge/ ; https://amp.cnn.com/cnn/2020/09/02/app-tech-section/simon-wheatcroft-wayband-tech-for-good-spc-intl ; https://apps.apple.com/us/app/hapticnav/id1405786049
- Date: 2016 (SXSW) to 2021.
- Twist and tech: a haptic wristband that keeps the wearer inside a "virtual corridor" along a route. Blind runner Simon Wheatcroft used it at the 2017 NYC Marathon, and GPS failed around mile 16.
- Status: metadata only.
- Lesson: strong human story, but it relies on GPS, which fails in dense cities.

### 12. Animotus (Ad Spiers, Yale/Imperial), shape-changing haptic compass
- URL: https://news.yale.edu/2015/08/26/shape-shifting-navigation-device-both-sighted-and-visually-impaired ; https://hackaday.com/2015/09/04/experimental-theater-helps-field-test-haptic-navigation-device
- Date: 2015. It was made for *Flatland*, an immersive theatre show in a dark London church.
- Twist and tech: a handheld cube whose top half twists toward the next zone and extends forward to show distance, updating at 100 Hz. Audience members found their way in total darkness.
- Status: metadata only (search summaries of the Yale, Hackaday and Open University pages).
- Lesson: a great cinematic precedent, with darkness and a single glowing or tactile object guiding people.

### 13. Microsoft Soundscape, now VoiceVista
- URL: https://techcrunch.com/2022/12/13/microsoft-sunsets-soundscape-3d-audio-app-but-will-open-source-the-code ; VoiceVista https://apps.apple.com/jp/app/voicevista/id6450388413
- Date: research project from 2017, iOS app from 2018, removed in Jan 2023 and open-sourced under MIT. The community revived it as VoiceVista.
- Twist and tech: an audio compass. A 3D-audio "beacon" sounds from the direction of a place you set, and it calls out nearby points of interest and intersections. It gives awareness rather than turn-by-turn directions.
- Status: page read.
- Lesson: the audio-beacon form is proven and open-source. Big-company abandonment left a gap the community had to fill.

## C. Design and art pieces

### 14. Terra (Modem Works x Panter & Tourron), AI compass for wandering
- URL: https://www.dezeen.com/2024/04/05/terra-ai-compass-panter-tourron-modem-works-design/ ; https://www.yankodesign.com/2024/04/13/stone-shaped-digital-compass-concept-promises-an-adventure-with-each-walk/ ; https://github.com/modem-works/terra (703 stars, 37 forks, last push Mar 2024)
- Date: Mar/Apr 2024. Dezeen Awards 2025 longlist.
- Twist: a stone-shaped, phone-free compass. You type an intention and a time budget, for example "Two-hour Marais stroll with patisserie visit", and an AI makes a trail of GPS coordinates. It buzzes when you go wrong and shows animal or plant glyphs when you are on track. The user doesn't know the route, only that it returns to the start. It credits the board game in *Jumanji* as inspiration.
- How it works: a local Node app uses the ChatGPT API and Google Places to make checkpoints. The hardware is GPS, an LCD, a haptic driver and a 3D-printed shell, all open-source.
- Reception from GitHub issues (firsthand builders):
  - #5: "No translation of 'intention'". The shipped app has no intention field.
  - #3: a build is stuck on the "Pending" screen.
  - #14 and #15: LCD and "CANNOT GET /" errors in 2025.
  - #6: "Is any of your Terra working? … I can't find anyone talking about it".
  - #4: "The documentation needs a demo video".
- Status: page read (Dezeen, Yanko, README and issues).
- Lesson: this is the closest prior art to "AI agent + compass". It got lots of design press, but there is no evidence that it works. A working, demoed intent-to-bearing pipeline is open territory.

### 15. Homing Compass (Aumens), dementia
- URL: https://www.designboom.com/technology/wooden-compass-single-red-arrow-leads-people-with-dementia-homes-aumens-12-28-2025/ ; https://www.yankodesign.com/2026/01/01/homing-compass-lets-a-single-red-arrow-always-point-the-way-back-home/
- Date: Dec 2025. A 2026 launch with a subscription and caregiver app is planned.
- Twist: a wooden puck with one red arrow that only points home. It wakes when picked up, needs no power button, and home is set with a recessed pin button by the front door. It was co-designed with more than 100 people with dementia and piloted with 30 users for 3 months.
- Status: page read.
- Lesson: a model of restraint. One function, one arrow and no screen make the "faithful" half of the judging criterion vivid.

### 16. Compath (Jonas Krämer), dementia wearable concept
- URL: https://www.yankodesign.com/2026/10/30/compath-imagines-dementia-navigation-without-a-touchscreen/
- Date: Oct 2026. Finalist in the 2025 RIMOWA Design Prize.
- Twist: a jewellery-like pendant with one yellow Home button, light and audio cues, a caregiver safe zone and a "Lighthouse" charging dock.
- Status: page read (concept only; Yanko notes it is unproven).
- Lesson: dementia "point home" design is getting crowded (Aumens and Compath). Avoid it unless there is a new angle.

### 17. "Finally, a compass that works without opening Google Maps" (A Pow Studio)
- URL: https://www.yankodesign.com/2026/09/02/finally-a-compass-that-works-without-opening-google-maps/amp/
- Date: Sep 2026. Proof of concept.
- Twist: a MagSafe compass object with NFC. Tapping it opens a minimal compass UI that points to a destination such as a small boutique. An NFC tag in the shop then links to product pages.
- Status: page read.
- Lesson: shows "physical token + phone sensors + web page" as a cheap architecture. A hackathon team could do the same with Web NFC or a QR code and a browser.

### 18. Olafur Eliasson, *Reality compass* (2010) and compass series
- URL: https://olafureliasson.net/artwork/reality-compass-2010 (also *Europe compass* 2014, *Addis compass* 2015, *Future hemisphere compass* 2020)
- Twist: a large magnetic needle in a steel ring hangs from the ceiling and points to the north window. Exhibited at Martin-Gropius-Bau, Berlin.
- Status: page read.
- Lesson: a visual reference for a "giant suspended needle" hero shot. For art references the instrument stays honest, with a real magnet.

### 19. ISS orbit tracker and pointer (Practical Engineering, Grady Hillhouse)
- URL: https://practical.engineering/blog/2016/1/20/international-space-station-orbit-tracker-and-pointer ; https://makezine.com/article/science/space-station-orbit-tracker/
- Date: Jan 2016. Related builds include a Printables "ISS pointer" desk toy and a Reddit ISS pedestal.
- Twist and tech: a pointer that tracks the ISS. It uses a hardcoded TLE and an SGP4 port on an STM32 Nucleo, with a stepper for azimuth and a servo for elevation. North must be set by hand.
- Demo moment: he finished coding an hour before the pass, the clouds parted, and it tracked the ISS overhead. It moves at about the speed of a minute hand.
- Status: page read.
- Lesson: pointing at moving targets is well covered for the ISS. Live data, such as an online TLE or AIS ships, would be the update.

## D. YouTube builds: "the Jack Sparrow compass"

### 20. Joe Grand x WIRED, "Engineer Builds a Compass That Finds Pizza" (Hack Job)
- URL: https://www.youtube.com/watch?v=aY0OtOy6lcE ; project https://www.grandideastudio.com/portfolio/pizza-compass ; code https://github.com/joegrand/pizza-compass
- Date: 28 Apr 2021, with 421k views and 18.9k likes.
- Twist: an orienteering baseplate compass that points to the nearest pizza.
- How it works: a Particle Boron (LTE-M) sends GPS coordinates through Particle webhooks to the Google Places API. TinyGPS++ computes the bearing and distance, an LSM303 magnetometer gives heading, and a ring of 8 NeoPixels shows the direction. One button starts it. Licence CC BY-NC.
- Reception (viewers):
  - The top comment (2.2k likes) asked for the food type to be randomised "so you never know what or where you're eating until you reach your destination".
  - In the video, Grand admits it points "as the crow flies", so he has to follow roads.
- Demo moment: walking through suburbs, a green LED points straight ahead, then "we made it to the pizza place, the compass works, let's eat".
- Status: video captions read, project page read.
- Lesson: the canonical "compass that points to X". Pointing at a single category is done; the next step is open-ended intent and choosing a route.

### 21. Uwos Lab, "Building a COMPASS that points us to the nearest LIQUOR STORE"
- URL: https://www.youtube.com/watch?v=QEPN5_rM6b0
- Date: 8 May 2025 (Twitch stream edit), with 283k views and 15k likes.
- Twist: a Jack Sparrow compass shell holding an Arduino, GPS and a ring of 8 LEDs, plus a distance display. The store list is pre-loaded.
- Failures in the video:
  - The magnetometer "wasn't working right", so the user must hold the compass pointed north by hand.
  - A road closure forced a detour.
  - On arrival the store had been closed for 4 hours: "That ain't a failed stream, that's just a lesson learned."
- Reception: a viewer suggested a toggle to point to "the local rehab". Top comments are jokes; one said "if I already knew whether the thing I want was north… I wouldn't need a compass".
- Status: video captions read, with comments.
- Lesson: these are the exact failure modes an AI or browser agent fixes: opening hours, live status and routes. A strong "before" beat for a demo video.

### 22. Leviathan Engineering, "This compass points to what you want most!"
- URL: https://www.youtube.com/watch?v=fU4PS7IFLRY
- Date: 5 Dec 2025, with about 2k views. Sponsored by PCBWay.
- Twist: a real Jack Sparrow compass. You say what you want and it maps the concept to a place ("peace" to the nearest park), then points there with GPS.
- How it went: the Waveshare board got bricked, an Uno was too weak, and a Pi and a large ESP32 failed. The final build was an ESP32 Nano with a round LCD. He forgot the magnetometer at first ("it has no way of knowing which way you're facing"). There was no input device, so the wish was hard-coded to "adventure", which found the nearest airport.
- Reception: viewers liked the concept and asked for a "part 2", a phone or watch app and a nicer case. One noted the reveal was underwhelming.
- Status: video captions read, with comments.
- Lesson: the "wish to place" idea has been attempted but not delivered. Nobody has publicly shown a working "say anything, the compass points to it". Software-first on a phone, using its compass, avoids the hardware sinkhole.

### 23. Bilibili leads (blocked or irrelevant)
- yt-dlp `bilisearch` worked for some queries but returned game guides (Minecraft compass, Ori). Other queries and the Bilibili view API returned HTTP 412 or a risk-control page.
- Web search found no relevant Bilibili maker video for 会指向你的指南针, 杰克船长 指南针 or 情侣指南针.
- One indirect lead: an sspai article on a home-made BeiDou/GPS receiver with an iPhone compass app, Bilibili BV1KV41167cU. Lead only.

## E. Big-platform "arrow" reinventions (context)

### 24. Apple Find My Precision Finding
- URL: https://www.macrumors.com/how-to/use-precision-finding-airtag/ ; https://9to5mac.com/2026/01/28/airtag-2-hands-on-review-apples-clever-item-tracker-finds-even-more-utility-with-longer-range-and-louder-sound/
- Twist and tech: UWB gives an on-screen arrow, distance and haptics that turn into a bullseye on arrival. AirTag 2 (Jan 2026) has longer range and works through floors.
- Reception: reviewers saw short wrong-way detours. Forum users say the arrow disappears up close.
- Status: metadata only.
- Lesson: the "arrow to a thing" UX is mainstream. The judges will know it, so reference it rather than compete with it.

### 25. Google Maps Live View
- URL: https://techcrunch.com/2019/08/08/google-launches-live-view-ar-walking-directions-for-google-maps/amp/
- Date: 2019, extended to transit in 2020.
- Twist and tech: AR arrows over the camera feed, using Street View visual positioning.
- Reception: early reviews praised it. Walking with the phone held up feels awkward and gets looks from passers-by, and it drains the battery.
- Status: metadata only.
- Lesson: AR arrows are taken. A "heads-up, phone-down" analog feel is the counter-position, as with Terra, Homing and Beeline.

### 26. Randonautica (random or "intention" coordinates)
- URL: https://en.wikipedia.org/wiki/Randonautica
- Date: launched 22 Feb 2020, from the Fatum Project Telegram bot. About 10.8M users by Jul 2020 and about 176M TikTok hashtag views.
- Twist: sends you to random "attractor/void/anomaly" points, framed with intention and the dérive. It is a compass that points to the unknown.
- Reception: viral TikTok "creepy coincidence" content. In 2020 a Seattle group found human remains, which led to safety and trespass concerns. Downloads tapered off afterwards.
- Status: page read.
- Lesson: "point me somewhere meaningful" went viral, and the safety concerns came with it. Any serendipity or AI-chosen destination needs safe and public filtering.

Adjacent, not a compass: Paul Lagier's e-ink AIS ship tracker gift build (https://www.youtube.com/watch?v=lsG5w9Y8AuI, Sep 2026, 1.96M views). The top comment was "I loved her to the point of invention." It shows that "built for someone I love" stories go viral. Its live ship data came from open Finnish AIS feeds. Status: video captions read.

## Top 3 most relevant to an AI-agent compass
1. **Terra** (#14): intention plus AI produces a compass trail. It is exactly the concept space, but builders report that the intent feature isn't implemented and nobody has shown it working. Differentiate by making intent → live web research → bearing work end to end on camera.
2. **Leviathan wish compass, Uwos liquor compass and Joe Grand pizza compass** (#20–22): together they define the "Jack Sparrow compass" genre. They also show its real gaps: one hard-coded category, no live opening hours ("closed 4 hours ago"), as-the-crow-flies routing and magnetometer trouble.
3. **Truest North Compass** (#1): a proven market for a faithful physical aesthetic with a sentimental target ($136k). Its phone-flash reprogramming is a great demo idea. A firsthand failure report says it points the wrong way, and buyers keep asking for it to point to a person or a moving target.

## Gap areas (not found built)
- **Agentic "points to what you want".** Free text or voice goes to an LLM, which plans and uses browser automation to check live facts (open now, has stock, has a table, has a quiet seat or a socket, fits the budget, accessibility). It then commits one bearing. Every build found uses a fixed category or a hard-coded wish.
- **The agent acts on arrival or en route.** For example, it books the table, joins the queue, or buys the ticket while the needle swings. No compass product found does this.
- **Re-targeting as the world changes.** The needle re-plans live when a place closes or sells out, or when a friend moves. That is the Uwos failure turned into a feature.
- **Pointing at non-places with live data.** Examples: the nearest person who wants help, a moving ship, plane or ISS from open feeds, "where the sunset is visible", "the quietest park now". The ISS is covered; generalised live targets are not.
- **Browser-only and phone-only.** DeviceOrientation and Geolocation in a web page avoid the hardware failures seen in #10, #21 and #22. None of the products found takes this route; all lean on custom hardware.
- **Honest compass semantics.** Two-hand (bearing plus distance) or ring-of-light UIs exist. A route-aware needle that bends with the street (Joe Grand had to correct himself mentally) is open.
- Saturated, avoid as headline: point to partner or friend (LynQ, Lover's Compass); point home for dementia (Aumens, Compath); haptic north (feelSpace, North Paw, North Sense); bike arrow (Beeline, Haize, SmartHalo); AR arrows (Live View); UWB arrow (Find My).

## Strong visual and demo moments for a cinematic film
- Joe Grand: green LED locks "straight ahead" at a suburban corner, then arrival and "let's eat".
- Uwos Lab: a night drive to Pirates of the Caribbean music, a road-closed detour, then "it closed 4 hours ago". A perfect 1979-style failure that the 2026 version fixes.
- Truest North: the compass laid face-down on a phone that flashes binary to receive a new destination, with the two hands swinging to "3,000 miles that way".
- Practical Engineering: clouds part and the pointer tracks the ISS across the night sky.
- Animotus / *Flatland*: audience members in total darkness, each guided by a cube that twists in their hands.
- Olafur Eliasson: a giant suspended needle turning to the north window, as a hero still.
- Homing Compass: a single red arrow on a wooden puck, picked up and waking. Minimal and calm.
- North Paw: the "Eric dance" spin to check north indoors, and the anklet going haywire when the BART motor starts. A comic beat about the old tech's limits.

## Search coverage and blocks
- Web search covered: Beeline, SmartHalo, Haize, Truest North, LynQ, friend/partner compasses, feelSpace, North Sense, Wayband, Animotus, Soundscape, Randonautica, Find My, Live View, Yanko Design, designboom, Dezeen, Olafur Eliasson, ISS pointers, and Chinese queries (情侣指南针, 杰克船长 指南针).
- YouTube (yt-dlp ytsearch): Jack Sparrow builds, "points to anything", GPS compass Arduino, "points to my girlfriend", haptic belt, North Sense, ISS pointer, Truest North, "nearest", AI compass. I read captions and comments for 9 videos.
- Blocked:
  - Kickstarter, BackerKit and Medium returned 403, so I could not read backer comments or updates for Truest North or Beeline.
  - The Bilibili API returned 412 or a risk-control page, and bilisearch gave irrelevant results.
  - The Dezeen comments were not available.
- Not done: X/Twitter, because I had no known post URLs; an Indiegogo LynQ page read; a SmartHalo or Haize delivery check.
