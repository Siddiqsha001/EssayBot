import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { FiDownload, FiShare2, FiClock } from 'react-icons/fi';
import '../styles/EssayBot.css'; // Import your CSS file here

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
      <div className="essaybot-header">
        <h2>EssayAI Analysis</h2>
      </div>
      <div className="analysis-container">
        <form onSubmit={handleSubmit} className="input-section">
          <div className="form-group">
            <label htmlFor="essay">
              Paste your essay below for analysis
            </label>
            <textarea
              id="essay"
              value={essay}
              onChange={(e) => setEssay(e.target.value)}
              className="essay-textarea"
              placeholder="Enter your essay here..."
              disabled={loading}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="analyze-btn"
          >
            {loading ? (
              <span className="loading-state">
                <svg className="loading-spinner" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Analyzing...
              </span>
            ) : 'Analyze Essay'}
          </button>
        </form>

        {error && (
          <div className="error-message">
            <p>{error}</p>
          </div>
        )}

        {analysis && (
          <div className="results-section">
            <div className="analysis-panel summary-panel">
              <h3>Overall Summary</h3>
              <p>{analysis.summary}</p>
            </div>

            <div className="analysis-panel">
              <h3>Scores</h3>
              <div className="scores-grid">
                {Object.entries(analysis.scores).map(([category, score]) => (
                  <div key={category} className="score-item">
                    <div className="score-header">
                      <span className="score-category">{category}</span>
                      <span className="score-value">{score}/100</span>
                    </div>
                    <div className="score-bar-bg">
                      <div 
                        className="score-bar" 
                        style={{ width: `${Math.round(score)}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="analysis-panel">
              <h3>Top Areas for Improvement</h3>
              <ul className="suggestions-list">
                {analysis.improvement_suggestions.map((suggestion, index) => (
                  <li key={index} className="suggestion-item">
                    <span className="suggestion-icon">•</span>
                    <span>{suggestion}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="analysis-panel improved-panel">
              <h3>Improved Version</h3>
              <div className="improved-version">
                {analysis.improved_version}
              </div>
            </div>

            <div className="action-buttons">
              <button
                onClick={handleDownload}
                className="download-btn"
              >
                <FiDownload className="btn-icon" />
                Download Essay
              </button>
              <button
                onClick={handleShare}
                className="share-btn"
              >
                <FiShare2 className="btn-icon" />
                Share Analysis
              </button>
            </div>

            {timeTaken > 0 && (
              <div className="time-indicator">
                <FiClock className="time-icon" />
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