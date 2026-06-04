# Capture Pack — minimal examples

Validate with:

```powershell
cd C:\Projects\docraft
python scripts/validate_schemas.py
```

## PNG placeholders

This folder does not ship binary images (git-friendly). For a real ZIP test:

1. Add `images/step_01.png` and `images/step_02.png` (any PNG ≥ 5 KB).
2. Zip with `manifest.zip.json` renamed to `manifest.json`:

```powershell
# From this directory, after adding PNGs under images/
Compress-Archive -Path manifest.zip.json, images -DestinationPath ..\..\..\tmp-test.capture-pack.zip
# Then fix: manifest must be named manifest.json at zip root (use export_capture_pack.py on desktop for real packs)
```

**Recommended:** generate a real pack from desktop-instructor:

```powershell
python scripts/export_capture_pack.py --run-dir output --require-release
```
