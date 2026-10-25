# Registry Atlas

A simple, static single-page guide to package-registry security. No server, framework, dependencies, build step, or API is required.

## Open locally

Double-click [index.html](./index.html). The page works directly from disk, including registry selection, comparison, insights, and the full capability details.

## Publish on GitHub Pages

1. Upload these five files together into your repository:
   - [index.html](./index.html)
   - [styles.css](./styles.css)
   - [data.js](./data.js)
   - [app.js](./app.js)
   - [report.pdf](./report.pdf)
2. In **Settings → Pages**, choose **Deploy from a branch**, then select your branch and the folder containing these files.
3. Visit the Pages URL GitHub provides.

All asset and PDF URLs are relative, so repository sites such as `https://username.github.io/registry-security/` work without configuration. The PDF is the original supplied report, bundled locally for page-specific evidence links. There are no third-party requests or external fonts.

## A simpler reading experience

- Switch between **By registry** and **By control** using the two explorer pivots (also keyboard-accessible with Left/Right or Home/End).
- **By registry:** pick one registry to see **what is working** and **where the gaps are**.
- Nine plain-language questions cover publishing, package delivery, and consumer response.
- Expand an answer for its definition, exact PDF table page, and any lower-confidence warning.
- Optionally compare one other registry using the same questions.
- All 45 original controls remain available behind **See all 45 controls**.
- **By control:** pick one of five categories, then select a specific control to see all 16 profiles grouped by rating. Counts describe profiles, not unique ecosystems or security scores.
- Select **Whole category** to compare every control in that category in a horizontally scrollable table. Select a column heading to explore a control; select a rating to open that registry's evidence. Lower-confidence cells are marked with a dagger.
- Three headline insights are visible; five additional findings and methodology are expandable.
- Selection is shareable in the URL, for example `#registry=npm&compare=pypi`.
- Control views are shareable too: `#registry=npm&view=control&category=Z&control=Z4` (one control) or `#registry=npm&view=control&category=C&control=all` (whole category).
- The visual palette uses bold navy, blue, green, red, and amber with high-contrast text. Rating labels and symbols accompany colors; no meaning depends on color alone.

## Research scope

The original assessment is **3 August 2026**, validated **30 September 2026**. This is a transformation of that report, not a live assessment.

All **720 ratings** are retained: 45 controls across 16 profiles representing 15 ecosystems. Arch official and AUR remain separate. Available does not mean enabled for everyone; partial can mean opt-in or external tooling; planned is not shipped; N/A is not failure. No composite security score is used.

## Validate changes

Node.js 22+ is needed only for development tests, not to use or host the website:

```powershell
npm test
node --check app.js
node --check data.js
```
