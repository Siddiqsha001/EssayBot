import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { FiDownload, FiShare2, FiClock } from 'react-icons/fi';
import './EssayBot.css'; // Import your CSS file here

const EssayBot = () => {
  const [essay, setEssay] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [startTime, setStartTime] = useState(null);
  const [timeTaken, setTimeTaken] = useState(0);
  const { currentUser } = useAuth();

  const API_KEY = '1HsRptMcCP0TJIEw5DdTA3QrVVAF4KeGpPlB2MHk';
  const MODEL_NAME = 'command-r-plus';

  useEffect(() => {
    if (loading) {
      setStartTime(Date.now());
    }
  }, [loading]);

  const saveToFirebase = async (analysisResult) => {
    try {
      const essayData = {
        userId: currentUser?.uid,
        topic: essay.split('\n')[0], // First line as topic
        content: essay,
        timeTaken: Math.round((Date.now() - startTime) / 1000), // in seconds
        analysis: {
          ...analysisResult.scores,
          overallScore: Object.values(analysisResult.scores).reduce((a, b) => a + b, 0) / 
                       Object.values(analysisResult.scores).length
        },
        suggestions: analysisResult.improvement_suggestions,
        submittedAt: Timestamp.now(),
        status: 'completed'
      };

      const docRef = await addDoc(collection(db, 'chats'), essayData);
      console.log('Essay saved with ID:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('Error saving essay:', error);
      throw error;
    }
  };

  const handleDownload = () => {
    const essayText = `
Topic: ${essay.split('\n')[0]}
Date: ${new Date().toLocaleDateString()}
Content: ${essay}

Analysis:
${Object.entries(analysis.scores)
  .map(([key, value]) => `${key.toUpperCase()}: ${value}%`)
  .join('\n')}

Suggestions:
${analysis.improvement_suggestions.map(s => `- ${s}`).join('\n')}
    `;

    const blob = new Blob([essayText], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `essay-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'My Essay Analysis',
          text: `Check out my essay analysis!\nOverall Score: ${
            Object.values(analysis.scores).reduce((a, b) => a + b, 0) / 
            Object.values(analysis.scores).length
          }%`,
          url: window.location.href
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!essay.trim()) {
      setError('Please enter an essay to analyze');
      return;
    }
  
    setLoading(true);
    setError(null);
    setAnalysis(null);
  
    const prompt = `
  You are an expert essay reviewer. Analyze the following essay and give:
  
  Level: [Beginner / Intermediate / Advanced]
  Clarity: XX%
  Structure: XX%
  Grammar: XX%
  Vocabulary: XX%
  Coherence: XX%
  Creativity: XX%
  
  Suggestions:
  - Use more transitions
  - Vary sentence structure
  - Provide specific examples
  
  Essay:
  """${essay}"""
  `;

  try {
    const response = await fetch("https://api.cohere.ai/v1/generate", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "command-r-plus",
        prompt: prompt,
        max_tokens: 500,
        temperature: 0.7
      })
    });

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }

      const data = await response.json();
      const text = data.generations[0].text;
const lines = text.split('\n').map(line => line.trim()).filter(Boolean);

let scores = {};
let summary = '';
let improvementSuggestions = [];
let improvedVersion = '';

for (let line of lines) {
  if (line.includes(':')) {
    const [keyRaw, valueRaw] = line.split(':');
    const key = keyRaw.trim().toLowerCase();
    const value = valueRaw.trim();

    if (key === 'level') {
      summary += `Level: ${value}\n`;
    } else if (['clarity', 'structure', 'grammar', 'vocabulary', 'coherence', 'creativity'].includes(key)) {
      scores[key] = parseInt(value.replace('%', '')) || 0;
    }
  } else if (line.startsWith('-')) {
    improvementSuggestions.push(line.slice(1).trim());
  } else {
    improvedVersion += line + '\n';
  }
}

const analysisResult = {
  summary,
  scores,
  improvement_suggestions: improvementSuggestions,
  improved_version: improvedVersion.trim()
};

setAnalysis(analysisResult);

if (currentUser) {
  await saveToFirebase(analysisResult);
}

    } catch (err) {
      console.error('Error analyzing essay:', err);
      setError('Failed to analyze essay. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderScoreBar = (score) => {
    const percentage = Math.round(score);
    let colorClass = 'bg-red-500';
    if (score >= 70) colorClass = 'bg-green-500';
    else if (score >= 50) colorClass = 'bg-yellow-500';

    return (
      <div className="w-full bg-gray-200 rounded-full h-2.5">
        <div 
          className={`h-2.5 rounded-full ${colorClass}`} 
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    );
  };

  return (
    <div className="essaybot-container">
      <div className="essaybot-card">
        <h1 className="essaybot-header">AI Essay Assistant</h1>
        
        <div className="input-area">
          <textarea
            className="essay-textarea"
            id="essay"
            value={essay}
            onChange={(e) => setEssay(e.target.value)}
            placeholder="Enter your essay here..."
            disabled={loading}
          />
          <div className="word-count">
            {/* ...existing word count... */}
          </div>
        </div>

        <div className="button-group">
          <button className="reset-button">
            Reset
          </button>
          <button className="submit-button" onClick={handleSubmit} disabled={loading}>
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Analyzing...
              </span>
            ) : 'Analyze Essay'}
          </button>
        </div>

        {error && (
          <div className="mt-4 p-4 bg-red-50 border-l-4 border-red-500 text-red-700">
            <p>{error}</p>
          </div>
        )}

        {analysis && (
          <div className="mt-8 space-y-6">
            <div className="bg-indigo-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-indigo-800 mb-2">Overall Summary</h3>
              <p className="text-gray-700">{analysis.summary}</p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Scores</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(analysis.scores).map(([category, score]) => (
                  <div key={category} className="bg-white p-4 rounded-lg border border-gray-200">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-medium capitalize">{category}</span>
                      <span className="font-bold">{score}/100</span>
                    </div>
                    {renderScoreBar(score)}
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">Top Areas for Improvement</h3>
              <ul className="list-disc pl-5 space-y-2">
                {analysis.improvement_suggestions.map((suggestion, index) => (
                  <li key={index} className="text-gray-700">{suggestion}</li>
                ))}
              </ul>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-2">Improved Version</h3>
              <div className="prose max-w-none">
                <p className="whitespace-pre-wrap">{analysis.improved_version}</p>
              </div>
            </div>

            <div className="flex space-x-4 mt-6">
              <button
                onClick={handleDownload}
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                <FiDownload className="mr-2" />
                Download Essay
              </button>
              <button
                onClick={handleShare}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <FiShare2 className="mr-2" />
                Share Analysis
              </button>
            </div>

            {timeTaken > 0 && (
              <div className="flex items-center text-gray-600">
                <FiClock className="mr-2" />
                Time taken: {Math.round(timeTaken / 60)} minutes
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default EssayBot;