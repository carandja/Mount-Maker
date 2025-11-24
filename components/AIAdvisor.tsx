import React, { useState } from 'react';
import { getMountAdvice } from '../services/geminiService';
import { MountConfig, Unit, AIAdvice } from '../types';
import { Sparkles, Loader2, AlertCircle } from 'lucide-react';

interface AIAdvisorProps {
  currentConfig: MountConfig;
  unit: Unit;
  onApplySuggestion: (config: Partial<MountConfig>) => void;
}

const AIAdvisor: React.FC<AIAdvisorProps> = ({ currentConfig, unit, onApplySuggestion }) => {
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [advice, setAdvice] = useState<AIAdvice | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAskAI = async () => {
    if (!description.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const result = await getMountAdvice(description, currentConfig, unit);
      setAdvice(result);
    } catch (e) {
      setError("Failed to get advice. Ensure API key is set.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-50 border-t border-slate-200 p-4 rounded-b-lg">
      <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2 mb-3">
        <Sparkles className="w-4 h-4 text-purple-600" />
        AI Design Advisor
      </h3>
      
      <div className="flex gap-2 mb-3">
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe your photo (e.g. 'B&W portrait', 'Colorful sunset')..."
          className="flex-1 text-sm rounded-md border-gray-300 border p-2 focus:ring-2 focus:ring-purple-500 focus:outline-none"
        />
        <button
          onClick={handleAskAI}
          disabled={loading || !description}
          className="bg-purple-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Ask'}
        </button>
      </div>

      {error && (
        <div className="text-red-600 text-xs flex items-center gap-1 mb-2">
            <AlertCircle className="w-3 h-3" /> {error}
        </div>
      )}

      {advice && (
        <div className="bg-white border border-purple-100 rounded p-3 shadow-sm animate-in fade-in slide-in-from-top-2">
          <p className="text-slate-800 font-medium text-sm mb-1">{advice.suggestion}</p>
          <p className="text-slate-600 text-xs italic mb-3">"{advice.reasoning}"</p>
          
          {advice.suggestedConfig && (
            <button
              onClick={() => onApplySuggestion(advice.suggestedConfig!)}
              className="w-full bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 py-1.5 rounded text-xs font-semibold transition-colors"
            >
              Apply Suggested Dimensions
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default AIAdvisor;
