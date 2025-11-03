import { getLyricsData } from "./api.js";

// Estado del juego
let gameState = {
    currentScreen: 'menu',
    questions: [],
    currentQuestion: 0,
    score: 0,
    selectedAnswer: null,
    showResult: false,
    usedHint: false
};

// Generador de preguntas que usa la API de letras
async function generateQuestions() {
    const canciones = [
        "Shape of You",
        "Bohemian Rhapsody",
        "Billie Jean",
        "Perfect",
        "Smells Like Teen Spirit",
    ];

    const questions = [];

    for (const titulo of canciones) {
        try {
            const data = await getLyricsData(titulo);
            if (!data || data.length === 0) continue;

            const song = data[0]; // Solo usamos la primera coincidencia
            const tipoPregunta = Math.floor(Math.random() * 2); // Aleatoria

                    if (tipoPregunta === 0 && song.artist) {
                        const opts = mezclarOpciones([
                            song.artist,
                            "Adele",
                            "Elton John",
                            "Beyoncé",
                        ]);
                        questions.push({
                            question: `¿Quién interpreta la canción "${song.song}"?`,
                            correctAnswer: song.artist,
                            options: opts,
                            hint: '',
                            artist: song.artist,
                            isLyric: false,
                            correct: opts.indexOf(song.artist)
                        });
                    } else if (song.album) {
                        const opts = mezclarOpciones([
                            song.album,
                            "Greatest Hits",
                            "Unplugged",
                            "The Best Of 2020",
                        ]);
                        questions.push({
                            question: `¿A qué álbum pertenece "${song.song}"?`,
                            correctAnswer: song.album,
                            options: opts,
                            hint: '',
                            artist: song.artist || '',
                            isLyric: false,
                            correct: opts.indexOf(song.album)
                        });
                    }
        } catch (err) {
            console.warn('Error al obtener datos para', titulo, err);
            continue;
        }
    }

    // Si la API falla, usa preguntas de respaldo
    if (questions.length === 0) return generateFallbackQuestions();
    return questions;
}

// Función auxiliar para mezclar opciones
function mezclarOpciones(array) {
    return array.sort(() => Math.random() - 0.5);
}

// Preguntas de respaldo
function generateFallbackQuestions() {
    return [
        {
            question: "¿Qué artista canta 'Rolling in the Deep'?",
            correctAnswer: "Adele",
            options: ["Adele", "Rihanna", "Lady Gaga", "Sia"],
            hint: '',
            artist: 'Adele',
            isLyric: false,
            correct: 0
        },
        {
            question: "¿Qué álbum lanzó Michael Jackson en 1982?",
            correctAnswer: "Thriller",
            options: ["Bad", "Dangerous", "Thriller", "Off the Wall"],
            hint: '',
            artist: 'Michael Jackson',
            isLyric: false,
            correct: 2
        },
    ];
}

// Elementos del DOM
const screens = {
    menu: document.getElementById('menuScreen'),
    loading: document.getElementById('loadingScreen'),
    game: document.getElementById('gameScreen'),
    results: document.getElementById('resultsScreen')
};

const elements = {
    playBtn: document.getElementById('playBtn'),
    playAgainBtn: document.getElementById('playAgainBtn'),
    questionCounter: document.getElementById('questionCounter'),
    scoreDisplay: document.getElementById('scoreDisplay'),
    hintLabel: document.getElementById('hintLabel'),
    hintText: document.getElementById('hintText'),
    artistText: document.getElementById('artistText'),
    optionsContainer: document.getElementById('optionsContainer'),
    nextBtn: document.getElementById('nextBtn'),
    finalScore: document.getElementById('finalScore'),
    resultMessage: document.getElementById('resultMessage')
};

// Elemento clickable para revelar la pista (icono/header)
elements.hintHeader = document.querySelector('.hint-header');

// Formateador de score (muestra .5 cuando aplica)
function formatScore(n) {
    return Number.isInteger(n) ? String(n) : n.toFixed(1);
}

// Listener para revelar la pista/artista solo al hacer click
if (elements.hintHeader) {
    elements.hintHeader.style.cursor = 'pointer';
    elements.hintHeader.addEventListener('click', () => {
        const question = gameState.questions[gameState.currentQuestion];
        if (!question) return;

        // Si ya se mostró la pista para esta pregunta, no hacer nada
        if (gameState.usedHint) return;

        // Revelar artista (si existe)
        if (question.artist) {
            elements.artistText.textContent = `Artista: ${question.artist}`;
            elements.artistText.style.opacity = '1';
            gameState.usedHint = true;
        }
    });
}

