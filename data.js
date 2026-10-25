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
  {
    id: 'workflow-trust', tag: 'THE NEW CONTROL PLANE', color: 'blue',
    title: 'Trusted publishing moves the target to CI.',
    stat: `${shipped('Z4').filter(registry => registry.ratings.X8 === 'S').length} / ${shipped('Z4').length}`,
    label: 'trusted-publishing ecosystems also ship a release-approval gate',
    text: 'npm, PyPI, NuGet, RubyGems, and crates.io ship OIDC publishing. Of those five, only npm also earns a shipped staged-publishing rating. OIDC removes stored secrets, not malicious workflows: a compromised runner can still publish with a valid identity.',
    implication: 'Treat CI as production infrastructure. Restrict identity-minting triggers, isolate runners, and put release approval outside the runner’s authority. OIDC and approval must be connected, not merely available separately.',
    codes: ['Z4', 'X8'], pages: [5, 10, 23, 28, 29], kind: 'Derived intersection',
  },
  {
    id: 'proof-not-safety', tag: 'EVIDENCE IS NOT A VERDICT', color: 'green',
    title: 'Authentic, unchanged, and safe are different claims.',
    stat: '3 different proofs', label: 'integrity, build provenance, and reproducibility',
    text: 'Go’s checksum log can show that a version has not changed since first observation. Provenance links an artifact to a source and build. Reproducibility asks whether an independent rebuild matches. None establishes that the source was benign; Homebrew’s provenance verification is also opt-in.',
    implication: 'Verify each claim at consumption time and still assess the code. Do not substitute a signature or attestation badge for malware analysis, workflow review, or a reproducibility check.',
    codes: ['X1', 'Z6', 'X3'], pages: [19, 21, 23], kind: 'Report synthesis',
  },
  {
    id: 'response-loop', tag: 'THE UNFINISHED INCIDENT', color: 'rose',
    title: 'A takedown protects the next user—not the last.',
    stat: `${shipped('X13').length} / ${ecosystemCount}`, label: 'ecosystems earn shipped post-removal notification',
    text: 'npm, PyPI, and RubyGems ship machine-readable malware advisories, yet none of the 16 profiles earns shipped proactive notification to previously exposed consumers. Partial ratings rely on audits or security channels the consumer must check. Publication of an advisory is not delivery to affected users.',
    implication: 'Join removal and advisory events to dependency inventories. With consumer opt-in, identify affected installations and notify them with concrete containment and remediation steps—not just a deleted package page.',
    codes: ['G9', 'X13'], pages: [7, 11, 12, 30], kind: 'Cross-control comparison',
  },
  {
    id: 'inherited-trust', tag: 'THE NAME IS ALREADY TRUSTED', color: 'rose',
    title: 'Ownership transfer is a release-risk event.',
    stat: `${shipped('X12').length} / ${ecosystemCount}`, label: 'ecosystems earn shipped maintainer-change visibility',
    text: 'Only Packagist earns shipped X12; several others have partial visibility. The AUR adoption attacks inherited existing package names and users, bypassing the need to win trust as a new package. The report describes adoption being disabled with roughly 13,000 orphans remaining—not a solved succession process.',
    implication: 'Treat a new maintainer like a new trust boundary: verify the claimant, review the handoff, delay the first post-transfer release, and expose the change to consumers. Typosquat defenses do not address inherited trust.',
    codes: ['X12', 'X8', 'X10'], pages: [11, 20, 29, 30], kind: 'Report synthesis',
  },
  {
    id: 'effective-coverage', tag: 'THE DEFAULT IS THE DEFENSE', color: 'blue',
    title: 'A shipped feature can still leave most users outside it.',
    stat: '~0.2%', label: 'of gems covered by the cited critical-package MFA threshold',
    text: 'The report cites about 370 of 190,000+ gems under RubyGems’ MFA threshold: roughly 0.195% by package count, not download share. Homebrew verification is opt-in, npm’s script-off default depends on v12, and pip has no install-time vulnerability warning. Capability is not effective coverage.',
    implication: 'Ask four questions: Is it available? Is it enabled? Who is covered? Does the deployed client enforce it? Track those answers separately from the matrix; a roadmap commitment is not protection today.',
    codes: ['A8', 'A11', 'C2', 'X9'], pages: [12, 14, 15, 21, 30], kind: 'Derived calculation + examples',
  },
  {
    id: 'layered-barriers', tag: 'BORROW THE STRUCTURE', color: 'green',
    title: 'Self-service is borrowing the curated playbook.',
    stat: '6 linked barriers', label: 'one shipped combination, unique to Debian in this matrix',
    text: 'Debian alone combines signed metadata, immutable versions, reproducible builds, centralized builds, cooldown, and human inclusion review. Self-service roadmaps are converging on parts of that structure. The lesson is layered barriers, not a “safest registry” award: Debian scripts can still run as root, and reproducibility is not universal.',
    implication: 'Design the release path so one compromise must cross several independent barriers. Review, rebuild, delay, and verify serve different purposes; no single checkmark replaces the chain.',
    codes: ['X1', 'X2', 'X3', 'X4', 'X10', 'X11'], pages: [11, 19, 23, 28], kind: 'Cross-control comparison',
  },
  {
    id: 'architecture', tag: 'REMOVE AN ATTACK SURFACE', color: 'green',
    title: 'Sometimes the best account control is no registry account.',
    stat: `${capabilities.filter(cap => ['A', 'Z'].includes(cap.track) && registries.find(registry => registry.id === 'go').ratings[cap.id] === 'X').length} N/A`,
    label: 'Go authentication and authorization cells—not 18 failures',
    text: 'Go has no registry publishing accounts or tokens to steal. That removes a class of registry-side attacks, but moves identity trust to the source host. A compromised source account can still introduce a malicious new version. Likewise, Arch official and AUR cannot inherit each other’s guarantees just because they share an ecosystem.',
    implication: 'Map the real trust boundaries before comparing controls: source host, registry, build service, and client. Evaluate the actual distribution path; never turn N/A into a zero or average unlike architectures into a safety score.',
    codes: ['A11', 'Z4', 'X11'], pages: [4, 6, 18, 19, 20, 30], kind: 'Architectural comparison',
  },
  {
    id: 'triage-bottleneck', tag: 'JUDGMENT IS THE BOTTLENECK', color: 'blue',
    title: 'More findings are not the same as better decisions.',
    stat: `${shipped('C5').length} / ${ecosystemCount}`, label: 'ecosystems ship native reachability analysis',
    text: 'Only Go ships ecosystem-native reachability analysis in this assessment. govulncheck narrows findings to vulnerable functions an application calls. The report links cheaper AI-assisted discovery to a growing need for verified triage: more reports can consume scarce maintainer time without making prioritization better. External tools are outside the native-tooling count.',
    implication: 'Fund reachability-aware tooling alongside human triage. Prioritize actionable exposure over advisory volume, while remembering that reachability analysis is neither a malware detector nor proof of exploitability.',
    codes: ['C2', 'C5'], pages: [9, 19, 29], kind: 'Report synthesis',
  },
  {
    id: 'sustainable-security', tag: 'THE HIDDEN SHARED DEPENDENCY', color: 'rose',
    title: 'A capability grant is not an operating model.',
    stat: 'Beyond the audit', label: 'security needs recurring people, not just one funded project',
    text: 'The same funders recur across ecosystems: Alpha-Omega supported work at PyPI, RubyGems, Packagist, crates.io, hex.pm, and Homebrew. Corporate ownership creates a different concentration risk. The report describes audits followed by staffed residencies turning findings into shipped controls; a one-off project does not fund ongoing operation. This is association, not proof of causation.',
    implication: 'Include operator and funding concentration in dependency due diligence. Support recurring maintenance and incident-response capacity, not only feature launches. Technical diversity can still share a financial single point of failure.',
    codes: ['G7'], pages: [24, 25, 26, 27, 28, 29], kind: 'Report synthesis',
  },
];

globalThis.RegistryAtlas = { statuses, tracks, capabilities, registries, registryNotes, keyControls, getCapability, sourcePage, isLowerConfidence, shipped, ecosystemCount, insights };
})();
