// API de letras (stands4 u otra API)
const API_BASE_URL = "https://www.stands4.com/services/v2/lyrics.php";
const UID = "13561";
const TOKEN_ID = "fIBAnaMl96jrfCEI";

// Canciones populares para la trivia
const POPULAR_SONGS = [
    { title: "Bohemian Rhapsody", artist: "Queen" },
    { title: "Imagine", artist: "John Lennon" },
    { title: "Hotel California", artist: "Eagles" },
    { title: "Stairway to Heaven", artist: "Led Zeppelin" },
    { title: "Sweet Child O Mine", artist: "Guns N Roses" },
    { title: "Smells Like Teen Spirit", artist: "Nirvana" },
    { title: "Billie Jean", artist: "Michael Jackson" },
    { title: "Hey Jude", artist: "The Beatles" },
    { title: "Yesterday", artist: "The Beatles" },
    { title: "Every Breath You Take", artist: "The Police" },
    { title: "Shape of You", artist: "Ed Sheeran" },
    { title: "Someone Like You", artist: "Adele" },
    { title: "Rolling in the Deep", artist: "Adele" },
    { title: "Uptown Funk", artist: "Mark Ronson" },
    { title: "Thriller", artist: "Michael Jackson" },
    { title: "We Will Rock You", artist: "Queen" },
    { title: "Don't Stop Believin", artist: "Journey" },
    { title: "Sweet Dreams", artist: "Eurythmics" },
    { title: "Girls Just Want to Have Fun", artist: "Cyndi Lauper" },
    { title: "Take On Me", artist: "A-ha" },
    { title: "Livin' on a Prayer", artist: "Bon Jovi" },
    { title: "Like a Prayer", artist: "Madonna" },
    { title: "Purple Rain", artist: "Prince" },
    { title: "Beat It", artist: "Michael Jackson" },
    { title: "With or Without You", artist: "U2" }
];

// Función para mezclar array
function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

// Función para buscar letras en la API (usa 'term' y parsea XML si es necesario)
async function searchLyrics(title, artist) {
    try {
        // Construir URL con credenciales y parámetros (usar 'term' como en tu ejemplo)
        const params = new URLSearchParams();
        params.set('uid', UID);
        params.set('tokenid', TOKEN_ID);
        // 'term' suele ser el título o fragmento a buscar
        params.set('term', title || '');
        if (artist) params.set('artist', artist);
        // pedir XML ya que el endpoint suele devolver XML estable
        params.set('format', 'xml');

        const url = `${API_BASE_URL}?${params.toString()}`;

        const response = await fetch(url, { method: 'GET' });

        if (!response.ok) {
            console.warn('searchLyrics: respuesta no OK', response.status, response.statusText);
            return null;
        }

        const text = await response.text();

        // Intentar parsear como JSON si llega así
        let parsed = null;
        try {
            parsed = JSON.parse(text);
        } catch (e) {
            parsed = null;
        }

        if (parsed) {
            // Similar al manejo previo
            const payload = parsed.result || parsed;
            const lyrics = payload.lyrics || payload.lyric || payload.text || payload.lyrics_body || '';
            const songTitle = payload.song || payload.title || title;
            const songArtist = payload.artist || artist || '';
            const album = payload.album || payload.release || '';

            return {
                title: songTitle,
                artist: songArtist,
                album: album,
                lyrics: lyrics
            };
        }

        // Si no es JSON, intentar parsear XML usando DOMParser (browser)
        if (typeof DOMParser !== 'undefined') {
            const parser = new DOMParser();
            const xml = parser.parseFromString(text, 'application/xml');

            // Buscar primer nodo <result> o usar root
            const resultNode = xml.querySelector('result') || xml.documentElement;

            // Helper para obtener texto de varios nombres posibles
            const getText = (candidates) => {
                for (const name of candidates) {
                    const el = resultNode.querySelector(name);
                    if (el && el.textContent && el.textContent.trim().length > 0) return el.textContent.trim();
                }
                return '';
            };

            const lyrics = getText(['lyrics', 'lyric', 'text', 'lyrics_body', 'lyric_text']);
            const songTitle = getText(['song', 'title', 'track']);
            const songArtist = getText(['artist', 'singer']);
            const album = getText(['album', 'release']);

            return {
                title: songTitle || title,
                artist: songArtist || artist || '',
                album: album || '',
                lyrics: lyrics || ''
            };
        }

        // Si no hay DOMParser (entorno no browser), intentar heurística básica
        return {
            title: title,
            artist: artist || '',
            album: '',
            lyrics: text || ''
        };
    } catch (error) {
        console.error('Error buscando letra:', error);
        return null;
    }
}