// Función para cambiar de pantalla
function showScreen(screenName) {
    Object.keys(screens).forEach(key => {
        screens[key].classList.remove('active');
    });
    
    setTimeout(() => {
        screens[screenName].classList.add('active');
    }, 50);
    
    gameState.currentScreen = screenName;
}

// Función para iniciar el juego
async function startGame() {
    showScreen('loading');
    
    try {
        gameState.questions = await generateQuestions();
    } catch (error) {
        console.error('Error generando preguntas:', error);
        gameState.questions = generateFallbackQuestions();
    }
    
    gameState.currentQuestion = 0;
    gameState.score = 0;
    gameState.selectedAnswer = null;
    gameState.showResult = false;
    gameState.usedHint = false;
    
    setTimeout(() => {
        showScreen('game');
        renderQuestion();
    }, 1000);
}

// Función para renderizar la pregunta actual
function renderQuestion() {
    const question = gameState.questions[gameState.currentQuestion];
    
    // Actualizar contador y score
    elements.questionCounter.textContent = `${gameState.currentQuestion + 1}/${gameState.questions.length}`;
    elements.scoreDisplay.textContent = gameState.score;
    
    // Actualizar pista (si no hay pista, mostrar el texto de la pregunta)
    elements.hintLabel.textContent = question.isLyric ? 'LETRA' : 'PISTA';
    elements.hintText.textContent = question.hint || question.question || '';
    // Ocultar artista hasta que el usuario haga click en la pista
    elements.artistText.textContent = '';
    elements.artistText.style.opacity = '0.6';
    gameState.usedHint = false;
    
    // Renderizar opciones
    elements.optionsContainer.innerHTML = '';
    question.options.forEach((option, index) => {
        const button = document.createElement('button');
        button.className = 'option-btn default';
        button.textContent = option;
        button.onclick = () => handleAnswer(index);
        elements.optionsContainer.appendChild(button);
    });
    
    // Ocultar botón siguiente
    elements.nextBtn.classList.add('hidden');
    gameState.showResult = false;
    gameState.selectedAnswer = null;
}

// Función para manejar la respuesta
function handleAnswer(index) {
    if (gameState.showResult) return;
    
    const question = gameState.questions[gameState.currentQuestion];
    gameState.selectedAnswer = index;
    gameState.showResult = true;
    
    // Actualizar puntuación si es correcto
    if (index === question.correct) {
        const points = gameState.usedHint ? 0.5 : 1;
        gameState.score = Math.round((gameState.score + points) * 100) / 100;
        elements.scoreDisplay.textContent = formatScore(gameState.score);
    }
    
    // Actualizar estilos de los botones
    const buttons = elements.optionsContainer.querySelectorAll('.option-btn');
    buttons.forEach((btn, idx) => {
        btn.disabled = true;
        btn.classList.remove('default');
        
        if (idx === question.correct) {
            btn.classList.add('correct');
        } else if (idx === index) {
            btn.classList.add('incorrect');
        } else {
            btn.classList.add('disabled');
        }
    });
    
    // Mostrar botón siguiente
    elements.nextBtn.classList.remove('hidden');
    
    // Actualizar texto del botón
    if (gameState.currentQuestion < gameState.questions.length - 1) {
        elements.nextBtn.textContent = 'Siguiente Pregunta';
    } else {
        elements.nextBtn.textContent = 'Ver Resultados';
    }
}

// Función para ir a la siguiente pregunta
function nextQuestion() {
    if (gameState.currentQuestion < gameState.questions.length - 1) {
        gameState.currentQuestion++;
        renderQuestion();
    } else {
        showResults();
    }
}

// Función para mostrar resultados
function showResults() {
    const totalQuestions = gameState.questions.length;
    const score = gameState.score;
    const percentage = score / totalQuestions;
    
    elements.finalScore.textContent = `${score}/${totalQuestions}`;
    
    // Mensaje según puntuación
    if (percentage === 1) {
        elements.resultMessage.textContent = '¡Perfecto! 🎉';
    } else if (percentage >= 0.7) {
        elements.resultMessage.textContent = '¡Excelente! 🌟';
    } else if (percentage >= 0.5) {
        elements.resultMessage.textContent = '¡Bien hecho! 👍';
    } else {
        elements.resultMessage.textContent = '¡Sigue practicando! 💪';
    }
    
    showScreen('results');
}

// Event Listeners
elements.playBtn.addEventListener('click', startGame);
elements.playAgainBtn.addEventListener('click', () => {
    showScreen('menu');
});
elements.nextBtn.addEventListener('click', nextQuestion);

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    showScreen('menu');
});

// Exportar para poder reutilizar la función en otros módulos
export { generateQuestions };