# LibreOffice setup for DOCX → PDF conversion

The app uses the `libreoffice-convert` npm package, which runs **LibreOffice in headless mode** to convert DOCX to PDF. LibreOffice must be installed on the same machine where the Next.js server runs.

## Install LibreOffice

### Windows

1. Download the installer from [https://www.libreoffice.org/download/download/](https://www.libreoffice.org/download/download/).
2. Run the installer and complete the setup.
3. Default path is usually `C:\Program Files\LibreOffice`.
4. Restart the Next.js dev server or production process after installing.

### macOS

```bash
# Homebrew
brew install --cask libreoffice
```

Or download the `.dmg` from the LibreOffice site and install from Applications.

### Linux (Debian/Ubuntu)

```bash
sudo apt-get update
sudo apt-get install libreoffice-writer libreoffice-common --no-install-recommends
```

### Linux (Fedora/RHEL)

```bash
sudo dnf install libreoffice-writer libreoffice-core
```

## Verify installation

From a terminal, run:

```bash
# Windows (adjust path if needed)
"C:\Program Files\LibreOffice\program\soffice.exe" --version

# macOS / Linux
libreoffice --version
# or
soffice --version
```

If you see a version number, the server can use it for conversion.

## Production (e.g. Vercel, Docker)

- **Vercel / serverless**: LibreOffice is not available on Vercel’s runtime. Use a different host (VPS, Docker) or an external conversion API if you need DOCX→PDF in production.
- **Docker**: Add LibreOffice to your image:
  ```dockerfile
  RUN apt-get update && apt-get install -y --no-install-recommends libreoffice-writer libreoffice-common
  ```
- **VPS / VM**: Install LibreOffice as above for your OS, then run your Next.js app (e.g. `node .next/standalone/server.js` or `pnpm start`).

## Environment

No env vars are required for `libreoffice-convert`; it discovers the LibreOffice binary. If conversion fails with “LibreOffice not found”, ensure the `soffice` (or `libreoffice`) executable is on the system `PATH` where the Node process runs.
