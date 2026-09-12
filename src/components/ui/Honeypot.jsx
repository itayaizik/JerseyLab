import React from 'react';

// Bot trap for the forms anyone can submit.
//
// The contact form and the shirt-request form insert straight into the database
// without an account, because requiring one would lose the customers those
// forms exist for. That means the only thing standing between them and a script
// is how much effort a spammer wants to spend.
//
// This is the cheap half of the answer: a field that is invisible and
// unreachable to a person, but that naive bots fill in because it looks like a
// normal input. A submission that carries a value here is discarded. It stops
// commodity spam, not a targeted attacker — see the note in the security
// section of the report for the rest.
//
// Hidden with CSS rather than `type="hidden"`, because bots skip hidden inputs
// but fill styled ones. `tabIndex={-1}` and `aria-hidden` keep it out of the
// way of keyboard and screen-reader users.
//
// Hidden by clipping, not by `left: -9999px`. The offset version pushed the
// document 8,874px wide and gave both forms a horizontal scrollbar; clipping
// takes the field out of view without it occupying any space at all.
const HIDDEN = {
  position: 'absolute',
  width: 1,
  height: 1,
  padding: 0,
  margin: -1,
  overflow: 'hidden',
  clip: 'rect(0 0 0 0)',
  clipPath: 'inset(50%)',
  whiteSpace: 'nowrap',
  border: 0,
};

export const HONEYPOT_NAME = 'company_website';

export default function Honeypot({ value, onChange }) {
  return (
    <div aria-hidden="true" style={HIDDEN}>
      <label htmlFor={HONEYPOT_NAME}>אל תמלא שדה זה</label>
      <input
        id={HONEYPOT_NAME}
        name={HONEYPOT_NAME}
        type="text"
        tabIndex={-1}
        autoComplete="off"
        value={value}
        onChange={e => onChange(e.target.value)}
      />
    </div>
  );
}

// True when the submission looks automated.
export function isBot(value) {
  return typeof value === 'string' && value.trim().length > 0;
}
