(() => {
const statuses = {
  S: { label: 'Available', symbol: '✓', description: 'Shipped and generally available. Availability does not imply adoption or enforcement.' },
  P: { label: 'Partial', symbol: '◐', description: 'Limited scope, opt-in, external tooling, or equivalent protection by other means.' },
  N: { label: 'Not present', symbol: '−', description: 'Not present according to the report assessment.' },
  R: { label: 'Planned', symbol: '◷', description: 'Announced, in progress, or committed with a public plan. Not shipped.' },
  X: { label: 'Not applicable', symbol: '·', description: 'Out of scope under the framework taxonomy; not a missing control.' },
};

const tracks = [
  { id: 'A', name: 'Authentication', short: 'Identity', pages: [2, 3, 4] },
  { id: 'Z', name: 'Authorization', short: 'Publishing', pages: [4, 5, 6] },
  { id: 'G', name: 'General capabilities', short: 'Registry', pages: [6, 7, 8] },
  { id: 'C', name: 'CLI tooling', short: 'Consumer tooling', pages: [8, 9] },
  { id: 'X', name: 'Extended capabilities', short: 'Beyond the framework', pages: [9, 10, 11, 12] },
];

const definitions = {
  A: [
    ['Email verification', 1, 'Verified email addresses support account recovery.'],
    ['Account recovery policy', 1, 'A documented, predictable account recovery process.'],
    ['Strong MFA available', 1, 'At least TOTP multi-factor authentication; email or SMS alone does not qualify.'],
    ['Account-change notifications', 1, 'Maintainers are notified about security-relevant changes to their accounts.'],
    ['Brute-force prevention', 1, 'Rate limiting or blocking of credential and MFA-code guessing.'],
    ['Abandoned-domain detection', 2, 'Detect abandoned email domains and prevent account recovery through resurrected domains.'],
    ['Phishing-resistant MFA', 2, 'WebAuthn / FIDO2 security keys or platform authenticators are supported.'],
    ['MFA for critical packages', 2, 'MFA is mandatory for maintainers of critical packages.'],
    ['Leaked-credential checks', 2, 'Check credentials against breach databases and reject known-leaked passwords.'],
    ['Passwordless authentication', 3, 'Passwordless sign-in, such as passkeys.'],
    ['MFA for all maintainers', 3, 'Every account with publishing permissions must use MFA.'],
    ['Phishing-resistant MFA required', 3, 'Critical-package maintainers must use phishing-resistant MFA.'],
  ],
  Z: [
    ['Package-scoped API keys', 1, 'Automation credentials can be restricted to specific packages.'],
    ['Recognizable token prefixes', 1, 'Registry-specific prefixes make leaked tokens identifiable.'],
    ['Role-based access control', 2, 'Separate user-management and package-publishing permissions.'],
    ['Trusted publishing', 3, 'OIDC exchanges CI identity for short-lived publishing credentials, avoiding stored long-lived secrets.'],
    ['Secret scanning & revocation', 3, 'Third-party secret-scanning integration automatically revokes reported leaked tokens.'],
    ['Build provenance', 3, 'Verifiable evidence connects an artifact to its source and build environment.'],
  ],
  G: [
    ['Vulnerability disclosure policy', 1, 'A published policy for reporting vulnerabilities in the registry, including safe harbor and remediation targets.'],
    ['Typosquat prevention', 1, 'Namespacing, similar-name detection, or equivalent protection against deceptive package names.'],
    ['Unpublish / name-reuse policy', 2, 'Protect published versions against replacement and prevent deleted name/version reuse.'],
    ['Malicious-package reporting', 2, 'Suspicious packages can be reported through UI, CLI, and API surfaces.'],
    ['Malware detection', 2, 'Registry-level detection of malicious package content. Partial does not necessarily mean publish-time scanning.'],
    ['Vulnerability warnings in UI', 2, 'Package pages surface known vulnerabilities.'],
    ['Periodic security reviews', 3, 'Periodic security reviews of registry infrastructure.'],
    ['Event transparency log', 3, 'Public security-relevant history. Content-checksum logs, security-event logs, and public git histories have different semantics.'],
    ['Machine-readable malware advisories', 3, 'Standardized malicious-package advisories, for example in OSV format.'],
  ],
  C: [
    ['Pinned installs', 1, 'Deterministic dependency resolution using hashes, versions, or lockfiles.'],
    ['Install-time vulnerability warnings', 2, 'The dominant CLI warns about known vulnerabilities at install time; external audit tools are rated partial.'],
    ['SBOM generation', 3, 'The CLI can produce a Software Bill of Materials. Third-party tools are partial.'],
    ['Automated remediation', 3, 'The CLI can upgrade dependencies to remediate known vulnerabilities.'],
    ['Reachability analysis', 3, 'Ecosystem-native analysis filters findings to vulnerable functions the application actually calls. Go uses govulncheck, a separate Go tool.'],
  ],
  X: [
    ['Signed index / metadata', null, 'Signed or hash-chained repository metadata protects index integrity, separately from artifact signing.'],
    ['Version immutability', null, 'A published version cannot be silently replaced or rewritten.'],
    ['Reproducible builds', null, 'Independent rebuilds produce bit-identical artifacts. A shipped rating is not a universal guarantee for every artifact.'],
    ['Centralized attested builds', null, 'The repository builds distributed artifacts rather than trusting a maintainer-built binary.'],
    ['Quarantine / freeze', null, 'Block installation of a suspect package while retaining evidence and protecting the name.'],
    ['Archival / deprecation', null, 'Maintainers can signal that a package is archived or no longer maintained.'],
    ['Namespace / vendor scoping', null, 'Package naming is scoped to an owner, domain, or reserved prefix.'],
    ['Staged publishing', null, 'A human approval gate separates submission from making a release installable.'],
    ['Install-time execution controls', null, 'The client restricts arbitrary install-time code, or the package format / fetch operation avoids it. This is not a guarantee against build-time execution.'],
    ['Release cooldown', null, 'Minimum release age delays serving or adopting new versions. Partial may be client-side or opt-in, not a registry default.'],
    ['Human review before inclusion', null, 'A human reviews a package or change before repository inclusion.'],
    ['Maintainer-change visibility', null, 'Consumers can observe changes to who can publish a package; owner-only email does not qualify.'],
    ['Post-removal notification', null, 'Previously exposed consumers are proactively told a version was removed or found malicious. Pull-based audits are partial.'],
  ],
};

const capabilities = tracks.flatMap(track => definitions[track.id].map(([name, level, description], i) => ({
  id: `${track.id}${i + 1}`, track: track.id, name, level, description,
  page: track.id === 'A' ? 3 : track.id === 'Z' ? 5 : track.id === 'G' ? 7 : track.id === 'C' ? (i < 5 ? 8 : 9) : 10,
})));

// S = shipped, P = partial, N = absent, R = roadmap, X = not applicable.
const rows = [
  ['npm', 'npm', 'JavaScript', 'Self-service', 'Corporate', 'npm', 'S S S S S P S S P S P P', 'S S S S S S', 'S P S S S S P P S', 'S S S S N', 'P S N N P S S S S P N N P'],
  ['pypi', 'PyPI', 'Python', 'Self-service', 'Foundation / grants', 'pip', 'S S S S S S S S S P S N', 'S S S S S S', 'S P S S S P S P S', 'S N P N N', 'P S N N S S P N P P N N N'],
  ['nuget', 'NuGet', '.NET', 'Self-service', 'Corporate', 'dotnet', 'S S S S S P S S S S S P', 'S S P S S P', 'S S S S S S P N P', 'S S P P N', 'S S N N P S S N S N N N P'],
  ['rubygems', 'RubyGems', 'Ruby', 'Self-service', 'Foundation / grants', 'bundler', 'S S S S S P S S P P R N', 'S S S S S S', 'S P S S P P S P S', 'S P N N N', 'S S N N P P N N P P N N N'],
  ['packagist', 'Packagist', 'PHP', 'Metadata / source', 'Commercial subsidy', 'composer', 'S P S P S N N N P N R R', 'P P R N P X', 'S S S S S S S S P', 'S S P N N', 'P S N N R S S R S R N S P'],
  ['maven', 'Maven Central', 'Java / JVM', 'Self-service', 'Corporate', 'mvn / gradle', 'S S S P S N P N P N N N', 'S P P N P P', 'S S S P P P P N P', 'S P P N N', 'P S P N P P S S S N N N N'],
  ['crates', 'crates.io', 'Rust', 'Self-service', 'Foundation / grants', 'cargo', 'S P S P S P S P S S N N', 'S S P S S N', 'S P S P P S S P P', 'S P P N N', 'R S P N P P N N P N N N N'],
  ['hex', 'hex.pm', 'Elixir / Erlang', 'Self-service', 'Commercial subsidy', 'mix', 'S P S P S N P X P S S N', 'S P S N P R', 'S P S P N P S N N', 'S P N N N', 'S S N N P S P N P P N N N'],
  ['go', 'Go modules', 'Go', 'Metadata / source', 'Corporate', 'go', 'X X X X X X X X X X X X', 'X X X X X X', 'S S S P N S P S P', 'S P P N S', 'S S P X P S S X S N N P P'],
  ['debian', 'Debian', 'Linux distribution', 'Curated', 'Volunteer / donations', 'apt', 'S S P S S X P X P X S P', 'X X S X X S', 'S S S S P S P S N', 'S S P S N', 'S S S S S S S S P S S P P'],
  ['arch', 'Arch official', 'Linux distribution', 'Curated', 'Volunteer / donations', 'pacman', 'S P P P S N P X N N S P', 'X X P X X P', 'S S P S N S N P N', 'P P N N N', 'S P P S P S S P N P S P P'],
  ['aur', 'Arch AUR', 'Community build recipes', 'Community / unreviewed', 'Volunteer / donations', 'pacman / AUR helpers', 'S P P P S N P N N N N N', 'P X N N N N', 'S N P S N P N P N', 'P P N N N', 'N P N N P S N N N N N P N'],
  ['vcpkg', 'vcpkg', 'C / C++', 'Curated', 'Corporate', 'vcpkg', 'X X X X X X X X X X X X', 'X X X X X N', 'S S S S P P P S N', 'S N S N N', 'S S P P P P X S N N S P N'],
  ['homebrew', 'Homebrew', 'macOS / Linux', 'Curated', 'Volunteer / donations', 'brew', 'X X X X X X X X X X X X', 'X X X X X S', 'S S S S P P S S N', 'P N N P N', 'S P P S P S S S N N S P N'],
  ['cran', 'CRAN', 'R', 'Curated', 'Academic / volunteer', 'install.packages', 'P X N P X N N N N N N N', 'X X N N N N', 'P P S P P N N P N', 'P N N N N', 'P S N S P S N P N P S N N'],
  ['cpan', 'CPAN / PAUSE', 'Perl', 'Curated', 'Volunteer / donations', 'cpan / cpanm', 'S P N P P N N N N N N N', 'N N S N N P', 'S P S P N S N P N', 'P P N N N', 'P S N N N P S N N N N P N'],
];

const registryNotes = {
  npm: { pages: [12, 13], strength: 'Full authorization track; staged releases and npm v12 script-off defaults add gates beyond credentials.', gap: 'No reproducible builds or consumer-visible ownership-change signal. MFA bypass closure is still staged into January 2027.', caveat: 'Install-time defaults described here apply to npm v12. Earlier clients differ; available provenance is not universal adoption.', funding: 'GitHub / Microsoft corporate security engineering.' },
  pypi: { pages: [13, 14], strength: 'Mandatory maintainer MFA, trusted publishing, attestations, and abandoned-domain detection.', gap: 'pip does not warn on vulnerabilities at install. No staged publishing or proactive downstream removal alerts.', caveat: 'PEP 458 / TUF index protection remains unfinished. The 14-day upload rule limits additions to old releases; it is not a release cooldown.', funding: 'PSF; recurring Alpha-Omega-funded security roles and multiple project grants.' },
  nuget: { pages: [14], strength: 'Repository signing, reserved prefixes, mandatory MFA, and trusted publishing.', gap: 'Build provenance remains partial / proposed. No transparency log or staged release workflow.', caveat: 'The report describes no package install scripts. Do not interpret this as absence of build-time MSBuild execution.', funding: 'Microsoft in-house security engineering.' },
  rubygems: { pages: [14, 15], strength: 'Trusted publishing, WebAuthn, scoped permissions, and Sigstore attestations.', gap: 'MFA is not yet mandatory for all publishers; no staged publishing or publish-time malware scanning.', caveat: 'The critical-package MFA threshold covers about 370 of more than 190,000 gems. Platform-wide MFA is a commitment, not a shipped rating.', funding: 'Ruby Central sponsorships and Alpha-Omega security residencies; concentrated sponsor exposure.' },
  packagist: { pages: [15, 16], strength: 'Purpose-built public security-event log; immutable stable versions; Composer blocks flagged malware.', gap: 'No shipped trusted publishing or phishing-resistant MFA. Staging, quarantine, and cooldowns are roadmap items.', caveat: 'Metadata registry, not an artifact host. Z6 is N/A; CPAN-like account and artifact assumptions cannot be applied uniformly.', funding: 'Private Packagist product subsidy, sponsorships, and Sovereign Tech Agency / Alpha-Omega grants.' },
  maven: { pages: [16, 31], strength: 'Verified domain namespaces, PGP artifact signing, immutable versions, and manual portal release gates.', gap: 'No trusted publishing, mandatory MFA, or build-environment provenance guarantee.', caveat: 'Artifact signatures prove who signed, not how a build ran. September validation notes paid Publisher Pro for some publishers; it is not metered downloads.', funding: 'Sonatype corporate budget and Nexus product adjacency; Publisher Pro noted in September validation.' },
  crates: { pages: [16, 17], strength: 'OIDC publishing with token-free mode, secret scanning, and RustSec-backed package-page advisories.', gap: 'No build provenance or staged publishing; flat namespace and no registry-side malware scanning.', caveat: 'GitHub OAuth supplies authentication features, but crates.io cannot enforce GitHub MFA. G5 partial does not mean registry-side scanning.', funding: 'Rust Foundation, recurring Alpha-Omega security funding, and OpenSSF-funded UI work.' },
  hex: { pages: [17, 18], strength: 'Signed index and OAuth write permissions gated on MFA; comprehensive 2026 external audit.', gap: 'No trusted publishing, malware scanning, or transparency log; provenance is on the roadmap.', caveat: 'mix hex.audit reports retired packages, not general vulnerabilities. Vulnerability auditing uses external mix_audit.', funding: 'Private organization subscriptions; Alpha-Omega funded the audit, not a dedicated staff team.' },
  go: { pages: [18, 19], strength: 'Immutable proxy, verified checksum transparency log, script-free fetching, and native reachability tooling.', gap: 'No malware scanning or release cooldown. Source-host compromise can still introduce a malicious first version.', caveat: 'N/A account controls reflect architecture, not failure. The checksum log proves consistency after first observation, not that the original source was safe.', funding: 'Google operates the proxy, checksum database, and security team; operator concentration remains.' },
  debian: { pages: [19], strength: 'Unique shipped combination of signed index, immutability, reproducibility, centralized builds, cooldown, and review.', gap: 'Maintainer scripts can run as root. No standardized OSV malware advisory feed.', caveat: 'Reproducibility gates entering testing do not imply every distributed artifact is universally reproducible. Human review is not proof of benign intent.', funding: 'Donations and volunteer security team; commercial LTS indirectly funds contributors.' },
  arch: { pages: [20], strength: 'Official repositories use trusted keyrings, signed packages, centralized builds, and human review.', gap: 'Install-time arbitrary code remains possible; no malware scanning or reproducibility guarantee.', caveat: 'Official repositories and AUR must not be averaged. Their trust and review models differ fundamentally.', funding: 'Donated infrastructure and volunteer effort.' },
  aur: { pages: [20], strength: 'Public history and reporting mechanisms expose some changes to scrutiny.', gap: 'No human inclusion review, scanning, namespace protection, or install-time execution restriction.', caveat: 'The report describes adoption disabled in July 2026 after orphan takeover abuse. Never inherit official-repository guarantees for AUR.', funding: 'Arch community donations and volunteers.' },
  vcpkg: { pages: [20, 21], strength: 'Reviewed port changes, SHA512 upstream pins, git object hashes, and per-package SPDX SBOMs.', gap: 'CMake portfiles execute build logic; no CLI vulnerability warnings or user-binary provenance.', caveat: 'Recipes are reviewed, but users build locally. N/A publishing accounts are delegated to the contribution host.', funding: 'Microsoft C++ tooling corporate budget.' },
  homebrew: { pages: [21], strength: 'Reviewed formulae and centralized bottle builds with Sigstore-backed provenance.', gap: 'Attestation verification is opt-in; formulae execute Ruby; weak pinning and no CLI install warnings.', caveat: 'HOMEBREW_VERIFY_ATTESTATIONS must be enabled. Third-party taps do not inherit homebrew/core guarantees.', funding: 'Donations, donated CI, maintainer stipends, and project grants for provenance and audits.' },
  cran: { pages: [21, 22], strength: 'Human submission review, centralized binary builds, archival, and historical versions.', gap: 'Email-based maintainer identity without MFA, no package signing or vulnerability UI.', caveat: 'R CMD check is a quality and compatibility gate, not targeted malware detection. The report groups CRAN among curated repositories.', funding: 'Academic hosting, donated mirrors, and a small volunteer team.' },
  cpan: { pages: [22], strength: 'Per-module 06perms.txt authorization, immutable BackPAN history, and MetaCPAN security advisories.', gap: 'No PAUSE MFA, secret scanning, trusted publishing, or malware detection.', caveat: 'The report includes CPAN in its six-repository curated cohort, while describing PAUSE uploads as self-service. That grouping is not a human-review guarantee.', funding: 'Volunteer PAUSE admins and CPANSec; donated hosting and mirrors.' },
};

const registries = rows.map(([id, name, language, model, fundingModel, cli, ...ratings]) => {
  const values = ratings.flatMap(value => value.split(' '));
  if (values.length !== capabilities.length || values.some(value => !statuses[value])) {
    throw new Error(`Invalid capability ratings for ${name}`);
  }
  return { id, name, language, model, fundingModel, cli, ratings: Object.fromEntries(capabilities.map((cap, i) => [cap.id, values[i]])), ...registryNotes[id] };
});

const keyControls = ['A11', 'Z4', 'Z6', 'G5', 'G8', 'C3', 'C5', 'X9', 'X13'];
const getCapability = id => capabilities.find(cap => cap.id === id);
function sourcePage(registry, cap) {
  if (cap.track === 'A') return registries.indexOf(registry) < 8 ? 3 : 4;
  if (cap.track === 'C') return registries.indexOf(registry) < 8 ? 8 : 9;
  if (cap.track === 'X') return registries.indexOf(registry) < 5 ? 10 : 11;
  return cap.page;
}
function isLowerConfidence(registry, cap) {
  return (['npm', 'nuget', 'rubygems', 'maven', 'hex'].includes(registry.id) && ['A6', 'A9'].includes(cap.id))
    || (registry.id === 'nuget' && cap.id === 'Z6')
    || (registry.id === 'maven' && cap.id === 'G5')
    || (['debian', 'arch', 'aur'].includes(registry.id) && cap.track === 'A');
}
const shipped = id => registries.filter(registry => registry.ratings[id] === 'S');
const ecosystemCount = 15;

const insights = [
  { tag: 'THE BLIND SPOT', title: 'The incident ends. Exposure doesn’t.', stat: '0 / 15', label: 'ecosystems proactively notify exposed consumers', text: 'No row earns a shipped rating for post-removal notification. Existing partial controls require consumers to run an audit or follow a security channel.', implication: 'Opportunity: connect removal events to installed dependency inventories, with explicit consumer opt-in.', codes: ['X13', 'G9'], pages: [11, 12], kind: 'Report finding', color: 'rose' },
  { tag: 'SIGNAL OVER NOISE', title: 'Finding a CVE is not finding risk.', stat: '1 / 15', label: 'ecosystems ship native reachability analysis', text: 'Go’s govulncheck filters advisories to functions an application actually calls. The other fourteen have no comparable native capability in this assessment; external products are outside this claim.', implication: 'Opportunity: fund reachability-aware triage, not just more vulnerability reports.', codes: ['C5', 'C2'], pages: [9, 29], kind: 'Report finding', color: 'violet' },
  { tag: 'TRUST HAS MOVED', title: 'Passwordless publishing is not trustless.', stat: '5 / 15', label: 'ecosystems support trusted publishing', text: 'OIDC removes stored publisher secrets, but moves trust into CI identity and workflow execution. A compromised workflow can still receive valid publishing credentials.', implication: 'Inference: pair OIDC with restricted workflow triggers, isolated runners, and an independent release-approval gate.', codes: ['Z4', 'X8'], pages: [23, 28, 29], kind: 'Finding + inference', color: 'amber' },
  { tag: 'ARCHITECTURE > CHECKLISTS', title: 'The strongest control can be no feature.', stat: '18 N/A', label: 'Go account and authorization cells are out of scope', text: 'Go has no registry publishing accounts or API tokens. Its 12 authentication and 6 authorization N/A cells reflect an absent attack surface, not eighteen failures. Trust still lives with the VCS host.', implication: 'Inference: evaluate attack paths before counting checkmarks. Never score N/A as zero.', codes: ['A11', 'Z4', 'X1'], pages: [4, 6, 18, 19, 30], kind: 'Finding + inference', color: 'mint' },
  { tag: 'COMPOUND DEFENSE', title: 'Debian’s advantage is a combination.', stat: '6 / 6', label: 'structural controls shipped together', text: 'Debian alone combines signed metadata, immutable versions, reproducible builds, centralized builds, cooldown, and human inclusion review in the extended matrix.', implication: 'Inference: design layered release barriers; no single control substitutes for the chain. Review and reproducibility do not prove code is safe.', codes: ['X1', 'X2', 'X3', 'X4', 'X10', 'X11'], pages: [11, 19], kind: 'Finding + inference', color: 'violet' },
  { tag: 'INHERITED TRUST', title: 'Abandoned doesn’t mean untrusted.', stat: '1 / 15', label: 'ecosystems ship purpose-built maintainer-change visibility', text: 'Only Packagist earns a shipped X12 rating. The AUR incidents show how adopting an orphan can transfer an existing install base to an attacker without creating a suspicious new name.', implication: 'Inference: treat ownership succession like a sensitive release: verify identity, stage the handoff, add a cooldown, and notify consumers.', codes: ['X12', 'X8', 'X10'], pages: [11, 20, 29, 30], kind: 'Finding + inference', color: 'amber' },
  { tag: 'AVAILABLE ≠ ENFORCED', title: 'A green cell is not a coverage guarantee.', stat: '~0.2%', label: 'of gems covered by the cited critical-package MFA threshold', text: 'The report cites about 370 of 190,000+ gems under RubyGems’ download threshold. Homebrew has provenance, but verification is off by default. Existence and population coverage are different questions.', implication: 'Derived insight: 370 ÷ 190,000 is about 0.195%. Track enforcement and client versions alongside capability availability.', codes: ['A8', 'A11', 'Z6'], pages: [15, 21, 30], kind: 'Derived calculation', color: 'rose' },
  { tag: 'RESILIENCE IS A CONTROL', title: 'Security has a maintenance budget.', stat: '5', label: 'ecosystems funded as corporate line items', text: 'npm, NuGet, Maven Central, Go, and vcpkg have corporate operators. Several nonprofit ecosystems rely on recurring grants for security staff; volunteer ecosystems rely on donated capacity.', implication: 'Inference: include funding concentration and sustained staffing in dependency due diligence. The report shows association, not proof that funding causes security maturity.', codes: ['Z4', 'G7'], pages: [24, 25, 26, 27, 28, 29], kind: 'Finding + inference', color: 'mint' },
];

globalThis.RegistryAtlas = { statuses, tracks, capabilities, registries, registryNotes, keyControls, getCapability, sourcePage, isLowerConfidence, shipped, ecosystemCount, insights };
})();
