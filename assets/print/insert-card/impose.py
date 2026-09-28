#!/usr/bin/env python3
"""שני כרטיסים על גיליון אחד, זה לצד זה, לחיתוך באמצע.

מרכיב את הגיליונות מתוך jerseylab-insert-a5.pdf ברמת ה-PDF, כך שהטקסט
והאייקונים נשארים וקטוריים ולא הופכים לתמונה.

לכל כרטיס יש 3 מ"מ bleed מסביב. במרכז הגיליון שני הכרטיסים נפגשים על קו
החיתוך עצמו, ולכן ה-bleed הפנימי של כל אחד נחתך שם: בלעדי זה ה-bleed של
הכרטיס השמאלי היה מודפס מעל הכרטיס הימני ברצועה של 3 מ"מ. ה-bleed החיצוני,
זה שבית הדפוס באמת צריך, נשאר.

    python3 impose.py
"""

from pathlib import Path
from pypdf import PdfReader, PdfWriter, Transformation
from pypdf.generic import RectangleObject

HERE = Path(__file__).parent
SRC = HERE / 'jerseylab-insert-a5.pdf'
MM = 72 / 25.4
TRIM_W, TRIM_H = 148 * MM, 210 * MM          # A5 לאחר חיתוך

# הגיליון של צד 1 מסובב 180. בהדפסה דו-צדדית שבה המדפסת הופכת את הדף על
# הציר הארוך, הגב יוצא הפוך ביחס לפנים; סיבוב הגיליון הקדמי מיישר את
# השניים. שני חצאי הגיליון זהים, ולכן הסיבוב לא מחליף ביניהם שום דבר
# ושני הכרטיסים יוצאים נכון.
#   קובץ, עמוד שמאלי, עמוד ימני, 180, תיאור
SHEETS = [
    ('jerseylab-2up-front-front.pdf', 0, 0, True,  'צד 1 ליד צד 1, מסובב 180'),
    ('jerseylab-2up-back-back.pdf',   1, 1, False, 'צד 2 ליד צד 2'),
    ('jerseylab-2up-front-back.pdf',  0, 1, False, 'צד 1 ליד צד 2'),
]


def clipped(index, x0, x1):
    """עמוד מתוך המקור, חתוך לרצועה שבין x0 ל-x1.

    נקרא מחדש בכל פעם: שינוי ה-mediabox נשאר על האובייקט, ועמוד משותף
    לשני גיליונות היה יוצא חתוך פעמיים.
    """
    page = PdfReader(SRC).pages[index]
    box = RectangleObject((x0, 0, x1, float(page.mediabox.height)))
    page.mediabox, page.cropbox = box, box
    return page


def main():
    src = PdfReader(SRC).pages[0]
    src_w, src_h = float(src.mediabox.width), float(src.mediabox.height)
    bleed_x = (src_w - TRIM_W) / 2               # ה-bleed בפועל, לא ההנחה
    sheet_w, sheet_h = src_w + TRIM_W, src_h

    for name, left, right, turn, label in SHEETS:
        writer = PdfWriter()
        sheet = writer.add_blank_page(width=sheet_w, height=sheet_h)

        def place(base):
            """הסיבוב נצרב לתוך התוכן ולא נשמר כ-/Rotate על העמוד, כי חלק
            מה-RIPים בבתי דפוס מתעלמים מ-/Rotate ומדפיסים זקוף."""
            if not turn:
                return base
            return base.rotate(180).translate(sheet_w, sheet_h)

        # שמאל: הכל חוץ מה-bleed הימני, שנופל על קו החיתוך המרכזי.
        sheet.merge_transformed_page(clipped(left, 0, src_w - bleed_x), place(Transformation()))
        # ימין: הכל חוץ מה-bleed השמאלי, מוזז ברוחב כרטיס אחד.
        sheet.merge_transformed_page(clipped(right, bleed_x, src_w),
                                     place(Transformation().translate(TRIM_W, 0)))
        with open(HERE / name, 'wb') as fh:
            writer.write(fh)
        print(f'→ {name}  ({label})  {sheet_w/MM:.1f} x {sheet_h/MM:.1f} mm')


if __name__ == '__main__':
    main()
