# Rear docking contacts

Editable checkpoint: `silver-dock-contacts.blend`, following `silver-lower-keys.blend`. The PNG authoring GLB and lossless WebP delivery pack are kept separately, as described in `web-model-packing.md`.

Nintendo's original-XL hardware page identifies the AC-adapter socket and the separate charging-cradle contacts. The downloaded model already contains the socket rim, insulating insert and internal contacts; the inspection did not justify replacing that geometry. [Nintendo hardware reference](https://www.nintendo.co.jp/hardware/3dsseries/3dsll/index.html)

A new original-XL rear photograph was opened in the browser at useful scale. It shows brighter gold docking pads than the model's dark brown appearance. This is a used black original XL, so it supports the rear connector construction rather than the silver shell colour. [Original-XL rear photograph](https://i.ebayimg.com/images/g/-94AAeSwi5ZpypMQ/s-l960.jpg). The user's supplied image 4 provides a second rear reference with more worn contacts. Neither photograph is calibrated for material measurement.

The docking pads are `Source_0_part_55` and `Source_0_part_56`, each a four-vertex source surface recessed behind the existing chassis openings. Their source metallic channel is 255, with centre base colours around sRGB (124,110,56) and (126,110,50). Treating that dark captured colour as conductor reflectance made them appear brown. The new authored colour uses the gold sRGB example #ffd891 from [Filament's material guide](https://google.github.io/filament/main/materials.html), converted to linear RGB, with restrained variation derived from the original atlas. Actual plating alloy, wear and roughness are not measured or claimed exact.

`build_dock_contact_colour.py` modifies only the two UV rectangles plus two pixels of padding: 7,740 pixels total. It keeps the original source image intact and writes `dock-contact-basecolor.png`. `preview_dock_contacts.py` previews temporary material copies and restores them afterward. `install_dock_contacts.py` assigns one independent material to the two pads, retaining their original roughness, normal, metallic and specular maps. Geometry, UVs, positions and every other material remain unchanged.

Before/after close-ups are `rear-detail-current-charging.png` and `rear-contact-textured-trial-charging.png`; the plain-colour diagnostic is `rear-gold-trial-charging.png`. The textured version retains visible variation while providing a more plausible gold reflection. All six `dock-contacts-final-*.png` views were inspected. The front and shell appearance remain unchanged, and the rear pads remain legible at whole-device scale.

Two export tests compare all geometry attributes, indices, transforms and hierarchy with `silver-lower-keys.glb`; they then compare resolved material bindings and image hashes. They prove only the two pad base-colour bindings and their material names changed. This material pass does not resolve remaining silhouette, lettering or HOME Menu discrepancies.

The authoring GLB is 147,749,772 bytes, SHA-256 `135aeeb178482e93fe316c0770fc56f5b4952119c349934910dffd5b51d9f1e7`. The lossless delivery pack is 104,628,312 bytes, SHA-256 `dbbc22af27f89f04d8e2392de7d0b28ed4741ec2961c1677f22d105d3b0d421c`. Both independent packing checks pass against this new pair, including every decoded RGBA pixel and all non-image buffer payloads.

All 121 JavaScript tests and Python compilation pass. Browser verification at 1280 × 720 loaded the new pack with VGPU ready, closed the lid and rotated the console to show the rear. The two gold pads remained distinct beside the socket, and no warning/error logs were reported. This pass changes only material colour; no new frame-rate or hardware-compatibility claim is made.
