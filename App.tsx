import React, { useState, useEffect, useCallback } from 'react';
import { Upload, FileImage, Image as ImageIcon, Zap, AlertCircle } from 'lucide-react';
import { compressImage, formatBytes } from './services/compressionService';
import { analyzeImageWithGemini } from './services/geminiService';
import { ComparisonSlider } from './components/ComparisonSlider';
import { Controls } from './components/Controls';
import { CompressionSettings, CompressionResult, AnalysisResult, FileState } from './types';

const INITIAL_SETTINGS: CompressionSettings = {
  quality: 0.8,
  format: 'image/jpeg',
  resizeMode: 'scale',
  scale: 1.0,
  maxWidth: 1920
};

function App() {
  const [fileState, setFileState] = useState<FileState | null>(null);
  const [settings, setSettings] = useState<CompressionSettings>(INITIAL_SETTINGS);
  const [result, setResult] = useState<CompressionResult | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  
  const [isCompressing, setIsCompressing] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Handle File Upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Handle PDF explicitly to give a better error message as per user request
    if (file.type === 'application/pdf') {
        setError("当前版本仅支持图片压缩。PDF 压缩功能正在开发中，敬请期待！");
        return;
    }

    if (!file.type.startsWith('image/')) {
      setError("请上传有效的图片文件 (JPG, PNG, WEBP)。");
      return;
    }

    setError(null);
    setAnalysis(null);
    setResult(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        setFileState({
          original: file,
          previewUrl: event.target?.result as string,
          originalSize: file.size,
          originalDimensions: { width: img.width, height: img.height }
        });
        
        // Reset settings based on file type roughly
        setSettings({
            ...INITIAL_SETTINGS,
            format: file.type === 'image/png' ? 'image/png' : 'image/jpeg',
            // If image is huge, default to 1920 width to be smart
            resizeMode: img.width > 2000 ? 'width' : 'scale',
            maxWidth: 1920
        });
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Perform Compression
  const performCompression = useCallback(async () => {
    if (!fileState) return;
    setIsCompressing(true);
    try {
      const res = await compressImage(fileState.original, settings);
      setResult(res);
    } catch (err) {
      console.error(err);
      setError("压缩失败，请重试。");
    } finally {
      setIsCompressing(false);
    }
  }, [fileState, settings]);

  // Debounce compression triggering
  useEffect(() => {
    const timer = setTimeout(() => {
      if (fileState) performCompression();
    }, 300);
    return () => clearTimeout(timer);
  }, [fileState, settings, performCompression]);

  // Handle AI Analysis
  const handleAnalyze = async () => {
    if (!fileState) return;
    setIsAnalyzing(true);
    try {
      const aiResult = await analyzeImageWithGemini(fileState.original);
      setAnalysis(aiResult);
      
      // We don't auto-apply immediately in this version, we let the user click "Apply" in the UI
      // But we could auto-apply if we wanted. For now, let the user choose in the Controls component.
    } catch (err) {
      console.error(err);
      setError("AI 分析失败，请检查 API Key 设置。");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Handle Download
  const handleDownload = () => {
    if (!result) return;
    const link = document.createElement('a');
    link.href = result.dataUrl;
    // Construct filename: original_compressed.ext
    const namePart = fileState?.original.name.split('.')[0] || 'image';
    const ext = settings.format.split('/')[1];
    link.download = `${namePart}_optimized.${ext}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 pb-20 font-sans">
      
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 p-2 rounded-lg">
              <Zap size={20} className="text-white" />
            </div>
            <div>
              <h1 className="font-bold text-lg tracking-tight">智缩 (SmartCompress)</h1>
              <p className="text-xs text-slate-400">AI 驱动的智能图片压缩工具</p>
            </div>
          </div>
          <a href="#" className="text-sm text-slate-400 hover:text-white transition-colors">帮助文档</a>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        
        {/* Error Banner */}
        {error && (
          <div className="bg-rose-900/30 border border-rose-500/50 text-rose-200 p-4 rounded-xl flex items-center gap-3 animate-fade-in">
            <AlertCircle size={20} />
            <p>{error}</p>
            <button onClick={() => setError(null)} className="ml-auto hover:text-white">&times;</button>
          </div>
        )}

        {/* Upload Area */}
        {!fileState && (
          <div className="border-2 border-dashed border-slate-700 hover:border-indigo-500 rounded-2xl p-12 transition-all group bg-slate-900/50">
            <div className="text-center space-y-4 max-w-md mx-auto">
              <div className="w-16 h-16 bg-slate-800 group-hover:bg-indigo-900/30 rounded-full flex items-center justify-center mx-auto transition-colors">
                <Upload size={32} className="text-slate-400 group-hover:text-indigo-400 transition-colors" />
              </div>
              <h2 className="text-2xl font-bold text-white">上传图片开始压缩</h2>
              <p className="text-slate-400">
                支持拖拽或点击上传 (JPG, PNG, WEBP)
              </p>
              <div className="relative inline-block">
                 <input 
                  type="file" 
                  accept="image/png, image/jpeg, image/webp, application/pdf" 
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <button className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-3 rounded-lg font-medium transition-colors shadow-lg shadow-indigo-900/20">
                  选择文件
                </button>
              </div>
              <div className="text-xs text-slate-500 pt-4 border-t border-slate-800 mt-6 grid grid-cols-2 gap-4">
                 <div className="flex items-center justify-center gap-1">
                    <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                    <span>智能清晰度预测</span>
                 </div>
                 <div className="flex items-center justify-center gap-1">
                    <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                    <span>本地极速处理</span>
                 </div>
              </div>
            </div>
          </div>
        )}

        {/* Workspace */}
        {fileState && (
          <div className="grid lg:grid-cols-3 gap-8 items-start">
            
            {/* Left: Preview Area */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold flex items-center gap-2">
                  <ImageIcon size={20} className="text-indigo-400" />
                  效果预览
                </h3>
                <div className="flex gap-4 text-sm text-slate-400 bg-slate-900 px-3 py-1 rounded-lg border border-slate-800">
                   <span>原图: <strong className="text-white">{formatBytes(fileState.originalSize)}</strong></span>
                   <span className="text-slate-600">|</span>
                   {result && (
                     <span>
                       压缩后: <strong className={result.size < fileState.originalSize ? 'text-emerald-400' : 'text-rose-400'}>
                        {formatBytes(result.size)}
                       </strong>
                     </span>
                   )}
                </div>
              </div>

              {/* Slider Component */}
              <div className="bg-slate-900 rounded-xl p-1 border border-slate-800 shadow-2xl">
                 {result ? (
                   <ComparisonSlider 
                     originalUrl={fileState.previewUrl} 
                     compressedUrl={result.dataUrl} 
                   />
                 ) : (
                    <div className="aspect-video w-full bg-slate-800 rounded-xl flex items-center justify-center animate-pulse">
                      <p className="text-slate-500 flex items-center gap-2">
                          <Zap className="animate-bounce" size={16} />
                          正在生成预览...
                      </p>
                    </div>
                 )}
              </div>
              
              <div className="flex justify-between items-center bg-slate-900/50 p-4 rounded-xl border border-slate-800">
                 <div className="flex items-center gap-3">
                    <FileImage className="text-slate-500" />
                    <div>
                      <p className="text-sm font-medium text-white max-w-[200px] truncate">{fileState.original.name}</p>
                      <p className="text-xs text-slate-500">
                          {fileState.originalDimensions.width} x {fileState.originalDimensions.height} px
                          {result && result.width !== fileState.originalDimensions.width && (
                              <span className="text-indigo-400"> &rarr; {result.width} x {result.height} px</span>
                          )}
                      </p>
                    </div>
                 </div>
                 <button 
                  onClick={() => setFileState(null)} 
                  className="text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-900/20 px-3 py-1.5 rounded transition-colors"
                 >
                   移除文件
                 </button>
              </div>
            </div>

            {/* Right: Controls */}
            <div className="lg:col-span-1 lg:sticky lg:top-24">
              <Controls 
                settings={settings}
                setSettings={setSettings}
                analysis={analysis}
                isAnalyzing={isAnalyzing}
                onAnalyze={handleAnalyze}
                onDownload={handleDownload}
                compressedSize={result?.size || null}
                originalSize={fileState.originalSize}
              />
            </div>

          </div>
        )}

      </main>
    </div>
  );
}

export default App;