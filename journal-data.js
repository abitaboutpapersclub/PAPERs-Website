import { SUPABASE_URL, SUPABASE_ANON_KEY } from './supabase-config.js';

const configured = !!SUPABASE_URL && !SUPABASE_URL.includes('YOUR_') && !!SUPABASE_ANON_KEY && !SUPABASE_ANON_KEY.includes('YOUR_');
export const isBackendConfigured = configured;

const REST = SUPABASE_URL + '/rest/v1';
const STORAGE = SUPABASE_URL + '/storage/v1';
const authHeaders = { apikey: SUPABASE_ANON_KEY, Authorization: 'Bearer ' + SUPABASE_ANON_KEY };
async function rest(path, opts = {}) {
  const res = await fetch(REST + path, { ...opts, headers: { ...authHeaders, ...(opts.headers || {}) } });
  const text = await res.text();
  if (!res.ok) throw new Error('DB ' + res.status + ': ' + text.slice(0, 200));
  return text ? JSON.parse(text) : null;
}

const ISSUE = 'Vol. 2 \u00b7 2026 Cohort';
let n = 0;
// Papers carry no abstract or page range yet — the journal hides both when blank.
const P = (disc, tag, title, author) => ({
  id: 'd' + (++n), discipline: disc, tag, title, author, abstract: '',
  issue: ISSUE, pages: '', date: 'May 2026', pdf: null, pdfName: '',
});
export const defaultPapers = [
  P('Biology & Life Sciences', 'Gene Editing', 'A Comparative Review of CRISPR-Cas9 Based Therapeutic Strategies for Ankylosing Spondylitis', 'Ryan Baek, Charlize Sow, Ethan Xu'),
  P('Biology & Life Sciences', 'Developmental Biology', 'Aspartame and Its Effects on Embryonic Development', 'Barrett Kim, Dillon Chugani'),
  P('Biology & Life Sciences', 'Protein Engineering', 'Can Targeted Amino Acid Substitutions in CPD Photolyase of Rice Near the FAD-Binding Pocket Be Computationally Designed to Stabilize the HQ State of the FAD Cofactor, Enhancing DNA Repair Efficiency Under High UV-B Conditions?', 'Alyssa Gu, Aishwarya Ananthakrishnan, Edward Kim'),
  P('Biology & Life Sciences', 'Neuroscience', 'The Role of Astrocytes as Contributors to Epileptogenesis and Strategic Future Targets for Epilepsy Treatment', 'Andy Song'),
  P('Biology & Life Sciences', 'Cognitive Science', 'Cross-Linguistic Patterns in Inducer Concurrent Pairings of Grapheme-Color Synesthesia', 'Carys Harvin'),
  P('Biology & Life Sciences', 'Cell Biology', 'The Effect of Mitochondrial Therapy on Senescent Cells', 'Shaivi Kancharla'),
  P('Medicine & Health', 'Pharmacology', 'A Systematic Review on the Use of Oxytocin and Oxytocin Receptor Antagonists to Treat Endometriosis', 'Colin Lee'),
  P('Medicine & Health', 'Psychiatry', 'The Relationship Between the Receptor Retaining Properties of Aripiprazole and the Effectiveness in Reducing Agitation Symptoms of Schizophrenic Patients', 'Michelle Kim, Johannah Huang'),
  P('Medicine & Health', 'Public Health', 'The Role of Socioeconomic Status in Breast Cancer Screening Access and Late-Stage Diagnosis in Low-Income Thai Communities', 'Gemmi Haripottawekul'),
  P('Medicine & Health', 'Oncology', 'Blood–Brain Barrier Development and Treatment Response in Pediatric Brain Tumors', 'Maddie Yang'),
  P('Economics', 'Behavioral Economics', 'The Impact of Behavioral Economics on Consumer Decision-Making: A Case Study of Anchoring in E-Commerce Pricing Strategies', 'Niccolo Lee-Suk, Eric Myung, Edward Zhang, Daniel Matloff'),
  P('Economics', 'Economic History', 'The Creation of the Bank of England and its Effect on Humanity\'s Political, Economic, and Societal Development from its Creation in 1800', 'Felix Bret'),
  P('Economics', 'Health Economics', 'Policy, Politics, and Performance: A Mixed-Methods Analysis of Medicaid Expansion\'s Impact on Hospital Finances in Kentucky and Texas', 'Andrew Park'),
  P('Social Sciences', 'Game Theory', 'Game Theory\'s Impact on Minorities', 'Aglaia Hong'),
  P('Social Sciences', 'Media & Cognition', 'Impulse Control and Digital Advertising: A Comparative Analysis of Differing Techniques Utilized by Snapchat and Roblox and Their Resulting Impact on Adolescent Brain Development', 'Mel Guedes, Nandini Sharma'),
  P('Social Sciences', 'Education Policy', 'Meritocracy and the Socio-Economic Stratification in Selective Higher Education', 'Julien Requa, John Lew, Lucas Suradejvibul'),
  P('Social Sciences', 'Psychology', 'The Illusion of Transparency in Boarding School: Overestimating Visibility', 'Jacob Shin'),
  P('Computer Science', 'Machine Learning', 'DeepStain: A Unified Approach for Multi-Domain Immunofluorescence and Immunohistochemistry Staining via Image-to-Image Translation', 'Nicholas Jung'),
  P('Computer Science', 'Quantum Computing', 'Analyzing Energy Consumption, Efficiency, and Scalability in Classical and Quantum Machines', 'Soohan Cho'),
  P('Other', 'Astronomy', 'Providing Evidence Against the Fermi Paradox: Incorporating the Kardashev Scale and Drake Equation to Contextualize Life in the Known Universe', 'Claire Bancroft, Ian Kim'),
  P('Other', 'History', 'Analysis of How Machine Politics Affected New York City Public Works Procurement from 1910–1918', 'Anay Mehta-Manghani, Boson Bai'),
  P('Other', 'Classics', 'Translation and Interpretation of Female Transformation in Ovid\'s Metamorphoses', 'Serra Akyali'),
];

