import React, { useState } from 'react';
import {
    MapPin, Calendar, Users, Flame, Info, CheckCircle,
    Car, Music, Sun, Wallet, Coins, TrendingUp,
    ShieldCheck, Thermometer, CloudSun, Waves, Wind,
    Map as MapIcon, Tent, Coffee, Moon, Navigation,
    LocateFixed
} from 'lucide-react';

const App = () => {
    const [activeTab, setActiveTab] = useState('plan');

    // Berechnungsgrundlagen für MAUTFREIE Fahrt
    const distanzHinZurueck = 600;
    const lokaleFahrten = 40;
    const gesamtKm = distanzHinZurueck + lokaleFahrten;

    const verbrauchPro100 = 8.8;
    const spritPreis = 2.20;
    const verschleissProKm = 0.05;

    const spritGesamt = ((gesamtKm / 100) * verbrauchPro100 * spritPreis).toFixed(2);
    const verschleissGesamt = (gesamtKm * verschleissProKm).toFixed(2);
    const totalKosten = (parseFloat(spritGesamt) + parseFloat(verschleissGesamt)).toFixed(2);
    const proPerson = (totalKosten / 5).toFixed(2);

    const exactAddress = "Eppan an der Weinstraße, 39057 Autonome Provinz Bozen - Südtirol, Italien";
    const coordinates = "46.443690, 11.286489";

    const weatherData = [
        {
            day: "Dienstag",
            temp: "24°C",
            condition: "Sonnig",
            detail: "Perfektes Stadtwetter. Abends mild für die Altstadt.",
            uv: "Hoch",
            icon: <Sun className="text-yellow-500" size={48} />
        },
        {
            day: "Mittwoch",
            temp: "27°C",
            condition: "Heiß & Strahlend",
            detail: "Ideales Grillwetter am See. Wasser ist erfrischend!",
            uv: "Sehr Hoch",
            icon: <CloudSun className="text-orange-500" size={48} />
        }
    ];

    const itinerary = [
        {
            day: "Dienstag",
            title: "Mautfreie Panorama-Anreise",
            events: [
                "Vormittag: Start über die Landstraße (Zirler Berg & Alte Brennerstraße).",
                "Mittag: Picknick-Stopp mit Blick auf die Alpenriesen.",
                "Nachmittag: Einzug in Bozen, Gelato am Waltherplatz.",
                "Abend: Fahrt zum Basecamp in Eppan & Chill-out."
            ]
        },
        {
            day: "Mittwoch",
            title: "See-Vibes & Grill-Session",
            events: [
                "Vormittag: Frühstück am Basecamp, dann zum Bozner Markt.",
                "Mittag: Abfahrt zum Montiggler See (direkt um die Ecke).",
                "Nachmittag: Sprung ins Wasser & Kohle anfeuern!",
                "Abend: Sonnenuntergang genießen & mautfreie Heimfahrt."
            ]
        }
    ];

    return (
        <div className="min-h-screen bg-orange-50 font-sans text-slate-900 pb-12">
            {/* Summer Hero Section */}
            <div className="relative h-80 bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500 flex items-center justify-center text-white overflow-hidden">
                <div className="absolute inset-0 opacity-20">
                    <svg viewBox="0 0 100 100" className="w-full h-full">
                        <circle cx="50" cy="50" r="20" fill="white" />
                        {[...Array(12)].map((_, i) => (
                            <rect key={i} x="48" y="0" width="4" height="30" fill="white" transform={`rotate(${i * 30} 50 50)`} />
                        ))}
                    </svg>
                </div>

                <div className="relative text-center z-10 px-4">
                    <div className="inline-block bg-white/30 backdrop-blur-md px-4 py-1 rounded-full text-sm font-bold mb-4 border border-white/40 uppercase tracking-widest shadow-sm">
                        ☀️ Summer Roadtrip 2026
                    </div>
                    <h1 className="text-5xl md:text-7xl font-black mb-2 drop-shadow-lg tracking-tighter italic">BOZEN VIBES</h1>
                    <p className="text-xl font-medium opacity-100 flex items-center justify-center gap-2 drop-shadow-md">
                        Mautfrei • Camping • See • 5 Freunde
                    </p>
                </div>

                <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-[0]">
                    <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="relative block w-full h-12 fill-orange-50">
                        <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V120H0V95.8C58.47,113.7,126.15,108.13,184.4,94.24,242.66,80.35,286,63.14,321.39,56.44Z"></path>
                    </svg>
                </div>
            </div>

            <main className="max-w-4xl mx-auto -mt-10 px-4 relative z-20">
                {/* Summer Navigation */}
                <div className="flex bg-white/90 backdrop-blur-md rounded-2xl shadow-xl p-1.5 mb-8 overflow-x-auto no-scrollbar border border-white">
                    {[
                        { id: 'plan', label: 'Plan', icon: <MapPin size={18} /> },
                        { id: 'weather', label: 'Wetter', icon: <Sun size={18} /> },
                        { id: 'camping', label: 'Basecamp', icon: <Tent size={18} /> },
                        { id: 'budget', label: 'Kosten', icon: <Wallet size={18} /> },
                        { id: 'grill', label: 'See & BBQ', icon: <Waves size={18} /> },
                        { id: 'pack', label: 'Packliste', icon: <CheckCircle size={18} /> }
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex-1 min-w-[90px] py-3 px-2 rounded-xl font-bold flex items-center justify-center gap-2 transition-all duration-300 ${activeTab === tab.id ? 'bg-orange-500 text-white shadow-md scale-105' : 'text-slate-500 hover:bg-orange-50'}`}
                        >
                            {tab.icon} {tab.label}
                        </button>
                    ))}
                </div>

                {/* Content Area */}
                <div className="bg-white rounded-3xl shadow-2xl p-6 md:p-10 border-b-8 border-orange-200">

                    {activeTab === 'plan' && (
                        <div className="space-y-10 animate-in fade-in zoom-in-95 duration-500">
                            <div className="bg-yellow-50 p-5 rounded-2xl flex gap-4 items-center text-amber-800 border border-yellow-100 shadow-sm">
                                <div className="bg-white p-2 rounded-full shadow-sm"><Info size={24} className="text-amber-500" /></div>
                                <p className="font-medium">Mautfrei-Modus: Wir genießen die Landschaft über die Alte Brennerstraße!</p>
                            </div>
                            {itinerary.map((item, idx) => (
                                <div key={idx} className="relative pl-10">
                                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-orange-400 to-yellow-300 rounded-full"></div>
                                    <div className="absolute -left-3 top-0 w-7 h-7 rounded-full bg-white border-4 border-orange-400 shadow-sm flex items-center justify-center">
                                        <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
                                    </div>
                                    <h3 className="text-3xl font-black text-slate-800 mb-1 flex items-center gap-2">
                                        {item.day} <span className="text-sm font-normal text-slate-400 uppercase tracking-widest px-3 py-1 bg-slate-100 rounded-full">Roadtrip</span>
                                    </h3>
                                    <p className="text-orange-600 font-bold mb-4 flex items-center gap-2"><Sun size={16} /> {item.title}</p>
                                    <ul className="space-y-4">
                                        {item.events.map((event, i) => (
                                            <li key={i} className="flex gap-4 text-slate-600 bg-slate-50/50 p-3 rounded-xl hover:bg-orange-50 transition-colors">
                                                <span className="text-orange-500 font-black">0{i + 1}</span>
                                                <span className="font-medium">{event}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>
                    )}

                    {activeTab === 'weather' && (
                        <div className="animate-in slide-in-from-right-4 duration-500 space-y-8">
                            <div className="text-center mb-8">
                                <h2 className="text-4xl font-black text-slate-800 mb-2">Summer Forecast</h2>
                                <p className="text-slate-500">Packt die Sonnencreme ein, Jungs!</p>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {weatherData.map((w, idx) => (
                                    <div key={idx} className="bg-gradient-to-br from-white to-orange-50 p-8 rounded-3xl border border-orange-100 shadow-lg text-center flex flex-col items-center group hover:scale-105 transition-transform">
                                        <span className="text-slate-400 font-bold uppercase tracking-widest text-sm mb-4">{w.day}</span>
                                        <div className="mb-4 transform group-hover:rotate-12 transition-transform">
                                            {w.icon}
                                        </div>
                                        <div className="text-5xl font-black text-slate-800 mb-2">{w.temp}</div>
                                        <div className="text-orange-600 font-bold mb-4">{w.condition}</div>
                                        <div className="space-y-3 w-full">
                                            <div className="flex justify-between items-center bg-white/60 p-2 rounded-lg text-sm">
                                                <span className="flex items-center gap-2 text-slate-500"><Wind size={14} /> UV-Index</span>
                                                <span className="font-bold text-red-500">{w.uv}</span>
                                            </div>
                                            <p className="text-xs text-slate-500 leading-relaxed italic">{w.detail}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTab === 'camping' && (
                        <div className="animate-in zoom-in duration-500 space-y-8">
                            <div className="flex flex-col md:flex-row gap-8">
                                <div className="flex-1 space-y-6">
                                    <h2 className="text-4xl font-black text-slate-800 italic flex items-center gap-3">
                                        <Tent className="text-orange-500" /> BASECAMP
                                    </h2>
                                    <div className="bg-slate-900 text-white p-6 rounded-3xl shadow-xl relative overflow-hidden">
                                        <div className="absolute top-0 right-0 p-4 opacity-10 rotate-12"><Moon size={100} /></div>
                                        <h4 className="text-orange-400 font-bold uppercase text-xs tracking-widest mb-2 flex items-center gap-2">
                                            <LocateFixed size={14} /> Ziel-Adresse
                                        </h4>
                                        <p className="text-lg font-bold mb-1 leading-tight">{exactAddress}</p>
                                        <p className="text-orange-400 font-mono text-sm mb-4">{coordinates}</p>

                                        <ul className="space-y-3 text-sm text-slate-300 border-t border-white/10 pt-4">
                                            <li className="flex items-center gap-2"><CheckCircle size={14} className="text-emerald-400" /> Exakter Parkplatz-Spot</li>
                                            <li className="flex items-center gap-2"><CheckCircle size={14} className="text-emerald-400" /> Unmittelbar bei den Seen</li>
                                            <li className="flex items-center gap-2"><CheckCircle size={14} className="text-emerald-400" /> Mautfrei via SS12 erreichbar</li>
                                        </ul>
                                    </div>

                                    <div className="bg-amber-50 border border-amber-200 p-5 rounded-2xl">
                                        <h5 className="font-bold text-amber-800 mb-2 flex items-center gap-2"><Info size={18} /> Survival-Regeln</h5>
                                        <p className="text-xs text-amber-700 leading-relaxed italic">
                                            In Südtirol ist Wildcampen heikel. Bleibt diskret (kein Camping-Setup draußen), hinterlasst keinen Müll und nutzt den Platz primär zum Schlafen nach der langen Fahrt.
                                        </p>
                                    </div>
                                </div>

                                <div className="flex-1">
                                    <div className="bg-slate-100 rounded-3xl h-64 md:h-full border-4 border-white shadow-inner relative group flex flex-col items-center justify-center overflow-hidden">
                                        <div className="absolute inset-0 opacity-40 bg-[radial-gradient(#e5e7eb_2px,transparent_2px)] [background-size:20px_20px]"></div>
                                        <MapIcon size={64} className="text-slate-300 mb-4 group-hover:scale-110 transition-transform" />
                                        <div className="text-center px-4 relative z-10">
                                            <p className="text-slate-500 font-bold uppercase text-xs mb-1">Stellplatz in Eppan</p>
                                            <p className="text-[10px] text-slate-400 mb-4">{coordinates}</p>
                                        </div>

                                        <button
                                            className="bg-orange-500 text-white px-8 py-3 rounded-full font-bold shadow-lg hover:bg-orange-600 transition-all hover:scale-105 flex items-center gap-2 relative z-10"
                                            onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${coordinates}`, '_blank')}
                                        >
                                            <Navigation size={18} /> Route starten
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="p-4 bg-white border rounded-2xl text-center">
                                    <Coffee size={24} className="mx-auto text-orange-400 mb-2" />
                                    <span className="text-[10px] font-bold text-slate-400 uppercase">Frühstück</span>
                                    <p className="text-xs font-bold text-slate-700">Camping-Kocher</p>
                                </div>
                                <div className="p-4 bg-white border rounded-2xl text-center">
                                    <Moon size={24} className="mx-auto text-blue-400 mb-2" />
                                    <span className="text-[10px] font-bold text-slate-400 uppercase">Nacht</span>
                                    <p className="text-xs font-bold text-slate-700">Decken & Kissen</p>
                                </div>
                                <div className="p-4 bg-white border rounded-2xl text-center">
                                    <Sun size={24} className="mx-auto text-yellow-400 mb-2" />
                                    <span className="text-[10px] font-bold text-slate-400 uppercase">Morgen</span>
                                    <p className="text-xs font-bold text-slate-700">See-Abkühlung</p>
                                </div>
                                <div className="p-4 bg-white border rounded-2xl text-center">
                                    <ShieldCheck size={24} className="mx-auto text-emerald-400 mb-2" />
                                    <span className="text-[10px] font-bold text-slate-400 uppercase">Safety</span>
                                    <p className="text-xs font-bold text-slate-700">Powerbank</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'budget' && (
                        <div className="animate-in fade-in duration-500">
                            <h2 className="text-3xl font-black mb-8 flex items-center gap-3 text-emerald-600 italic">
                                <Coins size={32} /> SMART TRAVEL
                            </h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                                <div className="p-8 bg-emerald-600 rounded-3xl text-white shadow-xl shadow-emerald-200 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-4 opacity-20"><TrendingUp size={80} /></div>
                                    <p className="text-emerald-100 text-xs font-bold uppercase tracking-widest mb-1">Total (Sprit + Verschleiß)</p>
                                    <p className="text-5xl font-black">{totalKosten} €</p>
                                    <p className="text-sm mt-4 font-medium bg-white/20 inline-block px-3 py-1 rounded-full">Keine Mautgebühren!</p>
                                </div>
                                <div className="p-8 bg-white border-2 border-emerald-100 rounded-3xl shadow-lg flex flex-col justify-center">
                                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Anteil pro Person</p>
                                    <p className="text-5xl font-black text-slate-800">{proPerson} €</p>
                                    <p className="text-emerald-600 font-bold mt-2 text-sm flex items-center gap-1">
                                        <ShieldCheck size={16} /> Unschlagbarer Preis
                                    </p>
                                </div>
                            </div>

                            <div className="bg-slate-50 p-6 rounded-2xl space-y-4 border border-slate-100">
                                <div className="flex justify-between font-bold text-slate-700 border-b pb-2">
                                    <span>Posten</span>
                                    <span>Betrag</span>
                                </div>
                                <div className="flex justify-between text-slate-600">
                                    <span className="flex items-center gap-2"><div className="w-2 h-2 bg-orange-400 rounded-full"></div> Sprit (2.20€/l)</span>
                                    <span className="font-mono">{spritGesamt} €</span>
                                </div>
                                <div className="flex justify-between text-slate-600">
                                    <span className="flex items-center gap-2"><div className="w-2 h-2 bg-blue-400 rounded-full"></div> Verschleiß (5ct/km)</span>
                                    <span className="font-mono">{verschleissGesamt} €</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'grill' && (
                        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                            <h2 className="text-3xl font-black flex items-center gap-3 text-orange-500 italic">
                                <Flame size={32} /> SEE-SESSION
                            </h2>
                            <div className="relative rounded-3xl overflow-hidden h-48 bg-slate-200 mb-6">
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-6">
                                    <div className="text-white">
                                        <h4 className="text-xl font-bold">Montiggler Seen</h4>
                                        <p className="text-sm opacity-80">Der Hotspot für unser BBQ.</p>
                                    </div>
                                </div>
                                <div className="w-full h-full flex items-center justify-center text-slate-400">
                                    <Waves size={64} className="opacity-20 animate-pulse" />
                                </div>
                            </div>
                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="bg-white p-5 rounded-2xl border-2 border-orange-100 shadow-sm">
                                    <h5 className="font-black text-orange-600 mb-2">Die Grill-Regel</h5>
                                    <p className="text-sm text-slate-600 italic">"Nur in ausgewiesenen Bereichen grillen. Müll mitnehmen ist Ehrensache!"</p>
                                </div>
                                <div className="bg-white p-5 rounded-2xl border-2 border-blue-100 shadow-sm">
                                    <h5 className="font-black text-blue-600 mb-2">Abkühlung</h5>
                                    <p className="text-sm text-slate-600 italic">"Der kleine Montiggler See ist oft ruhiger und perfekt zum Chillen."</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'pack' && (
                        <div className="animate-in fade-in duration-500">
                            <h2 className="text-3xl font-black mb-8 flex items-center gap-3 text-orange-500 italic">
                                <CheckCircle size={32} /> CREW-STUFF
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {['Grill & Kohle', 'Kühlbox (Pre-iced)', 'Mariniertes Fleisch', 'Badesachen', 'Sonnenbrille', 'Musik-Box'].map((item, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-4 bg-orange-50 rounded-2xl group cursor-pointer hover:bg-orange-100 transition-colors">
                                        <span className="font-bold text-slate-700">{item}</span>
                                        <div className="w-6 h-6 rounded-full border-2 border-orange-300 flex items-center justify-center bg-white">
                                            <div className="w-3 h-3 bg-orange-500 rounded-full scale-0 group-hover:scale-100 transition-transform"></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-10 p-8 border-4 border-dashed border-orange-100 rounded-3xl text-center bg-yellow-50/30">
                                <Music className="mx-auto text-orange-300 mb-4 animate-bounce" size={48} />
                                <p className="text-orange-600 font-black text-xl uppercase italic">Playlist nicht vergessen!</p>
                                <p className="text-slate-500 text-sm mt-2">Suche nach: 'Italian Summer Hits 2026'</p>
                            </div>
                        </div>
                    )}

                </div>

                {/* Footer info */}
                <div className="mt-12 flex flex-col md:flex-row justify-between items-center gap-4 px-6 text-slate-400 text-sm font-bold uppercase tracking-widest">
                    <div className="flex items-center gap-2">
                        <Sun size={20} className="text-yellow-500" />
                        Enjoy the Sun
                    </div>
                    <div className="text-orange-500">
                        Bozen Calling! 🇮🇹
                    </div>
                </div>
            </main>
        </div>
    );
};

export default App;