import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import './AITester.css';

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
  const [topicLoading, setTopicLoading] = useState(false);
  const [difficulty, setDifficulty] = useState('beginner');
  const [wordGoal, setWordGoal] = useState(100);
  const { currentUser } = useAuth();
  const [startTime, setStartTime] = useState(null);
  const [sessionStartTime, setSessionStartTime] = useState(null);
  const [sessionData, setSessionData] = useState(null);

  useEffect(() => {
    // Start timing when component mounts
    setSessionStartTime(Date.now());
    return () => {
      // Save session data when component unmounts
      if (sessionData) {
        saveSessionToFirebase(sessionData, 'cancelled');
      }
    };
  }, []);

  // Generate topic using Hugging Face API
  const generateTopic = useCallback(async () => {
    setTopicLoading(true);
    setTopic('');
    try {
      const prompt = `Generate a ${difficulty} level essay topic about ` + 
        (difficulty === 'beginner' ? 'personal experiences or simple concepts' :
         difficulty === 'intermediate' ? 'social issues or common debates' :
         difficulty === 'advanced' ? 'complex societal or academic subjects' :
         'professional or specialized topics');

      const response = await fetch(
        'https://api-inference.huggingface.co/models/t5-small',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.REACT_APP_HUGGINGFACE_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ inputs: prompt }),
        }
      );

      if (!response.ok) {
        throw new Error(`API responded with ${response.status}`);
      }

      const result = await response.json();
      if (result && result[0] && result[0].generated_text) {
        // Clean up the generated text
        let generatedTopic = result[0].generated_text
          .replace(prompt, '')
          .replace(/^[^a-zA-Z]+/, '')
          .trim();
        
        // Capitalize first letter
        generatedTopic = generatedTopic.charAt(0).toUpperCase() + generatedTopic.slice(1);
        
        // Remove any trailing incomplete sentences
        const lastPunctuation = Math.max(
          generatedTopic.lastIndexOf('.'),
          generatedTopic.lastIndexOf('?'),
          generatedTopic.lastIndexOf('!')
        );
        
        if (lastPunctuation > 0 && lastPunctuation < generatedTopic.length - 1) {
          generatedTopic = generatedTopic.substring(0, lastPunctuation + 1);
        }

        setTopic(generatedTopic || 'Write about your favorite personal experience');
      } else {
        throw new Error('No topic generated');
      }
    } catch (err) {
      console.error('Topic generation error:', err);
      // Fallback topics
      const fallbackTopics = {
        beginner: [
          "Describe your favorite holiday",
          "Write about your best friend",
          "What is your favorite season and why?"
        ],
        intermediate: [
          "Should school uniforms be mandatory?",
          "The impact of social media on teenagers",
          "The importance of learning a second language"
        ],
        advanced: [
          "Analyze the causes of income inequality",
          "Discuss the ethical implications of AI development",
          "Compare and contrast two political systems"
        ],
        professional: [
          "The future of remote work in a post-pandemic world",
          "Blockchain technology: applications beyond cryptocurrency",
          "Sustainable business models for the 21st century"
        ]
      };
      const topics = fallbackTopics[difficulty] || fallbackTopics.beginner;
      setTopic(topics[Math.floor(Math.random() * topics.length)]);
    } finally {
      setTopicLoading(false);
    }
  }, [difficulty]);

  // Start writing session
  const startWriting = async () => {
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
    await generateTopic();
  };

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

  // Set word goals based on difficulty
  useEffect(() => {
    const goals = {
      beginner: 100,
      intermediate: 250,
      advanced: 500,
      professional: 750
    };
    setWordGoal(goals[difficulty] || 100);
  }, [difficulty]);

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

      // Simple readability score (Flesch-Kincaid approximation)
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

  // Save test results to Firebase
  const saveTestResults = async (results) => {
    try {
      const testData = {
        userId: currentUser?.uid,
        essayTopic: topic,
        essayContent: essay,
        difficulty: difficulty,
        scores: results.scores,
        grammarIssues: results.grammarIssues,
        vocabularySuggestions: results.vocabularySuggestions,
        styleSuggestions: results.styleSuggestions,
        overallScore: results.overallScore,
        timeSpent: results.timeSpent,
        wordCount: essay.split(' ').length,
        submittedAt: Timestamp.now(),
        status: 'completed'
      };

      const docRef = await addDoc(collection(db, 'test'), testData);
      console.log('Test results saved with ID:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('Error saving test results:', error);
      throw error;
    }
  };

  const saveSessionToFirebase = async (data, status = 'completed') => {
    if (!currentUser) return;

    try {
      const sessionDuration = Date.now() - sessionStartTime;
      const testData = {
        userId: currentUser.uid,
        topic: topic || 'Untitled',
        content: essay,
        difficulty: difficulty,
        duration: Math.floor(sessionDuration / 1000), // in seconds
        status: status,
        scores: data?.scores || {},
        analysis: data?.analysis || {},
        metadata: {
          submittedAt: Timestamp.now(),
          wordCount: essay.split(/\s+/).filter(Boolean).length,
          characterCount: essay.length,
          browser: navigator.userAgent
        }
      };

      const docRef = await addDoc(collection(db, 'test'), testData);
      console.log('Test session saved:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('Error saving test session:', error);
    }
  };

  const handleAnalyze = async () => {
    if (!essay.trim()) return;
    
    setLoading(true);
    try {
      // Simulate API analysis
      const analysisResults = {
        scores: {
          grammar: Math.floor(Math.random() * 30) + 70,
          vocabulary: Math.floor(Math.random() * 30) + 70,
          structure: Math.floor(Math.random() * 30) + 70,
          coherence: Math.floor(Math.random() * 30) + 70
        },
        analysis: {
          suggestions: [
            'Consider using more varied vocabulary',
            'Work on transition sentences',
            'Strengthen your argument structure'
          ],
          improvements: ['grammar', 'vocabulary', 'structure'],
          wordChoice: ['good', 'better', 'best']
        }
      };

      setSessionData(analysisResults);
      await saveSessionToFirebase(analysisResults);
      
      // Update UI with results
      // ...existing results display code...
      
    } catch (error) {
      console.error('Analysis error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    // Save current session state before cancelling
    const partialData = {
      scores: {},
      analysis: {
        partial: true,
        lastSaved: new Date().toISOString()
      }
    };
    await saveSessionToFirebase(partialData, 'cancelled');
    // Reset state or navigate away
    setEssay('');
    setTopic('');
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

      const results = {
        scores: mockScores,
        grammarIssues: grammarResults,
        vocabularySuggestions: vocabResults,
        styleSuggestions: styleResults,
        overallScore: Math.round(
          (mockScores.clarity + mockScores.coherence + mockScores.originality) / 3
        ),
        timeSpent: textStats.wordCount // Mock time spent
      };

      // Save to Firebase
      if (currentUser) {
        await saveTestResults(results);
      }

      setAnalysis(results);

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
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="main-card"
      >
        <h1 className="main-title">Essay Analysis Tool</h1>
        
        {!writingStarted ? (
          <div className="setup-panel">
            <h2 className="setup-title">Configure Your Writing Session</h2>
            
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

            <div className="session-info">
              <div className="info-item">
                <span className="info-label">Time Limit:</span>
                <span className="info-value">
                  {difficulty === 'beginner' ? '15 minutes' :
                   difficulty === 'intermediate' ? '30 minutes' :
                   difficulty === 'advanced' ? '45 minutes' : '60 minutes'}
                </span>
              </div>
              <div className="info-item">
                <span className="info-label">Word Goal:</span>
                <span className="info-value">{wordGoal} words</span>
              </div>
            </div>

            <button
              onClick={startWriting}
              disabled={topicLoading}
              className="start-button"
            >
              {topicLoading ? (
                <span className="loading-indicator">
                  <svg className="spinner" viewBox="0 0 24 24">
                    <circle className="spinner-circle" cx="12" cy="12" r="10"></circle>
                  </svg>
                  Generating Topic...
                </span>
              ) : 'Start Writing Test'}
            </button>
          </div>
        ) : (
          <>
            <div className="writing-header">
              <div>
                <h2 className="writing-topic">
                  {topicLoading ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Generating topic...
                    </span>
                  ) : topic}
                </h2>
                <p className="word-goal-text">
                  Word goal: {wordGoal} words (current: {essay.trim() ? essay.trim().split(/\s+/).length : 0})
                </p>
              </div>
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
                autoFocus
              />
            </div>

            <div className="button-group">
              <button
                onClick={analyzeEssay}
                disabled={loading || !essay}
                className="analyze-button"
              >
                {loading ? (
                  <span className="loading-indicator">
                    <svg className="spinner" viewBox="0 0 24 24">
                      <circle className="spinner-circle" cx="12" cy="12" r="10"></circle>
                    </svg>
                    Analyzing...
                  </span>
                ) : 'Submit Essay'}
              </button>

              <button
                onClick={handleCancel}
                className="cancel-button"
              >
                Cancel Session
              </button>
            </div>

            {error && (
              <div className="error-message">
                <p>{error}</p>
              </div>
            )}
          </>
        )}

        {/* Results Section */}
        {stats && (
          <div className="results-section">
            {/* Overall Score */}
            {analysis && (
              <div className="score-card">
                <div className="score-header">
                  <span className="overall-score">{analysis.overallScore}/100</span>
                  <p className="score-label">Overall Quality Score</p>
                </div>
                
                <div className="score-grid">
                  {Object.entries(analysis.scores).map(([category, score]) => (
                    <div key={category} className="score-item">
                      <div className="score-item-header">
                        <span className="score-category">{category}</span>
                        <span className="score-value">{score}/100</span>
                      </div>
                      {renderScoreBar(score)}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Text Statistics */}
            <div className="stats-card">
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

            {/* Grammar Issues */}
            {grammarIssues.length > 0 && (
              <div className="grammar-card">
                <h2 className="grammar-title">
                  Grammar & Spelling ({grammarIssues.length} issues found)
                </h2>
                <div className="issues-list">
                  {grammarIssues.slice(0, 10).map(renderGrammarIssue)}
                  {grammarIssues.length > 10 && (
                    <div className="more-issues">
                      + {grammarIssues.length - 10} more issues...
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Vocabulary Suggestions */}
            {vocabSuggestions.length > 0 && (
              <div className="vocab-card">
                <h2 className="vocab-title">
                  Vocabulary Enhancements
                </h2>
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

            {/* Style Feedback */}
            {styleFeedback.length > 0 && (
              <div className="style-card">
                <h2 className="style-title">
                  Style Improvements
                </h2>
                <ul className="style-list">
                  {styleFeedback.map((feedback, i) => (
                    <li key={i} className="style-item">
                      {feedback.type === 'passive' || feedback.type === 'wordiness' ? (
                        <span className="warning-icon">⚠️</span>
                      ) : (
                        <span className="error-icon">✗</span>
                      )}
                      <span>{feedback.reason}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* AI Suggestions */}
            {analysis && analysis.suggestions.length > 0 && (
              <div className="suggestions-card">
                <h2 className="suggestions-title">
                  Improvement Suggestions
                </h2>
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
        )}
      </motion.div>
    </div>
  );
};

export default AITester;