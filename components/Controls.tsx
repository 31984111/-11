import React, { useState } from 'react';
import { CompressionSettings, AnalysisResult } from '../types';
import { BrainCircuit, Info, Download, Loader2, Sparkles, Sliders, Monitor, Smartphone, Printer } from 'lucide-react';

interface ControlsProps {
  settings: CompressionSettings;
  setSettings: (s: CompressionSettings) => void;
  analysis: AnalysisResult | null;
  isAnalyzing: boolean;
  onAnalyze: () => void;
  onDownload: () => void;
  compressedSize: number | null;
  originalSize: number;
}

export const Controls: React.FC<ControlsProps> = ({
  settings,
  setSettings,
  analysis,
  isAnalyzing,
  onAnalyze,
  onDownload,
  compressedSize,
  originalSize
}) => {
  
  const [activeTab, setActiveTab] = useState<'manual' | 'ai'>('ai');

  const handleChange = (key: keyof CompressionSettings, value: any) => {
    setSettings({ ...settings, [key]: value });
  };

  const applyPreset = (type: 'web' | 'social' | 'print') => {
    switch (type) {
        case 'web':
            setSettings({ ...settings, quality: 0.8, format: 'image/webp', resizeMode: 'width', maxWidth: 1920 });
            break;
        case 'social':
            setSettings({ ...settings, quality: 0.9, format: 'image/jpeg', resizeMode: 'width', maxWidth: 1080 });
            break;
        case 'print':
            setSettings({ ...settings, quality: 1.0, format: 'image/jpeg', resizeMode: 'scale', scale: 1.0 });
            break;
    }
  };

  const reduction = compressedSize 
    ? Math.round(((originalSize - compressedSize) / originalSize) * 100) 
    : 0;
  
  const isReductionPositive = reduction > 0;

  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 flex flex-col gap-6">
      
      {/* Tab Switcher */}
      <div className="flex bg-slate-900/50 p-1 rounded-lg">
        <button
            onClick={() => setActiveTab('ai')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-md transition-all ${
                activeTab === 'ai' 
                ? 'bg-indigo-600 text-white shadow-lg' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
        >
            <Sparkles size={16} />
            智能推荐
        </button>
        <button
            onClick={() => setActiveTab('manual')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-md transition-all ${
                activeTab === 'manual' 
                ? 'bg-slate-700 text-white shadow-lg' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
        >
            <Sliders size={16} />
            高级设置
        </button>
      </div>

      {/* AI Section */}
      {activeTab === 'ai' && (
          <div className="bg-gradient-to-br from-indigo-900/30 to-slate-900/30 border border-indigo-500/20 rounded-lg p-5 relative overflow-hidden space-y-4">
            <div className="flex justify-between items-start relative z-10">
              <div className="flex items-center gap-2 text-indigo-300 font-semibold">
                <BrainCircuit size={18} />
                <span>AI 图像分析引擎</span>
              </div>
              <button 
                onClick={onAnalyze}
                disabled={isAnalyzing}
                className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-full transition-colors flex items-center gap-2"
              >
                {isAnalyzing ? <Loader2 size={12} className="animate-spin" /> : null}
                {analysis ? '重新分析' : '开始分析'}
              </button>
            </div>
            
            {analysis ? (
              <div className="space-y-3 relative z-10 animate-fade-in">
                <div className="bg-slate-900/50 p-3 rounded border border-slate-700/50">
                    <p className="text-sm text-slate-300 italic">"{analysis.reasoning}"</p>
                </div>
                <div className="flex flex-wrap gap-2 text-xs">
                  <span className="bg-indigo-500/20 text-indigo-300 px-2 py-1 rounded border border-indigo-500/30 flex items-center gap-1">
                    清晰度预估: <span className="font-bold">{analysis.predictedClarityScore}</span>
                  </span>
                  <span className="bg-emerald-500/20 text-emerald-300 px-2 py-1 rounded border border-emerald-500/30">
                    推荐: {analysis.recommendedFormat.split('/')[1].toUpperCase()} / {Math.round(analysis.recommendedQuality * 100)}%
                  </span>
                </div>
                <button 
                    onClick={() => {
                        setSettings({
                            ...settings,
                            quality: analysis.recommendedQuality,
                            format: analysis.recommendedFormat,
                            resizeMode: 'scale',
                            scale: analysis.recommendedScale
                        });
                        // Switch to manual to show the applied settings? Or stay here.
                    }}
                    className="w-full text-xs text-indigo-300 hover:text-white underline text-left mt-2"
                >
                    应用 AI 推荐参数 &rarr;
                </button>
              </div>
            ) : (
              <p className="text-xs text-slate-400 relative z-10 leading-relaxed">
                Gemini 模型将深入分析您的图片内容，自动判断最佳的文件格式、压缩比率和缩放尺寸，在保持肉眼画质的同时最大化压缩率。
              </p>
            )}
          </div>
      )}

      {/* Manual Controls */}
      <div className={`space-y-6 ${activeTab === 'ai' ? 'opacity-50 pointer-events-none filter blur-[1px]' : ''} transition-all duration-300`}>
        
        {/* Presets */}
        <div className="grid grid-cols-3 gap-2">
            <button onClick={() => applyPreset('web')} className="flex flex-col items-center gap-1 p-2 bg-slate-700/30 hover:bg-slate-700 rounded-lg border border-slate-700 text-slate-300 hover:text-white transition-colors">
                <Monitor size={16} />
                <span className="text-[10px]">网页通用</span>
            </button>
            <button onClick={() => applyPreset('social')} className="flex flex-col items-center gap-1 p-2 bg-slate-700/30 hover:bg-slate-700 rounded-lg border border-slate-700 text-slate-300 hover:text-white transition-colors">
                <Smartphone size={16} />
                <span className="text-[10px]">手机/社交</span>
            </button>
            <button onClick={() => applyPreset('print')} className="flex flex-col items-center gap-1 p-2 bg-slate-700/30 hover:bg-slate-700 rounded-lg border border-slate-700 text-slate-300 hover:text-white transition-colors">
                <Printer size={16} />
                <span className="text-[10px]">高清/打印</span>
            </button>
        </div>

        {/* Quality Slider */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <label className="text-slate-300 font-medium">画质 (Quality)</label>
            <span className="text-indigo-400 font-mono">{Math.round(settings.quality * 100)}%</span>
          </div>
          <input
            type="range"
            min="10"
            max="100"
            value={settings.quality * 100}
            onChange={(e) => handleChange('quality', Number(e.target.value) / 100)}
            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500 hover:accent-indigo-400 transition-all"
          />
        </div>

        {/* Resize Controls */}
        <div className="space-y-3 p-3 bg-slate-900/30 rounded-lg border border-slate-800">
          <label className="text-sm text-slate-300 font-medium block">尺寸调整 (Resize)</label>
          
          <div className="flex gap-2 text-xs mb-2">
             <button 
                onClick={() => handleChange('resizeMode', 'scale')}
                className={`flex-1 py-1.5 rounded ${settings.resizeMode === 'scale' ? 'bg-indigo-600 text-white' : 'bg-slate-700 text-slate-400'}`}
             >
                按比例
             </button>
             <button 
                onClick={() => handleChange('resizeMode', 'width')}
                className={`flex-1 py-1.5 rounded ${settings.resizeMode === 'width' ? 'bg-indigo-600 text-white' : 'bg-slate-700 text-slate-400'}`}
             >
                最大宽度
             </button>
          </div>

          {settings.resizeMode === 'scale' ? (
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-slate-400">
                    <span>缩放比例</span>
                    <span>{Math.round(settings.scale * 100)}%</span>
                </div>
                <input
                    type="range"
                    min="10"
                    max="100"
                    value={settings.scale * 100}
                    onChange={(e) => handleChange('scale', Number(e.target.value) / 100)}
                    className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
              </div>
          ) : (
              <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <input 
                        type="number"
                        value={settings.maxWidth}
                        onChange={(e) => handleChange('maxWidth', Number(e.target.value))}
                        className="w-full bg-slate-800 border border-slate-600 rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-indigo-500"
                    />
                    <span className="text-xs text-slate-500">px (宽)</span>
                  </div>
              </div>
          )}
        </div>

        {/* Format Selector */}
        <div className="space-y-2">
          <label className="text-sm text-slate-300 font-medium">输出格式 (Format)</label>
          <div className="grid grid-cols-3 gap-2">
            {(['image/jpeg', 'image/png', 'image/webp'] as const).map((fmt) => (
              <button
                key={fmt}
                onClick={() => handleChange('format', fmt)}
                className={`text-xs py-2 rounded-md border transition-all ${
                  settings.format === fmt
                    ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-900/50'
                    : 'bg-slate-700/50 border-slate-600 text-slate-400 hover:bg-slate-700'
                }`}
              >
                {fmt.split('/')[1].toUpperCase()}
              </button>
            ))}
          </div>
        </div>

      </div>

      {/* Stats & Action */}
      <div className="mt-auto pt-6 border-t border-slate-700 space-y-4">
        <div className="flex items-center justify-between p-3 bg-slate-900 rounded-lg border border-slate-700">
          <div className="flex flex-col">
            <span className="text-xs text-slate-500">压缩后大小</span>
            <span className={`text-lg font-bold ${isReductionPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
               {compressedSize ? (compressedSize / 1024).toFixed(1) + ' KB' : '...'}
            </span>
          </div>
          <div className="flex items-center gap-2">
             {isReductionPositive ? (
               <span className="text-xs font-bold text-slate-900 bg-emerald-400 px-2 py-1 rounded-full">
                 -{reduction}%
               </span>
             ) : (
                <span className="text-xs font-bold text-slate-900 bg-rose-400 px-2 py-1 rounded-full">
                 +{Math.abs(reduction)}%
               </span>
             )}
          </div>
        </div>

        <button 
          onClick={onDownload}
          disabled={!compressedSize}
          className="w-full py-3 bg-white text-slate-900 rounded-lg font-bold hover:bg-slate-200 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
        >
          <Download size={20} />
          下载压缩文件
        </button>
      </div>
    </div>
  );
};