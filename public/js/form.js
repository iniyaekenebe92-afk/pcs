(() => {
  const form = document.getElementById('application-form');
  const panels = document.querySelectorAll('.step-panel');
  const indicators = document.querySelectorAll('.step-indicator');
  const btnPrev = document.getElementById('btn-prev');
  const btnNext = document.getElementById('btn-next');
  const btnSubmit = document.getElementById('btn-submit');
  const progressFill = document.getElementById('step-line-fill');
  const summaryBox = document.getElementById('summary-box');
  const successMsg = document.getElementById('success-message');
  const errorBanner = document.getElementById('error-banner');
  const formCard = form.closest('.bg-white');

  let currentStep = 1;
  const totalSteps = 4;

  // ── Custom dropdowns ──
  (function initDropdowns() {
    // Move all menus to <body> so they escape every overflow/grid ancestor
    document.querySelectorAll('.dropdown-menu').forEach(menu => {
      document.body.appendChild(menu);
    });

    function positionMenu(trigger, menu) {
      const r = trigger.getBoundingClientRect();
      menu.style.position = 'fixed';
      menu.style.top      = (r.bottom + 6) + 'px';
      menu.style.left     = r.left + 'px';
      menu.style.width    = r.width + 'px';
      menu.style.zIndex   = '9999';
      // Remove the absolute/relative classes that no longer apply
      menu.style.marginTop = '0';
    }

    function openMenu(trigger, menu) {
      const isOpen = trigger.getAttribute('aria-expanded') === 'true';
      closeAll();
      if (!isOpen) {
        positionMenu(trigger, menu);
        menu.classList.remove('hidden');
        trigger.setAttribute('aria-expanded', 'true');
      }
    }

    function closeAll() {
      document.querySelectorAll('.dropdown-trigger').forEach(t => {
        t.setAttribute('aria-expanded', 'false');
        const m = document.getElementById(t.dataset.menu);
        if (m) m.classList.add('hidden');
      });
    }

    // Reposition on scroll/resize so menu tracks the trigger
    window.addEventListener('scroll', () => {
      const openTrigger = document.querySelector('.dropdown-trigger[aria-expanded="true"]');
      if (openTrigger) {
        const menu = document.getElementById(openTrigger.dataset.menu);
        if (menu) positionMenu(openTrigger, menu);
      }
    }, { passive: true });

    window.addEventListener('resize', () => {
      const openTrigger = document.querySelector('.dropdown-trigger[aria-expanded="true"]');
      if (openTrigger) {
        const menu = document.getElementById(openTrigger.dataset.menu);
        if (menu) positionMenu(openTrigger, menu);
      }
    }, { passive: true });

    // Delegate trigger clicks
    document.addEventListener('click', function (e) {
      const trigger = e.target.closest('.dropdown-trigger');
      if (trigger) {
        e.stopPropagation();
        const menu = document.getElementById(trigger.dataset.menu);
        if (menu) openMenu(trigger, menu);
        return;
      }

      // Item selection
      const item = e.target.closest('.dropdown-item');
      if (item) {
        e.stopPropagation();
        const menu = item.closest('.dropdown-menu');
        if (!menu) return;

        // Find the trigger that owns this menu via data-menu attribute
        const trigger2 = document.querySelector(`.dropdown-trigger[data-menu="${menu.id}"]`);
        const hiddenId = trigger2?.dataset.hidden;
        const hidden   = hiddenId ? document.getElementById(hiddenId) : null;
        const labelEl  = trigger2?.querySelector('.dropdown-label');

        // Update hidden input
        if (hidden) {
          hidden.value = item.dataset.value;
          hidden.dispatchEvent(new Event('change', { bubbles: true }));
        }

        // Update trigger label & style
        if (labelEl) {
          labelEl.textContent = item.textContent.trim();
          labelEl.classList.remove('text-slate-400');
          labelEl.classList.add('text-slate-800');
        }

        // Mark selected item
        menu.querySelectorAll('.dropdown-item').forEach(i => i.classList.remove('selected'));
        item.classList.add('selected');

        closeAll();
        return;
      }

      // Click outside → close all
      closeAll();
    });
  })();

  // ── Validation rules per step ──
  const stepRules = {
    1: [
      { id: 'full_name',      check: v => v.trim().length > 1 },
      { id: 'gender',         check: v => v !== '' },
      { id: 'nationality',    check: v => v.trim().length > 0 },
      { id: 'current_country',check: v => v.trim().length > 0 },
      { id: 'whatsapp',       check: v => /^\+\d{7,15}$/.test(v.trim()) },
      { id: 'email',          check: v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) },
    ],
    2: [
      { id: 'caregiving_experience', check: v => v !== '' },
      { id: 'years_experience',      check: v => v !== '' },
      { id: 'education_level',       check: v => v !== '' },
    ],
    3: [
      { id: 'preferred_destination', check: v => v !== '' },
      { id: 'has_passport',          check: v => v !== '' },
      { id: 'english_proficiency',   check: v => v !== '' },
    ],
    4: [], // consent handled separately
  };

  function getVal(id) {
    const el = document.getElementById(id);
    return el ? el.value : '';
  }

  function showError(id, show) {
    // whatsapp error: border goes on the phone-field wrapper, not a hidden input
    if (id === 'whatsapp') {
      const phoneField = document.getElementById('phone-field');
      if (phoneField) phoneField.classList.toggle('error', show);
      const err = document.getElementById('err-whatsapp');
      if (err) err.classList.toggle('visible', show);
      return;
    }
    const input = document.getElementById(id);
    const err   = document.getElementById('err-' + id);
    if (input) {
      input.classList.toggle('error', show);
      // Tom Select wraps the <select> — also toggle error on the wrapper
      const tsWrapper = input.nextElementSibling?.classList.contains('ts-wrapper')
        ? input.nextElementSibling
        : input.closest('.ts-wrapper');
      if (tsWrapper) tsWrapper.classList.toggle('error', show);
    }
    if (err)   err.classList.toggle('visible', show);
  }

  function validateStep(step) {
    let valid = true;
    (stepRules[step] || []).forEach(rule => {
      const val = getVal(rule.id);
      const ok  = rule.check(val);
      showError(rule.id, !ok);
      if (!ok) valid = false;
    });

    if (step === 4) {
      const checked = document.getElementById('consent-checkbox').checked;
      showError('consented', !checked);
      if (!checked) valid = false;
    }

    return valid;
  }

  function updateUI() {
    // Show/hide panels
    panels.forEach((p, i) => p.classList.toggle('active', i + 1 === currentStep));

    // Progress bar
    // Drive the green connector fill to the centre of the current step dot
    if (progressFill) {
      const track     = progressFill.parentElement;
      const trackRect = track.getBoundingClientRect();
      const dots      = track.querySelectorAll('.step-indicator');
      const targetDot = dots[currentStep - 1];
      if (targetDot && trackRect.width > 0) {
        const dotRect  = targetDot.getBoundingClientRect();
        const dotCentreX = dotRect.left + dotRect.width / 2;
        const fillPct  = ((dotCentreX - trackRect.left) / trackRect.width) * 100;
        progressFill.style.width = fillPct + '%';
      }
    }

    // Step indicators
    const baseDot = 'step-dot flex items-center justify-center w-7 h-7 rounded-full text-sm font-semibold';
    indicators.forEach((ind, i) => {
      const n   = i + 1;
      const dot = ind.querySelector('.step-dot');
      if (n < currentStep) {
        dot.className   = baseDot + ' bg-green-500 text-white';
        dot.textContent = '✓';
      } else if (n === currentStep) {
        dot.className   = baseDot + ' bg-brand-500 text-white shadow-sm';
        dot.textContent = n;
      } else {
        dot.className   = baseDot + ' bg-slate-200 text-slate-500';
        dot.textContent = n;
      }
    });

    // Buttons
    btnPrev.style.display  = currentStep > 1 ? 'inline-block' : 'none';
    btnNext.style.display  = currentStep < totalSteps ? 'inline-block' : 'none';
    btnSubmit.style.display = currentStep === totalSteps ? 'inline-block' : 'none';
  }

  function buildSummary() {
    const rows = [
      ['Full Name', getVal('full_name')],
      ['Gender', getVal('gender')],
      ['Nationality', getVal('nationality')],
      ['Current Country', getVal('current_country')],
      ['WhatsApp', getVal('whatsapp')],
      ['Email', getVal('email')],
      ['Experience Type', getVal('caregiving_experience')],
      ['Years Experience', getVal('years_experience')],
      ['Education', getVal('education_level')],
      ['Destination', getVal('preferred_destination')],
      ['Has Passport', getVal('has_passport')],
      ['English Level', getVal('english_proficiency')],
    ];
    summaryBox.innerHTML = rows
      .filter(([, v]) => v)
      .map(([k, v]) => `
        <div class="summary-row">
          <span class="text-slate-500">${k}</span>
          <span class="font-medium text-slate-800 capitalize">${v.replace(/_/g, ' ')}</span>
        </div>`)
      .join('');
  }

  btnNext.addEventListener('click', () => {
    if (!validateStep(currentStep)) return;
    currentStep++;
    if (currentStep === 4) buildSummary();
    updateUI();
    window.scrollTo({ top: document.getElementById('apply').offsetTop - 20, behavior: 'smooth' });
  });

  btnPrev.addEventListener('click', () => {
    currentStep--;
    updateUI();
    window.scrollTo({ top: document.getElementById('apply').offsetTop - 20, behavior: 'smooth' });
  });

  // Sync hidden consent field
  document.getElementById('consent-checkbox').addEventListener('change', function () {
    document.getElementById('consented-hidden').value = this.checked ? 'true' : 'false';
    if (this.checked) showError('consented', false);
  });

  // ── Form submit ──
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!validateStep(4)) return;

    const label   = document.getElementById('submit-label');
    const spinner = document.getElementById('submit-spinner');
    btnSubmit.disabled = true;
    label.textContent  = 'Submitting…';
    spinner.style.display = 'inline-block';
    errorBanner.classList.add('hidden');

    const data = Object.fromEntries(new FormData(form).entries());
    // Override consented from checkbox state
    data.consented = document.getElementById('consent-checkbox').checked ? 'true' : 'false';

    try {
      const res  = await fetch('/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const json = await res.json();

      if (json.success) {
        window.location.href = '/success';
      } else {
        const msg = json.errors?.[0]?.msg || json.message || 'Something went wrong. Please try again.';
        errorBanner.textContent = msg;
        errorBanner.classList.remove('hidden');
      }
    } catch {
      errorBanner.textContent = 'Network error. Please check your connection and try again.';
      errorBanner.classList.remove('hidden');
    } finally {
      btnSubmit.disabled    = false;
      label.textContent     = 'Submit Application';
      spinner.style.display = 'none';
    }
  });

  // Clear errors on input
  document.querySelectorAll('.input-field').forEach(el => {
    el.addEventListener('input', () => showError(el.id, false));
    el.addEventListener('change', () => showError(el.id, false));
  });

  updateUI();
})();