// Función para obtener un fragmento de la letra
function getLyricSnippet(lyrics) {
    if (!lyrics) return null;
    
    // Dividir las letras en líneas
    const lines = lyrics.split('\n').filter(line => line.trim().length > 0);
    
    // Buscar un fragmento significativo
    const meaningfulLines = lines.filter(line => 
        line.length > 20 && 
        !line.toLowerCase().includes('chorus') &&
        !line.toLowerCase().includes('verse') &&
        !line.toLowerCase().includes('[') &&
        !line.toLowerCase().includes(']')
    );
    
    if (meaningfulLines.length === 0) return null;
    
    // Seleccionar un fragmento aleatorio
    const randomIndex = Math.floor(Math.random() * meaningfulLines.length);
    const snippet = meaningfulLines[randomIndex];
    
    // Tomar las primeras palabras del fragmento
    const words = snippet.trim().split(' ');
    const fragmentLength = Math.min(words.length, 8);
    
    return words.slice(0, fragmentLength).join(' ') + '...';
}

// Función para generar preguntas
async function generateQuestions() {
    const selectedSongs = shuffleArray(POPULAR_SONGS).slice(0, 5);
    const questions = [];

    for (let i = 0; i < selectedSongs.length; i++) {
        const song = selectedSongs[i];
        
        try {
            // Buscar la letra de la canción
            const lyricData = await searchLyrics(song.title, song.artist);
            
            let hint = `Una canción icónica de ${song.artist}`;
            let isLyric = false;
            
            if (lyricData && lyricData.lyrics) {
                const snippet = getLyricSnippet(lyricData.lyrics);
                if (snippet) {
                    hint = `"${snippet}"`;
                    isLyric = true;
                }
            }
            
            // Generar respuestas incorrectas
            const wrongAnswers = shuffleArray(
                POPULAR_SONGS
                    .filter(s => s.title !== song.title)
                    .map(s => s.title)
            ).slice(0, 3);

            const allOptions = shuffleArray([song.title, ...wrongAnswers]);
            const correctIndex = allOptions.indexOf(song.title);

            questions.push({
                id: i + 1,
                hint: hint,
                options: allOptions,
                correct: correctIndex,
                artist: song.artist,
                correctAnswer: song.title,
                isLyric: isLyric
            });
            
            // Pequeña pausa para no saturar la API
            await new Promise(resolve => setTimeout(resolve, 500));
            
        } catch (error) {
            console.error('Error procesando canción:', error);
            
            // Usar pista genérica si falla
            const wrongAnswers = shuffleArray(
                POPULAR_SONGS
                    .filter(s => s.title !== song.title)
                    .map(s => s.title)
            ).slice(0, 3);

            const allOptions = shuffleArray([song.title, ...wrongAnswers]);
            const correctIndex = allOptions.indexOf(song.title);

            questions.push({
                id: i + 1,
                hint: `Una canción icónica de ${song.artist}`,
                options: allOptions,
                correct: correctIndex,
                artist: song.artist,
                correctAnswer: song.title,
                isLyric: false
            });
        }
    }

    return questions;
}

// Función fallback para generar preguntas sin API
function generateFallbackQuestions() {
    const selectedSongs = shuffleArray(POPULAR_SONGS).slice(0, 5);
    
    return selectedSongs.map((song, i) => {
        const wrongAnswers = shuffleArray(
            POPULAR_SONGS
                .filter(s => s.title !== song.title)
                .map(s => s.title)
        ).slice(0, 3);

        const allOptions = shuffleArray([song.title, ...wrongAnswers]);
        const correctIndex = allOptions.indexOf(song.title);

        return {
            id: i + 1,
            hint: `Una canción icónica de ${song.artist}`,
            options: allOptions,
            correct: correctIndex,
            artist: song.artist,
            correctAnswer: song.title,
            isLyric: false
        };
    });
}

// Wrapper exportable para obtener datos de letras (compatible con main.js)
export async function getLyricsData(title) {
    // Intentar encontrar el artista en la lista de canciones populares
    const match = POPULAR_SONGS.find(s => s.title.toLowerCase() === title.toLowerCase());
    const artist = match ? match.artist : '';

    try {
        const res = await searchLyrics(title, artist);
        if (!res) return [];

        // Normalizar a la forma que espera main.js
        return [{
            song: res.title || title,
            artist: res.artist || artist || '',
            album: res.album || '',
            lyrics: res.lyrics || ''
        }];
    } catch (err) {
        console.warn('getLyricsData: error buscando', title, err);
        return [];
    }
}