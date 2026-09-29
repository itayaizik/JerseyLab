#!/usr/bin/env bash
# בונה מחדש את כל קבצי ההדפסה מתוך card.html.
# דורש Chromium. שנה CHROME אם הבינארי אצלך במקום אחר.
set -euo pipefail
cd "$(dirname "$0")"
CHROME="${CHROME:-$(command -v chromium || command -v chromium-browser || command -v google-chrome || echo /opt/pw-browsers/chromium)}"

render() {  # render <html> <pdf>
  "$CHROME" --headless --no-sandbox --disable-gpu \
    --allow-file-access-from-files --no-pdf-header-footer \
    --print-to-pdf="$PWD/$2" "file://$PWD/$1" 2>/dev/null
}

# שלוש דרגות של הכחול. הכחול נדפס כהה יותר ממה שנראה על המסך, וכמה בדיוק
# תלוי במדפסת ובנייר, ולכן יש שלוש ולא אחת. רק צבע הרקע משתנה; הדיו על
# הנייר הבהיר נשאר #1B2A4A בכל הדרגות כדי שהטקסט לא יחוויר.
#   שם:רקע:רקע כהה
LEVELS=(
  "0:#1B2A4A:#0F1D38"   # המקורי, הכי כהה
  "1:#2A3F6B:#1B2A4A"   # מדרגה אחת בהיר יותר
  "2:#3A5388:#2A3F6B"   # שתי מדרגות
)
DEFAULT_LEVEL=2

mkdir -p variants
for entry in "${LEVELS[@]}"; do
  IFS=: read -r name bg dark <<< "$entry"
  sed -e "s|--navy-bg:#[0-9A-Fa-f]\{6\};|--navy-bg:${bg};|" \
      -e "s|--navy-bg-dark:#[0-9A-Fa-f]\{6\};|--navy-bg-dark:${dark};|" \
      card.html > ".card-navy-${name}.html"
  render ".card-navy-${name}.html" "variants/jerseylab-insert-a5-navy-${name}.pdf"
  [ "$name" = "$DEFAULT_LEVEL" ] && cp ".card-navy-${name}.html" .card-default.html
  rm -f ".card-navy-${name}.html"
  echo "→ variants/jerseylab-insert-a5-navy-${name}.pdf  (${bg})"
done

render .card-default.html jerseylab-insert-a5.pdf
rm -f .card-default.html
echo "→ jerseylab-insert-a5.pdf  (דרגה ${DEFAULT_LEVEL}, זה הקובץ הראשי)"

render navy-test.html jerseylab-navy-test.pdf
echo "→ jerseylab-navy-test.pdf  (שלוש הדרגות על דף אחד, להדפסה ובחירה)"

# גיליונות של שני כרטיסים לחיתוך באמצע. מדלג בשקט אם pypdf לא מותקן,
# כי הכרטיס הבודד הוא המקור וכבר נוצר.
python3 impose.py 2>/dev/null || echo "   (2-up: דלג, חסר pypdf — pip install pypdf)"
