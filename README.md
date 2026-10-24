# DayTone website

The static site for [DayTone](https://github.com/daytone-piano/DayTone), the daily piano practice
app: a landing page, the privacy policy and a support page. Plain HTML, CSS and JavaScript, no
build step and no dependencies; GitHub Pages serves the files as they are.

```
index.html             landing page
privacy/index.html     privacy policy (linked from the app: keep the URL stable)
support/index.html     support page and FAQ (the App Store's support URL)
404.html               page not found
assets/css/site.css    the one stylesheet, with the app's colours, light and dark
assets/js/site.js      reveal on scroll, counters, the keyboard demo
assets/js/voicings.js  ii–V–I voicings in 12 keys, exported from the app's voicing engine
assets/img/            logo (SVG), icons, share card (og.png) and app screenshots
robots.txt, sitemap.xml  for search engines: list every page in the sitemap
CNAME                  the custom domain, daytoneapp.com (written by GitHub)
```

## Preview locally

```sh
python3 -m http.server 8000
```

Then open http://localhost:8000.

## Rules

- Nothing is loaded from other sites: no fonts, scripts, analytics or trackers. The privacy
  policy says so.
- The privacy and support URLs are given to the App Store and built into the app; never move them.
- Every page has a canonical URL on https://daytoneapp.com and a share card. A new page goes in
  `sitemap.xml`.
- Screenshots come from the iOS Simulator with the status bar set to 9:41, full battery, and are
  resized to 720 px wide JPEG.
