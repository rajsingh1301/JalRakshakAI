import { useMemo, useState } from 'react';
import { ResponsiveContainer, BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, Cell, ReferenceLine } from 'recharts';
import { Empty } from './UI.jsx';
import { distribution, yearlyStatistics, isMeasured, number, percent } from '../utils/analysis.js';

const axis = { fontSize: 10, fill: '#84979d' };
const tip = { borderRadius: 9, border: '1px solid #e2ece9', fontSize: 11, boxShadow: '0 6px 24px #193e4510' };

export function DistrictChart({ districts }) {
  const values = districts.filter(d => d.valid > 0).slice(0, 7).map(d => ({ ...d, name: d.district }));
  if (!values.length) return <Empty />;
  return <><div className="chart-area" role="img" aria-label="Observed exceedance percentages by district; tabular values follow"><ResponsiveContainer width="100%" height={270}><BarChart data={values} layout="vertical" margin={{ top: 3, bottom: 0, left: 0, right: 25 }}><CartesianGrid stroke="#edf1f2" horizontal={false} strokeDasharray="3 3" /><XAxis type="number" domain={[0, 100]} tick={axis} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} /><YAxis type="category" dataKey="name" width={88} tick={axis} axisLine={false} tickLine={false} /><Tooltip contentStyle={tip} formatter={(v, key) => [percent(v), 'Above acceptable limit']} cursor={{ fill: '#f5f9f7' }} /><Bar dataKey="rate" barSize={14} radius={[0, 4, 4, 0]}>{values.map(d => <Cell key={`${d.state}:${d.district}`} fill={!d.eligible ? '#c7d3d6' : d.band === 'High' ? '#de9982' : '#6db5a2'} />)}</Bar></BarChart></ResponsiveContainer></div><details className="chart-details"><summary>View chart values</summary><div className="table-scroll"><table><thead><tr><th>District</th><th>Above / measured</th><th>Rate</th><th>Evidence</th></tr></thead><tbody>{values.map(d => <tr key={`${d.state}:${d.district}`}><td>{d.district}, {d.state}</td><td>{d.exceedances} / {d.valid}</td><td>{percent(d.rate)}</td><td>{d.eligible ? 'Meets coverage rule' : 'Limited'}</td></tr>)}</tbody></table></div></details></>;
}

export function DistributionChart({ records, parameter }) {
  const bins = distribution(records, parameter);
  if (!bins.some(b => b.count)) return <Empty />;
  return <><div className="chart-area" role="img" aria-label="Concentration distribution in multiples of the acceptable limit"><ResponsiveContainer width="100%" height={235}><BarChart data={bins} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}><CartesianGrid stroke="#edf1f2" vertical={false} strokeDasharray="3 3" /><XAxis dataKey="name" tick={axis} axisLine={false} tickLine={false} /><YAxis tick={axis} allowDecimals={false} axisLine={false} tickLine={false} /><Tooltip contentStyle={tip} formatter={v => [number(v), 'Measured events']} cursor={{ fill: '#f5f9f7' }} /><Bar dataKey="count" barSize={35} radius={[5, 5, 0, 0]}>{bins.map(b => <Cell key={b.name} fill={b.elevated ? '#db9980' : '#72b5a4'} />)}</Bar></BarChart></ResponsiveContainer></div><details className="chart-details"><summary>View chart values</summary><div className="table-scroll"><table><thead><tr><th>Multiple of acceptable limit</th><th>Events</th></tr></thead><tbody>{bins.map(b => <tr key={b.name}><td>{b.name}</td><td>{number(b.count)}</td></tr>)}</tbody></table></div></details></>;
}

export function AnnualChart({ records, parameter }) {
  const years = yearlyStatistics(records, parameter);
  if (!years.some(y => y.valid)) return <Empty />;
  return <><div className="chart-area" role="img" aria-label="Exceedance percentages by sampling year; stations and denominators differ between years"><ResponsiveContainer width="100%" height={235}><BarChart data={years} margin={{ top: 10, right: 15, left: -10, bottom: 0 }}><CartesianGrid stroke="#edf1f2" vertical={false} strokeDasharray="3 3" /><XAxis dataKey="year" tick={axis} axisLine={false} tickLine={false} /><YAxis domain={[0, 100]} tick={axis} tickFormatter={v => `${v}%`} axisLine={false} tickLine={false} /><Tooltip contentStyle={tip} formatter={v => [percent(v), 'Above acceptable limit']} /><Bar dataKey="rate" fill="#69b09d" barSize={35} radius={[5, 5, 0, 0]} /><ReferenceLine y={40} stroke="#dcad98" strokeDasharray="4 4" /></BarChart></ResponsiveContainer></div><details className="chart-details"><summary>View annual denominators</summary><div className="table-scroll"><table><thead><tr><th>Year</th><th>Above / measured</th><th>Rate</th></tr></thead><tbody>{years.map(y => <tr key={y.year}><td>{y.year}</td><td>{y.exceedances} / {y.valid}</td><td>{percent(y.rate)}</td></tr>)}</tbody></table></div></details></>;
}

