import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import './AITester.css'; // Assuming you have a CSS file for styles
const AITester = () => {
  const [essay, setEssay] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);
  const [grammarIssues, setGrammarIssues] = useState([]);
  const [vocabSuggestions, setVocabSuggestions] = useState([]);
  const [styleFeedback, setStyleFeedback] = useState([]);
  const [timeLeft, setTimeLeft] = useState(null);
  const [timerActive, setTimerActive] = useState(false);
  const [writingStarted, setWritingStarted] = useState(false);
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState('beginner');
  const [wordGoal, setWordGoal] = useState(100);

  // Topic generation based on difficulty
  const generateTopic = useCallback(() => {
    const topicsByDifficulty = {
      beginner: [
        "Describe your favorite holiday",
        "Write about your best friend",
        "What is your favorite season and why?",
        "Describe your dream house",
        "Write about a memorable day at school"
      ],
      intermediate: [
        "Should school uniforms be mandatory?",
        "The impact of social media on teenagers",
        "The importance of learning a second language",
        "How can we reduce pollution in cities?",
        "The benefits of team sports"
      ],
      advanced: [
        "Analyze the causes of income inequality",
        "Discuss the ethical implications of AI development",
        "Compare and contrast two political systems",
        "The role of art in society",
        "Climate change: mitigation vs adaptation strategies"
      ],
      professional: [
        "The future of remote work in a post-pandemic world",
        "Blockchain technology: applications beyond cryptocurrency",
        "Sustainable business models for the 21st century",
        "Leadership strategies in times of crisis",
        "The impact of automation on employment"
      ]
    };

    const topics = topicsByDifficulty[difficulty] || topicsByDifficulty.beginner;
    const randomTopic = topics[Math.floor(Math.random() * topics.length)];
    setTopic(randomTopic);

    // Set word goals based on difficulty
    const goals = {
      beginner: 100,
      intermediate: 250,
      advanced: 500,
      professional: 750
    };
    setWordGoal(goals[difficulty] || 100);
  }, [difficulty]);

  // Initialize with a topic
  useEffect(() => {
    generateTopic();
  }, [generateTopic]);

  // Timer effect
  useEffect(() => {
    let interval;
    if (timerActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && timerActive) {
      setTimerActive(false);
      analyzeEssay();
    }
    return () => clearInterval(interval);
  }, [timeLeft, timerActive]);

  // Start writing session
  const startWriting = () => {
    const timeLimits = {
      beginner: 15 * 60, // 15 minutes
      intermediate: 30 * 60, // 30 minutes
      advanced: 45 * 60, // 45 minutes
      professional: 60 * 60 // 60 minutes
    };
    setTimeLeft(timeLimits[difficulty] || 15 * 60);
    setTimerActive(true);
    setWritingStarted(true);
    setEssay('');
    setAnalysis(null);
  };

  // Format time display
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Calculate basic text statistics
  const calculateStats = (text) => {
    try {
      const words = text.trim() ? text.trim().split(/\s+/) : [];
      const sentences = text.trim() ? text.split(/[.!?]+/) : [];
      const characters = text.length;
      const paragraphs = text.trim() ? text.split('\n').filter(p => p.trim()) : [];
  
      const wordCount = words.length;
      const sentenceCount = sentences.filter(s => s.trim()).length;
      const syllableCount = words.join(' ').match(/[aeiouy]+/gi)?.length || 0;
  
      const readability = wordCount > 0 && sentenceCount > 0
        ? Math.max(0, Math.min(100,
            206.835 - 1.015 * (wordCount / sentenceCount) - 84.6 * (syllableCount / wordCount)
          ))
        : 0;
  
      return {
        wordCount,
        sentenceCount,
        paragraphCount: paragraphs.length,
        characterCount: characters,
        readability: Math.round(readability),
        readingLevel: readability < 30 ? 'Difficult' :
                      readability < 60 ? 'Moderate' : 'Easy'
      };
    } catch (err) {
      console.error('Error calculating stats:', err);
      return {
        wordCount: 0,
        sentenceCount: 0,
        paragraphCount: 0,
        characterCount: 0,
        readability: 0,
        readingLevel: 'Unknown'
      };
    }
  };
  

  // Check grammar using API with fallback
  const checkGrammar = async (text) => {
    if (!text.trim()) return [];
    
    try {
      const response = await fetch('https://api.languagetool.org/v2/check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json'
        },
        body: new URLSearchParams({
          text,
          language: 'en-US',
          apiKey: process.env.REACT_APP_LANGUAGETOOL_KEY || '6mofdWsjzZR1gsWg'
        })
      });

      if (!response.ok) {
        throw new Error(`Grammar API responded with ${response.status}`);
      }
      
      const data = await response.json();
      return data.matches || [];
    } catch (err) {
      console.error('Grammar check error:', err);
      // Fallback basic checks
      const issues = [];
      if (text.length > 0 && text.split(' ').length < 10) {
        issues.push({
          message: 'Essay is very short (minimum 10 words recommended)',
          offset: 0,
          length: text.length,
          rule: { id: 'SHORT_ESSAY' }
        });
      }
      return issues;
    }
  };

  // Get vocabulary suggestions from Datamuse with fallback
  const getVocabSuggestions = async (text) => {
    if (!text.trim()) return [];
    
    const commonWords = ['good', 'bad', 'nice', 'happy', 'sad', 'very', 'many', 'big', 'small'];
    const suggestions = [];
    
    try {
      // Find common words in the text
      const wordsInEssay = text.toLowerCase().split(/\s+/);
      const wordsToEnhance = commonWords.filter(word => 
        wordsInEssay.includes(word)
      );

      // Get synonyms for each common word
      for (const word of wordsToEnhance) {
        try {
          const response = await fetch(`https://api.datamuse.com/words?rel_syn=${word}&max=3`);
          if (!response.ok) continue;
          
          const synonyms = await response.json();
          if (synonyms.length > 0) {
            suggestions.push({
              original: word,
              suggestions: synonyms.map(s => s.word)
            });
          }
        } catch (err) {
          console.error('Error fetching synonyms for', word, err);
        }
      }
    } catch (err) {
      console.error('Vocabulary enhancement error:', err);
    }
    
    return suggestions.length > 0 ? suggestions : [];
  };

  // Get style feedback with robust error handling
  const getStyleFeedback = (text) => {
    if (!text.trim()) return [];
    
    const feedback = [];
    
    try {
      // Passive voice check
      const passiveMatches = text.match(/\b(am|are|is|was|were|be|being|been)\s+[a-z]+ed\b/gi);
      if (passiveMatches) {
        feedback.push({
          reason: `Passive voice detected (${passiveMatches.length} instances)`,
          type: 'passive'
        });
      }

      // Wordiness check
      const wordyPhrases = ['due to the fact that', 'in order to', 'at this point in time'];
      wordyPhrases.forEach(phrase => {
        if (text.includes(phrase)) {
          feedback.push({
            reason: `Wordy phrase: "${phrase}"`,
            type: 'wordiness'
          });
        }
      });

      // Basic style checks
      if (text.split('.').length > 1) {
        const avgSentenceLength = text.split(' ').length / text.split('.').length;
        if (avgSentenceLength > 25) {
          feedback.push({
            reason: 'Average sentence length is too long (try breaking up sentences)',
            type: 'sentence-length'
          });
        }
      }
    } catch (err) {
      console.error('Style analysis error:', err);
    }
    
    return feedback;
  };

  // Main analysis function
  const analyzeEssay = async () => {
    if (!essay.trim()) {
      setError('Please enter an essay to analyze');
      return;
    }

    setLoading(true);
    setError(null);
    setAnalysis(null);
    setStats(null);
    setGrammarIssues([]);
    setVocabSuggestions([]);
    setStyleFeedback([]);

    try {
      // Calculate stats (always works)
      const textStats = calculateStats(essay);
      setStats(textStats);

      // Run all analyses in parallel with error handling
      const [grammarResults, vocabResults, styleResults] = await Promise.all([
        checkGrammar(essay).catch(err => {
          console.error('Grammar check failed:', err);
          return [];
        }),
        getVocabSuggestions(essay).catch(err => {
          console.error('Vocab suggestions failed:', err);
          return [];
        }),
        Promise.resolve(getStyleFeedback(essay)) // Already handles errors
      ]);

      setGrammarIssues(grammarResults);
      setVocabSuggestions(vocabResults);
      setStyleFeedback(styleResults);

      // Generate mock analysis since we're not using OpenAI in this version
      const mockScores = {
        clarity: Math.min(100, Math.max(40, Math.floor(Math.random() * 30) + 70)),
        coherence: Math.min(100, Math.max(40, Math.floor(Math.random() * 30) + 70)),
        originality: Math.min(100, Math.max(30, Math.floor(Math.random() * 40) + 60))
      };

      const mockSuggestions = [
        "Vary your sentence structure for better flow",
        "Provide more specific examples to support your points",
        "Consider using more precise vocabulary"
      ];

      setAnalysis({
        scores: mockScores,
        suggestions: mockSuggestions,
        overallScore: Math.round(
          (mockScores.clarity + mockScores.coherence + mockScores.originality) / 3
        )
      });

    } catch (err) {
      console.error('Analysis error:', err);
      setError('Failed to complete analysis. Some features may not be available.');
    } finally {
      setLoading(false);
      setTimerActive(false);
    }
  };

  const renderScoreBar = (score, max = 100) => {
    const percentage = Math.min(100, Math.max(0, (score / max) * 100));
    let color = '#ef4444'; // red
    if (percentage >= 70) color = '#10b981'; // green
    else if (percentage >= 50) color = '#f59e0b'; // yellow

    return (
      <div className="w-full bg-gray-200 rounded-full h-2.5">
        <div 
          className="h-2.5 rounded-full" 
          style={{ width: `${percentage}%`, backgroundColor: color }}
        ></div>
      </div>
    );
  };

  const renderGrammarIssue = (issue) => {
    const context = essay.substring(
      Math.max(0, issue.offset - 10),
      Math.min(essay.length, issue.offset + issue.length + 10)
    );
    
    return (
      <div key={`${issue.offset}-${issue.length}`} className="grammar-issue">
        <div className="issue-message">
          {issue.message}
          {issue.rule && (
            <span className="issue-id">({issue.rule.id})</span>
          )}
        </div>
        <div className="issue-context">
          ...{context.replace(/\n/g, ' ')}...
        </div>
        {issue.replacements && issue.replacements.length > 0 && (
          <div className="suggestions-container">
            <span className="suggestions-label">Suggestions:</span>
            <div className="suggestions-list">
              {issue.replacements.slice(0, 3).map((rep, i) => (
                <span key={i} className="suggestion">
                  {rep.value}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };


  return (
    <div className="aitester-container">
      <motion.div 
        className="main-card"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="main-title">Essay Master AI</h1>
        
        <div className="content-layout">
          {/* Left Column - Input Area */}
          <div className="input-column">
            {!writingStarted ? (
              <div className="setup-panel">
                <h2 className="setup-title">Configure Your Writing Session</h2>
                
                <div className="setup-content">
                  <div className="difficulty-selector">
                    <label className="selector-label">Select Difficulty:</label>
                    <select 
                      value={difficulty}
                      onChange={(e) => setDifficulty(e.target.value)}
                      className="selector-dropdown"
                    >
                      <option value="beginner">Beginner</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="advanced">Advanced</option>
                      <option value="professional">Professional</option>
                    </select>
                  </div>
  
                  <div className="topic-display">
                    <h3 className="topic-title">Your Writing Topic:</h3>
                    <p className="topic-text">{topic}</p>
                    <p className="word-goal">Word goal: {wordGoal} words</p>
                  </div>
  
                  <button
                    onClick={startWriting}
                    className="start-button"
                  >
                    Start Writing
                  </button>
                </div>
              </div>
            ) : (
              <div className="writing-container">
                <div className="writing-header">
                  <h2 className="writing-topic">{topic}</h2>
                  <div className="timer">
                    Time Remaining: {formatTime(timeLeft)}
                  </div>
                </div>
  
                <div className="essay-input-container">
                  <textarea
                    id="essay"
                    value={essay}
                    onChange={(e) => setEssay(e.target.value)}
                    className="essay-textarea"
                    placeholder="Start writing your essay here..."
                    disabled={loading}
                  />
                </div>
  
                <div className="action-buttons">
                  <button
                    onClick={analyzeEssay}
                    disabled={loading || !essay}
                    className="submit-button"
                  >
                    {loading ? (
                      <span className="loading-indicator">
                        <svg className="spinner" viewBox="0 0 24 24">
                          <circle className="spinner-circle" cx="12" cy="12" r="10"></circle>
                        </svg>
                        Analyzing...
                      </span>
                    ) : 'SUBMIT ESSAY'}
                  </button>
  
                  <button
                    onClick={() => {
                      setWritingStarted(false);
                      setTimerActive(false);
                    }}
                    className="cancel-button"
                  >
                    CANCEL SESSION
                  </button>
                </div>
  
                {error && (
                  <div className="error-message">
                    <p>{error}</p>
                  </div>
                )}
              </div>
            )}
          </div>
  
          {/* Right Column - Results */}
          {analysis && (
            <div className="results-column">
              <div className="results-section">
                {/* Overall Score */}
                <div className="overall-score-card">
                  <div className="score-display">{analysis.overallScore}/100</div>
                  <div className="score-label">Overall Quality Score</div>
                </div>
  
                {/* Quality Scores */}
                <div className="quality-scores">
                  <div className="score-item">
                    <div className="score-category">Clarity</div>
                    <div className="score-value">{analysis.scores.clarity}/100</div>
                    {renderScoreBar(analysis.scores.clarity)}
                  </div>
                  <div className="score-item">
                    <div className="score-category">Coherence</div>
                    <div className="score-value">{analysis.scores.coherence}/100</div>
                    {renderScoreBar(analysis.scores.coherence)}
                  </div>
                  <div className="score-item">
                    <div className="score-category">Originality</div>
                    <div className="score-value">{analysis.scores.originality}/100</div>
                    {renderScoreBar(analysis.scores.originality)}
                  </div>
                </div>
  
                {/* Text Statistics */}
                <div className="text-statistics-card">
                  <h2 className="stats-title">Text Statistics</h2>
                  <div className="stats-grid">
                    <div className="stat-item">
                      <div className="stat-value">{stats.wordCount}</div>
                      <div className="stat-label">Words</div>
                    </div>
                    <div className="stat-item">
                      <div className="stat-value">{stats.sentenceCount}</div>
                      <div className="stat-label">Sentences</div>
                    </div>
                    <div className="stat-item">
                      <div className="stat-value">{stats.paragraphCount}</div>
                      <div className="stat-label">Paragraphs</div>
                    </div>
                    <div className="stat-item">
                      <div className="stat-value">{stats.readability}</div>
                      <div className="stat-label">Readability ({stats.readingLevel})</div>
                    </div>
                  </div>
                </div>
  
                {/* Additional sections */}
                {grammarIssues.length > 0 && (
                  <div className="grammar-card">
                    <h2 className="grammar-title">
                      Grammar & Spelling ({grammarIssues.length} issues found)
                    </h2>
                    <div className="issues-list">
                      {grammarIssues.slice(0, 5).map(renderGrammarIssue)}
                    </div>
                  </div>
                )}
  
                {vocabSuggestions.length > 0 && (
                  <div className="vocab-card">
                    <h2 className="vocab-title">Vocabulary Enhancements</h2>
                    <div className="vocab-grid">
                      {vocabSuggestions.map((item, i) => (
                        <div key={i} className="vocab-item">
                          <div className="vocab-header">
                            Consider replacing "{item.original}" with:
                          </div>
                          <div className="vocab-suggestions">
                            {item.suggestions.map((word, j) => (
                              <span key={j} className="vocab-word">
                                {word}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
  
                {analysis.suggestions.length > 0 && (
                  <div className="suggestions-card">
                    <h2 className="suggestions-title">Improvement Suggestions</h2>
                    <ol className="suggestions-list">
                      {analysis.suggestions.map((suggestion, i) => (
                        <li key={i} className="suggestion-item">
                          {suggestion}
                        </li>
                      ))}
                    </ol>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default AITester;