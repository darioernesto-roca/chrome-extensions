// Injected on demand. Detects what each visible form field expects (name,
// email, address, card…) and fills it with one consistent fake person.
// Wrapped in a function so it can be injected many times on the same page.
// The last expression is the number of fields filled, which is returned to
// the service worker.
(() => {
  // ---------- Fake data ----------

  const FIRST_NAMES = ['James', 'Maria', 'David', 'Sofia', 'Daniel', 'Laura', 'Carlos', 'Emma', 'Lucas', 'Valentina', 'Andres', 'Olivia', 'Mateo', 'Camila', 'Ethan', 'Isabella'];
  const LAST_NAMES = ['Smith', 'Garcia', 'Johnson', 'Martinez', 'Brown', 'Rodriguez', 'Miller', 'Lopez', 'Davis', 'Gonzalez', 'Wilson', 'Hernandez', 'Taylor', 'Ramirez'];
  const STREETS = ['Maple Street', 'Oak Avenue', 'Pine Road', 'Cedar Lane', 'Elm Street', 'Sunset Boulevard', 'Lakeview Drive', 'Hillcrest Road'];
  const PLACES = [
    { city: 'Austin', state: 'Texas', stateCode: 'TX', zip: '78701', area: '512' },
    { city: 'Denver', state: 'Colorado', stateCode: 'CO', zip: '80202', area: '303' },
    { city: 'Seattle', state: 'Washington', stateCode: 'WA', zip: '98101', area: '206' },
    { city: 'Miami', state: 'Florida', stateCode: 'FL', zip: '33130', area: '305' },
    { city: 'Chicago', state: 'Illinois', stateCode: 'IL', zip: '60601', area: '312' },
    { city: 'Portland', state: 'Oregon', stateCode: 'OR', zip: '97205', area: '503' }
  ];
  const COMPANIES = ['Acme Corp', 'Globex Inc', 'Initech', 'Northwind Traders', 'Contoso Ltd', 'Fabrikam'];
  const JOB_TITLES = ['Software Engineer', 'Product Manager', 'Designer', 'QA Analyst', 'Marketing Lead'];
  const LOREM = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.';
  const PASSWORD = 'Passw0rd!Test';

  const pick = (list) => list[Math.floor(Math.random() * list.length)];
  const randInt = (min, max) => min + Math.floor(Math.random() * (max - min + 1));
  const pad = (n) => String(n).padStart(2, '0');
  const isoDate = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

  function makePerson() {
    const first = pick(FIRST_NAMES);
    const last = pick(LAST_NAMES);
    const place = pick(PLACES);
    const tag = randInt(1000, 9999);
    const birth = new Date(randInt(1970, 2000), randInt(0, 11), randInt(1, 28));
    const expYear = new Date().getFullYear() + 3;
    const soon = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
    return {
      first,
      last,
      full: `${first} ${last}`,
      // example.com is reserved for testing, so no real inbox ever receives mail.
      email: `${first}.${last}.${tag}@example.com`.toLowerCase(),
      username: `${first}${last}${tag}`.toLowerCase(),
      password: PASSWORD,
      // 555-01xx numbers are reserved for fictional use in North America.
      phone: `${place.area}-555-01${pad(randInt(0, 99))}`,
      street: `${randInt(100, 9999)} ${pick(STREETS)}`,
      line2: `Apt ${randInt(1, 40)}`,
      city: place.city,
      state: place.state,
      stateCode: place.stateCode,
      zip: place.zip,
      country: 'United States',
      company: pick(COMPANIES),
      jobTitle: pick(JOB_TITLES),
      website: 'https://example.com',
      birthdate: isoDate(birth),
      age: String(new Date().getFullYear() - birth.getFullYear()),
      futureDate: isoDate(soon),
      // Stripe's public test card; it can't be charged anywhere.
      cardName: `${first} ${last}`,
      cardNumber: '4242424242424242',
      cardExpMonth: '12',
      cardExpYear: String(expYear),
      cardExp: `12/${String(expYear).slice(-2)}`,
      cardCvc: '123',
      text: LOREM,
      shortText: 'Test value'
    };
  }

  // ---------- Field detection ----------

  // Standard autocomplete tokens are the most reliable signal.
  const AUTOCOMPLETE = {
    'given-name': 'first', 'family-name': 'last', 'name': 'full', 'email': 'email',
    'username': 'username', 'new-password': 'password', 'current-password': 'password',
    'tel': 'phone', 'tel-national': 'phone', 'street-address': 'street', 'address-line1': 'street',
    'address-line2': 'line2', 'address-level2': 'city', 'address-level1': 'state',
    'postal-code': 'zip', 'country': 'country', 'country-name': 'country',
    'organization': 'company', 'organization-title': 'jobTitle', 'bday': 'birthdate',
    'cc-name': 'cardName', 'cc-number': 'cardNumber', 'cc-exp': 'cardExp',
    'cc-exp-month': 'cardExpMonth', 'cc-exp-year': 'cardExpYear', 'cc-csc': 'cardCvc', 'url': 'website'
  };

  // Otherwise, match words from the field's name, id, placeholder and label.
  // Order matters: more specific patterns come first.
  const PATTERNS = [
    [/\b(search|query|q|coupon|promo|discount|captcha|otp|verification code)\b/, 'skip'],
    [/e ?mail|correo/, 'email'],
    [/pass ?word|\bpwd\b|contrase/, 'password'],
    [/user ?name|\blogin\b|\bhandle\b|usuario/, 'username'],
    [/card ?holder|name on card|cc ?name/, 'cardName'],
    [/card ?(num|no)|cc ?num|credit ?card|card ?number/, 'cardNumber'],
    [/\b(cvc|cvv|csc|cvn)\b|security ?code/, 'cardCvc'],
    [/exp\w* ?(month|mm)\b|cc ?month/, 'cardExpMonth'],
    [/exp\w* ?(year|yy|yyyy)\b|cc ?year/, 'cardExpYear'],
    [/expir|exp ?date|mm ?\/? ?yy/, 'cardExp'],
    [/first ?name|given ?name|\bfname\b|\bnombre\b/, 'first'],
    [/last ?name|family ?name|surname|\blname\b|apellido/, 'last'],
    [/company|organi[sz]ation|business|empresa/, 'company'],
    [/\bjob\b|position|occupation|cargo/, 'jobTitle'],
    [/full ?name|your ?name|\bname\b/, 'full'],
    [/phone|mobile|\btel\b|\bcell\b|telefono|celular/, 'phone'],
    [/address ?(line)? ?2|\bapt\b|suite|apartment/, 'line2'],
    [/address|street|\baddr\b|direcci/, 'street'],
    [/\bcity\b|\btown\b|locality|ciudad/, 'city'],
    [/\bstate\b|province|region|county|departamento/, 'state'],
    [/\bzip\b|postal|post ?code/, 'zip'],
    [/country|\bpais\b/, 'country'],
    [/birth|\bdob\b|bday|nacimiento/, 'birthdate'],
    [/\bage\b|edad/, 'age'],
    [/website|\burl\b|homepage/, 'website'],
    [/message|comment|note|description|\bbio\b|about|mensaje/, 'text']
  ];

  const normalize = (s) => String(s || '')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .toLowerCase()
    .replace(/[_\-[\].:*]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  function labelText(el) {
    const parts = [];
    if (el.labels) for (const label of el.labels) parts.push(label.textContent);
    const labelledBy = el.getAttribute('aria-labelledby');
    if (labelledBy) {
      for (const id of labelledBy.split(/\s+/)) {
        const ref = document.getElementById(id);
        if (ref) parts.push(ref.textContent);
      }
    }
    return parts.join(' ');
  }

  function hintOf(el) {
    return [el.name, el.id, el.getAttribute('placeholder'), el.getAttribute('aria-label'), labelText(el)]
      .map(normalize)
      .filter(Boolean)
      .join(' | ');
  }

  function classify(el) {
    const tokens = (el.getAttribute('autocomplete') || '').toLowerCase().split(/\s+/);
    if (tokens.includes('off') === false) {
      if (tokens.includes('one-time-code')) return 'skip';
      for (const token of tokens) if (AUTOCOMPLETE[token]) return AUTOCOMPLETE[token];
    }

    const hint = hintOf(el);
    const type = (el.type || '').toLowerCase();

    if (type === 'email') return 'email';
    if (type === 'password') return 'password';
    if (type === 'tel') return 'phone';
    if (type === 'url') return 'website';
    if (type === 'date') return /birth|dob|bday|nacimiento/.test(hint) ? 'birthdate' : 'futureDate';

    for (const [pattern, kind] of PATTERNS) if (pattern.test(hint)) return kind;

    if (el instanceof HTMLTextAreaElement) return 'text';
    if (type === 'number') return 'number';
    return 'shortText';
  }

  // ---------- Filling ----------

  const SKIPPED_TYPES = new Set(['hidden', 'submit', 'button', 'reset', 'image', 'file', 'color', 'range', 'search', 'week']);

  function isFillable(el) {
    if (el.disabled || el.readOnly) return false;
    if (el instanceof HTMLInputElement && SKIPPED_TYPES.has(el.type)) return false;
    if (el.closest('[role="search"]')) return false;
    // Skip invisible fields; they are often honeypots for bots.
    const rect = el.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) return false;
    const style = getComputedStyle(el);
    return style.visibility !== 'hidden' && style.display !== 'none';
  }

  // Use the native value setter and fire input/change so frameworks such as
  // React, Vue and Angular register the new value.
  function setValue(el, value) {
    const proto = el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype
      : el instanceof HTMLSelectElement ? HTMLSelectElement.prototype
      : HTMLInputElement.prototype;
    const setter = Object.getOwnPropertyDescriptor(proto, 'value').set;
    el.dispatchEvent(new FocusEvent('focus'));
    el.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
    setter.call(el, value);
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
    el.dispatchEvent(new FocusEvent('blur'));
    el.dispatchEvent(new FocusEvent('focusout', { bubbles: true }));
  }

  function selectCandidates(kind, person) {
    switch (kind) {
      case 'state': return [person.state, person.stateCode];
      case 'country': return ['United States', 'United States of America', 'US', 'USA'];
      case 'cardExpMonth': return ['12', 'December', 'Dec'];
      case 'cardExpYear': return [person.cardExpYear, person.cardExpYear.slice(-2)];
      default: return [];
    }
  }

  function fillSelect(el, kind, person) {
    const options = [...el.options].filter((o) => !o.disabled && o.value !== '');
    if (!options.length) return false;
    const wanted = selectCandidates(kind, person).map((v) => v.toLowerCase());
    const match = options.find((o) => wanted.includes(o.value.trim().toLowerCase()) || wanted.includes(o.text.trim().toLowerCase()));
    setValue(el, (match || pick(options)).value);
    return true;
  }

  function fillInput(el, kind, person) {
    const type = (el.type || '').toLowerCase();
    let value;

    if (type === 'number') {
      const min = el.min !== '' ? Number(el.min) : null;
      const max = el.max !== '' ? Number(el.max) : null;
      value = kind === 'age' ? Number(person.age) : kind === 'cardExpMonth' ? 12 : kind === 'cardExpYear' ? Number(person.cardExpYear) : 1;
      if (min !== null && value < min) value = min;
      if (max !== null && value > max) value = max;
      value = String(value);
    } else if (type === 'time') {
      value = '10:30';
    } else if (type === 'datetime-local') {
      value = `${person.futureDate}T10:30`;
    } else if (type === 'month') {
      value = kind === 'cardExp' ? `${person.cardExpYear}-12` : person.futureDate.slice(0, 7);
    } else {
      value = person[kind] !== undefined ? person[kind] : person.shortText;
    }

    const maxLength = el.maxLength;
    if (maxLength > 0 && value.length > maxLength) value = value.slice(0, maxLength);
    setValue(el, value);
    return true;
  }

  function highlight(el) {
    const previous = el.style.outline;
    el.style.outline = '2px solid #7C4DFF';
    setTimeout(() => { el.style.outline = previous; }, 1200);
  }

  function fillAll() {
    const person = makePerson();
    let filled = 0;
    const radioGroups = new Set();

    for (const el of document.querySelectorAll('input, select, textarea')) {
      if (!isFillable(el)) continue;
      const type = (el.type || '').toLowerCase();

      if (type === 'checkbox') {
        // Only tick boxes that look like terms/consent or are required;
        // leave newsletters and other opt-ins alone.
        const hint = hintOf(el);
        if (!el.checked && (el.required || /terms|agree|accept|consent|privacy|policy|acepto/.test(hint))) {
          el.click();
          highlight(el);
          filled++;
        }
        continue;
      }

      if (type === 'radio') {
        const group = el.name || el.id;
        if (radioGroups.has(group)) continue;
        radioGroups.add(group);
        const choices = el.name
          ? [...document.querySelectorAll(`input[type="radio"][name="${CSS.escape(el.name)}"]`)].filter(isFillable)
          : [el];
        if (!choices.some((c) => c.checked)) {
          const choice = pick(choices);
          choice.click();
          highlight(choice);
          filled++;
        }
        continue;
      }

      const kind = classify(el);
      if (kind === 'skip') continue;

      const ok = el instanceof HTMLSelectElement ? fillSelect(el, kind, person) : fillInput(el, kind, person);
      if (ok) {
        highlight(el);
        filled++;
      }
    }
    return { filled, person };
  }

  function toast(filled, person) {
    if (window.top !== window) return;
    const host = document.createElement('div');
    host.style.cssText = 'position:fixed;right:16px;bottom:16px;z-index:2147483647;';
    const root = host.attachShadow({ mode: 'closed' });
    const box = document.createElement('div');
    box.style.cssText = 'font:13px/1.4 system-ui,sans-serif;background:#1b1b1d;color:#e8e8ea;border:1px solid #36363a;border-left:3px solid #7C4DFF;border-radius:8px;padding:10px 14px;box-shadow:0 6px 24px rgba(0,0,0,.35);max-width:320px;';
    box.textContent = filled === 0
      ? 'Fake Data Filler: no fillable fields found.'
      : `Filled ${filled} field${filled === 1 ? '' : 's'} as ${person.full} · password: ${person.password}`;
    root.append(box);
    document.documentElement.append(host);
    setTimeout(() => host.remove(), 3500);
  }

  const { filled, person } = fillAll();
  toast(filled, person);
  return filled;
})();
