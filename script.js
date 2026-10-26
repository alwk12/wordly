const API_URL = "https://api.dictionaryapi.dev/api/v2/entries/en/";

const form = document.getElementById("search-form");
const input = document.getElementById("word-input");
const message = document.getElementById("message");
const result = document.getElementById("result");
const favoritesList = document.getElementById("favorites-list");
const themeButton = document.getElementById("theme-button");

let favorites = JSON.parse(localStorage.getItem("favorites")) || [];

function makeElement(tag, text, className) {
  const element = document.createElement(tag);
  element.textContent = text;
  if (className) {
    element.className = className;
  }
  return element;
}

async function searchWord(word) {
  message.textContent = "Searching...";
  result.innerHTML = "";

  try {
    const response = await fetch(API_URL + word);

    if (response.status === 404) {
      message.textContent = 'Sorry, we could not find "' + word + '".';
      return;
    }
    if (!response.ok) {
      message.textContent = "Something went wrong. Please try again.";
      return;
    }

    const data = await response.json();
    message.textContent = "";
    showWord(data[0]);
  } catch (error) {
    message.textContent =
      "Could not reach the dictionary. Check your internet.";
  }
}

function getSynonyms(entry) {
  const synonyms = [];

  for (const meaning of entry.meanings) {
    for (const word of meaning.synonyms) {
      if (!synonyms.includes(word)) {
        synonyms.push(word);
      }
    }
    for (const definition of meaning.definitions) {
      for (const word of definition.synonyms) {
        if (!synonyms.includes(word)) {
          synonyms.push(word);
        }
      }
    }
  }

  return synonyms;
}

function getAudio(entry) {
  for (const phonetic of entry.phonetics) {
    if (phonetic.audio) {
      return phonetic.audio;
    }
  }
  return "";
}

function showWord(entry) {
  const card = document.createElement("article");
  card.className = "word-card";

  if (favorites.includes(entry.word)) {
    card.classList.add("saved");
  }

  card.appendChild(makeElement("h2", entry.word));
  card.appendChild(
    makeElement("p", entry.phonetic || "No pronunciation text available"),
  );

  entry.meanings.forEach(function (meaning) {
    card.appendChild(makeElement("p", meaning.partOfSpeech, "part-of-speech"));

    const list = document.createElement("ol");
    meaning.definitions.forEach(function (item) {
      const listItem = makeElement("li", item.definition);
      if (item.example) {
        listItem.appendChild(
          makeElement("p", "Example: " + item.example, "example"),
        );
      }
      list.appendChild(listItem);
    });
    card.appendChild(list);
  });

  const synonyms = getSynonyms(entry);
  if (synonyms.length > 0) {
    card.appendChild(makeElement("p", "Synonyms: " + synonyms.join(", ")));
  } else {
    card.appendChild(makeElement("p", "No synonyms found for this word."));
  }

  const buttons = document.createElement("div");
  buttons.className = "card-buttons";

  const audioLink = getAudio(entry);
  if (audioLink) {
    const playButton = makeElement("button", "Play pronunciation");
    playButton.addEventListener("click", function () {
      new Audio(audioLink).play();
    });
    buttons.appendChild(playButton);
  } else {
    card.appendChild(makeElement("p", "No audio available for this word."));
  }

  const saveButton = makeElement(
    "button",
    favorites.includes(entry.word) ? "Remove from saved" : "Save word",
  );
  saveButton.addEventListener("click", function () {
    toggleFavorite(entry.word, card, saveButton);
  });
  buttons.appendChild(saveButton);

  card.appendChild(buttons);
  result.appendChild(card);
}

function toggleFavorite(word, card, button) {
  if (favorites.includes(word)) {
    favorites = favorites.filter(function (item) {
      return item !== word;
    });
    card.classList.remove("saved");
    button.textContent = "Save word";
  } else {
    favorites.push(word);
    card.classList.add("saved");
    button.textContent = "Remove from saved";
  }

  localStorage.setItem("favorites", JSON.stringify(favorites));
  showFavorites();
}

function showFavorites() {
  favoritesList.innerHTML = "";

  if (favorites.length === 0) {
    favoritesList.appendChild(makeElement("li", "No saved words yet."));
    return;
  }

  favorites.forEach(function (word) {
    const item = document.createElement("li");
    const button = makeElement("button", word);
    button.addEventListener("click", function () {
      input.value = word;
      searchWord(word);
    });
    item.appendChild(button);
    favoritesList.appendChild(item);
  });
}

function toggleTheme() {
  document.body.classList.toggle("dark");
  const isDark = document.body.classList.contains("dark");
  themeButton.textContent = isDark ? "Light theme" : "Dark theme";
  localStorage.setItem("theme", isDark ? "dark" : "light");
}

form.addEventListener("submit", function (event) {
  event.preventDefault(); // stops the page from reloading
  const word = input.value.trim().toLowerCase();

  if (word === "") {
    message.textContent = "Please type a word first.";
    return;
  }
  if (word.includes(" ")) {
    message.textContent = "Please search one word at a time.";
    return;
  }

  searchWord(word);
});

themeButton.addEventListener("click", toggleTheme);

if (localStorage.getItem("theme") === "dark") {
  document.body.classList.add("dark");
  themeButton.textContent = "Light theme";
}
showFavorites();
