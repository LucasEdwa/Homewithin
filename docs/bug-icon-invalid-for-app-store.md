# Bug: App Icon Invalid for App Store Submission

## Summary

EAS Submit was failing silently with "Something went wrong when submitting your app to Apple App Store Connect." The root cause was that the app icon (`homeIcon.png`) failed `expo doctor` validation with three separate errors.

## Errors (from `expo doctor`)

```
Error validating asset fields in app.json:
  Field: icon - the file extension should match the content,
         but the file extension is .png while the file content
         at './assets/images/homeIcon.png' is of type jpg.
  Field: icon - field 'icon' should point to .png image
         but the file at './assets/images/homeIcon.png' has type jpg.
  Field: icon - image should be square, but the file at
         './assets/images/homeIcon.png' has dimensions 671x579.
```

## Root Cause

`homeIcon.png` was actually a JPEG file that had been renamed to `.png`. Additionally, it was not square (671×579 px). Apple requires the app icon to be:

- A **real PNG** file (not a renamed JPEG)
- Exactly **square** (width === height)
- Ideally **1024×1024 px**

Because `expo doctor` runs as part of the EAS build process, a failing check causes the submission to be rejected by Apple without a clear error message surfaced in the CLI.

## Fix

Used macOS's built-in `sips` tool to convert the file to a proper PNG and resize it to 1024×1024:

```bash
sips -s format png -z 1024 1024 assets/images/homeIcon.png \
  --out assets/images/homeIcon_fixed.png
```

Updated `app.json` to point to the fixed icon:

```json
"icon": "./assets/images/homeIcon_fixed.png"
```

## Prevention

- Always run `expo doctor` before triggering an EAS build.
- App icons must be **square, real PNG files at 1024×1024 px**.
- Do not rename JPEG files to `.png` — the file content type must match the extension.
- If replacing the icon in the future, verify with:
  ```bash
  sips -g pixelWidth -g pixelHeight -g format assets/images/your-icon.png
  ```
  Expected output: `pixelWidth: 1024`, `pixelHeight: 1024`, `format: png`.
