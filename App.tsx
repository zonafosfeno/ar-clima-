import React, { useState, useCallback } from 'react';
import { CameraFeed } from './components/CameraFeed';
import { MandalaVisualizer } from './components/MandalaVisualizer';
import { WeatherStats } from './components/WeatherStats';
import { analyzeWeatherAndGenerateMandala } from './services/geminiService';
import { AppState } from './types';
import { Loader2, MapPin, RefreshCw, Info, ExternalLink, Camera } from 'lucide-react';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>({
    weather: null,
    mandala: null,
    groundingUrls: null,
    loading: false,
    error: null,
    step: 'intro',
  });

  const [showInfo, setShowInfo] = useState(false);

  const startExperience = useCallback(() => {
    setState(prev => ({ ...prev, loading: true, error: null, step: 'locating' }));

    if (!navigator.geolocation) {
      setState(prev => ({ ...prev, loading: false, error: "Geolocalización no soportada", step: 'intro' }));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          setState(prev => ({ ...prev, step: 'analyzing' }));
          const { latitude, longitude } = position.coords;
          
          // Call Gemini Service
          const result = await analyzeWeatherAndGenerateMandala(latitude, longitude);
          
          setState({
            weather: result.weather,
            mandala: result.mandala,
            groundingUrls: result.sources,
            loading: false,
            error: null,
            step: 'experience'
          });

        } catch (error: any) {
          setState(prev => ({ 
            ...prev, 
            loading: false, 
            error: error.message || "Error conectando con Gemini", 
            step: 'intro' 
          }));
        }
      },
      (error) => {
        setState(prev => ({ 
          ...prev, 
          loading: false, 
          error: "Permiso de ubicación denegado. Actívalo para continuar.", 
          step: 'intro' 
        }));
      }
    );
  }, []);

  const renderOverlay = () => {
    if (state.loading) {
      return (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm text-white p-6">
          <div className="relative">
            <div className="absolute inset-0 animate-ping rounded-full ring-2 ring-white/50 opacity-20"></div>
            <Loader2 className="w-12 h-12 animate-spin text-cyan-400" />
          </div>
          <h2 className="mt-6 text-xl font-bold tracking-wider">
            {state.step === 'locating' ? 'Buscando satélites...' : 'Consultando a Gemini...'}
          </h2>
          <p className="text-gray-400 mt-2 text-sm text-center max-w-xs">
            {state.step === 'locating' 
              ? 'Estamos determinando tu ubicación exacta.' 
              : 'Analizando temperatura, viento y presión para diseñar tu mandala.'}
          </p>
        </div>
      );
    }

    if (state.step === 'intro' || state.error) {
      return (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-b from-slate-900 to-black text-white p-8 text-center">
          <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-cyan-500 to-purple-500 flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(6,182,212,0.5)]">
            <Camera className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-300 to-purple-300 mb-2">
            ClimaMandala AR
          </h1>
          <p className="text-gray-400 mb-8 max-w-sm mx-auto leading-relaxed">
            Descubre la forma oculta de tu entorno. Generamos arte fractal en realidad aumentada basado en el clima de tu ubicación.
          </p>
          
          {state.error && (
            <div className="mb-6 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200 text-sm">
              {state.error}
            </div>
          )}

          <button 
            onClick={startExperience}
            className="group relative px-8 py-4 bg-white text-black font-bold rounded-full overflow-hidden transition-all hover:scale-105 active:scale-95"
          >
            <span className="relative z-10 flex items-center gap-2">
              <MapPin className="w-5 h-5" /> Iniciar Experiencia
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-purple-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </button>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="relative w-full h-full overflow-hidden bg-black">
      {/* 1. Camera Layer */}
      <CameraFeed />

      {/* 2. Mandala Layer */}
      {state.mandala && state.step === 'experience' && (
        <MandalaVisualizer config={state.mandala} />
      )}

      {/* 3. Loading / Intro Overlays */}
      {renderOverlay()}

      {/* 4. Active Experience UI */}
      {state.step === 'experience' && state.weather && state.mandala && (
        <>
          {/* Header Info */}
          <div className="absolute top-0 left-0 right-0 p-4 z-40 flex justify-between items-start">
             <button 
               onClick={() => setState(prev => ({ ...prev, step: 'intro' }))}
               className="p-2 rounded-full bg-black/30 backdrop-blur-md text-white hover:bg-white/20 transition border border-white/10"
             >
               <RefreshCw className="w-4 h-4" />
             </button>
             
             <button 
               onClick={() => setShowInfo(!showInfo)}
               className={`p-2 rounded-full backdrop-blur-md text-white transition border border-white/10 ${showInfo ? 'bg-cyan-500/50' : 'bg-black/30'}`}
             >
               <Info className="w-4 h-4" />
             </button>
          </div>

          {/* Bottom Stats Panel - Reduced size */}
          <div className="absolute bottom-0 left-0 right-0 p-2 z-40 pb-4">
            <div className="bg-black/40 backdrop-blur-xl rounded-xl border border-white/10 p-2 shadow-2xl text-white max-w-xs mx-auto">
              <WeatherStats weather={state.weather} mandala={state.mandala} />
            </div>
            
            {/* Source attribution - condensed */}
            <div className="flex justify-center mt-1 gap-2 overflow-x-auto opacity-60">
               {state.groundingUrls && state.groundingUrls.slice(0, 2).map((source, i) => (
                 <a 
                    key={i} 
                    href={source.uri} 
                    target="_blank" 
                    rel="noreferrer"
                    className="text-[8px] text-gray-300 flex items-center gap-1 bg-black/40 px-1.5 py-0.5 rounded-full hover:text-cyan-300 transition"
                 >
                   <ExternalLink className="w-2 h-2" /> {source.title.substring(0, 12)}...
                 </a>
               ))}
            </div>
          </div>

          {/* Info Modal (Overlay) */}
          {showInfo && (
            <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-md p-8 flex flex-col justify-center animate-in fade-in duration-200" onClick={() => setShowInfo(false)}>
               <h3 className="text-xl font-bold text-white mb-4">¿Cómo funciona?</h3>
               <ul className="space-y-3 text-gray-300 text-xs">
                 <li className="flex gap-3">
                    <span className="w-2 h-2 mt-1 rounded-full bg-cyan-400 shrink-0"></span>
                    <span>
                      <strong>Temperatura:</strong> Colores del mandala.
                    </span>
                 </li>
                 <li className="flex gap-3">
                    <span className="w-2 h-2 mt-1 rounded-full bg-purple-400 shrink-0"></span>
                    <span>
                      <strong>Viento:</strong> Velocidad de rotación.
                    </span>
                 </li>
                 <li className="flex gap-3">
                    <span className="w-2 h-2 mt-1 rounded-full bg-green-400 shrink-0"></span>
                    <span>
                      <strong>Humedad:</strong> Grosor de líneas.
                    </span>
                 </li>
                 <li className="flex gap-3">
                    <span className="w-2 h-2 mt-1 rounded-full bg-yellow-400 shrink-0"></span>
                    <span>
                      <strong>Complejidad:</strong> Presión atmosférica.
                    </span>
                 </li>
               </ul>
               <p className="mt-6 text-center text-[10px] text-gray-500">Toca para cerrar</p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default App;