const STORAGE_KEY = 'papers_journal_data_v2';
const TABLE = 'papers';
const BUCKET = 'papers-pdfs';

// ── row <-> app-shape mapping ──
function fromRow(r) {
  return { id: r.id, discipline: r.discipline, tag: r.tag, title: r.title, author: r.author, abstract: r.abstract, issue: r.issue, pages: r.pages, date: r.date, pdf: r.pdf_url || null, pdfName: r.pdf_name || '' };
}
function toRow(p) {
  return { title: p.title, author: p.author, discipline: p.discipline, tag: p.tag, issue: p.issue, pages: p.pages, date: p.date, abstract: p.abstract, pdf_url: p.pdf || null, pdf_name: p.pdfName || '' };
}

// ── local-storage fallback (used until backend is configured) ──
function loadLocal() {
  try { const s = JSON.parse(localStorage.getItem(STORAGE_KEY)); if (Array.isArray(s) && s.length) return s; } catch (e) {}
  return defaultPapers;
}
function saveLocal(list) { localStorage.setItem(STORAGE_KEY, JSON.stringify(list)); }

// ── public API (all async so callers work with or without a backend) ──
export async function fetchPapers() {
  if (!configured) return loadLocal();
  try {
    let data = await rest('/' + TABLE + '?select=*&order=created_at.asc');
    if (!data || !data.length) {
      try { await rest('/' + TABLE, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(defaultPapers.map(toRow)) }); } catch (e) { console.warn('[journal] seed failed:', e.message); }
      data = await rest('/' + TABLE + '?select=*&order=created_at.asc');
    }
    return (data || []).map(fromRow);
  } catch (e) {
    console.warn('[journal] fetch failed, using local fallback:', e.message);
    return loadLocal();
  }
}

export async function uploadPdf(file) {
  const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const path = Date.now() + '-' + safe;
  if (!configured) { // local: keep as data URL
    return await new Promise((res) => { const r = new FileReader(); r.onload = () => res({ url: r.result, name: file.name }); r.readAsDataURL(file); });
  }
  const res = await fetch(STORAGE + '/object/' + BUCKET + '/' + encodeURIComponent(path), {
    method: 'POST', headers: { ...authHeaders, 'Content-Type': 'application/pdf' }, body: file,
  });
  if (!res.ok) throw new Error('Upload ' + res.status + ': ' + (await res.text()).slice(0, 200));
  return { url: STORAGE + '/object/public/' + BUCKET + '/' + encodeURIComponent(path), name: file.name };
}

export async function addPaper(p) {
  if (!configured) { const list = loadLocal(); const rec = { id: 'u' + Date.now(), ...p }; saveLocal([...list, rec]); return rec; }
  const data = await rest('/' + TABLE, { method: 'POST', headers: { 'Content-Type': 'application/json', Prefer: 'return=representation' }, body: JSON.stringify(toRow(p)) });
  return fromRow(data[0]);
}

export async function updatePaper(id, p) {
  if (!configured) { const list = loadLocal().map(x => x.id === id ? { ...x, ...p } : x); saveLocal(list); return list.find(x => x.id === id); }
  const data = await rest('/' + TABLE + '?id=eq.' + encodeURIComponent(id), { method: 'PATCH', headers: { 'Content-Type': 'application/json', Prefer: 'return=representation' }, body: JSON.stringify(toRow(p)) });
  return fromRow(data[0]);
}

export async function deletePaper(id) {
  if (!configured) { saveLocal(loadLocal().filter(x => x.id !== id)); return; }
  await rest('/' + TABLE + '?id=eq.' + encodeURIComponent(id), { method: 'DELETE' });
}

export async function resetToDefaults() {
  if (!configured) { localStorage.removeItem(STORAGE_KEY); return; }
  await rest('/' + TABLE + '?id=neq.00000000-0000-0000-0000-000000000000', { method: 'DELETE' });
  await rest('/' + TABLE, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(defaultPapers.map(toRow)) });
}

// legacy sync helper kept for any older callers
export function loadPapers() { return loadLocal(); }
