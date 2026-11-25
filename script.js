
// ========================================
// 1. HABIT DATA & CONFIGURATION
// ========================================

const STORAGE_KEY = "habitly_habits";

const defaultHabits = [
    { id: 1, name: "Read a Book", emoji: "📚", completedDates: [] },
    { id: 2, name: "Drink Water", emoji: "💧", completedDates: [] },
    { id: 3, name: "Morning Exercise", emoji: "🏃", completedDates: [] },
    { id: 4, name: "Meditation", emoji: "🧘", completedDates: [] },
    { id: 5, name: "Daily Journaling", emoji: "✍️", completedDates: [] }
];

let habits = loadHabits();
let selectedEmoji = "📚";


// ========================================
// 2. DATE & STORAGE FUNCTIONS
// ========================================

function getTodayDate() {
    const now = new Date();

    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

function updateDate() {
    const dateElement = document.getElementById("currentDate");

    if (dateElement) {
        dateElement.textContent = new Date().toLocaleDateString(
            "en-US",
            {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric"
            }
        );
    }
}

function loadHabits() {
    try {
        const savedHabits = localStorage.getItem(STORAGE_KEY);

        if (savedHabits !== null) {
            const parsedHabits = JSON.parse(savedHabits);

            if (
                Array.isArray(parsedHabits) &&
                parsedHabits.every(habit =>
                    habit &&
                    Number.isSafeInteger(habit.id) &&
                    typeof habit.name === "string" &&
                    typeof habit.emoji === "string" &&
                    Array.isArray(habit.completedDates) &&
                    habit.completedDates.every(date => typeof date === "string")
                )
            ) {
                return parsedHabits;
            }

            console.warn("Invalid saved data. Loading default habits.");
        }
    } catch (error) {
        console.error("Error loading habits:", error);
    }

    return defaultHabits.map(habit => ({
        ...habit,
        completedDates: [...habit.completedDates]
    }));
}

function saveHabits() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(habits));
    } catch (error) {
        console.error("Error saving habits:", error);
        showMessage("Unable to save habits in this browser.", "error");
    }
}


// ========================================
// 3. ESCAPE USER-PROVIDED TEXT
// ========================================

function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, character => {
        const entities = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        };

        return entities[character];
    });
}


// ========================================
// 4. CREATE ONE HABIT CARD
// ========================================

function createHabitCard(habit) {
    const completedToday = habit.completedDates.includes(getTodayDate());

    return `
        <article class="habit-card ${completedToday ? "completed" : ""}">

            <div class="habit-card-top">

                <div class="habit-emoji">
                    ${escapeHTML(habit.emoji)}
                </div>

                <button
                    type="button"
                    class="delete-btn"
                    data-action="delete"
                    data-id="${habit.id}"
                    aria-label="Delete ${escapeHTML(habit.name)}"
                    title="Delete habit">
                    🗑️
                </button>

            </div>

            <h3>${escapeHTML(habit.name)}</h3>

            <p>Build consistency and make progress every day.</p>

            <button
                type="button"
                class="complete-btn ${completedToday ? "done" : ""}"
                data-action="complete"
                data-id="${habit.id}">

                ${completedToday ? "✓ Completed" : "✓ Complete"}

            </button>

        </article>
    `;
}


// ========================================
// 5. UPDATE DAILY SUMMARY
// ========================================

function updateSummary() {
    const doneToday = habits.filter(habit =>
        habit.completedDates.includes(getTodayDate())
    ).length;

    const summaryElement = document.getElementById("doneTodayStat");

    if (summaryElement) {
        summaryElement.textContent = `${doneToday}/${habits.length}`;
    }
}


// ========================================
// 6. RENDER ALL HABIT CARDS
// ========================================

function renderHabits() {
    const habitsGrid = document.getElementById("habitsGrid");
    const habitCount = document.querySelector(".habit-count");

    if (!habitsGrid || !habitCount) return;

    habitCount.textContent = `${habits.length} Habits`;

    if (habits.length === 0) {
        habitsGrid.innerHTML = `
            <div class="empty-state">
                <div style="font-size: 40px;">🌱</div>
                <h3>No habits yet!</h3>
                <p>Add your first habit and start building a better routine.</p>
            </div>
        `;
    } else {
        habitsGrid.innerHTML = habits.map(createHabitCard).join("");
    }

    updateSummary();
}


// ========================================
// 7. SHOW FORM MESSAGES
// ========================================

function showMessage(message, type = "success") {
    const formMessage = document.getElementById("formMessage");

    if (!formMessage) return;

    formMessage.textContent = message;
    formMessage.className = `form-message ${type}`;
}


// ========================================
// 8. ADD NEW HABIT
// ========================================

