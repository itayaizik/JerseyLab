// The guides: pages that explain something rather than sell something.
//
// A shop made only of product pages has nothing for a search like "איך לזהות
// חולצת כדורגל מקורית" or "גרסת אוהד או שחקן", and nothing for an AI assistant
// to quote when someone asks it the same question. These answer those
// questions properly, and link back into the catalogue where an answer ends in
// a shirt.
//
// Written in Hebrew, which is what the shop's customers search in. The text
// lives here rather than in the page component so the build can prerender it
// (scripts/prerender.mjs) - a crawler that runs no JavaScript still gets the
// whole article.

export const GUIDES = [
  {
    slug: 'original-vs-replica',
    en: {
          "title": "How to Tell an Original Football Shirt from a Replica | JerseyLab",
          "h1": "How to tell an original football shirt",
          "description": "How to tell an original football shirt from a replica: the label, the stitching, the crest, the fabric and the price. Straight answers, no tricks.",
          "intro": "Every fan about to buy a shirt runs into the same question: what separates the €120 shirt from the ₪80 one, and how do you know what you are actually buying. These are the signs that really tell them apart.",
          "sections": [
                {
                      "h2": "The inner label",
                      "paragraphs": [
                            "An original carries a unique product code on its label, usually letters and digits, and the same code is printed on the packaging. Type it into Google and see whether it leads to a shirt that exists. On replicas the label is usually simpler, and sometimes printed rather than sewn in."
                      ]
                },
                {
                      "h2": "The crest",
                      "paragraphs": [
                            "On the expensive shirts of recent years the crest is heat-pressed onto the fabric or densely embroidered. A crest sewn roughly, with threads standing out around it, points to cheaper manufacturing."
                      ]
                },
                {
                      "h2": "The fabric",
                      "paragraphs": [
                            "The big makers use fabrics with trade names of their own, like Nike's Dri-FIT or adidas AEROREADY, and the name is usually printed inside the shirt. The feel differs too: an original is normally thinner and lighter."
                      ]
                },
                {
                      "h2": "The stitching",
                      "paragraphs": [
                            "Turn the shirt inside out. Good manufacturing means straight, even seams with no loose threads. A crooked seam or frayed edges are the easiest sign to spot."
                      ]
                },
                {
                      "h2": "The price",
                      "paragraphs": [
                            "An original shirt from a big club costs around ₪350 to ₪500 in Israel. That gap explains itself: a shirt at ₪80 is a replica, and this is the simplest sign of them all."
                      ]
                },
                {
                      "h2": "What we sell",
                      "paragraphs": [
                            "At JerseyLab we sell high-quality replicas, at ₪70 to ₪80.",
                            "What we do promise: good fabric, crests that stay put after a wash, and sizes that match the chart on the site. If you specifically want an official club product, an official store is the place to buy it."
                      ]
                },
                {
                      "h2": "How long does a shirt like this last?",
                      "paragraphs": [
                            "A good shirt washed on a gentle cycle, without a tumble dryer, survives whole seasons. What ruins shirts is high heat, not the number of washes."
                      ]
                }
          ],
          "links": [
                {
                      "to": "/catalog",
                      "label": "All shirts"
                },
                {
                      "to": "/size-guide",
                      "label": "Size guide"
                },
                {
                      "to": "/guides/fan-vs-player",
                      "label": "Fan version vs player version"
                }
          ]
    },
    title: 'איך לזהות חולצת כדורגל מקורית? המדריך המלא | JerseyLab',
    h1: 'איך לזהות חולצת כדורגל מקורית',
    description: 'איך מבדילים בין חולצת כדורגל מקורית לבין העתק: התווית, התפרים, הסמלים, הבד והמחיר. מדריך ברור, בלי טריקים.',
    intro: 'כל אוהד ששוקל לקנות חולצה נתקל באותה שאלה: מה ההבדל בין החולצה שעולה ₪450 לזו שעולה ₪80, ואיך יודעים מה בדיוק קונים. הנה הסימנים שבאמת מבדילים.',
    sections: [
      {
        h2: 'התווית הפנימית',
        paragraphs: ['בחולצה מקורית התווית נושאת קוד דגם ייחודי, לרוב שילוב של אותיות וספרות, ואותו קוד מופיע גם על האריזה. אפשר להקליד אותו בגוגל ולראות אם הוא מוביל לדגם שקיים. בהעתקים התווית לרוב פשוטה יותר, ולפעמים מודפסת ולא תפורה.'],
      },
      {
        h2: 'הסמל של הקבוצה',
        paragraphs: ['בחולצות היקרות של השנים האחרונות הסמל בדרך כלל מוטבע בחום על הבד, או רקום בצפיפות גבוהה. סמל שנתפר בגסות, עם חוטים בולטים מסביב, מעיד על ייצור זול יותר.'],
      },
      {
        h2: 'הבד',
        paragraphs: ['היצרנים הגדולים משתמשים בבדים עם שמות מסחריים משלהם, כמו Dri-FIT של נייקי או AEROREADY של אדידס, והשם מודפס בדרך כלל בתוך החולצה. גם המרקם שונה: בד מקורי לרוב דק יותר ומרגיש קליל.'],
      },
      {
        h2: 'התפרים',
        paragraphs: ['הפכו את החולצה. בייצור איכותי התפרים ישרים, אחידים ובלי חוטים חופשיים. תפר עקום או קצוות מדובללים הם הסימן הקל ביותר לזהות.'],
      },
      {
        h2: 'המחיר',
        paragraphs: ['חולצה מקורית של מועדון גדול עולה בישראל בסביבות ₪350 עד ₪500. זה ההפרש שמסביר את עצמו: חולצה במחיר של ₪80 היא העתק, וזה הסימן הכי פשוט מכולם.'],
      },
      {
        h2: 'מה אנחנו מוכרים',
        paragraphs: [
          'ב-JerseyLab אנחנו מוכרים העתקים איכותיים, במחירים של ₪70 עד ₪80.',
          'מה שאנחנו מבטיחים: בד איכותי, סמלים שנשארים במקומם אחרי כביסה, ומידות שתואמות לטבלה שבאתר. מי שמחפש דווקא מוצר רשמי של המועדון, המקום לקנות אותו הוא חנות רשמית.',
        ],
      },
      {
        h2: 'כמה זמן חולצה כזו מחזיקה?',
        paragraphs: ['חולצה טובה שמכבסים בתוכנית עדינה, בלי מייבש, שורדת עונות שלמות. מה שהורס חולצות זה חום גבוה, לא מספר הכביסות.'],
      },
    ],
    links: [
      { to: '/catalog', label: 'לכל החולצות' },
      { to: '/size-guide', label: 'מדריך מידות' },
      { to: '/guides/fan-vs-player', label: 'גרסת אוהד מול גרסת שחקן' },
    ],
  },

  {
    slug: 'fan-vs-player',
    en: {
          "title": "Fan Version or Player Version? Fit, Fabric and Price | JerseyLab",
          "h1": "Fan version vs player version",
          "description": "The difference between the fan version and the player version of a football shirt: fit, fabric, weight and price, and how to pick the right size in each.",
          "intro": "Two shirts, same club, same season, and almost identical in a photo. The difference starts the moment you put them on.",
          "sections": [
                {
                      "h2": "The fan version",
                      "paragraphs": [
                            "This is what most people buy. A regular, comfortable cut, slightly thicker fabric, and it suits everyday wear. If you are unsure, this is the answer most of the time."
                      ]
                },
                {
                      "h2": "The player version",
                      "paragraphs": [
                            "This is the shirt the players wear on the pitch. Lighter fabric, sometimes with ventilation holes, and a much closer cut: it is meant to hug the body while running. On a body that is not athletic it will look a size too small, even when the size is right by the chart."
                      ]
                },
                {
                      "h2": "The difference in numbers",
                      "paragraphs": [
                            "On our size chart the player version in L measures about 53-55 cm across, against 57-58 in the fan version. That is a few centimetres you feel straight away."
                      ]
                },
                {
                      "h2": "Which to choose",
                      "list": [
                            "A shirt for everyday wear, for work or for watching the game: fan version.",
                            "You actually play football in it, or you like a close fit: player version.",
                            "Torn between two sizes in the player version: take the larger one."
                      ]
                },
                {
                      "h2": "Name and number printing",
                      "paragraphs": [
                            "Available on both. On the player version the print is usually heat-pressed and thinner; on the fan version it is printed in a slightly thicker layer. Both hold up well as long as you don't iron directly over them."
                      ]
                },
                {
                      "h2": "Price",
                      "paragraphs": [
                            "Here both cost the same, and the player version is a ₪20 extra. In official stores the gap between the two is far larger."
                      ]
                }
          ],
          "links": [
                {
                      "to": "/size-guide",
                      "label": "Size guide and calculator"
                },
                {
                      "to": "/catalog",
                      "label": "All shirts"
                }
          ]
    },
    title: 'גרסת אוהד או גרסת שחקן? ההבדלים, הגזרה והמחיר | JerseyLab',
    h1: 'גרסת אוהד מול גרסת שחקן',
    description: 'ההבדל בין גרסת אוהד לגרסת שחקן בחולצות כדורגל: גזרה, בד, משקל ומחיר, ואיך לבחור את המידה הנכונה בכל אחת מהן.',
    intro: 'שתי חולצות של אותה קבוצה, אותה עונה, ונראות כמעט זהות בתמונה. ההבדל מתחיל ברגע שלובשים אותן.',
    sections: [
      {
        h2: 'גרסת אוהד',
        paragraphs: ['זו החולצה שרוב האנשים קונים. הגזרה רגילה ונוחה, הבד מעט עבה יותר, והיא מתאימה ללבישה יומיומית. אם אתם מתלבטים, זו התשובה ברוב המקרים.'],
      },
      {
        h2: 'גרסת שחקן',
        paragraphs: ['זו החולצה שהשחקנים עצמם לובשים במגרש. הבד קל יותר, לעיתים עם חורי אוורור, והגזרה צמודה בהרבה: היא נועדה להיצמד לגוף בזמן ריצה. חולצה כזו על גוף שאינו אתלטי תיראה קטנה במידה, גם כשהמידה נכונה לפי הטבלה.'],
      },
      {
        h2: 'ההבדל בגזרה, במספרים',
        paragraphs: ['בטבלת המידות שלנו גרסת שחקן במידה L מודדת כ-53 עד 55 ס"מ ברוחב, לעומת 57 עד 58 בגרסת אוהד. זה הפרש של כמה סנטימטרים שמרגישים אותו מיד.'],
      },
      {
        h2: 'מה לבחור',
        list: [
          'חולצה ללבוש ביומיום, לעבודה או למשחק בטלוויזיה: גרסת אוהד.',
          'משחקים בה כדורגל בפועל, או אוהבים גזרה צמודה: גרסת שחקן.',
          'מתלבטים בין שתי מידות בגרסת שחקן: קחו את הגדולה.',
        ],
      },
      {
        h2: 'הדפסת שם ומספר',
        paragraphs: ['אפשר בשתיהן. בגרסת שחקן ההדפסה לרוב מוטבעת בחום ודקה יותר, ובגרסת אוהד היא מודפסת בשכבה מעט עבה. שתיהן מחזיקות היטב כשלא מגהצים עליהן ישירות.'],
      },
      {
        h2: 'המחיר',
        paragraphs: ['אצלנו החולצות עולות אותו דבר, וגרסת שחקן היא תוספת של ₪20. בחנויות רשמיות ההפרש בין הגרסאות גדול בהרבה.'],
      },
    ],
    links: [
      { to: '/size-guide', label: 'מדריך מידות ומחשבון מידה' },
      { to: '/catalog', label: 'לכל החולצות' },
    ],
  },

  {
    slug: 'famous-retro-shirts',
    en: {
          "title": "The Most Famous Retro Football Shirts in History | JerseyLab",
          "h1": "The retro shirts every fan knows",
          "description": "The shirts nobody forgets: Argentina 1986, the Netherlands 1988, Brazil 1998, Manchester United 1999 and more. The story behind them and where to get them.",
          "intro": "Some shirts are remembered for a single match. Here are a few of them, and why they are still wanted.",
          "sections": [
                {
                      "h2": "Argentina, 1986 World Cup",
                      "paragraphs": [
                            "The shirt Maradona wore in the quarter-final against England, the match of the Hand of God and the Goal of the Century. That year's sky blue and white stripes may be the most recognised design in the game's history."
                      ]
                },
                {
                      "h2": "The Netherlands, Euro 1988",
                      "paragraphs": [
                            "A geometric orange pattern that looks more like a painting than a piece of sportswear. Van Basten, the volley, the final against the Soviet Union. If you like design, this is the shirt."
                      ]
                },
                {
                      "h2": "Napoli 1987/88",
                      "paragraphs": [
                            "The sky blue of Napoli in the years Maradona turned a whole city into champions. You still see it on the streets there."
                      ]
                },
                {
                      "h2": "Brazil, 1998 and 2002",
                      "paragraphs": [
                            "The classic yellow, Ronaldo, Rivaldo and Ronaldinho. 2002 is the shirt of the fifth title."
                      ]
                },
                {
                      "h2": "Manchester United 1998/99",
                      "paragraphs": [
                            "The treble season: league, cup and Champions League, and that final against Bayern with two goals in stoppage time."
                      ]
                },
                {
                      "h2": "Barcelona 2005/06",
                      "paragraphs": [
                            "Ronaldinho at his peak, Iniesta, and a young Messi. The blaugrana stripes of the season the club returned to the top of Europe."
                      ]
                },
                {
                      "h2": "What makes a retro shirt wanted",
                      "paragraphs": [
                            "Not age. A shirt becomes wanted when something happened in it: a title, an unforgettable goal, or a design that was bold for its time. That is why designs from the 1990s are wanted more than ones from the 2010s."
                      ]
                }
          ],
          "links": [
                {
                      "to": "/collections/retro",
                      "label": "All retro shirts"
                },
                {
                      "to": "/request-shirt",
                      "label": "Looking for one we don't have?"
                }
          ]
    },
    title: 'חולצות הרטרו המפורסמות בהיסטוריה של הכדורגל | JerseyLab',
    h1: 'חולצות הרטרו שכל אוהד מכיר',
    description: 'החולצות שנחרטו בזיכרון: ארגנטינה 1986, הולנד 1988, ברזיל 1998, מנצ\'סטר יונייטד 1999 ועוד. מה הסיפור מאחוריהן ואיפה להשיג אותן.',
    intro: 'יש חולצות שזוכרים לפי משחק אחד. הנה כמה מהן, ולמה הן עדיין מבוקשות.',
    sections: [
      {
        h2: 'ארגנטינה, מונדיאל 1986',
        paragraphs: ['החולצה שמראדונה לבש ברבע הגמר מול אנגליה, במשחק של "יד אלוהים" ושל שער המאה. פסי התכלת והלבן של אותה שנה הם אולי הדגם המזוהה ביותר בתולדות המשחק.'],
      },
      {
        h2: 'הולנד, יורו 1988',
        paragraphs: ['דגם גיאומטרי כתום שנראה יותר כמו יצירת אמנות מאשר כמו בגד ספורט. ואן באסטן, חצי מספריים, הגמר מול ברית המועצות. מי שאוהב עיצוב, זו החולצה.'],
      },
      {
        h2: 'נאפולי 1987/88',
        paragraphs: ['התכלת של נאפולי בשנים שבהן מראדונה הפך עיר שלמה לאלופה. עד היום רואים אותה ברחובות העיר.'],
      },
      {
        h2: 'ברזיל, מונדיאל 1998 ו-2002',
        paragraphs: ['הצהוב הקלאסי, רונאלדו, ריברלדו ורונאלדיניו. 2002 היא החולצה של הזכייה החמישית.'],
      },
      {
        h2: 'מנצ\'סטר יונייטד 1998/99',
        paragraphs: ['העונה של השלושער: ליגה, גביע וליגת האלופות, והגמר ההוא מול באיירן עם שני שערים בדקות הפציעה.'],
      },
      {
        h2: 'ברצלונה 2005/06',
        paragraphs: ['רונאלדיניו בשיא, איניאסטה ומסי הצעיר. הפסים הבורדו-כחולים של העונה שבה המועדון חזר לפסגת אירופה.'],
      },
      {
        h2: 'מה הופך חולצה לרטרו מבוקשת',
        paragraphs: ['לא הגיל. חולצה נעשית מבוקשת כשקרה בה משהו: תואר, שער בלתי נשכח, או עיצוב שהיה נועז לזמנו. לכן דגמים משנות ה-90 מבוקשים יותר מדגמים משנות ה-2010.'],
      },
    ],
    links: [
      { to: '/collections/retro', label: 'כל חולצות הרטרו באתר' },
      { to: '/request-shirt', label: 'מחפשים חולצה שאין באתר?' },
    ],
  },

  {
    slug: 'gifts-for-football-fans',
    en: {
          "title": "A Gift for a Football Fan: 7 Ideas That Land | JerseyLab",
          "h1": "What to buy a football fan",
          "description": "What to buy a football fan for a birthday or a holiday: their club's shirt, a retro kit, personalised printing or a Mystery Box. Including what to do when you don't know their size.",
          "intro": "Buying a gift for a fan is easy when you know what they like, and hard when you don't. Here are the ideas that work, in order.",
          "sections": [
                {
                      "h2": "Seven ideas",
                      "list": [
                            "Their club's shirt for the current season. The safe choice.",
                            "A retro shirt from a season they remember. A 35-year-old United fan will take the 1999 shirt over this year's.",
                            "A shirt with their name on the back. Name and number printing is ₪10 and turns a shirt into something kept.",
                            "A national team shirt before a World Cup, for when you don't know which club they support.",
                            "A Mystery Box: you choose the style and size, the shirt is a surprise, and you can rule out teams in advance.",
                            "A shirt for a child with their own name on it. Children like their own name back there more than any player's.",
                            "A joint gift for a group of friends: one order, each shirt in its own size and name."
                      ]
                },
                {
                      "h2": "If you don't know their size",
                      "paragraphs": [
                            "This is the most common worry and it has a simple answer: the size guide has a calculator that suggests a size from height, weight, build and preferred fit. If you are still unsure, message us and we'll help."
                      ]
                },
                {
                      "h2": "What it costs",
                      "paragraphs": [
                            "A shirt is ₪70 to ₪80, name and number printing ₪10, and delivery ₪25 or free over ₪250."
                      ]
                }
          ],
          "links": [
                {
                      "to": "/mystery-box",
                      "label": "Mystery Box"
                },
                {
                      "to": "/size-guide",
                      "label": "Size guide"
                },
                {
                      "to": "/catalog",
                      "label": "All shirts"
                }
          ]
    },
    title: 'מתנה לאוהד כדורגל: 7 רעיונות שבאמת שמחים לקבל | JerseyLab',
    h1: 'מה קונים לאוהד כדורגל',
    description: 'מה קונים לאוהד כדורגל ליום הולדת או לחג: חולצה של הקבוצה, חולצת רטרו, הדפסת שם אישית או מיסטרי בוקס. כולל פתרון למי שלא יודע את המידה.',
    intro: 'לקנות מתנה לאוהד זה קל כשיודעים מה הוא אוהב, וקשה כשלא. הנה הרעיונות שעובדים, לפי סדר.',
    sections: [
      {
        h2: 'שבעה רעיונות',
        list: [
          'החולצה של הקבוצה שלו בעונה הנוכחית. הבחירה הבטוחה.',
          'חולצת רטרו של תקופה שהוא זוכר. אוהד מנצ\'סטר בן 35 יתרגש מחולצת 1999 יותר מאשר מהדגם החדש.',
          'חולצה עם השם שלו על הגב. הדפסת שם ומספר עולה ₪10 והופכת חולצה רגילה למשהו שנשמר.',
          'חולצת נבחרת לקראת מונדיאל, כשאתם לא בטוחים באיזה מועדון הוא תומך.',
          'מיסטרי בוקס: אתם בוחרים סגנון ומידה, החולצה יוצאת בהפתעה, ואפשר לסמן מראש קבוצות שלא לשלוח.',
          'חולצה לילד עם השם שלו. ילדים אוהבים לראות את השם שלהם מאחור יותר מכל שחקן.',
          'מתנה משותפת לקבוצת חברים: הזמנה אחת, כל חולצה במידה ובשם אחרים.',
        ],
      },
      {
        h2: 'ואם אתם לא יודעים את המידה',
        paragraphs: ['זו הדאגה הכי נפוצה, ויש לה פתרון פשוט: במדריך המידות יש מחשבון שממליץ על מידה לפי גובה, משקל, מבנה גוף וגזרה מועדפת. אם עדיין לא בטוחים, כתבו לנו ונעזור.'],
      },
      {
        h2: 'כמה זה עולה',
        paragraphs: ['חולצה עולה ₪70 עד ₪80, הדפסת שם ומספר ₪10, ומשלוח ₪25 או חינם מעל ₪250.'],
      },
    ],
    links: [
      { to: '/mystery-box', label: 'מיסטרי בוקס' },
      { to: '/size-guide', label: 'מדריך מידות' },
      { to: '/catalog', label: 'לכל החולצות' },
    ],
  },
  {
    slug: 'washing-a-football-shirt',
    en: {
      title: 'How to Wash a Football Shirt Without Ruining the Print | JerseyLab',
      h1: 'How to wash a football shirt',
      description: 'How to wash a football shirt so the name, number and crest survive: temperature, inside out, no tumble dryer, no fabric softener, no ironing over the print.',
      intro: 'A printed shirt does not fade in the wash. It cracks, and almost always for the same four reasons. Get those right and the print outlives the season.',
      sections: [
        {
          h2: 'Inside out, always',
          paragraphs: ['The print and the crest are on the outside, so turning the shirt inside out puts the fabric between them and everything else in the drum. This is the single habit that matters most, and it costs nothing.'],
        },
        {
          h2: 'Cold, and gentle',
          paragraphs: ['Wash at 30°C at most, on a delicate or sports cycle. Heat is what lifts a heat-pressed number off the fabric; there is nothing on a football shirt that needs hot water to come clean.'],
        },
        {
          h2: 'No fabric softener',
          paragraphs: ['Softener coats the fibres, and the fibres of a football shirt are meant to move air and moisture through them. It dulls the colour, it hurts the fabric, and on a printed shirt it works its way under the edges of the print.'],
        },
        {
          h2: 'Air dry, never a tumble dryer',
          paragraphs: ['A dryer is heat and tumbling together, which is exactly the combination a print cannot take. Hang the shirt in the shade - direct sun fades colour on its own - and it dries in a couple of hours, because the fabric is built to.'],
        },
        {
          h2: 'If you iron, never over the print',
          paragraphs: ['Iron the shirt inside out, on low, and keep the iron off the print, the numbers and the crest entirely. In practice a shirt hung to dry properly does not need ironing at all.'],
        },
        {
          h2: 'Stains and sweat',
          paragraphs: ['Deal with a stain the same day with cold water and a little mild detergent, rubbed in with your fingers rather than scrubbed. For a sweat smell, half an hour in cold water with a splash of white vinegar before the wash does more than any amount of detergent.'],
        },
      ],
      links: [
        { to: '/catalog', label: 'All shirts' },
        { to: '/size-guide', label: 'Size guide' },
      ],
    },
    title: 'איך מכבסים חולצת כדורגל בלי להרוס את ההדפסה | JerseyLab',
    h1: 'איך מכבסים חולצת כדורגל',
    description: 'איך לכבס חולצת כדורגל כדי שהשם, המספר והסמל ישרדו: טמפרטורה, כביסה הפוכה, בלי מייבש, בלי מרכך ובלי גיהוץ על ההדפסה.',
    intro: 'חולצה מודפסת לא דוהה בכביסה. היא נסדקת, וכמעט תמיד מאותן ארבע סיבות. אם עושים אותן נכון, ההדפסה שורדת הרבה מעבר לעונה.',
    sections: [
      {
        h2: 'הפוך על הפוך, תמיד',
        paragraphs: ['ההדפסה והסמל נמצאים בחוץ, אז כביסה כשהחולצה הפוכה שמה את הבד בין ההדפסה לכל השאר בתוף. זה ההרגל הכי משמעותי מכולם, והוא לא עולה כלום.'],
      },
      {
        h2: 'קר, ועדין',
        paragraphs: ['עד 30 מעלות, בתוכנית עדינה או ספורט. חום הוא מה שמרים מספר מודבק מהבד, ואין שום דבר בחולצת כדורגל שצריך מים חמים כדי להתנקות.'],
      },
      {
        h2: 'בלי מרכך כביסה',
        paragraphs: ['מרכך מצפה את הסיבים, והסיבים של חולצת כדורגל אמורים להעביר דרכם אוויר ולחות. הוא מעמעם את הצבע, פוגע בבד, ובחולצה מודפסת הוא נכנס מתחת לקצוות ההדפסה.'],
      },
      {
        h2: 'לייבש באוויר, אף פעם לא במייבש',
        paragraphs: ['מייבש הוא חום וסיבוב ביחד, בדיוק הצירוף שהדפסה לא עומדת בו. תולים בצל - שמש ישירה מדהה צבע בפני עצמה - והחולצה מתייבשת בשעתיים, כי הבד בנוי לזה.'],
      },
      {
        h2: 'ואם מגהצים, אף פעם לא על ההדפסה',
        paragraphs: ['מגהצים כשהחולצה הפוכה, בחום נמוך, ולא מתקרבים עם המגהץ להדפסה, למספרים ולסמל. בפועל, חולצה שנתלתה כמו שצריך לא צריכה גיהוץ בכלל.'],
      },
      {
        h2: 'כתמים וריח זיעה',
        paragraphs: ['מטפלים בכתם באותו יום, במים קרים ומעט סבון עדין, משפשפים באצבעות ולא בכוח. לריח זיעה, חצי שעה במים קרים עם קצת חומץ לבן לפני הכביסה עושה יותר מכל כמות של אבקה.'],
      },
    ],
    links: [
      { to: '/catalog', label: 'לכל החולצות' },
      { to: '/size-guide', label: 'מדריך מידות' },
    ],
  },
  {
    slug: 'home-away-third',
    en: {
      title: 'Home, Away, Third and Fourth: What the Kits Mean | JerseyLab',
      h1: 'Home, away, third - what the difference is',
      description: 'What home, away, third and fourth kits are, why clubs have several, and which one to buy. The rule behind the colours, in plain words.',
      intro: 'A club puts out three or four shirts a season and they are not the same thing dressed differently. Each one exists for a reason, and knowing the reason makes choosing easy.',
      sections: [
        {
          h2: 'Home: the colours everyone knows',
          paragraphs: ['The home kit is the club in its own colours - the red of Liverpool, the stripes of Atletico, the white of Real Madrid. It changes the least from season to season, it is what people picture when they picture the club, and it is the safest shirt to buy for someone else.'],
        },
        {
          h2: 'Away: for when the colours clash',
          paragraphs: ['Two teams cannot play in colours a referee or a viewer might confuse, so the visiting side changes. That is the whole origin of the away kit, and because it is not tied to the club\'s own colours it is where designers take the most liberty. Away shirts are often the more interesting design of the two.'],
        },
        {
          h2: 'Third: for when away clashes too',
          paragraphs: ['A third kit exists for the nights when neither home nor away works - most often in Europe, against a side whose colours happen to catch both. It is made in smaller numbers, it is usually the boldest design of the season, and that combination is why collectors go for it.'],
        },
        {
          h2: 'Fourth and special editions',
          paragraphs: ['Some clubs add a fourth shirt, or a one-off for an anniversary or a cup final. PSG\'s Jordan collaboration is the best-known example. These are the shirts that are hardest to find a season later, which is exactly why they are worth having.'],
        },
        {
          h2: 'So which one do you buy?',
          paragraphs: ['If it is a gift and you are not sure, buy the home shirt. If it is for yourself and you already own the home shirt, the third is usually the one you will enjoy wearing most. And if you want the design people will ask you about, look at the special editions.'],
        },
      ],
      links: [
        { to: '/catalog', label: 'All shirts' },
        { to: '/collections/retro', label: 'Retro shirts' },
      ],
    },
    title: 'בית, חוץ, שלישית ורביעית: מה ההבדל בין הסטים | JerseyLab',
    h1: 'בית, חוץ, שלישית - מה ההבדל',
    description: 'מה זה חולצת בית, חוץ, שלישית ורביעית, למה לכל קבוצה יש כמה סטים, ואיזו חולצה כדאי לקנות. הכלל שמאחורי הצבעים, במילים פשוטות.',
    intro: 'קבוצה מוציאה שלוש או ארבע חולצות בעונה, והן לא אותו דבר בצבע אחר. לכל אחת יש סיבה קיום, וברגע שמכירים אותה הבחירה נעשית קלה.',
    sections: [
      {
        h2: 'בית: הצבעים שכולם מכירים',
        paragraphs: ['חולצת הבית היא הקבוצה בצבעים של עצמה - האדום של ליברפול, הפסים של אתלטיקו, הלבן של ריאל מדריד. היא משתנה הכי מעט בין עונות, היא מה שאנשים מדמיינים כשהם חושבים על הקבוצה, והיא החולצה הבטוחה ביותר לקנות במתנה.'],
      },
      {
        h2: 'חוץ: בשביל כשהצבעים מתנגשים',
        paragraphs: ['שתי קבוצות לא יכולות לשחק בצבעים שהשופט או הצופה עלולים לבלבל ביניהם, אז האורחת מחליפה. זה כל המקור של חולצת החוץ, ובגלל שהיא לא כבולה לצבעי הקבוצה, שם המעצבים לוקחים לעצמם הכי הרבה חופש. לא פעם דווקא חולצת החוץ היא העיצוב המעניין מבין השתיים.'],
      },
      {
        h2: 'שלישית: בשביל כשגם החוץ מתנגשת',
        paragraphs: ['החולצה השלישית קיימת לערבים שבהם לא הבית ולא החוץ עובדות - לרוב באירופה, מול קבוצה שהצבעים שלה במקרה תופסים את שתיהן. היא מיוצרת בכמויות קטנות יותר, היא בדרך כלל העיצוב הכי נועז של העונה, והצירוף הזה הוא הסיבה שאספנים רודפים אחריה.'],
      },
      {
        h2: 'רביעית ומהדורות מיוחדות',
        paragraphs: ['יש קבוצות שמוסיפות חולצה רביעית, או חולצה חד-פעמית ליובל או לגמר. שיתוף הפעולה של פריז סן זרמן עם ג\'ורדן הוא הדוגמה המוכרת. אלה החולצות שהכי קשה להשיג עונה אחרי, וזו בדיוק הסיבה שכדאי לתפוס אותן.'],
      },
      {
        h2: 'אז איזו לקנות?',
        paragraphs: ['אם זו מתנה ואתם לא בטוחים, קנו את חולצת הבית. אם זו חולצה לעצמכם וכבר יש לכם את הבית, השלישית היא בדרך כלל זו שתהנו ללבוש הכי הרבה. ואם אתם רוצים את העיצוב שישאלו אתכם עליו ברחוב, חפשו את המהדורות המיוחדות.'],
      },
    ],
    links: [
      { to: '/catalog', label: 'לכל החולצות' },
      { to: '/collections/retro', label: 'חולצות רטרו' },
    ],
  },
  {
    slug: 'kids-football-shirt',
    en: {
      title: "Buying a Football Shirt for a Child: Size, Fit and What Not to Do | JerseyLab",
      h1: 'Buying a football shirt for a child',
      description: "How to choose a kids football shirt size by height rather than age, whether to size up, and why the name on the back matters more than the player's.",
      intro: 'Kids shirts are sized by numbers - 14, 16, 18 and up - and the numbers mean height, not age. That one fact solves most of the guesswork.',
      sections: [
        {
          h2: 'Go by height, not age',
          paragraphs: ['The size number matches the height the shirt is cut for: a 22 is made for a child of 125 to 135 cm. Ages on a chart are an average and children are not averages, so measure the child against a wall and use that. It takes a minute and it is the difference between a shirt that fits and a shirt in a drawer.'],
        },
        {
          h2: 'How much room to leave',
          paragraphs: ['One size up is sensible if the child is between two sizes or mid-growth-spurt. Two sizes up is not: a shirt that reaches the knees is not a shirt a child wants to wear, and by the time it fits, the season it belongs to is over.'],
        },
        {
          h2: 'It comes as a set',
          paragraphs: ['A kids kit is the shirt and matching shorts together, in the same size, for one price. That is how kids kits are made, and it is what a child expects to open.'],
        },
        {
          h2: 'Put their name on it, not a star\'s',
          paragraphs: ['A child with their own name and number on the back wears that shirt until it falls apart. A shirt with a famous player\'s name is a shirt they grow out of the moment the player transfers. The printing is free on our kids kits, so there is no reason not to.'],
        },
        {
          h2: 'What it costs',
          paragraphs: ['A kids kit is ₪100 - shirt and shorts, with the name and number included. Made to order, arriving within about three weeks.'],
        },
      ],
      links: [
        { to: '/size-guide', label: 'Size guide' },
        { to: '/catalog', label: 'All shirts' },
      ],
    },
    title: 'חולצת כדורגל לילד: איך בוחרים מידה ומה לא לעשות | JerseyLab',
    h1: 'חולצת כדורגל לילד',
    description: 'איך בוחרים מידת חולצת כדורגל לילד לפי גובה ולא לפי גיל, האם לקחת מידה גדולה יותר, ולמה השם של הילד על הגב שווה יותר מהשם של שחקן.',
    intro: 'מידות ילדים מסומנות במספרים - 14, 16, 18 והלאה - והמספרים האלה מציינים גובה, לא גיל. העובדה הזאת לבדה פותרת את רוב הניחושים.',
    sections: [
      {
        h2: 'הולכים לפי גובה, לא לפי גיל',
        paragraphs: ['מספר המידה תואם לגובה שהחולצה נתפרה לו: מידה 22 נעשית לילד בגובה 125 עד 135 ס"מ. הגילאים בטבלה הם ממוצע, וילדים הם לא ממוצע, אז מודדים את הילד ליד הקיר והולכים לפי זה. זה לוקח דקה, וזה ההבדל בין חולצה שמתאימה לחולצה שנשארת במגירה.'],
      },
      {
        h2: 'כמה מקום להשאיר',
        paragraphs: ['מידה אחת גדולה יותר היא הגיונית אם הילד בין שתי מידות או באמצע קפיצת גדילה. שתי מידות גדולות - לא: חולצה שמגיעה לברכיים היא לא חולצה שילד רוצה ללבוש, וכשהיא כבר תתאים, העונה שלה כבר תהיה מאחורינו.'],
      },
      {
        h2: 'זה מגיע כסט',
        paragraphs: ['סט ילדים הוא חולצה ומכנס קצר תואם יחד, באותה מידה, במחיר אחד. ככה סטים לילדים מיוצרים, וזה גם מה שילד מצפה לפתוח.'],
      },
      {
        h2: 'שימו את השם שלו, לא של כוכב',
        paragraphs: ['ילד עם השם והמספר שלו על הגב לובש את החולצה הזאת עד שהיא נגמרת. חולצה עם שם של שחקן מפורסם היא חולצה שהוא מתבייש בה ברגע שהשחקן עובר קבוצה. ההדפסה על סטים לילדים אצלנו בחינם, אז אין סיבה לא.'],
      },
      {
        h2: 'כמה זה עולה',
        paragraphs: ['סט ילדים עולה ₪100 - חולצה ומכנס, כולל שם ומספר. הזמנה מיוחדת שמגיעה תוך כשלושה שבועות.'],
      },
    ],
    links: [
      { to: '/size-guide', label: 'מדריך מידות' },
      { to: '/catalog', label: 'לכל החולצות' },
    ],
  },
];

// The guide in the site's language. Every guide is written in both, so the
// English site is a real translation rather than Hebrew under an English
// address.
export const localizeGuide = (guide, en) => (guide && en && guide.en ? { ...guide, ...guide.en } : guide);

export const findGuide = (slug) => GUIDES.find(g => g.slug === slug) || null;

// The plain text of a guide, for the prerendered markup and for anything that
// needs the article without its layout.
export const guideText = (guide) => [
  guide.intro,
  ...guide.sections.flatMap(s => [s.h2, ...(s.paragraphs || []), ...(s.list || [])]),
].join('\n');
