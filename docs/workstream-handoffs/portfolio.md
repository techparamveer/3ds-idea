# Portfolio workstream handoff

Checkpoint: source base `f5ed204c7955880d59b097a632d48deaa7d80252`, 1 October 2026.
Owned features: P-WORK, P-PROJ, P-HOB, P-LIFE, P-HACKUK, P-NVIDIA,
P-ABOUT and P-CONTACT.

The 1 October 2026 model-policy update applies to subsequent work: workstream
chats use GPT-6 Astra with high reasoning; any bounded helper uses GPT-6.1 Sol
with medium reasoning; Fast mode is disallowed. This in-flight turn was not
claimed to have switched models, and it created no helper agent.

## Delivered route evidence

`tests/portfolio-completion-routes.test.mjs` locks the real 26-entry content and
action graph. It verifies that every entry opens, every declared page and photo
index is reachable without crossing its bounds, detail Back restores the same
entry at page/photo zero, and a second Back requests HOME. Work's HackUK entry
emits a `launch` effect; local Life and About toolkit Done actions return without
a link; all web and `mailto:` effects require a separate explicit activation.
For all eight apps, a live HOME suspend/resume retains the owner and route while
closing and starting a new instance restores entry 0 with no detail/page/photo.

This is source/test evidence only. Portfolio interiors are intentional
user-scoped adaptations, not Nintendo screens. No browser, Sidecar, native
Azahar, raw LCD capture, input/motion comparison or audio evidence was produced
in this worker slice, and no 1:1 or scenario-pass claim follows from the tests.

## Coordinator Sidecar capture checklist

Run only on freshly verified iPad Sidecar geometry with 3DS audio muted. For
each named scenario, capture both raw LCDs at entry list, longest detail, last
entry focus, post-Back focus, live HOME resume, and fresh-instance entry 0.

| Feature / scenario | Overflow and layout | Focus and action checks |
| --- | --- | --- |
| P-WORK / `portfolio-work-cross-launch` | Inspect MyUCAT page 2 and all four subtitles for clipping/wrap; keep footer inside the lower LCD. | Reach `hackuk-work` as the last row, Back to the same row, then A must request HackUK rather than a URL. |
| P-PROJ / `portfolio-projects-pages` | Inspect the two-page AnkiCram/CogniLink bodies and Renu page 2 plus its image crop/counter. | Move to last-row Renu, traverse both pages, Back to Renu, and activate each Visit only with the second A. |
| P-HOB / `portfolio-hobbies-gallery` | Inspect both long Building Collection pages and all three photo crops/counters at first and last bounds. | Single-row focus must remain visible; Back resets page/photo to zero and Visit requires a new explicit A. |
| P-LIFE / `portfolio-life-done` | Inspect the longest RWS/Hack Keele labels and each one-page body for wrap and footer overlap. | Reach last-row School, confirm Done returns locally to School with no outbound window, then Back reaches HOME. |
| P-HACKUK / `portfolio-hackuk-pages` | Inspect mission page 2 and image, plus Counterspell's reused image and long event subtitles. | Reach last-row Counterspell, preserve its focus after Back, and confirm a Visit intent appears only after explicit A. |
| P-NVIDIA / `portfolio-nvidia-renu` | Inspect both Renu pages and image scaling/counter with the single-row layout. | Focus must remain stable through page/photo bounds; Back resets and Visit needs explicit A. |
| P-ABOUT / `portfolio-about-local-and-visit` | Inspect intro page 2 and the toolkit's long technology list for clipping and balanced margins. | Intro Visit emits only after explicit A; toolkit Done returns locally to the toolkit row without a link. |
| P-CONTACT / `portfolio-contact-explicit-links` | Inspect all seven labels/subtitles, especially email, booking URL and last-row TikTok, for list/detail overflow. | Scroll focus to TikTok, Back restores that row, and verify no web/mail intent before the second A on every entry. |

For every scenario, compare the resumed live route with a newly closed/reopened
instance. Native comparison applies only to surrounding HOME, launch and
lifecycle chrome; retain the portfolio-interior adaptation label in evidence.
