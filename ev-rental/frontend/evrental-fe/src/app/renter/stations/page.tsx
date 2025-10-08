'use client';
import { useEffect, useState } from 'react';
import { api } from '@/src/lib/api';


export default function StationsPage(){
const [items, setItems] = useState<any[]>([]);
useEffect(()=>{ api('/rental/api/v1/stations').then(r=>setItems(r.data)); },[]);
return (
<div className="p-6">
<h1 className="text-2xl font-semibold">Stations</h1>
<ul className="mt-4 grid gap-3">
{items.map(s => (
<li key={s.id} className="p-4 rounded-xl border">{s.name} — {s.address}</li>
))}
</ul>
</div>
);
}