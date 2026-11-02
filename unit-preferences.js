'use strict';
const resultGroups = {
  length: ['Length / area', 'mm / mm²', 'in / in²'],
  pressure: ['Pressure / stress', 'kPa / MPa', 'psi / ksi'],
  temperature: ['Temperature', '°C', '°F'],
  load: ['Force / torque', 'N / N·m', 'lbf / lb-ft'],
  volume: ['Volume', 'mm³ / L', 'in³ / US gal'],
  mass: ['Mass', 'kg', 'lb']
};
let displayPreferences = null;
function legacyDisplayPreferences(mode) { return Object.fromEntries([...Object.keys(resultGroups).map(k=>[k,mode === 'imperial' ? 'imperial' : 'metric']), ['equivalents',mode === 'mixed']]); }
function describeDisplayPreferences() { const p=displayPreferenceSnapshot(); return Object.entries(resultGroups).map(([key,[label,metric,imperial]])=>`${label}: ${p[key] === 'imperial' ? imperial : metric}`).join('; ') + (p.equivalents ? '; equivalent units shown' : ''); }
function nominalBoltLabel(size) { return size.startsWith('M') ? size : `${size} in`; }
function displayPreferenceSnapshot() {
  return displayPreferences ? {...displayPreferences} : legacyDisplayPreferences(unitMode);
}
function resultGroup(unit) { return ({mm:'length','mm²':'length',kPa:'pressure',MPa:'pressure','°C':'temperature',N:'load','N·m':'load','mm³':'volume',L:'volume',kg:'mass'})[unit] || 'length'; }
function formatPreferredUnit(metricValue, metricUnit, imperialValue, imperialUnit, metricDigits, imperialDigits) {
  const p=displayPreferenceSnapshot(), imperial=p[resultGroup(metricUnit)] === 'imperial';
  const metric=`${fmt(metricValue,metricDigits)} ${metricUnit}`, inch=`${fmt(imperialValue,imperialDigits)} ${imperialUnit}`;
  return (imperial ? inch : metric) + (p.equivalents ? ` (${imperial ? metric : inch})` : '');
}
function restoreDisplayPreferences(value) {
  const defaults=displayPreferenceSnapshot();
  displayPreferences=Object.fromEntries(Object.keys(resultGroups).map(k=>[k,value?.[k] === 'imperial' ? 'imperial' : value?.[k] === 'metric' ? 'metric' : defaults[k]]));
  displayPreferences.equivalents=typeof value?.equivalents === 'boolean' ? value.equivalents : defaults.equivalents;
  document.querySelectorAll('[data-result-group]').forEach(el=>el.value=displayPreferences[el.dataset.resultGroup]);
  if(byId('showUnitEquivalents')) byId('showUnitEquivalents').checked=displayPreferences.equivalents;
  writeStored('displayPreferences',displayPreferences);
  refreshUnitDisplays();
}
function fieldUnitSnapshot(view=document) { return Object.fromEntries([...view.querySelectorAll('input[data-quantity]')].map(el=>[el.id,el.dataset.unitMode || 'metric'])); }
function setFieldUnit(input,mode) {
  mode=mode === 'imperial' ? 'imperial' : 'metric';
  const old=input.dataset.unitMode || 'metric', kind=input.dataset.quantity;
  if(old !== mode) for(const attr of ['value','placeholder']) {
    const raw=attr === 'value' ? input.value : input.getAttribute(attr);
    if(raw === null || raw === '' || !Number.isFinite(Number(raw))) continue;
    const canonical=attr === 'value' && input.dataset.convertedRaw === raw && Number.isFinite(Number(input.dataset.canonicalValue)) ? Number(input.dataset.canonicalValue) : old === 'imperial' ? toMetric(Number(raw),kind) : Number(raw);
    const text=String(Number((mode === 'imperial' ? fromMetric(canonical,kind) : canonical).toPrecision(12)));
    if(attr === 'value') { input.value=text; input.dataset.canonicalValue=String(canonical); input.dataset.convertedRaw=text; } else input.setAttribute(attr,text);
  }
  input.dataset.unitMode=mode;
  const label=input.closest('label'),node=[...label.childNodes].find(n=>n.nodeType === Node.TEXT_NODE && n.textContent.trim());
  if(node) node.textContent=`${input.dataset.caption} (${inputSuffix(kind,mode)})`;
  const select=label.querySelector('[data-field-unit]'); if(select) select.value=mode;
}
function restoreFieldUnits(units,view=document,legacyMode='metric') {
  view.querySelectorAll('input[data-quantity]').forEach(el=>setFieldUnit(el,units?.[el.id] || legacyMode));
  updateUnitBanners();
}
function updateUnitBanners() {
  document.querySelectorAll('.unit-banner').forEach(el=>el.textContent='Units are shown beside each field. NPS, DN and nominal thread sizes identify the selected component.');
}
function initUnitPreferences() {
  const container=byId('displayPreferences');
  container.innerHTML=Object.entries(resultGroups).map(([key,[label,metric,imperial]])=>`<label>${label}<select data-result-group="${key}" aria-label="${label} display units"><option value="metric">${metric}</option><option value="imperial">${imperial}</option></select></label>`).join('')+'<label class="unit-equivalents"><input type="checkbox" id="showUnitEquivalents">Show equivalent units beside results</label>';
  document.querySelectorAll('input[data-quantity]').forEach(input=>{
    input.closest('label').classList.add('unit-field');
    input.insertAdjacentHTML('afterend',`<select data-field-unit="${input.id}" aria-label="${esc(input.dataset.caption)} units"><option value="metric">${inputSuffix(input.dataset.quantity,'metric')}</option><option value="imperial">${inputSuffix(input.dataset.quantity,'imperial')}</option></select>`);
  });
  applyInputUnits(readStored('inputUnits','metric'),false);
  restoreFieldUnits(readStored('fieldUnits',{}),document,inputUnitMode);
  restoreDisplayPreferences(readStored('displayPreferences',null));
  byId('pipeDimensionUnits').value=displayPreferenceSnapshot().length;
  document.addEventListener('change',event=>{
    const el=event.target;
    if(el.matches('[data-field-unit]')) {
      setFieldUnit(byId(el.dataset.fieldUnit),el.value);
      writeStored('fieldUnits',fieldUnitSnapshot()); recordDraft(el.closest('.view')); refreshActiveTool();
    }
    if(el.matches('[data-result-group],#showUnitEquivalents')) {
      const p=displayPreferenceSnapshot();
      if(el.dataset.resultGroup) p[el.dataset.resultGroup]=el.value; else p.equivalents=el.checked;
      restoreDisplayPreferences(p); updateUnitBanners();
    }
    if(['pipeTableView','pipeDimensionUnits'].includes(el.id)) showPipeData();
  });
}
function nominalFraction(nps) { return ({'1.25':'1¼','1.5':'1½','2.5':'2½','3.5':'3½'})[nps] || nps; }
function boltReferenceValue(value,key,inchNominal) {
  const area=['rootArea','tensileArea'].includes(key), result=area ? displayAreaMm2(value) : displayLengthMm(value);
  if(!inchNominal || result.includes(area ? 'in²' : ' in')) return result;
  return `${result} (${fmt(value / (area ? 645.16 : 25.4),area ? 4 : 3)} ${area ? 'in²' : 'in'})`;
}
const pipeSchedules=['sch5s','sch10s','sch10','sch20','sch30','std','sch40s','sch40','sch60','xs','sch80s','sch80','sch100','sch120','sch140','sch160','xxs'];
function scheduleLabel(key) { return key.startsWith('sch') ? `Sch ${key.slice(3).toUpperCase()}` : key.toUpperCase(); }
function renderPipeReference() {
  updatePipeOdPanel();
  const nps=byId('npsSelect').value, all=byId('pipeTableView').value === 'all', inch=byId('pipeDimensionUnits').value === 'imperial';
  const dimension=v=>fmt(inch ? v/25.4 : v,inch ? 3 : 2), unit=inch ? 'in' : 'mm';
  if(nps && state.pipes[nps]) byId('pipeOdPanel').querySelector('strong').textContent=`${dimension(state.pipes[nps].od)} ${unit}`;
  if(!all && !nps) { byId('pipeResult').style.display='none'; byId('pipeResult').innerHTML=''; return; }
  const source='<p class="support-note">Added NPS 26–48: <a target="_blank" rel="noopener" href="https://brandportal.vanleeuwen.com/m/18aecf58d0438f63/original/Pipe-schedules-web.pdf">Van Leeuwen pipe chart, page 2</a>. Existing smaller-size data retains its recorded precision. Inch values here are conversions of the metric data, not a separate inch-standard table.</p>';
  if(all) {
    const rows=standardNps.filter(k=>state.pipes[k]).map(k=>{const p=state.pipes[k];return `<tr><th scope="row">${esc(nominalFraction(k))}<small>DN ${npsToDn[k]}</small></th><td>${dimension(p.od)}</td>${pipeSchedules.map(s=>p[s] ? `<td>${dimension(p[s])}<small>${fmt(Math.PI*(p.od-p[s])*p[s]*0.00785,2)} kg/m</small></td>` : '<td aria-label="No supplied value">—</td>').join('')}</tr>`;}).join('');
    showHtml('pipeResult',`<table class="pipe-matrix"><caption>Pipe sizes through NPS 48 · wall thickness (${unit}), with calculated mass below</caption><thead><tr><th scope="col">NPS / DN</th><th scope="col">OD (${unit})</th>${pipeSchedules.map(s=>`<th scope="col">${scheduleLabel(s)}</th>`).join('')}</tr></thead><tbody>${rows}</tbody></table><p class="support-note">Mass is a geometric estimate at density 7,850 kg/m³ for every cell, including S schedules; it is not a stainless-grade mass specification.</p>${source}`);
  } else {
    const p=state.pipes[nps]; if(!p) return;
    const rows=pipeSchedules.map(s=>`<tr><th scope="row">${scheduleLabel(s)}</th><td>${p[s] ? dimension(p[s]) : '—'}</td><td>${p[s] ? dimension(p.od-2*p[s]) : '—'}</td></tr>`).join('');
    showHtml('pipeResult',`<table><caption>Schedule dimensions (${unit})</caption><thead><tr><th scope="col">Schedule / wall series</th><th scope="col">Wall thickness</th><th scope="col">Derived ID = OD − 2 × wall</th></tr></thead><tbody>${rows}</tbody></table>${source}`);
  }
}
