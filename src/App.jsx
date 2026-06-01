import { useEffect, useMemo, useState } from "react";
import "./App.css";

const languages = [
  { name: "Spanish", code: "es", voice: "es-ES", flag: "🇪🇸" },
  { name: "French", code: "fr", voice: "fr-FR", flag: "🇫🇷" },
  { name: "German", code: "de", voice: "de-DE", flag: "🇩🇪" },
  { name: "Japanese", code: "ja", voice: "ja-JP", flag: "🇯🇵" },
  { name: "Korean", code: "ko", voice: "ko-KR", flag: "🇰🇷" },
  { name: "Chinese", code: "zh", voice: "zh-CN", flag: "🇨🇳" },
  { name: "Italian", code: "it", voice: "it-IT", flag: "🇮🇹" },
  { name: "Portuguese", code: "pt", voice: "pt-PT", flag: "🇵🇹" },
  { name: "Russian", code: "ru", voice: "ru-RU", flag: "🇷🇺" },
  { name: "Hindi", code: "hi", voice: "hi-IN", flag: "🇮🇳" },
];

const starterWords = [
  "Hello",
  "Thank you",
  "Good morning",
  "Friend",
  "Water",
  "Food",
  "School",
  "Book",
];

function App() {
  const [inputWord, setInputWord] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState(languages[0]);
  const [translatedText, setTranslatedText] = useState("");
  const [flashcards, setFlashcards] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [quizCard, setQuizCard] = useState(null);
  const [quizInput, setQuizInput] = useState("");
  const [quizResult, setQuizResult] = useState("");
  const [score, setScore] = useState(0);

  useEffect(() => {
    const savedCards = JSON.parse(localStorage.getItem("languageFlashcards")) || [];
    const savedScore = Number(localStorage.getItem("languageScore")) || 0;

    setFlashcards(savedCards);
    setScore(savedScore);
  }, []);

  useEffect(() => {
    localStorage.setItem("languageFlashcards", JSON.stringify(flashcards));
  }, [flashcards]);

  useEffect(() => {
    localStorage.setItem("languageScore", score);
  }, [score]);

  const progress = useMemo(() => {
    return Math.min(Math.round((flashcards.length / 20) * 100), 100);
  }, [flashcards]);

  const translateWord = async (word = inputWord) => {
    if (!word.trim()) {
      setMessage("Please enter a word or phrase.");
      return;
    }

    try {
      setLoading(true);
      setMessage("");
      setTranslatedText("");

      const response = await fetch(
        `https://api.mymemory.translated.net/get?q=${encodeURIComponent(
          word
        )}&langpair=en|${selectedLanguage.code}`
      );

      const data = await response.json();
      const translated = data.responseData.translatedText;

      setInputWord(word);
      setTranslatedText(translated);
    } catch {
      setMessage("Translation failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const saveFlashcard = () => {
    if (!inputWord.trim() || !translatedText.trim()) {
      setMessage("Translate something before saving.");
      return;
    }

    const newCard = {
      id: Date.now(),
      original: inputWord.trim(),
      translated: translatedText.trim(),
      language: selectedLanguage.name,
      code: selectedLanguage.code,
      voice: selectedLanguage.voice,
      flag: selectedLanguage.flag,
    };

    const alreadyExists = flashcards.some(
      (card) =>
        card.original.toLowerCase() === newCard.original.toLowerCase() &&
        card.language === newCard.language
    );

    if (alreadyExists) {
      setMessage("This flashcard already exists.");
      return;
    }

    setFlashcards([newCard, ...flashcards]);
    setMessage("Flashcard saved successfully.");
  };

  const deleteFlashcard = (id) => {
    setFlashcards(flashcards.filter((card) => card.id !== id));
  };

  const speakText = (text, voiceCode = selectedLanguage.voice) => {
    if (!text) return;

    const speech = new SpeechSynthesisUtterance(text);
    speech.lang = voiceCode;
    speech.rate = 0.9;

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(speech);
  };

  const generateStarterLesson = async () => {
    const randomWord = starterWords[Math.floor(Math.random() * starterWords.length)];
    await translateWord(randomWord);
  };

  const startQuiz = () => {
    if (flashcards.length === 0) {
      setQuizResult("Save at least one flashcard to start quiz.");
      return;
    }

    const randomCard = flashcards[Math.floor(Math.random() * flashcards.length)];

    setQuizCard(randomCard);
    setQuizInput("");
    setQuizResult("");
  };

  const checkQuiz = () => {
    if (!quizCard || !quizInput.trim()) return;

    const userAnswer = quizInput.trim().toLowerCase();
    const correctAnswer = quizCard.translated.trim().toLowerCase();

    if (userAnswer === correctAnswer) {
      setScore((prev) => prev + 1);
      setQuizResult("Correct answer!");
    } else {
      setQuizResult(`Wrong. Correct answer: ${quizCard.translated}`);
    }
  };

  const clearAll = () => {
    const confirmDelete = window.confirm("Delete all saved flashcards?");
    if (!confirmDelete) return;

    setFlashcards([]);
    setQuizCard(null);
    setQuizInput("");
    setQuizResult("");
    setScore(0);
    localStorage.removeItem("languageFlashcards");
    localStorage.removeItem("languageScore");
  };

  return (
    <main className="app">
      <section className="dashboard">
        <aside className="sidebar">
          <div>
            <div className="logo">🌍</div>
            <p className="eyebrow">Language Studio</p>
            <h1>Learn any word with smart flashcards.</h1>
            <p className="subtitle">
              Translate words, hear pronunciation, save flashcards and test your
              memory using quick quizzes.
            </p>
          </div>

          <div className="progress-card">
            <div className="progress-top">
              <span>{progress}%</span>
              <p>Learning Progress</p>
            </div>
            <div className="progress-track">
              <div style={{ width: `${progress}%` }}></div>
            </div>
          </div>
        </aside>

        <section className="main">
          <header className="topbar">
            <div>
              <p className="eyebrow">Translate & Practice</p>
              <h2>
                {selectedLanguage.flag} {selectedLanguage.name}
              </h2>
            </div>

            <select
              value={selectedLanguage.code}
              onChange={(e) => {
                const lang = languages.find((item) => item.code === e.target.value);
                setSelectedLanguage(lang);
                setTranslatedText("");
                setMessage("");
              }}
            >
              {languages.map((language) => (
                <option key={language.code} value={language.code}>
                  {language.flag} {language.name}
                </option>
              ))}
            </select>
          </header>

          <section className="workspace">
            <div className="translator-card">
              <div className="section-title">
                <div>
                  <p className="eyebrow">Vocabulary Builder</p>
                  <h3>Translate a word or phrase</h3>
                </div>
                <button className="ghost" onClick={generateStarterLesson}>
                  Daily Lesson
                </button>
              </div>

              <textarea
                placeholder="Enter English word or phrase..."
                value={inputWord}
                onChange={(e) => setInputWord(e.target.value)}
              />

              <div className="button-row">
                <button className="primary" onClick={() => translateWord()}>
                  {loading ? "Translating..." : "Translate"}
                </button>
                <button onClick={() => speakText(inputWord, "en-US")}>
                  🔊 Speak English
                </button>
              </div>

              {translatedText && (
                <div className="result-box">
                  <p>{selectedLanguage.flag} Translation</p>
                  <h4>{translatedText}</h4>

                  <div className="button-row">
                    <button
                      className="primary"
                      onClick={() =>
                        speakText(translatedText, selectedLanguage.voice)
                      }
                    >
                      🔊 Pronounce
                    </button>
                    <button onClick={saveFlashcard}>Save Flashcard</button>
                  </div>
                </div>
              )}

              {message && <p className="message">{message}</p>}
            </div>

            <div className="quiz-card">
              <div className="section-title">
                <div>
                  <p className="eyebrow">Practice Test</p>
                  <h3>Quiz Yourself</h3>
                </div>
                <span className="score">Score: {score}</span>
              </div>

              {!quizCard ? (
                <div className="empty-box">
                  <p>Start a quiz from your saved flashcards.</p>
                  <button className="primary" onClick={startQuiz}>
                    Start Quiz
                  </button>
                </div>
              ) : (
                <div className="quiz-area">
                  <p>Translate this into {quizCard.language}:</p>
                  <h4>{quizCard.original}</h4>

                  <input
                    type="text"
                    placeholder="Type your answer..."
                    value={quizInput}
                    onChange={(e) => setQuizInput(e.target.value)}
                  />

                  <div className="button-row">
                    <button className="primary" onClick={checkQuiz}>
                      Check Answer
                    </button>
                    <button onClick={startQuiz}>Next Question</button>
                  </div>

                  {quizResult && <p className="quiz-result">{quizResult}</p>}
                </div>
              )}
            </div>
          </section>

          <section className="flashcard-section">
            <div className="section-title">
              <div>
                <p className="eyebrow">Saved Deck</p>
                <h3>Your Flashcards</h3>
              </div>

              {flashcards.length > 0 && (
                <button className="danger" onClick={clearAll}>
                  Clear All
                </button>
              )}
            </div>

            {flashcards.length === 0 ? (
              <p className="empty-text">
                No flashcards saved yet. Translate a word and save it here.
              </p>
            ) : (
              <div className="flashcard-grid">
                {flashcards.map((card) => (
                  <div className="mini-card" key={card.id}>
                    <div className="mini-top">
                      <span>
                        {card.flag} {card.language}
                      </span>
                      <button onClick={() => deleteFlashcard(card.id)}>
                        Delete
                      </button>
                    </div>

                    <h4>{card.original}</h4>
                    <p>{card.translated}</p>

                    <button
                      className="speak-small"
                      onClick={() => speakText(card.translated, card.voice)}
                    >
                      🔊 Pronounce
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>
        </section>
      </section>
    </main>
  );
}

export default App;