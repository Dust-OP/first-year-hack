# Video info

Material for the demo video: how the Safari icon changed from its first version (2003) to today, and how the compass itself looked through history. Appearance only, no captions. Collected 21 Nov 2026.

## What is here

| Path | What | In git? |
|---|---|---|
| `compass/compass-evolution.mp4` | One continuous video: 15 compass stages, 24 s, 1080×1080 | Yes |
| `compass/clips/NN-MM.mp4` | One 2.5 s clip per step (stage NN swaps to stage MM) | Yes |
| `compass/raw/` | The 15 source photos, 14 of them Wikimedia's downscaled copies (public domain or Creative Commons, see the credits below) | Yes |
| `compass/manifest.json` | Order, labels, sources, licences, crops | Yes |
| `compass/stills/` | The photos normalised to 1080×1080 transparent PNGs | No, rebuilt by `make_clips.py` |
| `safari/{all,mac,ios}/manifest.json` | Order, versions, years and source URLs of the Safari icons | Yes |
| `safari/{all,mac,ios}/safari-*-evolution.mp4`, `clips/`, `stills/` | The Safari videos and clips | **No**, local only (see below) |
| `safari/raw/` | The 11 Safari icon images | **No**, local only |
| `*/videos.json` | Existing YouTube videos on the same subject (metadata only, not downloaded) | Yes |
| `compass/not-used.json` | Candidates that were rejected, with the reason | Yes |
| `tools/fetch_images.py`, `tools/make_clips.py` | Download the source images and build the clips | Yes |

**The swap animation.** Each step holds the old image for 0.9 s. The old image then shrinks to 80% and fades out while the new one settles from 120% to 100% and fades in, over 0.7 s with smoothstep easing. The new image then holds for 0.9 s. The continuous video chains the same swaps without repeating the holds. Built with ffmpeg only.

Rebuild the compass set:

```sh
cd new-project/video-info
python3 tools/make_clips.py compass --mode photo --bg 0x111111 --name compass
```

Rebuilding rewrites the tracked clips and video; do not commit the result unless a photo, the order or the timing changed.

## Safari: kept out of git on purpose

The Safari icons are Apple's artwork and this repository is public. The owner decided on 21 Nov 2026 to commit only the sources and scripts. `.gitignore` keeps the images and videos out. To rebuild them on any machine with Python 3 and ffmpeg:

```sh
cd new-project/video-info
python3 tools/fetch_images.py safari/all          # downloads the 11 icons into safari/raw/
for s in all mac ios; do python3 tools/make_clips.py safari/$s --mode icon --name safari-$s; done
```

Three sets: `all` is every change in date order across Mac and iPhone (11 icons, 17.5 s), `mac` is the Mac line (7), and `ios` is the iPhone line (6: four iPhone icons, then the 2025 and 2026 designs shared with the Mac).

| # | Year | Platform | Version | Release |
|---|---|---|---|---|
| 1 | 2003 | Mac | Safari 1.0 | Mac OS X 10.2 Jaguar / 10.3 Panther |
| 2 | 2005 | Mac | Safari 2.0 | Mac OS X 10.4 Tiger |
| 3 | 2007 | Mac + Windows | Safari 3 to 7 | Mac OS X 10.5 Leopard to 10.8; Windows Safari 3 to 5 |
| 4 | 2007 | iPhone | Mobile Safari, iPhone OS 1 to iOS 6 | iPhone OS 1 (2007); Retina redraw from iOS 4 (2010) |
| 5 | 2013 | iPhone | Safari, iOS 7 | iOS 7 flat redesign |
| 6 | 2014 | Mac | Safari 8 | OS X 10.10 Yosemite |
| 7 | 2017 | iPhone | Safari, iOS 11 | iOS 11 |
| 8 | 2020 | Mac | Safari 14 | macOS 11 Big Sur |
| 9 | 2024 | iPhone | Safari, iOS 18 | iOS 18 |
| 10 | 2025 | Mac | Safari 26 (Liquid Glass) | macOS 26 Tahoe |
| 11 | 2026 | Mac | Safari 27 | macOS 27 |

**Sources and limits.**
- The images are Logopedia (logos.fandom.com) files, fetched through Wayback Machine copies because Logopedia's image server blocks scripts. The years also come from Logopedia and were not checked against Apple.
- The local 2025 icon was rendered from the Safari app on this Mac (macOS 26.6). The fetch script uses Logopedia's copy instead.
- Some files are small because they were made small: 128 px for the 2003 and 2005 Mac icons, and 120 to 180 px for iOS 7, 11 and 18. They look soft at 760 px.
- Not included:
  - the 57 px iPhone OS 1 to 3 originals (the Retina redraw of the same design is used);
  - the separate iOS 26 and iOS 27 icons (no archived copy; the Mac icons of the same years are close);
  - beta-only icons.
- No existing video covers 2003 to Liquid Glass with morphing transitions. The closest are listed below.

## Compass stages and credits

