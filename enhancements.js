'use strict';

const toolSources = {
  compoundCalculator: { document: 'BeruApp compound reference', revision: 'Imported product data; brochure edition not recorded', coverage: '14 compounds. Temperature and pressure screening uses recorded limits. Exact fluid compatibility needs the product reference.', assumptions: '10 sticks per box. Weight is net fill mass; purchased mass includes whole sticks. No wastage allowance is added.', data: 'compounds.json' },
  nonCircularCalc: { document: 'Master Calc Rev 1.28 M.xlsm — NON-CIRCULAR', revision: 'Workbook cites ASME BPVC VIII-1 2025 and II-D 2025', coverage: 'UG-34 endplate assessment with a separately supplied shell thickness requirement. Full Appendix 13 shell analysis is outside this tool.', assumptions: 'Figure UG-34(b-2) attachment model from the workbook. H is the shorter span. Welded endplate efficiency is 0.7; machined is 1.0. Linear stress interpolation only inside the recorded range.', data: 'engineering_calcs.json' },
  circularCalc: { document: 'Master Calc Rev 1.28 M.xlsm — STRAIGHTLINE', revision: 'Workbook cites ASME BPVC VIII-1 2025 and II-D 2025', coverage: 'Internal-pressure shell and flat-endplate thickness checks for the workbook geometry. These checks do not establish full vessel compliance.', assumptions: 'Shell thickness must equal (OD − ID) / 2. ID basis: UG-27(c)(1); OD basis: Appendix 1-1. UG-34 attachment factor follows the workbook. Selected joint efficiency applies to both checks.', data: 'engineering_calcs.json' },
  boltStandaloneCalc: { document: 'Master Calc Rev 1.28 M.xlsm — BOLTING STANDALONE', revision: 'Workbook cites ASME PCC-1-2022 and BPVC 2025', coverage: 'Uniform pressure load per bolt and three separate torque estimates. A maximum allowable assembly torque is not established by these estimates.', assumptions: 'Uniform bolt loading, negligible flange bending, common thread/bearing friction, 60° thread profile. Parting estimate uses 1.1 × nominal bolt load. Preload uses the recorded yield strength, which is not temperature-adjusted.', data: 'engineering_calcs.json' },
  asmeTable1A: { document: 'ASME BPVC II - Part D Table 1A Rev01.xlsx', revision: 'Rev01 import; standard edition not recorded in the imported table', coverage: 'Ferrous material rows at tabulated temperatures only. Notes, condition, thickness limits and section applicability accompany each row.', assumptions: 'Missing stresses stay unavailable. No interpolation or extrapolation in this lookup. Note codes are reproduced; their full definitions are not supplied in the imported dataset.', data: 'asme_table_1a.json' },
  materialGuideLookup: { document: 'Material Guide based on Temp.pdf', revision: 'Edition / revision not recorded in source', coverage: 'Temperature bands and material families reproduced from the guide.', assumptions: 'A temperature match is a starting point for material selection. Blank source cells are identified explicitly.', link: 'source_information/references/material-guide.pdf' },
  pipeScheduleLookup: { document: 'Existing pipes.json plus Van Leeuwen ASME B36.10 / B36.19 pipe chart, page 2', revision: 'Existing source edition unknown; added NPS 26–48 reference checked 2 November 2026. Not certified to B36.10-2026.', coverage: 'NPS ⅛–48; only recorded schedules. Added metric OD values follow the supplier chart; converted inch values are derived from those metric values.', assumptions: 'NPS and DN are nominal designations. OD is the outside diameter; unavailable schedules are not inferred.', data: 'pipes.json' },
  elbowDimensions: { document: '90 degree elbow reference', revision: 'Source edition not recorded', coverage: 'Long-radius NPS ½–48; short-radius NPS 1–48.', assumptions: 'Center-to-end dimension A only. Dimensions do not establish fitting pressure rating.', link: 'source_information/references/90-elbow-long-radius.pdf' },
  ansiFlanges: { document: 'Imported ANSI B16.5 flange reference — flanges.json', revision: 'Source edition not recorded', coverage: 'Weld neck and slip-on dimensions; only recorded size/class/type combinations are offered.', assumptions: 'Flange class is a designation, not a pressure in bar or psi. Pressure–temperature ratings are not part of this lookup.', data: 'flanges.json' },
  boltNutReference: { document: 'Workbook Appendix H bolting reference', revision: 'Workbook cites ASME PCC-1-2022 Table H-1 / H-1M', coverage: 'Recorded metric and imperial bolt/nut dimensions. Empty cells remain unavailable.', assumptions: 'Recorded dimensions are in mm and areas in mm², including rows with imperial nominal sizes. Recorded dimensional values are not nominal thread designations. Inch equivalents are shown for inch fasteners.' },
  sans347Hazard: { document: 'SANS347 Cat.txt and existing category rules', revision: 'Standard edition not recorded in supplied reference', coverage: 'Separate piping (PS × DN) and volume (PS × V) screening outputs for the selected fluid group.', assumptions: 'Select the assessment applicable to the equipment. SEP means sound engineering practice. Full regulatory applicability and exceptions are not evaluated.', link: 'source_information/references/SANS347%20Cat.txt' },
  weldingProcedure: { document: 'Imported Beruseal WPS summaries — wps.json', revision: 'Individual revision shown in each procedure', coverage: 'Six procedure summaries. Filter by process, material, or groove thickness.', assumptions: 'Thickness filtering uses the recorded groove range only. Qualification records and approved original WPS documents are not included.', data: 'wps.json' },
  unitConverter: { document: 'Unit definitions in BeruApp', revision: 'Exact SI relationships and standard conversion factors', coverage: 'Length, volume, pressure, temperature, and simple geometry.', assumptions: 'US gallons. Pressure conversion changes units only; it does not change gauge pressure to absolute pressure.' }
};
const datasetStatus = {};
const toolData = { nonCircularCalc: 'engineering_calcs.json', circularCalc: 'engineering_calcs.json', boltStandaloneCalc: 'engineering_calcs.json', asmeTable1A: 'asme_table_1a.json', pipeScheduleLookup: 'pipes.json', ansiFlanges: 'flanges.json', weldingProcedure: 'wps.json' };
let inputUnitMode = 'metric', asmePage = 0, announceTimer, currentLoad = null;
const appStoragePrefix = 'beruapp-v2-';
function readStored(key, fallback) { try { return JSON.parse(localStorage.getItem(appStoragePrefix + key)) ?? fallback; } catch { return fallback; } }
function writeStored(key, value) { try { localStorage.setItem(appStoragePrefix + key, JSON.stringify(value)); return true; } catch { return false; } }
function notifyUser(message) { byId('liveMessage').textContent = message; byId('workspaceMessage').textContent = message; }
function numericInputValue(id) {
  const input = byId(id);
  if (!input || input.value.trim() === '') return NaN;
  const raw = Number(input.value);
  if (!Number.isFinite(raw)) return NaN;
  if (!input.dataset.quantity) return raw;
  if (input.dataset.convertedRaw === input.value && Number.isFinite(Number(input.dataset.canonicalValue))) return Number(input.dataset.canonicalValue);
  if (input.dataset.unitMode !== 'imperial') return raw;
  return toMetric(raw, input.dataset.quantity);
}
function toMetric(value, kind) { return ({ length: v => v * 25.4, area: v => v * 645.16, volume: v => v * 16387.064, litres: v => v / 0.2641720524, mpa: v => v / 145.0377377, kpa: v => v / 0.1450377377, bar: v => v / 14.50377377, temperature: v => (v - 32) * 5 / 9 }[kind] || (v => v))(value); }
function fromMetric(value, kind) { return ({ length: v => v / 25.4, area: v => v / 645.16, volume: v => v / 16387.064, litres: v => v * 0.2641720524, mpa: v => v * 145.0377377, kpa: v => v * 0.1450377377, bar: v => v * 14.50377377, temperature: v => v * 9 / 5 + 32 }[kind] || (v => v))(value); }
function inputSuffix(kind, mode) {
  return mode === 'imperial' ? ({ length:'in',area:'in²',volume:'in³',litres:'US gal',mpa:'psi',kpa:'psi',bar:'psi',temperature:'°F' })[kind] : ({length:'mm',area:'mm²',volume:'mm³',litres:'L',mpa:'MPa',kpa:'kPa',bar:'bar',temperature:'°C'})[kind];
}
function applyInputUnits(mode, persist = true) {
  inputUnitMode = mode === 'imperial' ? 'imperial' : 'metric';
  document.querySelectorAll('input[data-quantity]').forEach(input => setFieldUnit(input, inputUnitMode));
  byId('inputUnitMode').value = inputUnitMode;
  updateUnitBanners();
  if (persist) { writeStored('inputUnits', inputUnitMode); writeStored('fieldUnits', fieldUnitSnapshot()); document.querySelectorAll('.view').forEach(view=>recordDraft(view)); }
  runAllLiveCalculators(); updateCompoundScreen(); filterWps();
}
function announceResult(element) {
  clearTimeout(announceTimer);
  announceTimer = setTimeout(() => { if (element.closest('.view.active')) byId('liveMessage').textContent = element.textContent.trim().slice(0, 700); }, 500);
}
function activeView() { return document.querySelector('.view.active'); }
function activeTool() { return activeView()?.id || 'compoundCalculator'; }
function inputSnapshot(view = activeView()) { return Object.fromEntries([...view.querySelectorAll('input[id], select[id]')].map(el => [el.id, el.value])); }
function recordDraft(view = activeView()) { writeStored('draft-' + view.id, { schema: 2, values: inputSnapshot(view), inputUnits: inputUnitMode, fieldUnits: fieldUnitSnapshot(view) }); }
function restoreValues(values, view) {
  for (const [id, value] of Object.entries(values || {})) {
    const el = byId(id);
    if (!el || !view.contains(el) || typeof value !== 'string') continue;
    el.value = value;
    delete el.dataset.convertedRaw; delete el.dataset.canonicalValue;
    el.dispatchEvent(new Event(el.tagName === 'SELECT' ? 'change' : 'input', { bubbles: true }));
  }
  refreshActiveTool();
}
function refreshActiveTool() {
  const tool = activeTool();
  if (tool === 'compoundCalculator') { showSelectedCompoundCalculator(); updateCompoundScreen(); }
  if (tool === 'weldingProcedure') { filterWps(); showWpsData(); }
  if (tool === 'asmeTable1A') renderAsmeTable();
  if (tool === 'ansiFlanges') { syncFlangeOptions(); showFlangeData(); }
  if (tool === 'pipeScheduleLookup') showPipeData();
  if (tool === 'elbowDimensions') showElbowData();
  if (tool === 'materialGuideLookup') showMaterialGuideByTemp();
  if (tool === 'boltNutReference') showBoltNutData();
  runAllLiveCalculators();
}
function initEnhancements() {
  document.querySelectorAll('.nav-item').forEach(button => button.dataset.search = `${button.textContent} ${titles[button.dataset.view]?.[1] || ''}`.toLowerCase());
  byId('settingsPanel').insertAdjacentHTML('beforeend', '<div class="settings-row"><label>Set all input fields<select id="inputUnitMode"><option value="metric">mm / MPa / °C</option><option value="imperial">in / psi / °F</option></select></label><span class="settings-note">Each input also has its own unit selector. Switching converts the entered value.</span></div><div class="settings-row"><button class="secondary" data-action="retrySourceData">Retry source data</button><button class="secondary" data-action="checkForUpdates">Check for app update</button><div id="datasetDetails" class="support-note"></div></div>');
  document.querySelector('.topbar').insertAdjacentHTML('afterend', '<div class="status-line"><span id="connectionStatus"></span><span id="updateStatus"></span></div><div class="tool-actions"><button class="secondary" data-action="toggleFavourite" id="favouriteButton">Add to favourites</button><button class="secondary" data-action="clearTool">Clear inputs</button><button class="secondary" data-action="loadExample">Load example</button><button class="secondary" data-action="toggleWorkspace" aria-expanded="false" aria-controls="workspacePanel" id="workspaceToggle">Save / report</button></div><div id="workspacePanel" class="report-panel" hidden><div class="saved-row"><label>Calculation name<input id="calculationName" maxlength="120" placeholder="Job number or description"></label><button data-action="saveCalculation">Save on this device</button></div><div class="saved-row"><label>Saved calculations<select id="savedCalculations"></select></label><button class="secondary" data-action="loadCalculation">Load</button><button class="secondary" data-action="deleteCalculation">Remove saved copy</button></div><div class="report-actions"><button class="secondary" data-action="copyReport">Copy report</button><button class="secondary" data-action="downloadReport">Download report</button><button class="secondary" data-action="printReport">Print / save PDF</button></div><p class="support-note">Reports include visible inputs, results, units, source details and app version. Saved calculations stay on this device.</p></div><p id="workspaceMessage" role="status" class="support-note"></p>');
  document.querySelectorAll('.view').forEach(view => {
    view.insertAdjacentHTML('afterbegin', '<p class="unit-banner"></p>');
    const source = toolSources[view.id];
    view.insertAdjacentHTML('beforeend', `<details class="source-info" id="source-${view.id}"><summary>Source, scope and assumptions</summary><dl><dt>Source</dt><dd>${esc(source.document)}</dd><dt>Revision / edition</dt><dd>${esc(source.revision)}</dd><dt>Coverage</dt><dd>${esc(source.coverage)}</dd><dt>Assumptions</dt><dd>${esc(source.assumptions)}</dd><dt>Data version</dt><dd>${esc(SOURCE_DATA_VERSION)}</dd></dl>${source.link ? `<a href="${source.link}" target="_blank" rel="noopener">Open supplied reference</a>` : ''}</details>`);
    view.querySelectorAll('.result, .working').forEach(el => { el.classList.add('reference-result'); });
  });
  document.querySelector('#compoundCalculator .grid').insertAdjacentHTML('beforeend', '<label>Operating temperature (°C)<input type="number" id="compoundTemperature" placeholder="Optional"></label><label>Operating pressure (bar)<input type="number" id="compoundPressure" placeholder="Optional"></label>');
  byId('compoundInformation').insertAdjacentHTML('beforebegin', '<div id="compoundScreen" class="support-note"></div><details class="compound-details"><summary>Compare compounds for this service</summary><div id="compoundComparison" class="comparison-panel"></div></details><p class="support-note">Choose a geometry below to calculate volume immediately. Choose a compound to add sticks, boxes and weight. Dimensions are retained when switching products.</p>');
  byId('asmeTableWrap').insertAdjacentHTML('beforebegin', '<div class="grid two"><label>Tabulated temperature<select id="asmeTemperature"></select></label><label>Display<select id="asmeLayout"><option value="cards">Material cards</option><option value="table">Comparison table</option></select></label></div><div id="asmePager" class="pager"></div>');
  const advancedFilters = document.createElement('details'); advancedFilters.className='source-info'; advancedFilters.innerHTML='<summary>Advanced material filters</summary>';
  advancedFilters.append(byId('asmeTable1A').querySelector('.filter-toolbar'));
  byId('asmeTemperature').closest('.grid').after(advancedFilters);
  byId('asmeTableWrap').setAttribute('tabindex', '0'); byId('asmeTableWrap').setAttribute('role', 'region'); byId('asmeTableWrap').setAttribute('aria-label', 'ASME material results');
  byId('wpsSelect').closest('.grid').insertAdjacentHTML('beforebegin', '<div class="grid three"><label>Welding process<select id="wpsProcess"><option value="">All processes</option></select></label><label>Base material<select id="wpsMaterial"><option value="">All materials</option></select></label><label>Groove thickness (mm)<input type="number" id="wpsThickness" placeholder="Optional"></label></div><p id="wpsCount" class="support-note"></p>');
  byId('lengthResult').closest('.section').insertAdjacentHTML('beforebegin', '<div class="section"><h3>Temperature conversion</h3><div class="grid three"><label>Value<input type="number" id="temperatureInput" placeholder="Enter temperature"></label><label>From<select id="temperatureFrom"><option value="C">°C</option><option value="F">°F</option><option value="K">K</option></select></label><label>To<select id="temperatureTo"><option value="F">°F</option><option value="C">°C</option><option value="K">K</option></select></label></div><div class="result" id="temperatureResult"></div></div>');
  addGeometryGuides(); addRelatedTools();
  document.querySelectorAll('.view input[type="number"]').forEach(input => {
    input.step = ['boltCount','grooveBoreCount1','grooveBoreCount2','grooveBoreCount3'].includes(input.id) ? '1' : 'any';
    const label = input.closest('label'), text = label?.firstChild?.textContent.trim() || '';
    const match = text.match(/\((mm³|mm3|mm²|mm2|mm|MPa|kPa|bar|°C|C|L)\)$/);
    const kind = match && ({mm:'length','mm³':'volume',mm3:'volume','mm²':'area',mm2:'area',MPa:'mpa',kPa:'kpa',bar:'bar','°C':'temperature',C:'temperature',L:'litres'})[match[1]];
    if (kind) { input.dataset.quantity = kind; input.dataset.caption = text.replace(/\s*\([^)]*\)$/, ''); }
    if (['boltCount','grooveBoreCount1','grooveBoreCount2','grooveBoreCount3'].includes(input.id)) input.min = input.id === 'boltCount' ? '1' : '0';
    if (input.id === 'boltPreload') { input.min = '0.01'; input.max = '100'; }
    if (input.id === 'boltFriction') { input.min = '0.001'; input.max = '1'; }
  });
  initUnitPreferences();
  populateSavedCalculations(); renderQuickTools(); updateConnectionStatus();
  window.addEventListener('online', updateConnectionStatus); window.addEventListener('offline', updateConnectionStatus);
  window.addEventListener('beforeprint', preparePrintReport);
  window.addEventListener('afterprint', () => byId('printReportDocument')?.remove());
  window.addEventListener('hashchange', () => openToolFromLocation(true));
  document.addEventListener('input', enhancedInput);
  document.addEventListener('change', enhancedChange);
  document.addEventListener('keydown', trapMobileFocus);
  const observer = new MutationObserver(changes => { const el = changes.map(c => c.target.nodeType === 1 ? c.target : c.target.parentElement).find(el => el.closest?.('.result')); if (el) announceResult(el.closest('.result')); });
  document.querySelectorAll('.view .result').forEach(el => observer.observe(el, {childList:true, subtree:true, characterData:true}));
  openToolFromLocation(true);
}
function enhancedInput(event) {
  if (event.target.id === 'toolSearch') filterTools();
  if (['compoundTemperature','compoundPressure'].includes(event.target.id)) { updateCompoundScreen(); runAllLiveCalculators(); }
  if (event.target.id === 'wpsThickness') filterWps();
  if (event.target.id === 'temperatureInput') convertTemperature();
  if (event.target.id === 'asmeSearch') asmePage = 0;
  if (event.target.closest('.view')) recordDraft(event.target.closest('.view'));
}
function enhancedChange(event) {
  const id = event.target.id;
  if (id === 'inputUnitMode') { applyInputUnits(event.target.value); recordDraft(); }
  if (id.startsWith('asmeFilter') || ['asmeTemperature','asmeLayout'].includes(id)) { asmePage = 0; renderAsmeTable(); }
  if (['wpsProcess','wpsMaterial'].includes(id)) filterWps();
  if (id.startsWith('temperature')) convertTemperature();
  if (['compoundSelect','compoundType','compoundFluidGroup'].includes(id)) updateCompoundScreen();
  if (event.target.closest('.view')) recordDraft(event.target.closest('.view'));
}
function filterTools() {
  const query = byId('toolSearch').value.trim().toLowerCase();
  document.querySelectorAll('.nav-group').forEach(group => {
    let matches = 0;
    group.querySelectorAll('.nav-item').forEach(button => { button.hidden = !button.dataset.search.includes(query); if (!button.hidden) matches++; });
    group.hidden = !matches;
    if (query && matches) group.open = true;
  });
}
function renderQuickTools() {
  const favourites = readStored('favourites', []).filter(id => titles[id]);
  const recent = readStored('recent', []).filter(id => titles[id] && !favourites.includes(id)).slice(0, 3);
  const buttons = ids => ids.map(id => `<button type="button" data-view="${id}">${esc(titles[id][0])}</button>`).join('');
  byId('quickTools').innerHTML = `${favourites.length ? '<p>Favourites</p>' + buttons(favourites) : ''}${recent.length ? '<p>Recent tools</p>' + buttons(recent) : ''}`;
  byId('favouriteButton').textContent = favourites.includes(activeTool()) ? 'Remove favourite' : 'Add to favourites';
  byId('favouriteButton').setAttribute('aria-pressed', String(favourites.includes(activeTool())));
}
function toggleFavourite() { const saved = readStored('favourites', []).filter(id => titles[id]); const id = activeTool(); writeStored('favourites', saved.includes(id) ? saved.filter(v => v !== id) : [...saved, id]); renderQuickTools(); }
function openToolFromLocation(initial = false) {
  const hash = location.hash.slice(1), stored = readStored('lastTool', 'compoundCalculator');
  const id = titles[hash] ? hash : titles[stored] ? stored : 'compoundCalculator';
  navigate(id, document.querySelector(`.nav-item[data-view="${id}"]`), false, !initial);
}
function rememberTool(id) { writeStored('lastTool', id); writeStored('recent', [id, ...readStored('recent', []).filter(v => v !== id)].slice(0, 5)); renderQuickTools(); }
function toggleWorkspace() { const panel = byId('workspacePanel'); panel.hidden = !panel.hidden; byId('workspaceToggle').setAttribute('aria-expanded', String(!panel.hidden)); if (!panel.hidden) byId('calculationName').focus(); }
function clearTool() {
  const view = activeView();
  view.querySelectorAll('input').forEach(el => { el.value = ''; el.removeAttribute('aria-invalid'); });
  if (view.id === 'asmeTable1A') clearAsmeSearch();
  if (view.id === 'weldingProcedure') { byId('wpsProcess').value = ''; byId('wpsMaterial').value = ''; }
  if (view.id === 'compoundCalculator') { byId('compoundType').value = ''; updateCompoundFluidGroups(); }
  refreshActiveTool(); recordDraft(); notifyUser('Inputs cleared. Selectors and unit settings are retained.');
}
const exampleInputs = {
  compoundCalculator: { clampLength:200,clampWidth:150,grooveWidth:15,grooveDepth:10,grooveBoreOD1:60.3,grooveBoreCount1:2,internalLength:100,clampID:120,pipeOD2:60.3,sqLength:150,sqDepth:80,sqWidth:120,pipeOD3:48.3,pipeLength:150,cavityVolumeInput:500000,existingVolumeInput:150000 },
  nonCircularCalc: {ncPressure:1,ncTemp:40,ncCA:0,ncH:150,ncSmallH:150,ncTr:23.67,ncT1a:25,ncT2a:25,ncEndActual:12},
  circularCalc: {circPressure:1,circTemp:40,circCA:0,circOD:108,circID:88,circShellActual:10,circEndActual:16},
  boltStandaloneCalc: {boltPressure:1,boltTemp:40,boltArea:17671.46,boltCount:2,boltClearance:2,boltPreload:50,boltFriction:0.16},
  sans347Hazard: {sansPressure:500,sansVolume:1},
  unitConverter: {lengthInput:25.4,volumeInput:1000,pressureInput:1,temperatureInput:100,rectLength:100,rectWidth:80,rectHeight:60,cylDiameter:100,cylLength:150,unitAnnularOD:120,unitAnnularID:60}
};
function loadExample() {
  const inputs = exampleInputs[activeTool()];
  if (!inputs) { notifyUser('This reference uses selectors rather than example inputs.'); return; }
  for (const [id,value] of Object.entries(inputs)) { const el = byId(id); el.value = String(el.dataset.unitMode === 'imperial' && el.dataset.quantity ? Number(fromMetric(value, el.dataset.quantity).toPrecision(12)) : value); }
  refreshActiveTool(); recordDraft(); notifyUser('Example dimensions loaded. Replace them with your job values.');
}
function populateSavedCalculations() {
  const list = readStored('saved', []).filter(item => item?.schema === 2 && titles[item.tool]);
  byId('savedCalculations').innerHTML = '<option value="">Select a saved calculation</option>' + list.map(item => `<option value="${esc(item.id)}">${esc(item.name)} — ${esc(titles[item.tool][0])}</option>`).join('');
}
function saveCalculation() {
  const name = byId('calculationName').value.trim();
  if (!name) { notifyUser('Enter a calculation name before saving.'); byId('calculationName').focus(); return; }
  const item = {id:crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),schema:2,name,tool:activeTool(),values:inputSnapshot(),inputUnits:inputUnitMode,fieldUnits:fieldUnitSnapshot(),displayPreferences:displayPreferenceSnapshot(),resultUnits:unitMode,created:new Date().toISOString(),appVersion:APP_VERSION,sourceVersion:SOURCE_DATA_VERSION};
  const items = readStored('saved', []).filter(item => item?.schema === 2);
  if (!writeStored('saved', [...items, item])) { notifyUser('Device storage is unavailable or full. Download a report to keep a copy.'); return; }
  populateSavedCalculations(); byId('savedCalculations').value = item.id; notifyUser(`Saved “${name}” on this device.`);
}
function loadCalculation() {
  const item = readStored('saved', []).find(item => item.id === byId('savedCalculations').value && item.schema === 2 && titles[item.tool]);
  if (!item) { notifyUser('Select a saved calculation first.'); return; }
  applyInputUnits(item.inputUnits, false); applyUnitMode(item.resultUnits); restoreDisplayPreferences(item.displayPreferences || legacyDisplayPreferences(item.resultUnits)); restoreFieldUnits(item.fieldUnits, byId(item.tool), item.inputUnits);
  navigate(item.tool, document.querySelector(`.nav-item[data-view="${item.tool}"]`)); restoreValues(item.values, activeView());
  byId('calculationName').value = item.name; recordDraft(); notifyUser(`Loaded “${item.name}”. Results recalculated using current data${item.sourceVersion !== SOURCE_DATA_VERSION ? ' (source version has changed)' : ''}.`);
}
function deleteCalculation() {
  const id = byId('savedCalculations').value;
  if (!id) return notifyUser('Select a saved calculation first.');
  writeStored('saved', readStored('saved', []).filter(item => item.id !== id)); populateSavedCalculations(); notifyUser('Saved copy removed. Current inputs remain available.');
}
function reportData() {
  const view = activeView(), source = toolSources[view.id];
  const inputs = [...view.querySelectorAll('input[id],select[id]')].filter(el => !el.closest('[hidden]')).map(el => ({ label: el.closest('label')?.childNodes[0]?.textContent.trim() || el.id, value: el.tagName === 'SELECT' ? el.selectedOptions[0]?.textContent || 'Not selected' : el.value || 'Not entered' }));
  const results = [...view.querySelectorAll('.result')].filter(el => !el.closest('[hidden]') && getComputedStyle(el).display !== 'none').map(el => el.innerText.trim()).filter(Boolean);
  return {title:byId('calculationName').value.trim() || titles[view.id][0],tool:titles[view.id][0],date:new Date().toLocaleString('en-ZA',{timeZone:'Africa/Johannesburg'}),inputs,results,source,appVersion:APP_VERSION,sourceVersion:SOURCE_DATA_VERSION,inputUnits:"as labelled for each field",resultUnits:describeDisplayPreferences()};
}
function reportText(data) { return `${data.title}\nTool: ${data.tool}\nCreated: ${data.date} (South Africa)\nApp: ${data.appVersion}; data: ${data.sourceVersion}\nInput units: ${data.inputUnits}; result units: ${data.resultUnits}\n\nInputs\n${data.inputs.map(i=>`${i.label}: ${i.value}`).join('\n')}\n\nResults\n${data.results.join('\n\n') || 'No calculated result: complete required inputs.'}\n\nSource: ${data.source.document}\nRevision: ${data.source.revision}\nScope: ${data.source.coverage}\nAssumptions: ${data.source.assumptions}`; }
async function copyReport() { try { await navigator.clipboard.writeText(reportText(reportData())); notifyUser('Report copied.'); } catch { downloadReport(); notifyUser('Clipboard access is unavailable. A report was downloaded instead.'); } }
function downloadReport() {
  const data = reportData(), text = reportText(data);
  const blob = new Blob([`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(data.title)}</title><style>body{font:16px/1.65 system-ui,sans-serif;max-width:900px;padding:24px;margin:auto}pre{font:inherit;white-space:pre-wrap;overflow-wrap:anywhere}h1{font-size:26px}@media print{body{padding:0}}</style><h1>${esc(data.title)}</h1><pre>${esc(text)}</pre></html>`], {type:'text/html'});
  const url = URL.createObjectURL(blob), a = document.createElement('a'); a.href = url; a.download = `${data.title.replace(/[^a-z0-9_-]/gi,'_').slice(0,80)}-BeruApp.html`; a.click(); setTimeout(()=>URL.revokeObjectURL(url),1000); notifyUser('Report downloaded. Open it to print or save as PDF.');
}
function preparePrintReport() {
  byId('printReportDocument')?.remove();
  const data=reportData(), panel=document.createElement('article');
  panel.id='printReportDocument'; panel.className='print-report-document';
  panel.innerHTML=`<h1>${esc(data.title)}</h1><pre>${esc(reportText(data))}</pre>`;
  document.body.append(panel);
}
function printReport() { preparePrintReport(); window.print(); }
function thicknessCheck(label, actual, required) {
  const margin = actual - required, pass = margin >= 0;
  return `<div class="check-card ${pass ? '' : 'fail'}"><strong>${esc(label)}: ${pass ? 'meets calculated thickness' : 'below calculated thickness'}</strong><span>Actual ${esc(displayLengthMm(actual))}; required ${esc(displayLengthMm(required))}. ${pass ? 'Margin' : 'Shortfall'}: ${esc(displayLengthMm(Math.abs(margin)))}.</span></div>`;
}
function stressReadout(selection) { return `<p class="support-note">${esc(selection.row.name)}: ${esc(selection.basis)}. Available range ${selection.min}–${selection.max} °C.</p>`; }
function formulaDetails(content) { return `<details class="source-info"><summary>Formula and working</summary>${content}</details>`; }
function compoundLimits(compound) {
  const numbers = compound.temperature.match(/-?\d+(?:\.\d+)?/g)?.map(Number) || [];
  return /up to/i.test(compound.temperature) ? {min:null,max:numbers[0]} : {min:numbers[0],max:numbers[1]};
}
function compoundAssessment(compound) {
  const temperature = num('compoundTemperature'), pressure = num('compoundPressure'), limits = compoundLimits(compound), issues = [];
  if (fieldHasValue('compoundTemperature') && !Number.isFinite(temperature)) issues.push('Enter a numeric operating temperature');
  if (Number.isFinite(temperature)) {
    if (limits.min !== null && temperature < limits.min || Number.isFinite(limits.max) && temperature > limits.max) issues.push('Temperature outside recorded range');
    else if (limits.min === null) issues.push('Lower temperature limit not supplied');
  }
  if (fieldHasValue('compoundPressure') && (!Number.isFinite(pressure) || pressure < 0)) issues.push('Pressure must be zero or greater');
  else if (Number.isFinite(pressure) && pressure > Number(compound.pressureBar)) issues.push('Pressure exceeds recorded maximum');
  if (!issues.length && (!fieldHasValue('compoundTemperature') || !fieldHasValue('compoundPressure'))) issues.push('Enter temperature and pressure to complete screening');
  return issues.length ? issues.join('. ') : 'Within recorded temperature and pressure limits';
}
function updateCompoundScreen() {
  if (!byId('compoundScreen')) return;
  const compound = selectedCompound();
  byId('compoundScreen').innerHTML = compound ? `<strong>${esc(compound.product)}:</strong> ${esc(compoundAssessment(compound))}. Fluid compatibility requires the product reference.` : 'Compound selection is optional for volume calculations. Temperature and pressure screening appears after selection.';
  const group = byId('compoundFluidGroup').value, type = byId('compoundType').value;
  const compounds = state.compounds.filter(c => (!group || c.service === group) && (!type || compoundType(c) === type));
  byId('compoundComparison').innerHTML = compounds.length ? `<table><caption>Recorded compound limits and screening</caption><thead><tr><th>Compound</th><th>Temperature</th><th>Max pressure</th><th>Screening</th></tr></thead><tbody>${compounds.map(c=>`<tr><th scope="row">${esc(c.product)}</th><td>${esc(c.temperature)}</td><td>${esc(displayPressureKpa(c.pressureBar * 100))}</td><td>${esc(compoundAssessment(c))}</td></tr>`).join('')}</tbody></table>` : 'No compound data available for this selection.';
}
function populateAsmeTemperatures() {
  const previous = byId('asmeTemperature').value || '40';
  byId('asmeTemperature').innerHTML = (state.asmeTable1A.temperatureColumnsC || []).map(t=>`<option value="${t}">${esc(displayTempC(t))}</option>`).join(''); byId('asmeTemperature').value = previous;
}
function asmeDetails(row) {
  const value = v => v === null || v === undefined || v === '' ? 'Not supplied in source' : esc(v);
  return `<div class="asme-row-details"><p>Condition / temper: ${value(row.classConditionTemper)}</p><p>Size / thickness (mm): ${value(row.sizeThicknessMm)}</p><p>Notes: ${value(row.notes)}</p><p>Section I: ${value(row.sectionI)}; III: ${value(row.sectionIII)}; VIII-1: ${value(row.sectionVIII1)}; XII: ${value(row.sectionXII)}</p><p>External pressure chart: ${value(row.externalPressureChartNo)}</p><p>Source line: ${value(row.lineNo)}</p></div>`;
}
function previousAsmePage() { asmePage = Math.max(0,asmePage - 1); renderAsmeTable(); }
function nextAsmePage() { asmePage++; renderAsmeTable(); }
function populateWpsFilters() {
  for (const [id,key] of [['wpsProcess','Welding Process'],['wpsMaterial','Base Material(s)']]) {
    const saved = byId(id).value;
    byId(id).innerHTML = '<option value="">All</option>' + [...new Set(Object.values(state.wps).map(row=>row[key]).filter(Boolean))].map(v=>`<option value="${esc(v)}">${esc(v)}</option>`).join(''); byId(id).value = saved;
  }
  filterWps();
}
function filterWps() {
  if (!byId('wpsCount')) return;
  const process = byId('wpsProcess').value, material = byId('wpsMaterial').value, thickness = num('wpsThickness'), raw = byId('wpsThickness').value;
  const selected = byId('wpsSelect').value;
  if (raw && (!Number.isFinite(thickness) || thickness <= 0)) { byId('wpsSelect').innerHTML = '<option value="">Enter a positive thickness</option>'; byId('wpsCount').textContent = 'Groove thickness must be positive.'; showWpsData(); return; }
  const matches = Object.entries(state.wps).filter(([key,row])=> {
    const range = String(row['Thickness Range'] || '').match(/[\d.]+/g)?.slice(0,2).map(Number);
    return (!process || row['Welding Process']===process) && (!material || row['Base Material(s)']===material) && (!raw || range?.length===2 && thickness>=range[0] && thickness<=range[1]);
  });
  byId('wpsSelect').innerHTML = '<option value="">Select WPS</option>' + matches.map(([key,row])=>`<option value="${esc(key)}">${esc(row['WPS Number'] || key)}</option>`).join('');
  if (matches.some(([key])=>key===selected)) byId('wpsSelect').value=selected;
  byId('wpsCount').textContent = `${matches.length} procedure${matches.length===1?'':'s'} match. Thickness screening uses the recorded groove range.`; showWpsData();
}
function syncFlangeOptions() {
  const nps = byId('npsFlangeSelect').value, record = state.flanges[`NPS_${nps}`];
  const cls = byId('classFlangeSelect').value, type = byId('typeFlangeSelect').value;
  const classes = record ? Object.keys(record).filter(key => record[key] && ['WN','SO'].some(type => record[key][type])).map(key=>key.replace('CLASS_','')) : [];
  byId('classFlangeSelect').innerHTML = classes.length ? classes.map(c=>`<option value="${esc(c)}">Class ${esc(c)}</option>`).join('') : '<option value="">Select a size first</option>';
  if (classes.includes(cls)) byId('classFlangeSelect').value=cls;
  const available = record?.[`CLASS_${byId('classFlangeSelect').value}`] || {};
  const types = ['WN','SO'].filter(t=>available[t]);
  byId('typeFlangeSelect').innerHTML = types.length ? types.map(t=>`<option value="${t}">${t==='WN'?'Weld Neck':'Slip On'}</option>`).join('') : '<option value="">No recorded type</option>';
  if (types.includes(type)) byId('typeFlangeSelect').value=type;
  byId('classFlangeSelect').disabled = !classes.length; byId('typeFlangeSelect').disabled = !types.length;
}
function convertTemperature() {
  const raw = byId('temperatureInput').value;
  if (!raw) { byId('temperatureResult').style.display='none'; return; }
  const value = Number(raw), from=byId('temperatureFrom').value, to=byId('temperatureTo').value;
  const c = from==='F' ? (value-32)*5/9 : from==='K' ? value-273.15 : value;
  if (!Number.isFinite(c) || c < -273.15) return showHtml('temperatureResult','<span class="error-text">Temperature cannot be below absolute zero.</span>');
  showResult('temperatureResult', `${fmt(value,4)} ${from==='K'?'K':'°'+from} = ${fmt(to==='F'?c*9/5+32:to==='K'?c+273.15:c,4)} ${to==='K'?'K':'°'+to}`);
}
function addRelatedTools() {
  const related = {compoundCalculator:['pipeScheduleLookup','unitConverter'],nonCircularCalc:['asmeTable1A','materialGuideLookup','boltStandaloneCalc'],circularCalc:['pipeScheduleLookup','asmeTable1A','boltStandaloneCalc'],boltStandaloneCalc:['boltNutReference','asmeTable1A'],asmeTable1A:['materialGuideLookup','circularCalc','nonCircularCalc'],pipeScheduleLookup:['elbowDimensions','ansiFlanges','circularCalc'],ansiFlanges:['boltNutReference','boltStandaloneCalc'],weldingProcedure:['materialGuideLookup']};
  for(const [id,ids] of Object.entries(related)) byId(id).insertAdjacentHTML('beforeend',`<div class="related-tools"><span>Related tools:</span>${ids.map(id=>`<button class="secondary" data-view="${id}">${esc(titles[id][0])}</button>`).join('')}</div>`);
}
function addGeometryGuides() {
  const rectangular = '<svg class="geometry-guide" viewBox="0 0 500 230" role="img" aria-label="Rectangular cavity, H across the short span and h across the long span"><rect class="shape" x="100" y="65" width="300" height="115"/><path class="dim" d="M100 40H400M75 65V180"/><text x="170" y="28">h: long internal span</text><text x="5" y="125">H</text><text x="140" y="210">Wall thickness is measured normal to each side</text></svg>';
  const circle = '<svg class="geometry-guide" viewBox="0 0 500 230" role="img" aria-label="Circular shell with outside diameter OD and inside diameter ID"><circle class="shape" cx="245" cy="110" r="85"/><circle class="shape" cx="245" cy="110" r="65"/><path class="dim" d="M160 110H330M180 150H310"/><text x="340" y="115">OD</text><text x="320" y="155">ID</text><text x="110" y="220">Shell thickness = (OD − ID) / 2</text></svg>';
  byId('nonCircularCalc').querySelector('h3').insertAdjacentHTML('afterend', rectangular+'<p class="support-note">Enter the shell thickness requirement from your separate design assessment. This tool checks the UG-34 endplate and compares the supplied shell requirement with actual thickness.</p>');
  byId('circularCalc').querySelector('h3').insertAdjacentHTML('afterend',circle+'<p class="support-note">Enter nominal uncorroded dimensions. Corrosion allowance expands the internal pressure span and is included in required thickness. Joint efficiency E is 1.0 for the selected machined case and 0.7 for the selected welded case.</p>');
  byId('boltStandaloneCalc').querySelector('h3').insertAdjacentHTML('afterend','<p class="support-note">Pressure area is the projected area acted on by pressure. For a circle, A = πD²/4. The load is divided equally between the bolts. Preload is a percentage of recorded yield strength; friction strongly affects torque.</p>');
  document.querySelector('[data-compound-calculator="groove"] h3').insertAdjacentHTML('afterend', rectangular+'<p class="support-note">Clamp length and width describe the groove perimeter. Bore OD is the outside diameter of each opening; its count is the number of identical openings. Groove width and depth describe the groove cross-section.</p>');
  document.querySelector('[data-compound-calculator="void"] h3').insertAdjacentHTML('afterend',circle+'<p class="support-note">For this fill calculation, OD in the sketch represents clamp ID and ID represents pipe OD. Internal length is the length of the annular cavity.</p>');
}
function updateConnectionStatus() { byId('connectionStatus').textContent = navigator.onLine ? 'Connection available' : 'Offline · using local app data'; }
function retrySourceData() { return loadDatabases(true); }
function validateDataset(file, data) {
  let valid = data && typeof data === 'object';
  if (file === 'compounds.json') valid = Array.isArray(data) && data.length > 0 && data.every(c => typeof c.product === 'string' && typeof c.temperature === 'string' && Number.isFinite(c.pressureBar) && c.pressureBar >= 0 && c.volumeMm3 > 0 && c.densityKgPerMm3 > 0);
  else if (file === 'engineering_calcs.json') {
    const materials = rows => Array.isArray(rows) && rows.length > 0 && rows.every(row => typeof row?.name === 'string' && Array.isArray(row.stresses) && row.stresses.length > 0 && row.stresses.every(point => Number.isFinite(point?.temp) && Number.isFinite(point?.stress) && point.stress > 0));
    valid = materials(data?.materials) && materials(data.boltMaterials) && Array.isArray(data.boltSizes) && data.boltSizes.length > 0 && data.boltSizes.every(row => typeof row?.size === 'string');
  }
  else if (file === 'asme_table_1a.json') valid = Array.isArray(data?.rows) && data.rows.length > 0 && data.rows.every(row => typeof row?.specNo === 'string' && row.stressMpaByTempC && typeof row.stressMpaByTempC === 'object') && Array.isArray(data.temperatureColumnsC) && data.temperatureColumnsC.length > 0 && data.temperatureColumnsC.every(Number.isFinite);
  else if (file === 'pipes.json') valid = valid && Object.keys(data).length > 0 && Object.values(data).every(row => row && typeof row === 'object' && Number.isFinite(row.od) && row.od > 0 && Object.values(row).every(value => value == null || Number.isFinite(value) && value > 0));
  else if (file === 'flanges.json') valid = valid && Object.keys(data).length > 0 && Object.entries(data).every(([key,row]) => key.startsWith('NPS_') && row && typeof row === 'object' && Object.entries(row).every(([cls,values]) => cls.startsWith('CLASS_') && (values === null || typeof values === 'object' && ['WN','SO'].every(type => values[type] == null || typeof values[type] === 'object'))));
  else if (file === 'wps.json') valid = valid && Object.keys(data).length > 0 && Object.values(data).every(row => typeof row?.['WPS Number'] === 'string' && typeof row['Welding Process'] === 'string' && typeof row['Thickness Range'] === 'string');
  else valid = valid && !Array.isArray(data) && Object.keys(data).length > 0;
  if (!valid) throw new Error(`${file} is empty or has an unsupported structure.`);
}
function toggleGeometryWorking(id, text) { const el = byId(id); if(el.style.display === 'block') { el.style.display='none'; return; } el.textContent=text; el.style.display='block'; }
async function checkForUpdates() {
  if (!('serviceWorker' in navigator) || location.hostname === 'beruapp.local' || location.protocol === 'file:') { byId('updateStatus').textContent = 'Desktop updates use a new app package.'; return; }
  if (!navigator.onLine) { byId('updateStatus').textContent = 'Reconnect to check for an update.'; return; }
  try { const registration = await navigator.serviceWorker.getRegistration(); if(!registration) throw new Error('No registration'); await registration.update(); byId('updateStatus').textContent = registration.waiting ? 'Update available. Use Apply update.' : 'Update check completed.'; if(registration.waiting) showUpdateButton(); } catch { byId('updateStatus').textContent = 'Update check unavailable. Try again when connected.'; }
}
function showUpdateButton() { if(!byId('applyAppUpdate')) byId('updateStatus').insertAdjacentHTML('afterend','<button class="secondary" id="applyAppUpdate" data-action="applyAppUpdate">Apply update</button>'); }
async function applyAppUpdate() { recordDraft(); const registration=await navigator.serviceWorker.getRegistration(); if(registration?.waiting) registration.waiting.postMessage({type:'SKIP_WAITING'}); }
function trapMobileFocus(event) {
  if (event.key !== 'Tab' || !document.body.classList.contains('nav-open') || !matchMedia('(max-width: 860px)').matches) return;
  const elements = [...byId('appSidebar').querySelectorAll('button, input, summary')].filter(el=>!el.disabled && el.getClientRects().length);
  const first=elements[0],last=elements.at(-1);
  if(event.shiftKey && (document.activeElement===first || !byId('appSidebar').contains(document.activeElement))) {event.preventDefault();last?.focus();}
  else if(!event.shiftKey && (document.activeElement===last || !byId('appSidebar').contains(document.activeElement))) {event.preventDefault();first?.focus();}
}
