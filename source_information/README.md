# BeruApp Source Information

This folder contains the data used by the rebuilt BeruApp interface.

- `pipes.json`: pipe outside diameter and wall schedule data.
- `flanges.json`: ANSI B16.5 flange dimension data.
- `wps.json`: welding procedure specification data.
- `compounds.json`: compound selector data converted from the original BeruApp HTML reference.
- `engineering_calcs.json`: material allowable stresses, bolt material stresses, and bolt size data extracted from `Calcs/Master Calc Rev 1.28 M.xlsm`.
- `asme_table_1a.json`: ASME BPVC II - Part D Table 1A Rev01 ferrous material allowable stress data converted from Excel.

The canonical JSON is maintained in `Working Files/source_information`. The release builder regenerates `source-data.js` from these six JSON datasets with version metadata and SHA-256 hashes. Release copies and generated bundles must not be edited independently.

The app validates and loads each JSON dataset independently, trying `source_information/` then `../source_information/`. If unavailable, it can use an app-version-matched generated bundle. Settings reports dataset availability and offers retry. Missing data remains unavailable rather than becoming zero.

The data label `2026.07.28` is preserved. The app package date is 12 October 2026; packaging does not establish the current edition of each standard. The master workbook identifies ASME 2025 and PCC-1-2022. Other source editions and full ASME note definitions are not recorded in the imported data and are identified in the app.

Supplied material-guide PDF, elbow PDF, SANS text and dimension diagrams are packaged under `references/` for traceability and offline access. Approved original WPS and PQR documents are not included in the source dataset.