The Creative Commons licences require this credit wherever the images or clips are shown (CC BY-SA also requires derivatives to keep the same licence). In the video, a single credits card is enough if it links to this page and says "Compass sequence: CC BY-SA 4.0".

**Licence of the clips and the video.** `compass/clips/*.mp4` and `compass/compass-evolution.mp4` are adaptations of the photos credited below, made by the first-year-hack team, and are offered under [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/). Anything that reuses them, including our demo film, must show these credits or a link to this page and state that licence. The files in `compass/raw/` keep the licence listed for each photo.

| # | Stage | Era | Author | Licence | Source |
|---|---|---|---|---|---|
| 1 | Lodestone spoon on bronze earth plate (sinan), modern model | Han dynasty, c. 2nd c. BC - 1st c. AD (model) | Typo~commonswiki (uploader; the Commons page names no author); cropped by Hohum | [CC BY-SA 3.0](http://creativecommons.org/licenses/by-sa/3.0/) | [Commons](https://commons.wikimedia.org/wiki/File:Model_Si_Nan_of_Han_Dynasty.jpg) |
| 2 | Floating south-pointing fish (wet compass), reconstruction | Song dynasty, 11th c. (reconstruction, Guangdong Science Center) | Pauloleong2002 | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) | [Commons](https://commons.wikimedia.org/wiki/File:Compass_and_%22Guide_to_fish%22.jpg) |
| 3 | Chinese luopan (feng shui geomantic compass) | Form from Song-Ming era onward; object undated, probably 19th-20th c. | Александр Сигачёв | [CC0](http://creativecommons.org/publicdomain/zero/1.0/deed.en) | [Commons](https://commons.wikimedia.org/wiki/File:Museum_of_the_Middle_Urals_-_Chinese_luopan.jpg) |
| 4 | Dry-pivot box compass, gimballed (Mary Rose) | 1545 (sank); earliest Western gimballed steering compass | Tim Sheerman-Chase | [CC BY 4.0](https://creativecommons.org/licenses/by/4.0) | [Commons](https://commons.wikimedia.org/wiki/File:Gimballed_Compass,_Mary_Rose_-_55129422442.jpg) |
| 5 | Mariner's compass with compass-rose card in wooden box (Cook type) | 18th c., c. 1750 | Auckland War Memorial Museum Tamaki Paenga Hira | [CC BY 4.0](https://creativecommons.org/licenses/by/4.0) | [Commons](https://commons.wikimedia.org/wiki/File:Compass,_marine_(AM_1932.215-1).jpg) |
| 6 | Brass pocket equinoctial sundial with compass | c. 1750-1790 | Missouri History Museum (photo); maker unknown | [Public domain](https://commons.wikimedia.org/wiki/File:Pocket_Equinoctial_Compass.jpg) | [Commons](https://commons.wikimedia.org/wiki/File:Pocket_Equinoctial_Compass.jpg) |
| 7 | Ship's binnacle with compensating spheres | 19th c. | Antti Leppänen | [CC BY 4.0](https://creativecommons.org/licenses/by/4.0) | [Commons](https://commons.wikimedia.org/wiki/File:Binnacle_from_19th_century_Huolintatalo.jpg) |
| 8 | Brass pocket compass with paper rose card (USF Constitution) | probably 19th c. (exact date not recorded) | Naval History & Heritage Command from Washington, DC, USA | [CC BY 2.0](https://creativecommons.org/licenses/by/2.0) | [Commons](https://commons.wikimedia.org/wiki/File:Pocket_Compass_USF_Constitution_(14373248138).jpg) |
| 9 | Brunton pocket transit (geologist's compass) | Design patented 1894; photographed unit is modern | LeCire | [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0) | [Commons](https://commons.wikimedia.org/wiki/File:Brujula_Brunton_01.jpg) |
| 10 | Military prismatic marching compass (Verner's Pattern Mk VIII) | 1918 (WWI) | Remote People | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) | [Commons](https://commons.wikimedia.org/wiki/File:WWI_Compass_1918_ER_Watts_Verner%27s_Pattern.jpg) |
| 11 | Silva-type liquid-filled baseplate orienteering compass (Silva Ranger) | Baseplate design 1930s; scanned unit late 20th c. | Arpingstone | [Public domain](https://commons.wikimedia.org/wiki/File:Walkers_compass_arp.jpg) | [Commons](https://commons.wikimedia.org/wiki/File:Walkers_compass_arp.jpg) |
| 12 | US Army lensatic compass | WWII-derived design, standard since the 1950s | The Central Intelligence Agency | [Public domain](https://commons.wikimedia.org/wiki/File:US_Army_Lensatic_Compass_-_Flickr_-_The_Central_Intelligence_Agency.jpg) | [Commons](https://commons.wikimedia.org/wiki/File:US_Army_Lensatic_Compass_-_Flickr_-_The_Central_Intelligence_Agency.jpg) |
| 13 | Cheap mass-produced plastic compass | Late 20th / early 21st c. (photo 2010) | Evan-Amos | [Public domain](https://commons.wikimedia.org/wiki/File:Plastic-compass.jpg) | [Commons](https://commons.wikimedia.org/wiki/File:Plastic-compass.jpg) |
| 14 | Digital compass watch (Casio Pro Trek PRT-411) | c. 2000 | user:Geographer from en-Wikipedia | [CC BY 2.5](https://creativecommons.org/licenses/by/2.5) | [Commons](https://commons.wikimedia.org/wiki/File:Casio_Triple_Sensor_Pro_Trek.jpg) |
| 15 | Smartphone compass app (HTC Desire S, Android) | 2011 | Zirguezi | [CC0](http://creativecommons.org/publicdomain/zero/1.0/deed.en) | [Commons](https://commons.wikimedia.org/wiki/File:Smartphone_Compass.jpg) |

**Notes.**
- **Changes:** the files in `compass/raw/` are Wikimedia's downscaled copies of the originals (at most 1920 px wide; stage 1 is full size) and are otherwise unchanged. In the clips and the video every photo is scaled to fit a 1080×1080 dark background and cross-faded into the next one; stage 6 is also cropped to remove a scale bar and stage 12 is cropped to the compass.
- **Reconstructions and later copies:** stages 1 and 2 are modern reconstructions of the ancient designs. Stages 9, 11 and 13 are modern units of older designs.
- **Stage 6:** Commons tags this photo public domain; the Missouri History Museum's own statement is "copyright undetermined", with an open-access policy that allows use without permission.
- **Stage 15:** the photo is CC0, but the compass app shown on the phone screen belongs to its developer.
- **Gaps:**
  - no free image of the iPhone 3GS (2009) or current Apple and Google compass screens; the source pages are in `not-used.json`;
  - no 1980s digital compass watch (the Casio is from about 2000);
  - no medieval dry compass before the Mary Rose one (1545).
- **A natural final stage** would be a screen recording of our own app.

## Existing videos (links only, not downloaded or watched)

**Safari icon evolution**

- [Safari logo, symbol | history and evolution](https://www.youtube.com/watch?v=YWoEbMYfUoA), 1000 LOGOS, 0:45, uploaded 2022
- [Logo History #197 Safari](https://www.youtube.com/watch?v=5a0Ze1FX3_k), CP Animation Official, 5:43, uploaded 2024
- [Safari Logo History | Evologo [Evolution of Logo]](https://www.youtube.com/watch?v=P0Z7AxS89M4), Riswan Hanafyah Harahap, 1:36, uploaded 2017
- [Apple Safari Logo Evolution](https://www.youtube.com/watch?v=8TXvIrlO1cw), Logo Queen, 1:22, uploaded 2021
- [Logo History #43 - Safari](https://www.youtube.com/watch?v=Ipxk5iW9fWs), Dante Dominic, 1:23, uploaded 2022
- [Apple Safari Icon Evolution (iOS + macOS)](https://www.youtube.com/watch?v=3vguMpjiUyQ), Nobel Tech, 1:18, uploaded 2023
- [Apple Safari Browser Evolution | Apple Logo Evolution | Factonian](https://www.youtube.com/watch?v=vtuD0vrwL48), Factonian, 1:00, uploaded 2022
- [Evolution Of Safari Logo | SAFARI | TAS PRODUCTIONS | 2021](https://www.youtube.com/watch?v=RT3K-dOBbBY), TASology, 1:01, uploaded 2021
- [Apple iPhone Safari Logo Evolution Historical Logos #trending #technology #iphone #phone #ios #apple](https://www.youtube.com/watch?v=GI3oGBeZYcc), Effects 1428, 0:15, uploaded 2026
- [Safari Logo Restoration 🧭](https://www.youtube.com/watch?v=c4rKoAtj8zs), Logostern, 3:24, uploaded 2026
- [iPhone Icons Evolution: From iOS 1 to iOS 26](https://www.youtube.com/watch?v=lQnt7LwutUg), BLASTERTECHNOLOGY, 5:23, uploaded 2025

**Compass history**

- [How the compass unlocked the world | Small Thing Big Idea, a TED series](https://www.youtube.com/watch?v=Eup2J0oAq9Y), TED, 3:21, uploaded 2020
- [Chinese compass video](https://www.youtube.com/watch?v=8hERUh9xBbo), RAMMuseumExeter, 2:56, uploaded 2014
- [Navigation Through The Ages](https://www.youtube.com/watch?v=xHd3Ps634ao), The Mariners' Museum and Park, 57:46, uploaded 2026
- [How to Find Your Way | Ships, Sea & the Stars](https://www.youtube.com/watch?v=ALmvD20AR1s), Royal Museums Greenwich, 53:36, uploaded 2020
- [The Evolution of the Compass](https://www.youtube.com/watch?v=HGGI5KgHTzs), Curiosity Corner, 6:34, uploaded 2024
