(() => {
  const { registries, capabilities, tracks, statuses, insights, getCapability, sourcePage, isLowerConfidence } = globalThis.RegistryAtlas;
  const primarySelect = document.querySelector('#registry-select');
  const compareSelect = document.querySelector('#compare-select');
  const compareToggle = document.querySelector('#compare-toggle');
  const comparisonPicker = document.querySelector('#comparison-picker');
  const state = { primary: 'npm', compare: null, pivot: 'registry', category: 'Z', control: 'Z4' };
  const categorySelect = document.querySelector('#category-select');
  const controlSelect = document.querySelector('#control-select');
  const plainSummaries = {
    npm: ['CI can publish without stored secrets. Staged releases add human approval, and npm v12 disables install scripts by default.', 'Two-step sign-in is not yet required on every publishing path. Users do not get proactive alerts when installed packages are pulled.'],
    pypi: ['Every publisher must use two-step sign-in. CI can publish without stored secrets, and build evidence is supported.', 'pip does not warn about known vulnerabilities during install. There is no staged release step for human approval.'],
    nuget: ['Two-step sign-in, signed packages, protected name prefixes, and secret-free CI publishing help protect releases.', 'Evidence of how a package was built is incomplete. There is no public security-event log or staged release step.'],
    rubygems: ['Secret-free CI publishing, security-key sign-in, and evidence about package builds are available.', 'Two-step sign-in is not yet required for every publisher. There is no staged release step or publish-time malware scan.'],
    packagist: ['A public log exposes ownership changes. Stable versions cannot be silently rewritten, and Composer blocks flagged malware.', 'Secret-free CI publishing and security-key sign-in have not shipped. Several release protections are still planned.'],
    maven: ['Verified package-name ownership, signed packages, and manual release approval help protect what gets published.', 'Publishers can still rely on stored secrets, two-step sign-in is not mandatory, and signatures do not show how a build ran.'],
    crates: ['CI can publish without stored secrets, leaked tokens can be revoked, and package pages show known vulnerabilities.', 'No build evidence or human approval stage. The registry does not itself scan uploads for malware.'],
    hex: ['The package index is signed. Modern publishing permissions require two-step sign-in, and the service has had an external audit.', 'No secret-free CI publishing, malware scanning, or public security-event log. Build evidence is still planned.'],
    go: ['Downloads are checked against an immutable checksum log. Fetching does not run install scripts, and Go can check whether vulnerable code is reachable.', 'No malware scanning or release waiting period. A compromised source-host account can still introduce a malicious new version.'],
    debian: ['Signed metadata, repeatable builds, centralized building, human review, and a release waiting period work together.', 'Install scripts can still run with administrator privileges. Human review is not automated malware detection.'],
    arch: ['Official packages use trusted signing keys, centralized builds, and human review.', 'Install-time code can still run. There is no malware scanning or guarantee that independent rebuilds will match.'],
    aur: ['Public change history and reporting channels offer some visibility into package changes.', 'No required human review, malware scanning, or restriction on install-time code. Official Arch protections do not apply here.'],
    vcpkg: ['Changes to package recipes are reviewed, downloads are checked against fixed hashes, and installed packages get a software inventory.', 'Build recipes run code on your machine. The install tool does not warn about vulnerabilities or prove how your local binaries were built.'],
    homebrew: ['Official package recipes are reviewed, and centrally built bottles have evidence connecting them to their builds.', 'Checking that build evidence is opt-in. Recipes can run code, and the install flow does not warn about known vulnerabilities.'],
    cran: ['Packages go through submission checks and human review. Central builds and historical versions provide useful safeguards.', 'Publisher identity relies on email without a second sign-in factor. There is no package signing or vulnerability display.'],
    cpan: ['Per-module permissions control who can publish, historical uploads are retained, and MetaCPAN displays security advisories.', 'No two-step publisher sign-in, secret-free CI publishing, leaked-token detection, or malware scanning.'],
  };
  const labels = { S: 'Available', P: 'Partial', N: 'Missing', R: 'Planned', X: 'Not applicable' };
  const symbols = { S: '✓', P: '◐', N: '−', R: '◷', X: '—' };
  const groups = [
    { title: 'Who can publish?', icon: '01', description: 'Keeping the wrong people out.', controls: [
      { id: 'A11', name: 'Do all publishers need two-step sign-in?', explanation: 'A stolen password alone shouldn’t let someone publish a release.' },
      { id: 'Z4', name: 'Can CI publish without a stored secret?', explanation: 'Short-lived credentials reduce the risk of leaked publishing tokens.' },
      { id: 'X8', name: 'Does a human approve staged releases?', explanation: 'An approval gate separates submitting a release from making it installable.' },
    ] },
    { title: 'What gets delivered?', icon: '02', description: 'Knowing what you’re installing.', controls: [
      { id: 'G5', name: 'Does the registry look for malware?', explanation: 'Detection can catch malicious packages, but cannot prove a package is safe.' },
      { id: 'Z6', name: 'Can you verify where a build came from?', explanation: 'Build evidence connects a package to its source and build environment.' },
      { id: 'X9', name: 'Is install-time code execution restricted?', explanation: 'Controls can restrict install scripts. Build-time code may still run.' },
    ] },
    { title: 'What happens after you choose?', icon: '03', description: 'Helping you respond to risk.', controls: [
      { id: 'C2', name: 'Does the install tool warn about vulnerabilities?', explanation: 'Warnings in the normal install flow are different from running a separate audit.' },
      { id: 'C5', name: 'Can it tell if vulnerable code is reachable?', explanation: 'Reachability tools check whether your application calls the affected functions.' },
      { id: 'X13', name: 'Are exposed users told when a package is pulled?', explanation: 'Proactive alerts close the loop. Audits you must run yourself are only partial.' },
    ] },
  ];
  const escape = value => String(value).replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
  const byId = id => registries.find(registry => registry.id === id);
  const selectedRegistries = () => [byId(state.primary), ...(state.compare ? [byId(state.compare)] : [])];
  const sources = pages => pages.map(page => `<a href="./report.pdf#page=${page}" target="_blank" rel="noopener">p. ${page} ↗</a>`).join(' ');
  const status = value => `<span class="status status-${value}"><span aria-hidden="true">${symbols[value]}</span>${labels[value]}</span>`;

  function readSelection() {
    const params = new URLSearchParams(location.hash.slice(1));
    state.pivot = params.get('view') === 'control' ? 'control' : 'registry';
    const category = params.get('category');
    state.category = tracks.some(track => track.id === category) ? category : 'Z';
    const control = params.get('control');
    state.control = control === 'all' || capabilities.some(cap => cap.id === control && cap.track === state.category) ? control : (state.category === 'Z' ? 'Z4' : `${state.category}1`);
    if (params.has('registry')) {
      const primary = params.get('registry');
      const compare = params.get('compare');
      if (byId(primary)) {
        state.primary = primary;
        state.compare = compare && byId(compare) && compare !== primary ? compare : null;
      }
    }
  }

  function saveSelection() {
    const params = new URLSearchParams({ registry: state.primary });
    if (state.compare) params.set('compare', state.compare);
    if (state.pivot === 'control') {
      params.set('view', 'control');
      params.set('category', state.category);
      params.set('control', state.control);
    }
    history.replaceState(null, '', `#${params}`);
  }

  function registrySummary(registry) {
    return `<article class="registry-summary"><div class="registry-heading"><span class="registry-monogram ${registry.id}" aria-hidden="true">${registry.name === 'npm' ? 'npm' : registry.name.slice(0, 2)}</span><div><h3>${registry.name}</h3><p>${registry.language} <span>·</span> ${registry.model}</p></div><span class="cli-label">${escape(registry.cli)}</span></div>
      <div class="summary-columns"><div><span class="summary-label strength-label"><i aria-hidden="true">✓</i> What’s working</span><p>${plainSummaries[registry.id][0]}</p></div><div><span class="summary-label gap-label"><i aria-hidden="true">↗</i> Where the gaps are</span><p>${plainSummaries[registry.id][1]}</p></div></div>
      <details class="registry-caveat"><summary>One important caveat <span aria-hidden="true">+</span></summary><p>${registry.caveat}</p><p class="source-line">Registry narrative ${sources(registry.pages)}</p></details></article>`;
  }

  function evidence(registry, cap) {
    const value = registry.ratings[cap.id];
    return `<div class="evidence-item"><strong>${registry.name}: ${labels[value]}</strong><p>${statuses[value].description}</p>${isLowerConfidence(registry, cap) ? `<p class="confidence-warning">Lower-confidence evidence: the report flags this rating as inferred or partially documented. ${sources([31])}</p>` : ''}<p class="source-line">Original matrix · ${cap.id} ${sources([sourcePage(registry, cap)])}</p></div>`;
  }

  function controlRow(control, full = false) {
    const cap = getCapability(control.id);
    const rows = selectedRegistries();
    return `<details class="control-row ${full ? 'full-control' : ''}"><summary><span class="control-question">${full ? `<span class="control-code">${cap.id}</span>` : ''}${control.name}</span><span class="status-values">${rows.map(registry => `<span class="registry-status" ${rows.length > 1 ? `aria-label="${registry.name}: ${labels[registry.ratings[cap.id]]}"` : ''}>${rows.length > 1 ? `<small>${registry.name}</small>` : ''}${status(registry.ratings[cap.id])}</span>`).join('')}<span class="expand-icon" aria-hidden="true">+</span></span></summary><div class="control-evidence"><p class="plain-explanation">${control.explanation || cap.description}</p>${full ? '' : `<p class="formal-definition"><strong>In the report:</strong> ${cap.description}</p>`}<div class="evidence-grid ${rows.length > 1 ? 'two-up' : ''}">${rows.map(registry => evidence(registry, cap)).join('')}</div></div></details>`;
  }

  function render() {
    renderPivot();
    primarySelect.innerHTML = registries.map(registry => `<option value="${registry.id}" ${registry.id === state.primary ? 'selected' : ''}>${registry.name} — ${registry.language}</option>`).join('');
    compareSelect.innerHTML = registries.filter(registry => registry.id !== state.primary).map(registry => `<option value="${registry.id}" ${registry.id === state.compare ? 'selected' : ''}>${registry.name} — ${registry.language}</option>`).join('');
    comparisonPicker.hidden = !state.compare;
    compareToggle.hidden = Boolean(state.compare);
    compareToggle.setAttribute('aria-expanded', String(Boolean(state.compare)));
    const rows = selectedRegistries();
    const summaries = document.querySelector('#registry-summary');
    summaries.className = rows.length > 1 ? 'summaries comparing' : 'summaries';
    summaries.innerHTML = rows.map(registrySummary).join('');
    document.querySelector('#control-groups').innerHTML = groups.map(group => `<section class="control-group"><div class="group-heading"><span>${group.icon}</span><div><h4>${group.title}</h4><p>${group.description}</p></div></div>${group.controls.map(control => controlRow(control)).join('')}</section>`).join('');
    document.querySelector('#all-controls-content').innerHTML = tracks.map(track => `<section class="full-track"><h4>${track.name} <span>${capabilities.filter(cap => cap.track === track.id).length} controls</span></h4>${capabilities.filter(cap => cap.track === track.id).map(cap => controlRow({ id: cap.id, name: cap.name }, true)).join('')}</section>`).join('');
  }

  function renderPivot() {
    for (const pivot of ['registry', 'control']) {
      const active = state.pivot === pivot;
      const tab = document.querySelector(`#${pivot}-tab`);
      tab.setAttribute('aria-selected', String(active));
      tab.tabIndex = active ? 0 : -1;
      document.querySelector(`#${pivot}-panel`).hidden = !active;
    }
    categorySelect.innerHTML = tracks.map(track => `<option value="${track.id}" ${track.id === state.category ? 'selected' : ''}>${track.name}</option>`).join('');
    const caps = capabilities.filter(cap => cap.track === state.category);
    controlSelect.innerHTML = `<option value="all" ${state.control === 'all' ? 'selected' : ''}>Whole category · ${caps.length} controls</option>${caps.map(cap => `<option value="${cap.id}" ${state.control === cap.id ? 'selected' : ''}>${cap.name}</option>`).join('')}`;
    renderControlResults(caps);
  }

  function renderControlResults(caps) {
    const overview = document.querySelector('#control-overview');
    const results = document.querySelector('#control-results');
    if (state.control === 'all') {
      const track = tracks.find(item => item.id === state.category);
      overview.innerHTML = `<div class="control-overview-heading"><span class="eyebrow">CATEGORY VIEW</span><h3>${track.name}</h3><p>Compare ${caps.length} controls across all 16 profiles. Select a heading to explore a control, or a rating to open that registry’s evidence.</p></div>`;
      results.innerHTML = `<div class="category-table-wrap" role="region" aria-label="${track.name} comparison, scroll horizontally for more controls" tabindex="0"><table class="category-table"><caption>${track.name}: availability by registry. A dagger (†) marks lower-confidence evidence.</caption><thead><tr><th scope="col">Registry</th>${caps.map(cap => `<th scope="col"><button data-show-control="${cap.id}"><span>${cap.id}</span>${cap.name} ↗</button></th>`).join('')}</tr></thead><tbody>${registries.map(registry => `<tr><th scope="row"><strong>${registry.name}</strong><span>${registry.language}</span></th>${caps.map(cap => `<td><button class="matrix-rating" data-show-control="${cap.id}" data-inspect-registry="${registry.id}" aria-label="${registry.name}: ${cap.name} — ${labels[registry.ratings[cap.id]]}${isLowerConfidence(registry, cap) ? ', lower-confidence evidence' : ''}">${status(registry.ratings[cap.id])}${isLowerConfidence(registry, cap) ? '<span class="confidence-marker" aria-hidden="true">†</span>' : ''}</button></td>`).join('')}</tr>`).join('')}</tbody></table></div><div class="category-legend">${Object.keys(labels).map(value => status(value)).join('')}<span>† Lower-confidence evidence</span></div>`;
      return;
    }
    const cap = getCapability(state.control);
    overview.innerHTML = `<div class="control-overview-heading"><span class="eyebrow">${cap.id} · ${tracks.find(track => track.id === cap.track).name}${cap.level ? ` · LEVEL ${cap.level}` : ' · EXTENDED CONTROL'}</span><h3>${cap.name}</h3><p>${cap.description}</p></div><div class="control-distribution" aria-label="Ratings across 16 registry profiles">${Object.keys(labels).map(value => `<div><strong>${registries.filter(registry => registry.ratings[cap.id] === value).length}</strong>${status(value)}</div>`).join('')}</div>`;
    results.innerHTML = `<div class="rating-groups">${Object.keys(labels).filter(value => registries.some(registry => registry.ratings[cap.id] === value)).map(value => {
      const rows = registries.filter(registry => registry.ratings[cap.id] === value);
      return `<section class="rating-group" data-rating="${value}"><h4>${status(value)}<span>${rows.length} ${rows.length === 1 ? 'profile' : 'profiles'}</span></h4>${rows.map(registry => `<details class="registry-result" id="rating-${registry.id}"><summary><span><strong>${registry.name}</strong><small>${registry.language} · ${registry.model}</small></span><span class="expand-icon" aria-hidden="true">+</span></summary><div class="registry-result-evidence">${evidence(registry, cap)}<p class="result-caveat"><strong>Registry-wide caveat:</strong> ${registry.caveat} ${sources(registry.pages)}</p><button class="text-button" data-open-registry="${registry.id}">Explore ${registry.name} →</button></div></details>`).join('')}</section>`;
    }).join('')}</div>`;
  }

  function setPivot(pivot, focus = false) {
    state.pivot = pivot;
    saveSelection();
    renderPivot();
    if (focus) document.querySelector(`#${pivot}-tab`).focus();
  }

  document.querySelectorAll('[role="tab"]').forEach(tab => {
    tab.addEventListener('click', () => setPivot(tab.id === 'control-tab' ? 'control' : 'registry'));
    tab.addEventListener('keydown', event => {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      const pivot = event.key === 'Home' ? 'registry' : event.key === 'End' ? 'control' : state.pivot === 'registry' ? 'control' : 'registry';
      setPivot(pivot, true);
    });
  });
  categorySelect.addEventListener('change', () => {
    state.category = categorySelect.value;
    state.control = 'all';
    saveSelection();
    renderPivot();
  });
  controlSelect.addEventListener('change', () => {
    state.control = controlSelect.value;
    saveSelection();
    renderPivot();
  });
  document.querySelector('#control-results').addEventListener('click', event => {
    const button = event.target.closest('button');
    if (!button) return;
    if (button.dataset.showControl) {
      state.control = button.dataset.showControl;
      saveSelection();
      renderPivot();
      const detail = button.dataset.inspectRegistry ? document.querySelector(`#rating-${button.dataset.inspectRegistry}`) : null;
      if (detail) {
        detail.open = true;
        detail.querySelector('summary').focus();
        detail.scrollIntoView({ block: 'nearest', behavior: 'instant' });
      } else {
        controlSelect.focus();
      }
    }
    if (button.dataset.openRegistry) {
      state.primary = button.dataset.openRegistry;
      if (state.compare === state.primary) state.compare = null;
      state.pivot = 'registry';
      saveSelection();
      render();
      primarySelect.focus();
    }
  });

  const featured = [
    { index: 0, stat: '0 of 15', heading: 'Nobody closes the alert loop.', body: 'No assessed ecosystem proactively tells exposed users that a package was later pulled. Running your own audit is still on you.', color: 'red' },
    { index: 1, stat: 'Only Go', heading: 'A vulnerability isn’t always reachable.', body: 'Go alone has native tooling to check whether your app calls vulnerable functions. Finding a CVE is not the same as finding real exposure.', color: 'blue' },
    { index: 2, stat: '5 of 15', heading: 'Publishing secrets are disappearing. Trust isn’t.', body: 'Five ecosystems support trusted publishing. It removes stored secrets, but a compromised CI workflow can still publish with a valid identity.', color: 'green' },
  ];

  function insightDetails(insight) {
    return `<details class="insight-evidence"><summary>Why it matters <span aria-hidden="true">+</span></summary><p>${insight.text}</p><p class="implication">${insight.implication}</p><p class="source-line">${insight.kind} · ${sources(insight.pages)}</p></details>`;
  }
  document.querySelector('#featured-insights').innerHTML = featured.map(item => `<article class="insight-card ${item.color}"><span class="insight-stat">${item.stat}</span><h3>${item.heading}</h3><p>${item.body}</p>${insightDetails(insights[item.index])}</article>`).join('');
  document.querySelector('#more-insights-content').innerHTML = insights.slice(3).map(insight => `<article class="extra-insight"><h3>${insight.title}</h3><p>${insight.text}</p><p class="implication">${insight.implication}</p><p class="source-line">${insight.kind} · ${sources(insight.pages)}</p></article>`).join('');

  primarySelect.addEventListener('change', () => {
    const previous = state.primary;
    state.primary = primarySelect.value;
    if (state.compare === state.primary) state.compare = previous;
    saveSelection();
    render();
  });
  compareToggle.addEventListener('click', () => {
    state.compare = state.primary === 'pypi' ? 'npm' : 'pypi';
    saveSelection();
    render();
    compareSelect.focus();
  });
  compareSelect.addEventListener('change', () => {
    state.compare = compareSelect.value;
    saveSelection();
    render();
  });
  document.querySelector('#remove-comparison').addEventListener('click', () => {
    state.compare = null;
    saveSelection();
    render();
    compareToggle.focus();
  });
  window.addEventListener('hashchange', () => {
    const params = new URLSearchParams(location.hash.slice(1));
    if (!params.has('registry') && !params.has('view')) return;
    readSelection();
    render();
  });
  readSelection();
  render();
})();
