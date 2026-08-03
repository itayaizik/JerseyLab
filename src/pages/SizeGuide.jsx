import React, { useState } from 'react';
import { Ruler, Info } from 'lucide-react';
import Seo from '@/components/Seo';

// FAN VERSION — columns: S, M, L, XL, 2XL, 3XL
const fanRows = [
  { measure: 'אורך (ס"מ)', S: '69-71',   M: '71-73',   L: '73-75',  XL: '75-78',  '2XL': '78-81',  '3XL': '81-83' },
  { measure: 'רוחב (ס"מ)', S: '53-55',   M: '55-57',   L: '57-58',  XL: '58-60',  '2XL': '60-62',  '3XL': '62-64' },
  { measure: 'גובה (ס"מ)', S: '162-170', M: '170-176', L: '175-182', XL: '182-190', '2XL': '192-197', '3XL': '197-200' },
  { measure: 'משקל (ק"ג)', S: '50-62',   M: '62-70',   L: '70-83',  XL: '83-90',  '2XL': '90-97',  '3XL': '97-104' },
];

// PLAYER VERSION — columns: S, M, L, XL, 2XL, 3XL
const playerRows = [
  { measure: 'אורך (ס"מ)', S: '67-69',   M: '69-71',   L: '71-73',  XL: '75-76',  '2XL': '76-78',  '3XL': '78-79' },
  { measure: 'רוחב (ס"מ)', S: '49-51',   M: '51-53',   L: '53-55',  XL: '55-57',  '2XL': '57-60',  '3XL': '60-63' },
  { measure: 'גובה (ס"מ)', S: '162-170', M: '170-176', L: '175-180', XL: '180-185', '2XL': '185-190', '3XL': '190-195' },
  { measure: 'משקל (ק"ג)', S: '50-62',   M: '62-75',   L: '75-80',  XL: '80-85',  '2XL': '85-90',  '3XL': '90-95' },
];

// WOMEN'S VERSION — columns: S, M, L, XL
const womenRows = [
  { measure: 'אורך (ס"מ)', S: '61-63',   M: '63-66', L: '66-69',   XL: '69-71' },
  { measure: 'רוחב (ס"מ)', S: '40-41',   M: '41-44', L: '44-47',   XL: '47-50' },
  { measure: 'גובה (ס"מ)', S: '150-160', M: '160-165', L: '165-170', XL: '170-175' },
];

const adultSizes = ['S', 'M', 'L', 'XL', '2XL', '3XL'];
const womenSizes = ['S', 'M', 'L', 'XL'];

// KIDS VERSION — rows per size, columns: HEIGHT, AGE, LENGTH, WIDTH, WAIST
const kidsRows = [
  { size: '14', height: '85-95',   age: '2-3',   length: '41', width: '33', waist: '19-36' },
  { size: '16', height: '95-105',  age: '3-4',   length: '44', width: '35', waist: '20-37' },
  { size: '18', height: '105-115', age: '4-5',   length: '47', width: '37', waist: '21-39' },
  { size: '20', height: '115-125', age: '5-6',   length: '50', width: '39', waist: '22-41' },
  { size: '22', height: '125-135', age: '6-7',   length: '53', width: '41', waist: '23-42' },
  { size: '24', height: '135-145', age: '8-9',   length: '56', width: '43', waist: '24-44' },
  { size: '26', height: '145-155', age: '10-11', length: '59', width: '45', waist: '25-47' },
  { size: '28', height: '155-165', age: '11-12', length: '62', width: '47', waist: '26-50' },
];

