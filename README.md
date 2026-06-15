# BeruApp PWA for GitHub Pages

This folder is a GitHub Pages-ready PWA copy of BeruApp.

## Publish on GitHub Pages

1. Create or open the GitHub repository you want to host BeruApp from.
2. Upload the contents of this folder to the repository root, or to the branch/folder you use for Pages.
3. In GitHub, go to **Settings > Pages**.
4. Set the source to the branch and folder containing these files.
5. Open the Pages URL once GitHub finishes publishing.

## PWA Files

- `manifest.webmanifest` makes the app installable.
- `service-worker.js` caches the app shell and source data for offline use.
- `source_information/asme_table_1a.json` contains the imported ASME BPVC II - Part D Table 1A reference data.
- `.nojekyll` keeps GitHub Pages from processing the folder with Jekyll.
- `assets/icons/icon-192.png` and `assets/icons/icon-512.png` are install icons generated from the BeruApp logo.

GitHub Pages serves over HTTPS, which is required for service workers and PWA installation.

When publishing a new version, upload the complete folder contents and keep the service worker cache version updated. The service worker is set to check the live GitHub Pages files first, then use cached files only as an offline fallback.
