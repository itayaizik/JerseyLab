// Personalization tips - based on actual shirt data, never invented

export function getShirtTypeTip() {
  return 'גרסת שחקן מגיעה עם בד דק ונושם וגזרה צמודה יותר - כמו שהשחקנים לובשים במגרש.';
}

export function getPersonalizationTip(shirt) {
  if (shirt.is_retro) return 'חולצת רטרו - הדפסת שם ומספר תוסיף לה את האותנטיות של התקופה.';
  if (shirt.is_rare) return 'פריט נדיר - בלי הדפסה הוא נשמר נקי וקלאסי.';
  return 'בלי שם ומספר זו חולצה קלאסית ונקייה - אבל אפשר גם להתאים אישית.';
}

export function calcTotal(basePrice, shirtType, addName) {
  return basePrice + (shirtType === 'player' ? 20 : 0) + (addName === 'yes' ? 15 : 0);
}