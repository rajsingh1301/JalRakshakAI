import { useEffect, useMemo, useState } from 'react';
import { Droplets, LayoutDashboard, Compass, ListOrdered, Sparkles, BookOpen, ArrowUpRight, Download, Menu, X, ChevronRight, ShieldCheck, Database, RotateCcw } from 'lucide-react';
import { filterRecords, number, verifyInsightBundle } from './utils/analysis.js';
import { Empty, Notice } from './components/UI.jsx';
import Overview from './pages/Overview.jsx';
import Explorer from './pages/Explorer.jsx';
import Priorities from './pages/Priorities.jsx';
import Insights from './pages/Insights.jsx';
import Methodology from './pages/Methodology.jsx';
const navigation = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard, component: Overview },
  { id: 'explorer', label: 'Contamination explorer', icon: Compass, component: Explorer },
  { id: 'priorities', label: 'District priorities', icon: ListOrdered, component: Priorities },
  { id: 'insights', label: 'Avaloka AI insights', icon: Sparkles, component: Insights },
  { id: 'methodology', label: 'Methodology & about', icon: BookOpen, component: Methodology },
];
function getRoute() { return navigation.some(n => n.id === location.hash.slice(1)) ? location.hash.slice(1) : 'overview'; }
export default function App() {
  const [data, setData] = useState(null), [insights, setInsights] = useState(null), [error, setError] = useState('');
  const [route, setRoute] = useState(getRoute), [state, setState] = useState('all'), [year, setYear] = useState('all');
  const [parameterId, setParameterId] = useState('chloride'), [menu, setMenu] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const res = await fetch('/data/dashboard.json', { signal: controller.signal });
        if (!res.ok) throw new Error('Groundwater data could not be loaded. Please reload the page.');
        const payload = await res.json();
        if (!Array.isArray(payload.records) || !payload.parameters?.length) throw new Error('The dataset format is unavailable.');
        setData(payload);
        try { const ai = await fetch('/data/avaloka-insights.json', { signal: controller.signal }); if (ai.ok) setInsights(await ai.json()); }
        catch (e) { if (e.name !== 'AbortError') setInsights(null); }
      } catch (e) { if (e.name !== 'AbortError') setError(e.message); }
    }
    load(); return () => controller.abort();
  }, []);
  useEffect(() => { const navigate = () => { setRoute(getRoute()); setMenu(false); window.scrollTo(0, 0); }; window.addEventListener('hashchange', navigate); return () => window.removeEventListener('hashchange', navigate); }, []);
  useEffect(() => { document.title = `${navigation.find(n => n.id === route).label} · JalRakshak AI`; }, [route]);
  const records = useMemo(() => filterRecords(data?.records ?? [], { state, year }), [data, state, year]);
  const current = navigation.find(n => n.id === route), Page = current.component;
  const parameter = data?.parameters.find(p => p.id === parameterId) ?? data?.parameters[0];
  const aiReady = data && verifyInsightBundle(insights, data.provenance.csv_sha256);
  return <div className="app-shell"><a className="skip-link" href="#main-content" onClick={e => { e.preventDefault(); document.getElementById('main-content')?.focus(); }}>Skip to content</a>
    {menu && <button className="sidebar-overlay" aria-label="Close navigation" onClick={() => setMenu(false)} />}
    <aside className={`sidebar ${menu ? 'is-open' : ''}`}>
      <a href="#overview" className="brand"><span className="brand-mark"><Droplets size={25} /></span><span>JalRakshak<span className="brand-ai">AI</span><small>GROUNDWATER INTELLIGENCE</small></span></a>
      <div className="nav-label">WORKSPACE</div><nav aria-label="Main navigation">{navigation.map(({ id, label, icon: Icon }) => <a key={id} href={`#${id}`} className={route === id ? 'active' : ''} aria-current={route === id ? 'page' : undefined}><Icon size={19} /><span>{label}</span>{id === 'insights' && !aiReady && <span className="nav-dot" aria-hidden="true" />}</a>)}</nav>
      <div className="sidebar-data"><div className="sidebar-data-icon"><Database size={18} /><span>THE DATA BEHIND IT</span></div><strong>Government data.<br />Visible evidence.</strong><p>Every number traces back to an actual monitoring record.</p><a href="#methodology">Explore our sources <ArrowUpRight size={15} /></a></div>
      <div className="sidebar-bottom"><div className="status-dot" /><span>Avaloka Hackathon 2026</span><small>Built for better water monitoring</small></div>
    </aside><div className="workspace">
      <header className="topbar"><div className="breadcrumb"><button className="menu-button" onClick={() => setMenu(!menu)} aria-label={menu ? 'Close navigation' : 'Open navigation'}>{menu ? <X size={21} /> : <Menu size={21} />}</button><span>Workspace</span><ChevronRight size={14} /><strong>{current.label}</strong></div><div className="topbar-right"><span className="verified-data"><ShieldCheck size={15} /> Official source data</span><a href="https://github.com/rajsingh1301/JalRakshakAI" target="_blank" rel="noreferrer" className="repo-link">GitHub <ArrowUpRight size={14} /></a><span className="avatar" aria-label="JalRakshak workspace">JR</span></div></header>
      <main id="main-content" className="main-content" tabIndex={-1}>{error ? <div role="alert"><Empty title="Dataset unavailable" description={error} /><button className="button primary" onClick={() => location.reload()}>Reload dataset</button></div> : !data ? <div className="loading" role="status"><Droplets size={36} /><h1>Bringing the evidence into focus</h1><p>Loading official groundwater observations…</p></div> : <>
        <div className="scope-bar"><div className="scope-label"><span className="status-dot" /> CGWB monitoring data <span className="scope-divider" /> {number(records.length)} events in view</div><div className="scope-controls"><select aria-label="State" value={state} onChange={e => setState(e.target.value)}><option value="all">All states</option>{data.provenance.states.map(s => <option key={s}>{s}</option>)}</select><select aria-label="Sampling year" value={year} onChange={e => setYear(e.target.value)}><option value="all">2019 – 2023</option>{[...new Set(data.records.map(r => r.year))].sort().map(y => <option key={y} value={y}>{y}</option>)}</select>{(state !== 'all' || year !== 'all') && <button className="icon-button" aria-label="Reset scope filters" onClick={() => { setState('all'); setYear('all'); }}><RotateCcw size={16} /></button>}<a className="button download-button" href="/data/avaloka-ready.csv" download="avaloka-ready.csv"><Download size={15} /><span>Download dataset</span></a></div></div>
        <Page data={data} records={records} parameter={parameter} setParameterId={setParameterId} insights={insights} scope={{ state, year }} resetFilters={() => { setState('all'); setYear('all'); setParameterId('chloride'); }} />
        <Notice>Monitoring evidence supports further investigation. Historical sampled groundwater is not a certification of current drinking-water safety.</Notice>
      </>}</main>
    </div></div>;
}