function addHabit(name) {
    const cleanName = name.trim();

    if (!cleanName) {
        showMessage("Please enter a habit name.", "error");
        return;
    }

    const duplicate = habits.some(habit =>
        habit.name.toLowerCase() === cleanName.toLowerCase()
    );

    if (duplicate) {
        showMessage("This habit already exists. Try another name.", "error");
        return;
    }

    const newHabit = {
        id: Date.now(),
        name: cleanName,
        emoji: selectedEmoji,
        completedDates: []
    };

    habits.push(newHabit);

    saveHabits();
    renderHabits();

    document.getElementById("habitInput").value = "";

    showMessage("Your new habit has been added! 🎉", "success");
}


// ========================================
// 9. COMPLETE / UNCOMPLETE HABIT
// ========================================

function toggleComplete(id) {
    const habit = habits.find(item => item.id === id);

    if (!habit) return;

    const today = getTodayDate();

    if (habit.completedDates.includes(today)) {
        habit.completedDates = habit.completedDates.filter(
            date => date !== today
        );
    } else {
        habit.completedDates.push(today);
    }

    saveHabits();
    renderHabits();
}


// ========================================
// 10. DELETE HABIT
// ========================================

function deleteHabit(id) {
    const habit = habits.find(item => item.id === id);

    if (!habit) return;

    const confirmed = confirm(
        `Are you sure you want to delete "${habit.name}"?`
    );

    if (!confirmed) return;

    habits = habits.filter(item => item.id !== id);

    saveHabits();
    renderHabits();

    showMessage("Habit deleted successfully.", "success");
}


// ========================================
// 11. EMOJI PICKER
// ========================================

function setupEmojiPicker() {
    const emojiButtons = document.querySelectorAll(".emoji-option");

    emojiButtons.forEach(button => {
        button.addEventListener("click", () => {
            selectedEmoji = button.dataset.emoji;

            emojiButtons.forEach(item => {
                item.classList.remove("selected");
                item.setAttribute("aria-pressed", "false");
            });

            button.classList.add("selected");
            button.setAttribute("aria-pressed", "true");
        });
    });
}


// ========================================
// 12. HABIT FORM EVENTS
// ========================================

function setupHabitForm() {
    const habitForm = document.getElementById("habitForm");

    if (!habitForm) return;

    habitForm.addEventListener("submit", event => {
        event.preventDefault();

        const habitInput = document.getElementById("habitInput");

        addHabit(habitInput.value);
    });
}


// ========================================
// 13. HABIT CARD EVENTS
// ========================================

function setupHabitEvents() {
    const habitsGrid = document.getElementById("habitsGrid");

    if (!habitsGrid) return;

    habitsGrid.addEventListener("click", event => {
        const button = event.target.closest("button[data-action]");

        if (!button) return;

        const id = Number(button.dataset.id);

        if (!Number.isSafeInteger(id)) return;

        if (button.dataset.action === "complete") {
            toggleComplete(id);
        }

        if (button.dataset.action === "delete") {
            deleteHabit(id);
        }
    });
}


// ========================================
// 14. DAILY QUOTE
// ========================================

const fallbackQuotes = [
    {
        quote: "Great things are done by a series of small things brought together.",
        author: "Vincent van Gogh"
    },
    {
        quote: "It always seems impossible until it's done.",
        author: "Nelson Mandela"
    },
    {
        quote: "Success is the sum of small efforts repeated day in and day out.",
        author: "Robert Collier"
    }
];

async function loadDailyQuote() {
    const quoteText = document.getElementById("quoteText");
    const quoteAuthor = document.getElementById("quoteAuthor");

    if (!quoteText || !quoteAuthor) return;

    quoteText.textContent = "Loading...";
    quoteAuthor.textContent = "";

    try {
        const response = await fetch("https://dummyjson.com/quotes/random");

        if (!response.ok) {
            throw new Error("Quote request failed");
        }

        const data = await response.json();

        if (
            typeof data.quote !== "string" ||
            typeof data.author !== "string"
        ) {
            throw new Error("Invalid quote response");
        }

        quoteText.textContent = `"${data.quote}"`;
        quoteAuthor.textContent = `— ${data.author}`;

    } catch (error) {
        console.error("Could not fetch quote:", error);

        const randomIndex = Math.floor(
            Math.random() * fallbackQuotes.length
        );

        const quote = fallbackQuotes[randomIndex];

        quoteText.textContent = `"${quote.quote}"`;
        quoteAuthor.textContent = `— ${quote.author}`;
    }
}


// ========================================
// 15. INITIALIZE APPLICATION
// ========================================

function initHabitly() {
    updateDate();

    setupHabitForm();
    setupEmojiPicker();
    setupHabitEvents();

    renderHabits();

    loadDailyQuote();
}

document.addEventListener("DOMContentLoaded", initHabitly);
