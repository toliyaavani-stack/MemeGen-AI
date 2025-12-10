import React, { useState, useCallback, useRef } from 'react';
import { 
  Upload, 
  Wand2, 
  Image as ImageIcon, 
  Type, 
  Download, 
  Loader2, 
  Palette, 
  ScanSearch,
  RefreshCcw,
  Sparkles
} from 'lucide-react';
import MemeCanvas from './components/MemeCanvas';
import { generateMagicCaptions, editMemeImage, analyzeImageContent } from './services/geminiService';
import { MemeText, GeneratedCaption, AppMode, AnalysisResult } from './types';

const PLACEHOLDER_IMAGES = [
  "https://picsum.photos/id/237/800/800",
  "https://picsum.photos/id/1025/800/800",
  "https://picsum.photos/id/1062/800/800",
  "https://picsum.photos/id/1074/800/800",
];

const INITIAL_TEXT: MemeText = {
  id: 'bottom-text',
  text: 'WHEN THE CODE WORKS',
  x: 300,
  y: 500,
  fontSize: 40,
  color: '#FFFFFF',
  strokeColor: '#000000',
};

function App() {
  const [currentImage, setCurrentImage] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [memeTexts, setMemeTexts] = useState<MemeText[]>([]);
  const [mode, setMode] = useState<AppMode>(AppMode.CAPTION);
  
  // AI States
  const [isGenerating, setIsGenerating] = useState(false);
  const [captions, setCaptions] = useState<GeneratedCaption[]>([]);
  const [editPrompt, setEditPrompt] = useState('');
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Handlers ---

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setCurrentImage(result);
        
        // Extract pure base64 for API usage
        // Data URL format: "data:image/jpeg;base64,/9j/4AAQSk..."
        const base64 = result.split(',')[1];
        setImageBase64(base64);
        
        // Reset states
        setMemeTexts([]);
        setCaptions([]);
        setAnalysisResult(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSelectPlaceholder = async (url: string) => {
    setCurrentImage(url);
    // Fetch and convert to base64 for API consistency
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        setCurrentImage(result);
        setImageBase64(result.split(',')[1]);
      };
      reader.readAsDataURL(blob);
      
      setMemeTexts([]);
      setCaptions([]);
      setAnalysisResult(null);
    } catch (e) {
      console.error("Error loading placeholder", e);
    }
  };

  const handleMagicCaption = async () => {
    if (!imageBase64) return;
    setIsGenerating(true);
    setCaptions([]);
    try {
      const results = await generateMagicCaptions(imageBase64);
      setCaptions(results);
    } catch (error) {
      console.error(error);
      alert("Failed to generate captions. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleEditImage = async () => {
    if (!imageBase64 || !editPrompt.trim()) return;
    setIsGenerating(true);
    try {
      const newImageBase64 = await editMemeImage(imageBase64, editPrompt);
      if (newImageBase64) {
        const newDataUrl = `data:image/jpeg;base64,${newImageBase64}`;
        setCurrentImage(newDataUrl);
        setImageBase64(newImageBase64);
        setEditPrompt('');
        alert("Image updated with AI edit!");
      } else {
        alert("AI could not perform the edit. Try a different prompt.");
      }
    } catch (error) {
      console.error(error);
      alert("Error editing image.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAnalyzeImage = async () => {
    if (!imageBase64) return;
    setIsGenerating(true);
    setAnalysisResult(null);
    try {
      const result = await analyzeImageContent(imageBase64);
      setAnalysisResult(result);
    } catch (error) {
      console.error(error);
      alert("Analysis failed.");
    } finally {
      setIsGenerating(false);
    }
  };

  const applyCaption = (text: string) => {
    setMemeTexts([
      {
        ...INITIAL_TEXT,
        id: Date.now().toString(),
        text: text.toUpperCase(),
        // Center text roughly
        x: 300,
        y: 500 // Bottom
      }
    ]);
  };

  const addManualText = () => {
    setMemeTexts(prev => [
      ...prev,
      {
        ...INITIAL_TEXT,
        id: Date.now().toString(),
        text: "NEW TEXT",
        y: prev.length === 0 ? 500 : 100, // Toggle bottom/top roughly
      }
    ]);
  };

  const updateText = (id: string, newText: string) => {
    setMemeTexts(prev => prev.map(t => t.id === id ? { ...t, text: newText } : t));
  };
  
  const removeText = (id: string) => {
    setMemeTexts(prev => prev.filter(t => t.id !== id));
  };

  // --- Render Helpers ---

  const renderSidebarContent = () => {
    switch (mode) {
      case AppMode.CAPTION:
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700">
              <h3 className="text-lg font-semibold text-purple-300 mb-2 flex items-center gap-2">
                <Sparkles className="w-5 h-5" /> Magic Caption
              </h3>
              <p className="text-sm text-slate-400 mb-4">
                Let AI analyze the image and suggest funny captions instantly.
              </p>
              <button
                onClick={handleMagicCaption}
                disabled={!currentImage || isGenerating}
                className="w-full py-3 px-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-lg shadow-lg transform transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                {isGenerating ? <Loader2 className="animate-spin w-5 h-5" /> : <Wand2 className="w-5 h-5" />}
                {isGenerating ? 'Thinking...' : 'Generate Captions'}
              </button>
            </div>

            {captions.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-medium text-slate-300">Suggestions</h4>
                <div className="grid gap-3">
                  {captions.map((caption, idx) => (
                    <button
                      key={idx}
                      onClick={() => applyCaption(caption.text)}
                      className="text-left p-3 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-purple-500 transition-all group"
                    >
                      <span className="block text-sm font-medium text-slate-200 group-hover:text-white">
                        {caption.text}
                      </span>
                      {caption.category && (
                        <span className="inline-block mt-1 text-[10px] px-2 py-0.5 rounded-full bg-slate-900 text-slate-500 uppercase tracking-wider">
                          {caption.category}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-6 border-t border-slate-700">
              <div className="flex justify-between items-center mb-4">
                <h4 className="font-medium text-slate-300">Manual Text</h4>
                <button 
                  onClick={addManualText}
                  className="text-xs bg-slate-700 hover:bg-slate-600 text-white px-2 py-1 rounded"
                >
                  + Add Text
                </button>
              </div>
              
              <div className="space-y-4">
                {memeTexts.length === 0 && <p className="text-sm text-slate-500 italic">No text added yet.</p>}
                {memeTexts.map((item) => (
                  <div key={item.id} className="flex gap-2 items-center">
                    <input
                      type="text"
                      value={item.text}
                      onChange={(e) => updateText(item.id, e.target.value)}
                      className="flex-1 bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
                    />
                    <button 
                      onClick={() => removeText(item.id)}
                      className="p-2 text-red-400 hover:text-red-300"
                    >
                      &times;
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case AppMode.EDIT:
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700">
               <div className="flex items-center gap-2 mb-2 text-pink-300">
                 <Palette className="w-5 h-5" />
                 <h3 className="text-lg font-semibold">AI Image Editor</h3>
               </div>
               <p className="text-xs text-slate-400 mb-4 bg-slate-900/50 p-2 rounded border border-slate-800">
                 Powered by <strong>Gemini 2.5 Flash Image</strong> (Nano Banana). 
                 Describe how you want to change the image.
               </p>
               
               <textarea
                 value={editPrompt}
                 onChange={(e) => setEditPrompt(e.target.value)}
                 placeholder='e.g., "Add a retro filter", "Make it look like a painting", "Add fireworks in the background"'
                 className="w-full h-32 bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-pink-500 resize-none mb-4"
               />
               
               <button
                onClick={handleEditImage}
                disabled={!currentImage || isGenerating || !editPrompt.trim()}
                className="w-full py-3 px-4 bg-pink-600 hover:bg-pink-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-lg shadow-lg flex items-center justify-center gap-2 transition-all"
              >
                {isGenerating ? <Loader2 className="animate-spin w-5 h-5" /> : <RefreshCcw className="w-5 h-5" />}
                {isGenerating ? 'Editing...' : 'Apply Edit'}
              </button>
            </div>
          </div>
        );

      case AppMode.ANALYZE:
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
             <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700">
               <div className="flex items-center gap-2 mb-2 text-cyan-300">
                 <ScanSearch className="w-5 h-5" />
                 <h3 className="text-lg font-semibold">Image Analysis</h3>
               </div>
               <p className="text-xs text-slate-400 mb-4 bg-slate-900/50 p-2 rounded border border-slate-800">
                 Powered by <strong>Gemini 3 Pro Preview</strong>. Get deep insights about your meme image.
               </p>
               
               <button
                onClick={handleAnalyzeImage}
                disabled={!currentImage || isGenerating}
                className="w-full py-3 px-4 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-lg shadow-lg flex items-center justify-center gap-2 transition-all mb-6"
              >
                {isGenerating ? <Loader2 className="animate-spin w-5 h-5" /> : <ScanSearch className="w-5 h-5" />}
                {isGenerating ? 'Analyzing...' : 'Analyze Image'}
              </button>

              {analysisResult && (
                <div className="space-y-4 animate-in fade-in zoom-in-95">
                  <div>
                    <h4 className="text-sm text-slate-500 uppercase tracking-wider font-bold mb-1">Title</h4>
                    <p className="text-white text-lg font-medium">{analysisResult.title}</p>
                  </div>
                  <div>
                    <h4 className="text-sm text-slate-500 uppercase tracking-wider font-bold mb-1">Context</h4>
                    <p className="text-slate-300 text-sm leading-relaxed">{analysisResult.description}</p>
                  </div>
                  <div>
                    <h4 className="text-sm text-slate-500 uppercase tracking-wider font-bold mb-2">Tags</h4>
                    <div className="flex flex-wrap gap-2">
                      {analysisResult.tags.map(tag => (
                        <span key={tag} className="px-2 py-1 bg-cyan-900/30 text-cyan-300 text-xs rounded border border-cyan-800">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center text-xl font-black shadow-lg shadow-purple-900/20">
              M
            </div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
              MemeGen AI
            </h1>
          </div>
          <div className="flex gap-4">
             <button 
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors text-sm font-medium border border-slate-700"
             >
               <Upload className="w-4 h-4" /> Upload
             </button>
             <input 
               type="file" 
               ref={fileInputRef} 
               className="hidden" 
               accept="image/*"
               onChange={handleImageUpload}
             />
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full p-4 lg:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Canvas Area */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          <div className="relative group">
            <MemeCanvas 
              imageSrc={currentImage} 
              texts={memeTexts}
              width={800}
              height={600}
            />
            {!currentImage && (
               <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                 <div className="text-center opacity-50">
                    <ImageIcon className="w-16 h-16 mx-auto mb-4 text-slate-600" />
                    <p className="text-slate-400">Upload an image or select a template to start</p>
                 </div>
               </div>
            )}
          </div>

          {/* Template Gallery */}
          <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-800">
            <h3 className="text-sm font-semibold text-slate-400 mb-3 uppercase tracking-wider">Trending Templates</h3>
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3">
              {PLACEHOLDER_IMAGES.map((url, i) => (
                <button 
                  key={i}
                  onClick={() => handleSelectPlaceholder(url)}
                  className="aspect-square rounded-lg overflow-hidden border border-slate-700 hover:border-purple-500 hover:ring-2 hover:ring-purple-500/20 transition-all relative group"
                >
                  <img src={url} alt="Template" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Controls */}
        <div className="lg:col-span-4 flex flex-col h-[calc(100vh-8rem)] sticky top-24">
          
          {/* Mode Tabs */}
          <div className="flex bg-slate-900 p-1 rounded-lg border border-slate-800 mb-4">
            <button
              onClick={() => setMode(AppMode.CAPTION)}
              className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-md transition-all ${
                mode === AppMode.CAPTION 
                  ? 'bg-slate-800 text-white shadow-sm' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Type className="w-4 h-4" /> Caption
            </button>
            <button
              onClick={() => setMode(AppMode.EDIT)}
              className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-md transition-all ${
                mode === AppMode.EDIT
                  ? 'bg-slate-800 text-pink-400 shadow-sm' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Palette className="w-4 h-4" /> Edit
            </button>
            <button
              onClick={() => setMode(AppMode.ANALYZE)}
              className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-md transition-all ${
                mode === AppMode.ANALYZE 
                  ? 'bg-slate-800 text-cyan-400 shadow-sm' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ScanSearch className="w-4 h-4" /> Analyze
            </button>
          </div>

          {/* Tool Content */}
          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
            {renderSidebarContent()}
          </div>
          
          {/* Download Action */}
          <div className="pt-4 mt-auto border-t border-slate-800">
             <button 
              className="w-full py-3 bg-slate-100 text-slate-900 hover:bg-white font-bold rounded-lg shadow-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!currentImage}
              onClick={() => {
                // Quick hack for downloading from canvas
                const canvas = document.querySelector('canvas');
                if (canvas) {
                   const link = document.createElement('a');
                   link.download = `memegen-${Date.now()}.png`;
                   link.href = canvas.toDataURL();
                   link.click();
                }
              }}
             >
               <Download className="w-5 h-5" /> Download Meme
             </button>
          </div>

        </div>
      </main>
    </div>
  );
}

export default App;