// Measurement-rows table (FAN / PLAYER / WOMEN) — first column = measure name
function MeasureTable({ rows, sizes }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-2 border-[#1B2A4A]">
        <thead>
          <tr className="bg-[#1B2A4A] text-white">
            <th className="px-3 py-3 text-right font-heading uppercase tracking-wide text-xs">מידה</th>
            {sizes.map(s => (
              <th key={s} className="px-3 py-3 text-center font-heading uppercase tracking-wide text-xs">{s}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={row.measure} className={i % 2 === 0 ? 'bg-white' : 'bg-[#F2ECD9]'}>
              <td className="px-3 py-3 font-bold text-[#E8622A] border-b border-[#1B2A4A]/10">{row.measure}</td>
              {sizes.map(s => (
                <td key={s} className="px-3 py-3 font-mono text-center text-[#1B2A4A] border-b border-[#1B2A4A]/10">{row[s]}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Size-rows table (KIDS) — first column = size number
function KidsTable({ data }) {
  const cols = [
    { key: 'size', label: 'מידה' },
    { key: 'height', label: 'גובה (ס"מ)' },
    { key: 'age', label: 'גיל' },
    { key: 'length', label: 'אורך (ס"מ)' },
    { key: 'width', label: 'רוחב (ס"מ)' },
    { key: 'waist', label: 'היקף מותן (ס"מ)' },
  ];
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-2 border-[#1B2A4A]">
        <thead>
          <tr className="bg-[#1B2A4A] text-white">
            {cols.map(c => (
              <th key={c.key} className="px-3 py-3 text-center font-heading uppercase tracking-wide text-xs">{c.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={row.size} className={i % 2 === 0 ? 'bg-white' : 'bg-[#F2ECD9]'}>
              {cols.map((c, ci) => (
                <td key={c.key} className={`px-3 py-3 font-mono text-center border-b border-[#1B2A4A]/10 ${ci === 0 ? 'font-bold text-[#E8622A]' : 'text-[#1B2A4A]'}`}>
                  {row[c.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const tips = [
  'מודדים אורך מהכתף ועד קצה החולצה בצד האחורי',
  'רוחב נמדד מבית שחי לבית שחי (מתחת לבית השחי)',
  'גובה ומשקל מתארים טווח מומלץ לבחירת המידה',
  'בין שתי מידות? תמיד עדיף לקחת את הגדולה יותר',
  'מידות עשויות להשתנות בין יצרנים — פנה אלינו לאישור',
];

const TABS = [
  { key: 'fan', label: 'אוהד' },
  { key: 'player', label: 'גרסת שחקן' },
  { key: 'women', label: 'נשים' },
  { key: 'kids', label: 'ילדים' },
];

export default function SizeGuide() {
  const [tab, setTab] = useState('fan');

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <Seo title="מדריך מידות — JerseyLab" description="מדריך מידות לחולצות כדורגל: טבלאות מידות לאוהד, גרסת שחקן, נשים וילדים. איך לבחור את המידה הנכונה לפי מידות הגוף." canonicalPath="/size-guide" jsonLd={{ "@context": "https://schema.org", "@type": "WebPage", name: "מדריך מידות — JerseyLab", description: "מדריך מידות לחולצות כדורגל וטבלאות מידה.", url: (typeof window !== "undefined" ? window.location.origin : "https://jerseylabil.base44.app") + "/size-guide", inLanguage: "he-IL" }} />

      {/* Header */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center w-16 h-16 mb-4 bg-[#E8622A]"
          style={{ border: '2px solid #1B2A4A', boxShadow: '4px 4px 0 #1B2A4A' }}>
          <Ruler className="w-8 h-8 text-white" />
        </div>
        <div className="inline-block mb-3">
          <div className="bg-[#FFD95A]/60 px-4 py-1 text-xs font-heading tracking-widest text-[#1B2A4A] uppercase"
            style={{ transform: 'rotate(-1deg)' }}>
            מדריך רכישה
          </div>
        </div>
        <h1 className="font-heading font-black text-4xl text-[#1B2A4A] uppercase mb-2" style={{ textShadow: '2px 2px 6px rgba(27,42,74,0.15)' }}>מדריך מידות</h1>
        <p className="text-[#1B2A4A]/60 font-body text-sm">בחר את המידה המושלמת לפי הטבלה</p>
      </div>

      {/* Tabs */}
      <div className="flex mb-6 border-2 border-[#1B2A4A]" style={{ boxShadow: '3px 3px 0 #1B2A4A' }}>
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex-1 py-3 text-xs sm:text-sm font-heading font-bold uppercase tracking-wide transition-all duration-200 hover:-translate-y-0.5 ${tab === t.key ? 'bg-[#1B2A4A] text-white' : 'bg-white text-[#1B2A4A] hover:bg-[#F2ECD9]'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="mb-8" style={{ boxShadow: '3px 3px 0 #1B2A4A' }}>
        {tab === 'fan' && <MeasureTable rows={fanRows} sizes={adultSizes} />}
        {tab === 'player' && <MeasureTable rows={playerRows} sizes={adultSizes} />}
        {tab === 'women' && <MeasureTable rows={womenRows} sizes={womenSizes} />}
        {tab === 'kids' && <KidsTable data={kidsRows} />}
      </div>

      {/* How to measure */}
      <div className="bg-white p-6" style={{ border: '2px solid #1B2A4A', boxShadow: '3px 3px 0 #E8622A' }}>
        <div className="flex items-center gap-2 mb-4">
          <Info className="w-5 h-5 text-[#E8622A]" />
          <h3 className="font-heading font-bold text-sm text-[#1B2A4A] uppercase tracking-wide">איך מודדים נכון?</h3>
        </div>
        <ul className="space-y-3">
          {tips.map((tip, i) => (
            <li key={i} className="flex items-start gap-3 text-sm font-body text-[#1B2A4A]/80">
              <span className="flex-shrink-0 w-5 h-5 bg-[#E8622A] text-white text-xs font-mono font-bold flex items-center justify-center mt-0.5">
                {i + 1}
              </span>
              {tip}
            </li>
          ))}
        </ul>
      </div>

      {/* Contact CTA */}
      <div className="mt-8 text-center bg-[#1B2A4A] py-6 px-4" style={{ border: '2px solid #1B2A4A', boxShadow: '3px 3px 0 #E8622A' }}>
        <p className="text-white/80 text-sm font-body mb-3">לא בטוח באיזו מידה לבחור?</p>
        <a href="/contact"
          className="inline-block bg-[#E8622A] text-white font-heading font-bold text-sm px-6 py-2.5 uppercase tracking-wider hover:bg-[#D0551F] hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200"
          style={{ boxShadow: '2px 2px 0 rgba(255,255,255,0.2)', textShadow: '1px 1px 3px rgba(0,0,0,0.2)' }}>
          צור קשר
        </a>
      </div>
    </div>
  );
}