#!/usr/bin/env bash
# בונה מחדש את ה-PDF להדפסה מתוך card.html.
# דורש Chromium. שנה CHROME אם הבינארי אצלך במקום אחר.
set -euo pipefail
cd "$(dirname "$0")"
CHROME="${CHROME:-$(command -v chromium || command -v chromium-browser || command -v google-chrome || echo /opt/pw-browsers/chromium)}"
"$CHROME" --headless --no-sandbox --disable-gpu \
  --allow-file-access-from-files --no-pdf-header-footer \
  --print-to-pdf="$PWD/jerseylab-insert-a5.pdf" "file://$PWD/card.html"
echo "→ jerseylab-insert-a5.pdf"

# גיליונות של שני כרטיסים לחיתוך באמצע. מדלג בשקט אם pypdf לא מותקן,
# כי הכרטיס הבודד הוא המקור וכבר נוצר.
python3 impose.py 2>/dev/null || echo "   (2-up: דלג, חסר pypdf — pip install pypdf)"