export function StationMap({ records, parameter }) {
  const [mode, setMode] = useState('all'), [hovered, setHovered] = useState(null);
  const points = useMemo(() => {
    const groups = new Map();
    for (const r of records) {
      if (!isMeasured(r[parameter.id]) || !Number.isFinite(r.lat) || !Number.isFinite(r.lng)) continue;
      const key = `${r.state}:${r.district}:${r.station}`;
      if (!groups.has(key) || groups.get(key)[parameter.id] < r[parameter.id]) groups.set(key, r);
    }
    return [...groups.values()];
  }, [records, parameter]);
  const shown = mode === 'above' ? points.filter(r => r[parameter.id] > parameter.acceptable) : points;
  const focus = hovered && shown.find(r => r.id === hovered.id) || null;
  return <><div className="map-controls"><div className="legend"><span><i className="legend-dot teal" /> ≤ acceptable</span><span><i className="legend-dot coral" /> Above acceptable</span></div><div className="segmented"><button className={mode === 'all' ? 'active' : ''} onClick={() => setMode('all')}>All</button><button className={mode === 'above' ? 'active' : ''} onClick={() => setMode('above')}>Elevated</button></div></div>
    {!points.length ? <Empty /> : <div className="station-map"><svg viewBox="0 0 560 315" role="img" aria-label={`${shown.length} station locations, colored by maximum observed ${parameter.name.toLowerCase()}; schematic longitude and latitude plot`}><defs><pattern id="map-dots" x="0" y="0" width="11" height="11" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r=".65" fill="#d8e6df" /></pattern></defs><rect width="560" height="315" rx="9" fill="#f2f7f3" /><rect x="42" y="14" width="494" height="272" fill="url(#map-dots)" />{[70, 72, 74, 76, 78].map(lng => <g key={lng}><line x1={42 + (lng - 69) / 10 * 494} x2={42 + (lng - 69) / 10 * 494} y1="14" y2="286" stroke="#dce8e0" strokeDasharray="3 6" /><text x={42 + (lng - 69) / 10 * 494} y="304" textAnchor="middle" fill="#8ca19a" fontSize="9">{lng}°E</text></g>)}{[24, 26, 28, 30].map(lat => <g key={lat}><line x1="42" x2="536" y1={286 - (lat - 23) / 9 * 272} y2={286 - (lat - 23) / 9 * 272} stroke="#dce8e0" strokeDasharray="3 6" /><text x="32" y={289 - (lat - 23) / 9 * 272} textAnchor="end" fill="#8ca19a" fontSize="9">{lat}°N</text></g>)}{shown.map(r => <circle key={r.id} cx={42 + (r.lng - 69) / 10 * 494} cy={286 - (r.lat - 23) / 9 * 272} r={r[parameter.id] > parameter.acceptable ? 3.2 : 2.3} fill={r[parameter.id] > parameter.acceptable ? '#d98d74' : '#71b49c'} stroke="white" strokeWidth=".65" opacity=".85" onPointerEnter={() => setHovered(r)} onPointerLeave={() => setHovered(null)}><title>{r.station}, {r.district}: {r[parameter.id]} {parameter.unit} on {r.date.slice(0, 10)}</title></circle>)}<text x="286" y="191" fill="#678478" fontSize="10" letterSpacing="2" pointerEvents="none">RAJASTHAN</text><text x="444" y="60" fill="#678478" fontSize="9" letterSpacing="1.5" pointerEvents="none">HARYANA</text></svg></div>}
    <div className="map-footnote">{focus ? <span><strong>{focus.station}</strong> · {focus.district} · {number(focus[parameter.id], 4)} {parameter.unit} · {focus.date.slice(0, 10)}</span> : <span>{number(shown.length)} stations · maximum observation per station · schematic coordinates</span>}</div>
  </>;
}
