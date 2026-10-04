import React, { useState, useRef } from 'react';

// Type definitions based on the mock backend
type PredictionType = 'REAL' | 'AI-GENERATED' | 'DEEPFAKE';

interface AnalysisResult {
  filename: string;
  mimetype: string;
  prediction: PredictionType;
  confidence: string;
  explanation: string;
  suspiciousRegions: string[];
  analysisDetails: string[];
}

export default function App() {
  const [file, setFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setResult(null); // Reset previous results on new selection
      setError(null);
      
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
      setPreviewUrl(URL.createObjectURL(selectedFile));
    }
  };

  const handleAnalyze = async () => {
    if (!file) return;

    setIsAnalyzing(true);
    setError(null);

    const formData = new FormData();
    formData.append('media', file);

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Analysis request failed.');
      }

      const data: AnalysisResult = await response.json();
      setResult(data);
    } catch (err) {
      console.error(err);
      setError('An error occurred during analysis. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const resetForm = () => {
    setFile(null);
    setResult(null);
    setError(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getPredictionColor = (prediction: PredictionType) => {
    switch (prediction) {
      case 'REAL':
        return 'text-green-700 bg-green-50 border-green-200';
      case 'AI-GENERATED':
        return 'text-amber-700 bg-amber-50 border-amber-200';
      case 'DEEPFAKE':
        return 'text-red-700 bg-red-50 border-red-200';
      default:
        return 'text-gray-700 bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans p-6 sm:p-10">
      <div className="max-w-3xl mx-auto space-y-8">
        
        {/* Header Section */}
        <header className="border-b border-gray-200 pb-4">
          <h1 className="text-2xl font-medium text-gray-900">Deepfake Detection System</h1>
          <p className="text-gray-600 mt-1">Analyze image, video, or audio for possible manipulation.</p>
        </header>

        <main>
          {!result ? (
            /* Upload View */
            <div className="space-y-6">
              <div className="border border-gray-300 rounded-md p-6 bg-gray-50 flex flex-col items-start gap-4">
                <div>
                  <label htmlFor="file-upload" className="block text-sm font-medium text-gray-700 mb-1">
                    Upload Media File
                  </label>
                  <p className="text-xs text-gray-500 mb-3">Supported formats: JPG, PNG, MP4, WEBM, WAV, MP3.</p>
                  
                  <input
                    type="file"
                    id="file-upload"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*,video/*,audio/*"
                    className="block w-full text-sm text-gray-500
                      file:mr-4 file:py-2 file:px-4
                      file:rounded-md file:border file:border-gray-300
                      file:text-sm file:font-medium
                      file:bg-white file:text-gray-700
                      hover:file:bg-gray-50 cursor-pointer"
                  />
                  {file && (
                    <div className="mt-3 text-sm text-gray-700">
                      <strong>Selected:</strong> {file.name}
                    </div>
                  )}
                </div>
              </div>

              {error && (
                <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded-md text-sm">
                  {error}
                </div>
              )}

              <div className="flex justify-start">
                <button
                  onClick={handleAnalyze}
                  disabled={!file || isAnalyzing}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-md text-sm transition-colors shadow-sm disabled:bg-blue-300 disabled:cursor-not-allowed"
                >
                  {isAnalyzing ? 'Analyzing...' : 'Analyze'}
                </button>
              </div>
            </div>
          ) : (
            /* Result View */
            <div className="space-y-6">
              <div className="flex justify-between items-center border-b border-gray-200 pb-4">
                <h2 className="text-xl font-medium">Analysis Results</h2>
                <button
                  onClick={resetForm}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  Analyze Another File
                </button>
              </div>

              <div className="border border-gray-300 rounded-md p-0 overflow-hidden">
                <table className="w-full text-left text-sm border-collapse">
                  <tbody>
                    <tr className="border-b border-gray-200">
                      <th className="py-3 px-4 font-medium text-gray-700 bg-gray-50 w-1/3">File Name</th>
                      <td className="py-3 px-4 text-gray-900">{result.filename}</td>
                    </tr>
                    <tr className="border-b border-gray-200">
                      <th className="py-3 px-4 font-medium text-gray-700 bg-gray-50">Media Type</th>
                      <td className="py-3 px-4 text-gray-900">{result.mimetype}</td>
                    </tr>
                    {previewUrl && result.mimetype.startsWith('image/') && (
                      <tr className="border-b border-gray-200">
                        <th className="py-3 px-4 font-medium text-gray-700 bg-gray-50 align-top">Preview</th>
                        <td className="py-3 px-4">
                          <img src={previewUrl} alt="Uploaded media" className="max-w-xs max-h-64 object-contain border border-gray-200 rounded-sm" />
                        </td>
                      </tr>
                    )}
                    {previewUrl && result.mimetype.startsWith('video/') && (
                      <tr className="border-b border-gray-200">
                        <th className="py-3 px-4 font-medium text-gray-700 bg-gray-50 align-top">Preview</th>
                        <td className="py-3 px-4">
                          <video src={previewUrl} controls className="max-w-xs max-h-64 border border-gray-200 rounded-sm" />
                        </td>
                      </tr>
                    )}
                    {previewUrl && result.mimetype.startsWith('audio/') && (
                      <tr className="border-b border-gray-200">
                        <th className="py-3 px-4 font-medium text-gray-700 bg-gray-50 align-top">Preview</th>
                        <td className="py-3 px-4">
                          <audio src={previewUrl} controls className="w-full max-w-xs" />
                        </td>
                      </tr>
                    )}
                    <tr className="border-b border-gray-200">
                      <th className="py-3 px-4 font-medium text-gray-700 bg-gray-50">Prediction</th>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium border ${getPredictionColor(result.prediction)}`}>
                          {result.prediction}
                        </span>
                      </td>
                    </tr>
                    <tr className="border-b border-gray-200">
                      <th className="py-3 px-4 font-medium text-gray-700 bg-gray-50">Confidence Score</th>
                      <td className="py-3 px-4 text-gray-900">{result.confidence}</td>
                    </tr>
                    <tr>
                      <th className="py-3 px-4 font-medium text-gray-700 bg-gray-50 align-top">Explanation</th>
                      <td className="py-3 px-4 text-gray-900 leading-relaxed">
                        {result.explanation}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Extra Details Sections (Regions / Analysis Details) */}
              {(result.suspiciousRegions.length > 0 || result.analysisDetails.length > 0) && (
                <div className="border border-gray-300 rounded-md p-5 mt-6">
                  <h3 className="text-sm font-medium text-gray-900 mb-3">Additional Details</h3>
                  
                  {result.suspiciousRegions.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-xs font-medium text-gray-600 uppercase tracking-wider mb-2">Detected Suspicious Regions</h4>
                      <ul className="list-disc pl-5 text-sm text-gray-800 space-y-1">
                        {result.suspiciousRegions.map((region, idx) => (
                          <li key={idx}>{region}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {result.analysisDetails.length > 0 && (
                    <div>
                      <h4 className="text-xs font-medium text-gray-600 uppercase tracking-wider mb-2">Technical Analysis</h4>
                      <ul className="list-disc pl-5 text-sm text-gray-800 space-y-1">
                        {result.analysisDetails.map((detail, idx) => (
                          <li key={idx}>{detail}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
