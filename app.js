let db;
let persona = { name: "Anonymous", thoughts: [] };
const colors = ['#ffcccb', '#90EE90', '#ADD8E6', '#FFFFE0', '#E6E6FA'];

const dbName = "ThoughtMapperDB";
const request = indexedDB.open(dbName, 1);

request.onerror = function(event) {
    console.error("IndexedDB error:", event.target.error);
};

request.onsuccess = function(event) {
    db = event.target.result;
    loadPersonaFromDB();
};

request.onupgradeneeded = function(event) {
    db = event.target.result;
    const objectStore = db.createObjectStore("persona", { keyPath: "id" });
    objectStore.createIndex("name", "name", { unique: false });
    objectStore.createIndex("thoughts", "thoughts", { unique: false });
};

function loadPersonaFromDB() {
    const transaction = db.transaction(["persona"], "readonly");
    const objectStore = transaction.objectStore("persona");
    const request = objectStore.get(1);

    request.onerror = function(event) {
        console.error("Error loading persona:", event.target.error);
    };

    request.onsuccess = function(event) {
        if (request.result) {
            persona = request.result;
            document.getElementById('persona-name').value = persona.name;
        } else {
            savePersonaToDB();
        }
        renderThoughts();
    };
}

function savePersonaToDB() {
    const transaction = db.transaction(["persona"], "readwrite");
    const objectStore = transaction.objectStore("persona");
    const request = objectStore.put({ id: 1, ...persona });

    request.onerror = function(event) {
        console.error("Error saving persona:", event.target.error);
    };

    request.onsuccess = function(event) {
        console.log("Persona saved successfully");
    };
}

function updatePersonaName() {
    persona.name = document.getElementById('persona-name').value;
    savePersonaToDB();
}

function addThought() {
    const thoughtText = document.getElementById('new-thought').value.trim();
    if (thoughtText) {
        const thought = {
            id: Date.now(),
            text: thoughtText,
            color: colors[Math.floor(Math.random() * colors.length)]
        };
        persona.thoughts.push(thought);
        document.getElementById('new-thought').value = '';
        savePersonaToDB();
        renderThoughts();
    }
}

function updateThought(id, newText) {
    const thought = persona.thoughts.find(t => t.id === id);
    if (thought) {
        thought.text = newText.trim();
        savePersonaToDB();
    }
}

function deleteThought(id) {
    persona.thoughts = persona.thoughts.filter(t => t.id !== id);
    savePersonaToDB();
    renderThoughts();
}

function changeColor(id) {
    const thought = persona.thoughts.find(t => t.id === id);
    if (thought) {
        const currentIndex = colors.indexOf(thought.color);
        thought.color = colors[(currentIndex + 1) % colors.length];
        savePersonaToDB();
        renderThoughts();
    }
}

function renderThoughts() {
    const container = document.getElementById('thoughts-container');
    container.innerHTML = '';
    
    persona.thoughts.forEach(thought => {
        const thoughtElement = document.createElement('div');
        thoughtElement.className = 'thought';
        thoughtElement.style.backgroundColor = thought.color;
        thoughtElement.innerHTML = `
            <textarea oninput="updateThought(${thought.id}, this.value)">${thought.text}</textarea>
            <div class="thought-actions">
                <button onclick="changeColor(${thought.id})">Change Color</button>
                <button onclick="deleteThought(${thought.id})">Delete</button>
            </div>
        `;
        container.appendChild(thoughtElement);
    });

    new Masonry(container, {
        itemSelector: '.thought',
        columnWidth: '.thought',
        percentPosition: true
    });
}

document.getElementById('persona-name').onblur = updatePersonaName;
document.getElementById('add-thought').onclick = addThought;

// Initial render
loadPersonaFromDB();
