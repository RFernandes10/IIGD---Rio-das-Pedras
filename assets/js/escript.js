let bible = {};
let currentBook = "";
let currentChapter = 0;
let currentVerse = 0;
let autoAdvanceInterval;

const searchForm = document.getElementById("search-form");
const resultDiv = document.getElementById("result");
const tvResultDiv = document.getElementById("tv-result");
const prevVerseButton = document.getElementById("prev-verse");
const nextVerseButton = document.getElementById("next-verse");
const tvPrevVerseButton = document.getElementById("tv-prev-verse");
const tvNextVerseButton = document.getElementById("tv-next-verse");
const tvBackButton = document.getElementById("tv-back");
const randomVerseButton = document.getElementById("random-verse");
const darkModeToggle = document.getElementById("toggle-dark-mode");
const addToFavoritesButton = document.getElementById("add-to-favorites");
const clearFavoritesButton = document.getElementById("clear-favorites");
const shareFavoritesButton = document.getElementById("share-favorites");
const favoritesList = document.getElementById("favorites-list");
const tvToggle = document.getElementById("tv-toggle");

async function loadBible() {
  try {
    const response = await fetch("assets/data/ARC.json"); // Ajuste o caminho conforme necessário
    const data = await response.json();
    parseJSON(data);
  } catch (error) {
    console.error("Erro ao carregar o arquivo JSON:", error);
  }
}

function parseJSON(jsonData) {
  jsonData.forEach(book => {
    const bookName = book.abbrev;
    bible[bookName] = {};

    book.chapters.forEach((chapter, chapterIndex) => {
      const chapterNumber = chapterIndex + 1;
      bible[bookName][chapterNumber] = {};

      chapter.forEach((verse, verseIndex) => {
        const verseNumber = verseIndex + 1;
        bible[bookName][chapterNumber][verseNumber] = verse;
      });
    });
  });

  populateBooks();
  console.log("Bible data loaded:", bible); // Log dos dados da Bíblia para verificação
  document.querySelector('button[type="submit"]').disabled = false; // Habilitar o botão de envio
  loadFavorites(); // Carregar favoritos do localStorage
}

function populateBooks() {
  const bookSelect = document.getElementById("book");
  for (const book in bible) {
    const option = document.createElement("option");
    option.value = book;
    option.textContent = book;
    bookSelect.appendChild(option);
  }
}

function updateResult(book, chapter, verse) {
  if (bible[book] && bible[book][chapter] && bible[book][chapter][verse]) {
    const text = bible[book][chapter][verse];
    resultDiv.textContent = `${book} ${chapter}:${verse} - ${text}`;
    tvResultDiv.textContent = `${book} ${chapter}:${verse} - ${text}`;
    currentBook = book;
    currentChapter = chapter;
    currentVerse = verse;
    updateNavigationButtons();
  } else {
    resultDiv.textContent = "Versículo não encontrado. Verifique sua entrada.";
    tvResultDiv.textContent = "Versículo não encontrado. Verifique sua entrada.";
  }
}

function updateNavigationButtons() {
  const isFirstVerse = currentChapter === 1 && currentVerse === 1;
  const isLastVerse = !(bible[currentBook] && bible[currentBook][currentChapter] && bible[currentBook][currentChapter][currentVerse + 1]);

  prevVerseButton.disabled = isFirstVerse;
  nextVerseButton.disabled = isLastVerse;
  tvPrevVerseButton.disabled = isFirstVerse;
  tvNextVerseButton.disabled = isLastVerse;
}

searchForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const book = document.getElementById("book").value;
  const chapter = parseInt(document.getElementById("chapter").value);
  const verse = parseInt(document.getElementById("verse").value);

  updateResult(book, chapter, verse);
});

prevVerseButton.addEventListener("click", () => {
  navigateVerse(-1);
});

nextVerseButton.addEventListener("click", () => {
  navigateVerse(1);
});

tvPrevVerseButton.addEventListener("click", () => {
  navigateVerse(-1);
});

tvNextVerseButton.addEventListener("click", () => {
  navigateVerse(1);
});

tvBackButton.addEventListener("click", () => {
  document.body.classList.remove("tv-mode-active");
});

randomVerseButton.addEventListener("click", () => {
  const books = Object.keys(bible);
  const randomBook = books[Math.floor(Math.random() * books.length)];
  const chapters = Object.keys(bible[randomBook]);
  const randomChapter = parseInt(chapters[Math.floor(Math.random() * chapters.length)]);
  const verses = Object.keys(bible[randomBook][randomChapter]);
  const randomVerse = parseInt(verses[Math.floor(Math.random() * verses.length)]);

  updateResult(randomBook, randomChapter, randomVerse);
});

darkModeToggle.addEventListener("click", () => {
  document.body.classList.toggle("dark-theme");
});

addToFavoritesButton.addEventListener("click", () => {
  const text = resultDiv.textContent;
  if (text) {
    addFavorite(text);
    saveFavorites();
    loadFavorites();
  }
});

clearFavoritesButton.addEventListener("click", () => {
  localStorage.removeItem("favorites");
  favoritesList.innerHTML = "";
});

shareFavoritesButton.addEventListener("click", () => {
  const favorites = Array.from(favoritesList.children).map((li) => li.textContent).join("\n\n");

  const url = `https://api.whatsapp.com/send?text=Palavra de hoje (IIGR - Rio das Pedras):%0A%0A${encodeURIComponent(favorites)}`;
  window.open(url, "_blank");
});

function addFavorite(text) {
  const favoriteItem = document.createElement("li");
  favoriteItem.textContent = text;
  favoritesList.appendChild(favoriteItem);
}

function saveFavorites() {
  const favorites = Array.from(favoritesList.children).map((li) => li.textContent);
  localStorage.setItem("favorites", JSON.stringify(favorites));
}

function loadFavorites() {
  const favorites = JSON.parse(localStorage.getItem("favorites")) || [];
  favoritesList.innerHTML = favorites.map((fav) => `<li>${fav}</li>`).join("");
}

function navigateVerse(direction) {
  if (direction === -1 && currentVerse > 1) {
    updateResult(currentBook, currentChapter, currentVerse - 1);
  } else if (direction === -1 && currentChapter > 1) {
    const previousChapter = currentChapter - 1;
    const previousChapterVerseCount = Object.keys(bible[currentBook][previousChapter]).length;
    updateResult(currentBook, previousChapter, previousChapterVerseCount);
  } else if (direction === 1 && bible[currentBook][currentChapter][currentVerse + 1]) {
    updateResult(currentBook, currentChapter, currentVerse + 1);
  } else if (direction === 1 && bible[currentBook][currentChapter + 1]) {
    updateResult(currentBook, currentChapter + 1, 1);
  }
}

let tvModeActive = false;

tvToggle.addEventListener("click", () => {
  tvModeActive = !tvModeActive;
  if (tvModeActive) {
    document.body.classList.add("tv-mode-active");
    startAutoAdvance();
  } else {
    document.body.classList.remove("tv-mode-active");
    stopAutoAdvance();
  }
});

//A ação que é repetida a cada 10 segundos (ação a cada 90.000 milissegundos)
function startAutoAdvance() {
  autoAdvanceInterval = setInterval(() => {
    navigateVerse(1);
  }, 90000);
}

function stopAutoAdvance() {
  clearInterval(autoAdvanceInterval);
}

loadBible(); // Carregar a Bíblia quando a página é carregada
