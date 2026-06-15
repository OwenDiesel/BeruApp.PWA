# BeruApp Source Information

This folder contains the data used by the rebuilt BeruApp interface.

- `pipes.json`: pipe outside diameter and wall schedule data.
- `flanges.json`: ANSI B16.5 flange dimension data.
- `wps.json`: welding procedure specification data.
- `compounds.json`: compound selector data converted from the original BeruApp HTML reference.
- `engineering_calcs.json`: material allowable stresses, bolt material stresses, and bolt size data extracted from `Calcs/Master Calc Rev 1.28 M.xlsm`.
- `asme_table_1a.json`: ASME BPVC II - Part D Table 1A Rev01 ferrous material allowable stress data converted from Excel.

`BeruApp HTML.html` remains in the project root as the original reference app and information source. The running app does not use its styling.
