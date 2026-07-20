import { useState, useEffect } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { EffectCoverflow, Navigation } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/effect-coverflow';
import 'swiper/css/navigation'; 

import { createClient } from '@supabase/supabase-js';

const GEMINI_API_KEY = "AIzaSyDoakVD9F452mWb-g_WU8E9XCJ5ZizLq8s"; 
const TMDB_API_KEY = 'ae9f1b37008417cf84bd939e47ad0839';
const fetchOptions = { method: 'GET', headers: { 'Accept': 'application/json' }, cache: 'no-store' };

const SUPABASE_URL = 'https://rjlnhxdstgpizvbjbotu.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_yBmS3RkHn2jnghn-w-SeqA_qcVCXua7'; 
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const LOGO_DARK = '/wherewasi_logo_dark.png'; 
const LOGO_LIGHT = '/wherewasi_logo_light.png'; 

function App() {
  const [user, setUser] = useState(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [authError, setAuthError] = useState('');

  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [theme, setTheme] = useState('dark'); 

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedShow, setSelectedShow] = useState(null);
  const [showDetails, setShowDetails] = useState(null);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [memoryText, setMemoryText] = useState('');
  const [exactSeason, setExactSeason] = useState('');
  const [popupLoading, setPopupLoading] = useState(false);
  const [gameLoading, setGameLoading] = useState(false);
  const [flatEpisodes, setFlatEpisodes] = useState([]); 
  const [searchBounds, setSearchBounds] = useState({ min: 0, max: 0, mid: 0 }); 
  const [currentEpisode, setCurrentEpisode] = useState(null);
  const [episodeImages, setEpisodeImages] = useState([]);
  const [foundEpisode, setFoundEpisode] = useState(null);
  const [blacklistedEpisodes, setBlacklistedEpisodes] = useState([]);

  // Navigasyon
  const [activePage, setActivePage] = useState('home'); 
  const [savedEpisodes, setSavedEpisodes] = useState([]);
  const [isMobileAccountOpen, setIsMobileAccountOpen] = useState(false);
  const [episodeToDelete, setEpisodeToDelete] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setIsAuthLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    setAuthError('');
    if (!authEmail || !authPassword) return setAuthError("E-posta ve şifre boş bırakılamaz.");
    try {
      if (isLoginMode) {
        const { error } = await supabase.auth.signInWithPassword({ email: authEmail, password: authPassword });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({ email: authEmail, password: authPassword });
        if (error) throw error;
        showToast("Kayıt başarılı! Giriş yapıldı.", "success");
      }
    } catch (err) { setAuthError(err.message); }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setActivePage('home'); setSelectedShow(null); setFoundEpisode(null); setIsMobileAccountOpen(false);
  };

  const fetchHistory = async () => {
    if (!user) return;
    const { data, error } = await supabase.from('saved_episodes').select('*').order('created_at', { ascending: false });
    if (!error && data) setSavedEpisodes(data);
  };

  useEffect(() => {
    if (activePage === 'history' && user) fetchHistory();
  }, [activePage, user]);

  const handleSaveEpisode = async () => {
    if (!user || !foundEpisode || !selectedShow) return;
    const { error } = await supabase.from('saved_episodes').insert([
      { user_id: user.id, show_name: selectedShow.name, season: foundEpisode.season, episode: foundEpisode.episode }
    ]);
    if (error) showToast("Kaydetme başarısız: " + error.message, "error");
    else showToast("Bölüm başarıyla kaydedildi!", "success");
  };

  const handleDeleteEpisode = async () => {
    if (!user || !episodeToDelete) return;
    const { error } = await supabase.from('saved_episodes').delete().match({ id: episodeToDelete });
    if (error) {
      showToast("Silme hatası: " + error.message, "error");
    } else {
      showToast("Kayıt veritabanından silindi.", "success");
      setSavedEpisodes(savedEpisodes.filter(ep => ep.id !== episodeToDelete));
    }
    setEpisodeToDelete(null);
  };

  useEffect(() => {
    if (searchQuery.trim() === '') { setSearchResults([]); return; }
    const delay = setTimeout(() => {
      setIsSearching(true);
      fetch(`https://api.themoviedb.org/3/search/tv?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(searchQuery)}&language=tr-TR&page=1`, fetchOptions)
        .then(res => res.json())
        .then(data => setSearchResults((data.results || []).slice(0, 5)))
        .catch(() => setError("Arama hatası"))
        .finally(() => setIsSearching(false));
    }, 500);
    return () => clearTimeout(delay);
  }, [searchQuery]);

  const handleSelectShow = async (show) => {
    setError(null); setSearchQuery(''); setSearchResults([]); setFoundEpisode(null);
    setMemoryText(''); setExactSeason(''); setBlacklistedEpisodes([]);
    setSelectedShow(show); setShowDetails(null); setCurrentEpisode(null);
    try {
      const res = await fetch(`https://api.themoviedb.org/3/tv/${show.id}?api_key=${TMDB_API_KEY}&language=tr-TR`, fetchOptions);
      if (!res.ok) throw new Error("Hata");
      const data = await res.json();
      setShowDetails(data);
      setIsModalOpen(true); 
    } catch (err) { setError("Veri alınamadı."); setSelectedShow(null); }
  };

  const generateFlatEpisodes = (showData) => {
    let flatList = [];
    const validSeasons = (showData.seasons || []).filter(s => s.season_number > 0);
    validSeasons.forEach(s => {
      for (let i = 1; i <= s.episode_count; i++) flatList.push({ season: s.season_number, episode: i });
    });
    return flatList;
  };

  const loadEpisodeData = async (showId, seasonNum, episodeNum) => {
    try {
      const epRes = await fetch(`https://api.themoviedb.org/3/tv/${showId}/season/${seasonNum}/episode/${episodeNum}?api_key=${TMDB_API_KEY}&language=tr-TR`, fetchOptions);
      const epData = await epRes.json();
      setCurrentEpisode(epData);
      const imgRes = await fetch(`https://api.themoviedb.org/3/tv/${showId}/season/${seasonNum}/episode/${episodeNum}/images?api_key=${TMDB_API_KEY}`, fetchOptions);
      const imgData = await imgRes.json();
      if (imgData.stills && imgData.stills.length > 0) setEpisodeImages(imgData.stills);
      else if (epData.still_path) setEpisodeImages([{ file_path: epData.still_path }]);
      else setEpisodeImages([]);
    } catch (err) { console.error(err); setEpisodeImages([]); }
  };

  const callGemini = async (promptText) => {
    const modelsToTry = ['gemini-2.5-flash', 'gemini-1.5-flash-8b'];
    let lastError = "";
    for (const modelName of modelsToTry) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${GEMINI_API_KEY}`;
        const response = await fetch(url, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contents: [{ parts: [{ text: promptText }] }] })
        });
        if (!response.ok) { const errData = await response.json().catch(() => ({})); throw new Error(errData?.error?.message || response.statusText); }
        const data = await response.json();
        return data.candidates[0].content.parts[0].text;
      } catch (err) { lastError = err.message; }
    }
    throw new Error(`Google API çöktü: ${lastError}`);
  };

  const startGameWithBounds = async (forcedMinIndex = null, forcedMaxIndex = null) => {
    setGameLoading(true);
    const flatList = generateFlatEpisodes(showDetails);
    setFlatEpisodes(flatList);
    const minIndex = forcedMinIndex !== null ? forcedMinIndex : 0;
    const maxIndex = forcedMaxIndex !== null ? forcedMaxIndex : flatList.length - 1;
    const midIndex = Math.floor((minIndex + maxIndex) / 2);
    setSearchBounds({ min: minIndex, max: maxIndex, mid: midIndex });
    await loadEpisodeData(selectedShow.id, flatList[midIndex].season, flatList[midIndex].episode);
    setGameLoading(false);
  };

  const handleStartDirectly = () => { setIsModalOpen(false); startGameWithBounds(null, null); };

  const handleStartWithAIAndSeason = async () => {
    setError(null);
    const flatList = generateFlatEpisodes(showDetails);
    if (exactSeason && !memoryText.trim()) {
      setIsModalOpen(false);
      const targetSeason = parseInt(exactSeason);
      const filteredIndices = flatList.map((ep, idx) => ep.season === targetSeason ? idx : null).filter(idx => idx !== null);
      if (filteredIndices.length > 0) startGameWithBounds(filteredIndices[0], filteredIndices[filteredIndices.length - 1]);
      else startGameWithBounds(null, null);
      return;
    }
    if (memoryText.trim()) {
      setPopupLoading(true);
      try {
        const seasonsSummary = (showDetails.seasons || []).filter(s => s.season_number > 0).map(s => `Sezon ${s.season_number}: ${s.overview || 'Özet yok'}`).join("\n");
        const prompt = `Dizi: ${selectedShow.name}\nAnı: "${memoryText}"\nÖzetler:\n${seasonsSummary}\nSoru: Anı hangi sezonda? SADECE tahmin ettiğin sezon numarasını dön. Bulamazsan 0 dön.`;
        const reply = await callGemini(prompt);
        const guessedSeason = parseInt(reply.trim());
        setIsModalOpen(false);
        if (guessedSeason > 0) {
          const filteredIndices = flatList.map((ep, idx) => ep.season === guessedSeason ? idx : null).filter(idx => idx !== null);
          if (filteredIndices.length > 0) {
            startGameWithBounds(filteredIndices[0], filteredIndices[filteredIndices.length - 1]);
            setPopupLoading(false); return;
          }
        }
        startGameWithBounds(null, null);
      } catch (err) { alert("AI Hatası: " + err.message); setIsModalOpen(false); startGameWithBounds(null, null); } finally { setPopupLoading(false); }
    }
  };

  const handleDecision = async (direction) => {
    let { min, max, mid } = searchBounds;
    if (direction === 'DONT_REMEMBER') {
      setGameLoading(true);
      try {
        const currentEpIdentifier = `${currentEpisode.season_number}-${currentEpisode.episode_number}`;
        const updatedBlacklist = [...blacklistedEpisodes, currentEpIdentifier];
        setBlacklistedEpisodes(updatedBlacklist);
        const slicedRange = flatEpisodes.slice(min, max + 1);
        const uniqueSeasonsInRange = [...new Set(slicedRange.map(ep => ep.season))];
        const fetchPromises = uniqueSeasonsInRange.map(sNum => fetch(`https://api.themoviedb.org/3/tv/${selectedShow.id}/season/${sNum}?api_key=${TMDB_API_KEY}&language=tr-TR`, fetchOptions).then(res => res.json()) );
        const seasonsDataArray = await Promise.all(fetchPromises);
        let compiledEpisodesText = "";
        let availableEpisodesCount = 0;
        seasonsDataArray.forEach(sData => {
          const sNum = sData.season_number;
          const targetEpisodes = slicedRange.filter(ep => ep.season === sNum);
          targetEpisodes.forEach(te => {
            if (!updatedBlacklist.includes(`${sNum}-${te.episode}`)) {
              const fullEp = (sData.episodes || []).find(e => e.episode_number === te.episode);
              if (fullEp) { compiledEpisodesText += `S${sNum} B${te.episode}: "${fullEp.name}"\n`; availableEpisodesCount++; }
            }
          });
        });
        if (availableEpisodesCount === 0) {
           const newMin = Math.min(flatEpisodes.length - 1, max + 1); const newMax = Math.min(flatEpisodes.length - 1, newMin + Math.max(5, max - min));
           if(newMin > newMax || newMin >= flatEpisodes.length - 1) { setFoundEpisode(flatEpisodes[flatEpisodes.length - 1]); setGameLoading(false); return; }
           const newMid = Math.floor((newMin + newMax) / 2);
           setSearchBounds({ min: newMin, max: newMax, mid: newMid }); await loadEpisodeData(selectedShow.id, flatEpisodes[newMid].season, flatEpisodes[newMid].episode);
           setGameLoading(false); return;
        }
        const prompt = `Aktif liste:\n${compiledEpisodesText}\nGörevin: Bu listedeki en şok edici/ikonik bölümü seç. SADECE JSON ver: {"season": X, "episode": Y}`;
        const reply = await callGemini(prompt);
        const jsonMatch = reply.match(/\{.*\}/s); const targetEp = JSON.parse(jsonMatch[0]);
        const targetIndex = flatEpisodes.findIndex(ep => ep.season === targetEp.season && ep.episode === targetEp.episode);
        if (targetIndex !== -1 && targetIndex >= min && targetIndex <= max) { setSearchBounds({ min, max, mid: targetIndex }); await loadEpisodeData(selectedShow.id, flatEpisodes[targetIndex].season, flatEpisodes[targetIndex].episode); } else {
           const fallbackIndex = flatEpisodes.findIndex((ep, idx) => idx >= min && idx <= max && !updatedBlacklist.includes(`${ep.season}-${ep.episode}`));
           if(fallbackIndex !== -1) { setSearchBounds({ min, max, mid: fallbackIndex }); await loadEpisodeData(selectedShow.id, flatEpisodes[fallbackIndex].season, flatEpisodes[fallbackIndex].episode); }
        }
      } catch (err) { alert("Motor hatası"); } finally { setGameLoading(false); }
      return;
    }
    if (direction === 'FORWARD') min = mid + 1; else max = mid - 1; 
    if (min > max) { const targetIndex = Math.min(min, flatEpisodes.length - 1); setFoundEpisode(flatEpisodes[targetIndex]); } else {
      setGameLoading(true);
      const newMid = Math.floor((min + max) / 2);
      setSearchBounds({ min, max, mid: newMid }); await loadEpisodeData(selectedShow.id, flatEpisodes[newMid].season, flatEpisodes[newMid].episode);
      setGameLoading(false);
    }
  };

  // ANA TEMA
  const isDark = theme === 'dark';
  const bgColor = isDark ? 'bg-zinc-950' : 'bg-[#F4F5F7]';
  const sidebarBg = isDark ? 'bg-zinc-900' : 'bg-white';
  const textColor = isDark ? 'text-white' : 'text-slate-800';
  const mutedText = isDark ? 'text-slate-400' : 'text-slate-500';
  const inputBg = isDark ? 'bg-zinc-950' : 'bg-slate-100';
  const borderColor = isDark ? 'border-slate-700/50' : 'border-slate-200';

  if (isAuthLoading) {
    return <div className={`min-h-screen ${bgColor} flex justify-center items-center text-white`}><div className="w-10 h-10 border-4 border-slate-700 border-t-indigo-500 rounded-full animate-spin"></div></div>;
  }

  // --- LOGIN EKRANI ---
  if (!user) {
    return (
      <div className={`min-h-screen ${bgColor} flex justify-center items-center font-['Inter'] px-4`}>
        <div className={`w-full max-w-md ${sidebarBg} rounded-3xl shadow-2xl py-12 px-8 ${textColor} border ${borderColor}`}>
          <div className="text-center mb-10">
            <img src={isDark ? LOGO_DARK : LOGO_LIGHT} alt="WhereWasI? Logo" className="w-48 mx-auto mb-6 object-contain" />
            <p className={mutedText}>Tekrar hoş geldin!</p>
          </div>
          {authError && <div className="bg-red-500/10 text-red-500 p-3 rounded-xl mb-6 text-sm text-center border border-red-500/20">{authError}</div>}
          <form onSubmit={handleAuth} className="flex flex-col gap-4">
            <input type="email" placeholder="E-Posta Adresi" value={authEmail} onChange={(e) => setAuthEmail(e.target.value)} className={`w-full p-4 ${inputBg} border ${borderColor} rounded-xl outline-none focus:border-indigo-500 ${textColor} transition-all`} />
            <input type="password" placeholder="Şifre" value={authPassword} onChange={(e) => setAuthPassword(e.target.value)} className={`w-full p-4 ${inputBg} border ${borderColor} rounded-xl outline-none focus:border-indigo-500 ${textColor} transition-all`} />
            <button type="submit" className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-all mt-2 shadow-lg shadow-indigo-900/20 active:scale-95">
              {isLoginMode ? 'Giriş Yap' : 'Kayıt Ol'}
            </button>
          </form>
          <p className={`text-center ${mutedText} mt-6 text-sm`}>
            {isLoginMode ? "Hesabın yok mu?" : "Zaten hesabın var mı?"} 
            <button onClick={() => { setIsLoginMode(!isLoginMode); setAuthError(''); }} className="text-indigo-500 ml-2 font-semibold hover:text-indigo-400">{isLoginMode ? "Kayıt Ol" : "Giriş Yap"}</button>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex h-screen w-full ${bgColor} ${textColor} font-['Inter'] overflow-hidden transition-colors duration-300 font-sans`}>
      
      {/* TOAST POP-UP */}
      {toast.show && (
        <div className={`fixed top-5 right-5 z-50 px-6 py-4 rounded-xl shadow-xl flex items-center gap-3 border ${toast.type === 'success' ? `${sidebarBg} border-indigo-500/30 text-indigo-500` : `${sidebarBg} border-red-500/30 text-red-500`}`}>
          <span className="font-bold text-lg">{toast.type === 'success' ? '✓' : '✕'}</span>
          <p className="font-semibold">{toast.message}</p>
        </div>
      )}

      {/* SİLME ONAY MODALI */}
      {episodeToDelete && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
           <div className={`${sidebarBg} border ${borderColor} rounded-2xl p-6 shadow-2xl max-w-sm w-full text-center`}>
              <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/30">
                 <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
              </div>
              <h3 className="text-xl font-bold mb-2">Kayıt Silinecek</h3>
              <p className={`${mutedText} mb-6 text-sm`}>Bu bölümü geçmişten silmek istediğine emin misin? Bu işlem geri alınamaz.</p>
              <div className="flex gap-3">
                 <button onClick={() => setEpisodeToDelete(null)} className={`flex-1 py-3 ${inputBg} rounded-xl text-sm font-semibold border ${borderColor} hover:opacity-80 transition-opacity`}>İptal</button>
                 <button onClick={handleDeleteEpisode} className="flex-1 py-3 bg-red-600 text-white rounded-xl text-sm font-semibold shadow-lg shadow-red-900/20 active:scale-95 transition-all">Evet, Sil</button>
              </div>
           </div>
        </div>
      )}

      {/* =========================================
          SOL MENÜ (MASAÜSTÜ)
          ========================================= */}
      <aside className={`hidden md:flex flex-col w-[280px] ${sidebarBg} shadow-2xl z-20 border-r ${borderColor} transition-colors duration-300`}>
        
        {/* Üst Profil Alanı */}
        <div className={`flex items-center justify-between p-6 border-b ${borderColor}`}>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-indigo-400 to-purple-500 flex items-center justify-center shadow-lg border-2 border-zinc-950">
              <span className="font-bold text-white text-lg">{user.email.charAt(0).toUpperCase()}</span>
            </div>
            <div>
              <p className={`text-[11px] ${mutedText} font-medium`}>İyi Günler!</p>
              <p className={`text-sm font-bold ${textColor} truncate max-w-[120px]`}>{user.email.split('@')[0]}</p>
            </div>
          </div>
          <button onClick={handleLogout} className={`w-8 h-8 flex items-center justify-center rounded-lg border ${borderColor} text-red-400 hover:bg-red-500/10 transition-colors`}>
             <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
          </button>
        </div>

        {/* Ana Menüler */}
        <nav className="flex-1 flex flex-col gap-1 p-4">
          <div className={`text-[10px] font-bold uppercase tracking-wider ${mutedText} mb-2 ml-2 mt-2`}>Arama</div>
          
          <button onClick={() => setActivePage('home')} className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${activePage === 'home' ? 'bg-indigo-500/10 text-indigo-500 border border-indigo-500/20' : `${mutedText} hover:bg-slate-500/10 hover:${textColor}`}`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
            Ana Sayfa
          </button>
          
          <button onClick={() => setActivePage('history')} className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${activePage === 'history' ? 'bg-indigo-500/10 text-indigo-500 border border-indigo-500/20' : `${mutedText} hover:bg-slate-500/10 hover:${textColor}`}`}>
            {/* YENİ: Bookmark (Kaydedilenler) İkonu */}
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"></path></svg>
            Kaydedilenler
          </button>
        </nav>

        {/* Hakkında (Eski Ayarlar) & Tema */}
        <div className={`p-4 border-t ${borderColor}`}>
          <div className="flex flex-col gap-1 mb-4">
            <button onClick={() => setActivePage('about')} className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${activePage === 'about' ? 'bg-indigo-500/10 text-indigo-500 border border-indigo-500/20' : `${mutedText} hover:bg-slate-500/10 hover:${textColor}`}`}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              Hakkında
            </button>
          </div>

          <div className={`p-1 flex items-center justify-between rounded-xl ${inputBg} border ${borderColor}`}>
            <button onClick={() => setTheme('light')} className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${!isDark ? `${sidebarBg} ${textColor} shadow-sm border border-slate-700/30` : `${mutedText} hover:${textColor}`}`}>
              ☀️ Light
            </button>
            <button onClick={() => setTheme('dark')} className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${isDark ? `${sidebarBg} ${textColor} shadow-sm border border-slate-700/30` : `${mutedText} hover:${textColor}`}`}>
              🌙 Dark
            </button>
          </div>
        </div>
      </aside>

      {/* =========================================
          ANA İÇERİK ALANI 
          ========================================= */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        
        {/* PUSLU ARKA PLAN EFEKTİ */}
        <div className={`absolute inset-0 z-0 opacity-10 bg-zinc-950 transition-colors duration-300 ${!isDark && 'opacity-[0.04]'} bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]`}>
           <div className={`absolute inset-0 bg-gradient-to-b from-indigo-950/20 via-zinc-950/5 to-zinc-950/0`}></div>
        </div>

        {/* İçerik Container */}
        <div className="flex-1 overflow-y-auto px-4 py-8 md:p-12 pb-24 md:pb-12 z-10 custom-scrollbar relative w-full">
          
          {/* ANA SAYFA / ARAMA EKRANI */}
          {activePage === 'home' && (
            <div className="flex flex-col h-full w-full max-w-4xl mx-auto">
              {!selectedShow && (
                <div className="flex-1 flex flex-col items-center justify-center text-center animate-fade-in w-full px-4">
                  
                  {/* BÜYÜTÜLMÜŞ LOGO */}
                  <img src={isDark ? LOGO_DARK : LOGO_LIGHT} alt="WhereWasI? Logo" className="w-full max-w-[400px] md:max-w-[600px] h-auto mb-10 object-contain drop-shadow-[0_0_20px_rgba(79,70,229,0.15)]" />
                  
                  {error && <p className="text-red-500 bg-red-500/10 p-4 rounded-xl mb-6 text-sm border border-red-500/20 w-full max-w-2xl">{error}</p>}
                  
                  {/* ARAMA ÇUBUĞU VE ALT YAZI */}
                  <div className="relative w-full max-w-2xl group mx-auto">
                    {/* YENİ: Arama İkonu Kusursuz Ortalandı (top-1/2 -translate-y-1/2) */}
                    <div className="absolute left-6 top-1/2 -translate-y-1/2 flex items-center pointer-events-none transition-transform group-focus-within:translate-x-1">
                      <svg className={`w-7 h-7 ${mutedText} group-focus-within:text-indigo-500 transition-colors`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                    </div>
                    
                    <input type="text" placeholder="Dizi adı yazın... (Örn: Breaking Bad)" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className={`w-full pl-16 pr-8 py-5 ${inputBg} border-2 ${borderColor} rounded-[2rem] outline-none focus:border-indigo-500 text-xl transition-all ${textColor} placeholder-slate-500 focus:ring-4 focus:ring-indigo-500/20 shadow-xl group-hover:border-slate-500`} />
                    
                    {/* Açıklama yazısı */}
                    <p className={`${mutedText} mt-5 text-sm md:text-base font-medium tracking-wide`}>Dizini ara, kaldığın efsane sahneyi saniyeler içinde bulalım.</p>
                    
                    {searchResults.length > 0 && (
                      <div className={`absolute w-full mt-4 ${sidebarBg} border ${borderColor} rounded-3xl shadow-2xl overflow-hidden z-20 animate-slide-down`}>
                        {searchResults.map((show) => (
                          <div key={show.id} onClick={() => handleSelectShow(show)} className={`flex items-center p-5 border-b ${borderColor} hover:${inputBg} cursor-pointer transition-colors active:scale-[0.99] origin-left`}>
                            {show.poster_path ? <img src={`https://image.tmdb.org/t/p/w92${show.poster_path}`} className="w-14 h-20 rounded-xl object-cover mr-6 shadow-md" /> : <div className={`w-14 h-20 ${inputBg} rounded-xl mr-6`}></div>}
                            <div className="text-left">
                              <p className={`font-black text-xl ${textColor}`}>{show.name}</p>
                              <p className={`text-sm ${mutedText} mt-1 font-semibold`}>{show.first_air_date ? show.first_air_date.substring(0,4) : ''}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ZAFER EKRANI */}
              {foundEpisode && (
                <div className="flex flex-col items-center justify-center h-full text-center max-w-lg mx-auto animate-fade-in w-full">
                  <div className="w-28 h-28 bg-indigo-500/10 rounded-full flex items-center justify-center mb-8 border border-indigo-500/20 shadow-[0_0_40px_rgba(79,70,229,0.15)] text-indigo-500">
                    <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                  </div>
                  <h2 className={`text-4xl font-black mb-3 ${textColor}`}>{selectedShow.name}</h2>
                  <p className={`${mutedText} mb-10 text-xl font-medium`}>Harika! Kaldığın tam noktayı bulduk.</p>
                  
                  <div className={`${sidebarBg} border ${borderColor} w-full p-10 rounded-[2.5rem] mb-8 shadow-2xl`}>
                    <p className="text-sm text-indigo-500 font-bold tracking-widest uppercase mb-3">Hedef Bölüm</p>
                    <p className={`text-6xl font-black tracking-tighter ${textColor}`}>S{foundEpisode.season} <span className={`${mutedText} font-light mx-2 opacity-50`}>|</span> B{foundEpisode.episode}</p>
                  </div>
                  
                  <button onClick={handleSaveEpisode} className={`w-full py-5 mb-4 ${sidebarBg} hover:${inputBg} font-bold rounded-2xl flex items-center justify-center gap-3 active:scale-95 transition-all text-xl shadow-md border ${borderColor} ${textColor}`}>
                     Kaldığım Yeri Buluta Kaydet
                  </button>
                  <button onClick={() => { setSelectedShow(null); setFoundEpisode(null); }} className="w-full py-5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl active:scale-95 text-xl shadow-xl shadow-indigo-900/30 transition-all">
                    Başka Dizi Ara
                  </button>
                </div>
              )}

              {/* !!! OYUN EKRANI !!! */}
              {selectedShow && !foundEpisode && (
                <div className="flex flex-col items-center justify-center h-full max-w-3xl mx-auto py-2 w-full animate-fade-in relative">
                  
                  {/* YENİ: İptal / Geri Dön Butonu (Web'de görünür, mobilde zaten ortadaki tuş var) */}
                  <div className="w-full flex justify-start mb-6">
                    <button onClick={() => setSelectedShow(null)} className={`flex items-center gap-2 ${mutedText} hover:${textColor} font-semibold transition-colors`}>
                       <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                       Başka Dizi Ara
                    </button>
                  </div>

                  {gameLoading || !currentEpisode ? (
                    <div className="flex flex-col items-center justify-center py-20">
                      <div className="w-16 h-16 border-4 border-slate-700 border-t-indigo-500 rounded-full animate-spin mb-6"></div>
                      <p className={`${mutedText} font-bold text-lg animate-pulse tracking-wide`}>Sahneler Yükleniyor...</p>
                    </div>
                  ) : (
                    <div className="w-full flex flex-col items-center">
                      
                      {/* Görsel Alanı */}
                      <div className="w-full mb-8 relative">
                        {episodeImages.length > 0 ? (
                          <Swiper 
                             effect={'coverflow'} 
                             grabCursor={window.innerWidth <= 768} 
                             simulateTouch={window.innerWidth <= 768} 
                             centeredSlides={true} slidesPerView={1.15} loop={true} spaceBetween={30} 
                             coverflowEffect={{ rotate: 4, stretch: 0, depth: 100, modifier: 1, slideShadows: false }} 
                             navigation={window.innerWidth > 768} 
                             modules={[EffectCoverflow, Navigation]} 
                             className="w-full h-64 md:h-[400px] rounded-3xl md:rounded-[2.5rem] shadow-2xl web-swiper-kill-drag"
                          >
                            {episodeImages.map((img, index) => (
                              <SwiperSlide key={index} className="w-full h-full flex justify-center items-center">
                                 <img src={`https://image.tmdb.org/t/p/w780${img.file_path}`} className="w-full h-full object-cover rounded-3xl md:rounded-[2.5rem] shadow-inner border border-slate-800/50" alt="Dizi Sahnesi" />
                              </SwiperSlide>
                            ))}
                          </Swiper>
                        ) : ( <div className={`w-full h-64 md:h-[400px] ${inputBg} border ${borderColor} rounded-3xl flex items-center justify-center`}><p className={`${mutedText} font-bold text-lg`}>Görsel Yok</p></div> )}
                      </div>
                      
                      {/* Bölüm Bilgileri ve Karar Butonları */}
                      <div className="text-center w-full max-w-xl px-4 flex flex-col items-center">
                        <span className="inline-block px-5 py-2 bg-indigo-500/10 text-indigo-500 text-sm font-black rounded-xl mb-4 tracking-widest uppercase border border-indigo-500/20">Sezon {currentEpisode.season_number} • Bölüm {currentEpisode.episode_number}</span>
                        <h3 className={`text-3xl md:text-5xl font-black leading-tight mb-4 ${textColor} tracking-tighter`}>"{currentEpisode.name}"</h3>
                        <p className={`text-base md:text-lg leading-relaxed line-clamp-3 mb-8 ${mutedText} font-medium`}>{currentEpisode.overview || "Özet bulunmuyor."}</p>
                        
                        {/* YENİ: Soft Renkli Karar Butonları (Emoji Yok) */}
                        <div className="flex flex-col gap-4 w-full">
                          <button onClick={() => handleDecision('FORWARD')} className="w-full py-4 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 border border-emerald-500/20 text-xl font-bold rounded-2xl active:scale-95 transition-all shadow-sm">
                            Bu Bölümü İzledim
                          </button>
                          <button onClick={() => handleDecision('BACKWARD')} className="w-full py-4 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border border-rose-500/20 text-xl font-bold rounded-2xl active:scale-95 transition-all shadow-sm">
                            İzlemedim
                          </button>
                          <button onClick={() => handleDecision('DONT_REMEMBER')} className="w-full py-4 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 text-lg font-bold rounded-2xl active:scale-95 transition-all shadow-sm">
                            Sahneyi Flu Hatırlıyorum
                          </button>
                        </div>
                      </div>

                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          
          {/* GEÇMİŞ EKRANI */}
          {activePage === 'history' && (
            <div className="flex flex-col h-full max-w-6xl mx-auto animate-fade-in w-full">
              <div className="flex justify-between items-center mb-10 border-b border-transparent pb-4">
                <div>
                  <h2 className={`text-3xl md:text-4xl font-black tracking-tight mb-2 ${textColor}`}>Kaydedilenler</h2>
                  <p className={`${mutedText} text-sm font-medium`}>İzlediğin ve kaldığın tüm diziler burada saklanır.</p>
                </div>
                <button onClick={() => fetchHistory()} className={`px-5 py-2.5 ${sidebarBg} hover:${inputBg} rounded-xl text-sm font-bold shadow-sm border ${borderColor} active:scale-95 ${textColor}`}>🔄 Yenile</button>
              </div>
              
              {savedEpisodes.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center py-20 -mt-10 animate-fade-in">
                   {/* YENİ: Bookmark İkonu */}
                   <div className={`w-28 h-28 ${sidebarBg} rounded-[2rem] flex items-center justify-center mb-8 shadow-sm border ${borderColor} text-indigo-500`}>
                     <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"></path></svg>
                   </div>
                   <p className={`${mutedText} text-xl font-medium max-w-md`}>Henüz kaydedilmiş bir bölümün yok. Aradıkça burası dolacak.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {savedEpisodes.map((item) => (
                    <div key={item.id} className={`${sidebarBg} border ${borderColor} p-6 rounded-3xl flex flex-col justify-between shadow-lg hover:shadow-2xl transition-all duration-300 relative group`}>
                      <div className="flex justify-between items-start mb-5">
                        <div>
                          <p className={`font-black text-2xl leading-tight ${textColor} group-hover:text-indigo-500 transition-colors pr-6 tracking-tight`}>{item.show_name}</p>
                          <p className={`text-sm ${mutedText} mt-2 font-medium`}>{new Date(item.created_at).toLocaleDateString('tr-TR')}</p>
                        </div>
                        <button onClick={() => setEpisodeToDelete(item.id)} className={`absolute top-5 right-5 w-10 h-10 rounded-xl ${inputBg} border ${borderColor} text-red-400 md:opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500 hover:text-white shadow-inner flex items-center justify-center`} title="Sil">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                        </button>
                      </div>
                      <div className={`mt-auto inline-block px-4 py-2.5 bg-indigo-500/10 text-indigo-500 text-sm font-black rounded-xl border border-indigo-500/20 w-fit`}>
                        <p className="tracking-wide">Sezon {item.season} • Bölüm {item.episode}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* YENİ: HAKKINDA EKRANI (Ayarlar & Destek Birleşimi) */}
          {activePage === 'about' && (
            <div className="max-w-2xl mx-auto w-full animate-fade-in py-10">
               <h2 className={`text-3xl font-black mb-8 ${textColor}`}>Hakkında</h2>
               
               <div className={`${sidebarBg} border ${borderColor} p-8 rounded-3xl mb-6 shadow-sm`}>
                 <h3 className="text-xl font-bold mb-5 text-indigo-500">Kullanılan Teknolojiler</h3>
                 <ul className={`space-y-4 ${textColor} font-medium`}>
                   <li className="flex items-center gap-3"><span className="w-2.5 h-2.5 rounded-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.8)]"></span> Google Gemini AI (Akıl Yürütme Motoru)</li>
                   <li className="flex items-center gap-3"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)]"></span> TMDB API (Dizi ve Görsel Veritabanı)</li>
                   <li className="flex items-center gap-3"><span className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.8)]"></span> Supabase (PostgreSQL & Kimlik Doğrulama)</li>
                   <li className="flex items-center gap-3"><span className="w-2.5 h-2.5 rounded-full bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.8)]"></span> React + Tailwind CSS + Capacitor</li>
                 </ul>
               </div>

               <div className={`${sidebarBg} border ${borderColor} p-8 rounded-3xl shadow-sm`}>
                 <h3 className="text-xl font-bold mb-3 text-indigo-500">İletişim & Destek</h3>
                 <p className={`${mutedText} font-medium mb-3`}>Geri bildirim, hata bildirimi veya destek için geliştirici ile iletişime geçebilirsiniz:</p>
                 <a href="mailto:aatakanakyol@gmail.com" className="text-lg font-bold text-indigo-500 hover:text-indigo-400 underline transition-colors">aatakanakyol@gmail.com</a>
               </div>
            </div>
          )}

        </div>
      </main>

      {/* =========================================================
          ALT MOBİL BAR 
          ========================================================= */}
      <nav className={`flex md:hidden fixed bottom-0 w-full h-[4.5rem] ${sidebarBg} border-t ${borderColor} justify-around items-center z-40 pb-safe shadow-[0_-15px_50px_rgba(0,0,0,0.1)] transition-colors duration-300`}>
        <button onClick={() => {setActivePage('history'); setIsMobileAccountOpen(false);}} className={`flex flex-col items-center gap-1.5 w-16 ${activePage === 'history' ? 'text-indigo-500' : mutedText}`}>
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"></path></svg>
          <span className="text-[10px] font-black tracking-wider uppercase">Geçmiş</span>
        </button>
        
        {/* YENİ: Mobilde Ortadaki Tuş (Arama / İptal) Büyüteç Oldu */}
        <button onClick={() => {setActivePage('home'); setSelectedShow(null); setFoundEpisode(null); setIsMobileAccountOpen(false);}} className="flex flex-col items-center justify-center relative -top-6">
           <div className={`w-[4.5rem] h-[4.5rem] bg-indigo-600 rounded-full flex items-center justify-center shadow-xl shadow-indigo-600/40 text-white border-[6px] ${bgColor} transition-all active:scale-95`}>
             <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
           </div>
        </button>
        
        <button onClick={() => setIsMobileAccountOpen(true)} className={`flex flex-col items-center gap-1.5 w-16 ${isMobileAccountOpen ? 'text-indigo-500' : mutedText}`}>
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
          <span className="text-[10px] font-black tracking-wider uppercase">Hesap</span>
        </button>
      </nav>

      {/* MOBİL HESAP POP-UP PANELİ */}
      {isMobileAccountOpen && (
        <div className="md:hidden fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex flex-col justify-end">
          <div className={`${sidebarBg} rounded-t-[2.5rem] p-8 border-t ${borderColor} animate-slide-up shadow-[0_-30px_60px_rgba(0,0,0,0.6)]`}>
            <div className="flex justify-between items-center mb-8">
              <h3 className={`text-2xl font-black ${textColor} tracking-tight`}>Hesap Ayarları</h3>
              <button onClick={() => setIsMobileAccountOpen(false)} className={`p-3 ${inputBg} rounded-full border ${borderColor} ${textColor}`}>✕</button>
            </div>
            
            <div className={`flex items-center gap-5 p-5 ${inputBg} rounded-3xl mb-8 border ${borderColor}`}>
              <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-indigo-400 to-purple-500 flex items-center justify-center font-black text-xl text-white shadow-lg">A</div>
              <div className="truncate">
                <p className={`text-xs ${mutedText} font-bold uppercase tracking-wider mb-1`}>Giriş yapıldı</p>
                <p className={`font-bold text-lg ${textColor} truncate max-w-[200px]`}>{user?.email}</p>
              </div>
            </div>

            <div className="flex flex-col gap-4 mb-8">
               <div className={`p-1.5 flex items-center justify-between rounded-2xl ${inputBg} border ${borderColor}`}>
                 <button onClick={() => setTheme('light')} className={`flex-1 py-3.5 rounded-xl font-bold transition-all ${!isDark ? `${sidebarBg} shadow-sm border border-slate-700/20 ${textColor}` : mutedText}`}>☀️ Light</button>
                 <button onClick={() => setTheme('dark')} className={`flex-1 py-3.5 rounded-xl font-bold transition-all ${isDark ? `${sidebarBg} shadow-sm border border-slate-700/20 ${textColor}` : mutedText}`}>🌙 Dark</button>
               </div>
               <button onClick={() => { setActivePage('about'); setIsMobileAccountOpen(false); }} className={`w-full py-4.5 ${inputBg} hover:opacity-80 font-bold rounded-2xl active:scale-95 transition-all text-base border ${borderColor} ${textColor}`}>Hakkında & İletişim</button>
            </div>

            <button onClick={handleLogout} className="w-full py-5 bg-red-600/10 text-red-500 font-black rounded-2xl border border-red-500/20 active:scale-95 shadow-lg shadow-red-950/20 flex items-center justify-center gap-3 text-lg">
               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
               Hesaptan Çıkış Yap
            </button>
          </div>
        </div>
      )}

      {/* AI POP-UP MODAL */}
      {isModalOpen && showDetails && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-md z-50 flex flex-col justify-end items-center md:justify-center md:items-center px-2 pb-2 md:p-0">
          <div className={`${sidebarBg} w-full max-w-md md:max-w-2xl rounded-[2.5rem] p-8 md:p-12 border border-slate-700/30 shadow-2xl max-h-[95%] overflow-y-auto animate-modal-zoom`}>
            
            {popupLoading ? (
              <div className="py-20 flex flex-col items-center text-center">
                <div className="w-20 h-20 mb-8 rounded-3xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center shadow-[0_0_30px_rgba(79,70,229,0.3)] animate-pulse">
                   <span className="text-5xl">🧠</span>
                </div>
                <h3 className={`text-3xl font-black mb-3 ${textColor}`}>Yapay Zeka Akıl Yürütüyor...</h3>
                <p className={`${mutedText} text-base font-medium`}>Tüm sezon özetleri ve olay örgüleri derinlemesine analiz ediliyor.</p>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-start mb-10 text-center md:text-left">
                  <div className="w-full">
                    <h2 className={`text-4xl font-black ${textColor} tracking-tighter mb-2`}>{selectedShow.name}</h2>
                    <p className={`text-base font-medium ${mutedText}`}>Arama alanını daraltarak tam nokta atışı yapalım.</p>
                  </div>
                  <button onClick={() => { setIsModalOpen(false); setSelectedShow(null); }} className={`p-3 absolute top-6 right-6 ${inputBg} hover:bg-slate-700/50 rounded-full border ${borderColor} transition-colors ${textColor}`}>✕</button>
                </div>
                
                <div className="mb-8">
                  <label className={`block text-sm font-bold text-slate-400 mb-3 uppercase tracking-wider`}>Hangi sezonda kaldığını hatırlıyor musun?</label>
                  <select value={exactSeason} onChange={(e) => setExactSeason(e.target.value)} className={`w-full p-5 ${inputBg} border-2 ${borderColor} rounded-2xl outline-none focus:border-indigo-500 ${textColor} appearance-none cursor-pointer font-semibold text-lg shadow-sm`}>
                    <option value="">Emin değilim, tüm sezonları tara</option>
                    {[...Array(showDetails.number_of_seasons || 0)].map((_, i) => (<option key={i + 1} value={i + 1}>{i + 1}. Sezon</option>))}
                  </select>
                </div>

                <div className="mb-10">
                  <label className={`block text-sm font-bold text-slate-400 mb-3 uppercase tracking-wider`}>Bölüme dair aklında kalan en belirgin olay?</label>
                  <textarea placeholder="Örn: Rick laboratuvarı patlatıyordu veya yeni bir karakter diziye giriyordu..." value={memoryText} onChange={(e) => setMemoryText(e.target.value)} rows="4" className={`w-full p-5 ${inputBg} border-2 ${borderColor} rounded-2xl outline-none focus:border-indigo-500 ${textColor} resize-none shadow-inner placeholder-slate-500 font-medium text-lg`} />
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  <button onClick={handleStartWithAIAndSeason} disabled={!exactSeason && !memoryText.trim()} className={`w-full sm:w-3/5 py-5 rounded-2xl font-black text-xl transition-all ${exactSeason || memoryText.trim() ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-xl shadow-indigo-900/30 active:scale-95' : 'bg-slate-800/50 text-slate-500 cursor-not-allowed border-2 border-slate-700/50'}`}>
                    🧠 Yapay Zeka ile Bul
                  </button>
                  <button onClick={handleStartDirectly} className={`w-full sm:w-2/5 py-5 ${inputBg} hover:${sidebarBg} border-2 ${borderColor} ${textColor} font-black rounded-2xl active:scale-95 transition-all text-lg shadow-sm`}>
                    Direkt Geç
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

    </div>
  );
}

export default App;