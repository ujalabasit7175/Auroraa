const input = document.querySelector(".mood-input");
const button = document.querySelector(".play-btn");
const bg = document.querySelector(".background");
const card = document.querySelector(".pixel-card");

/* ================= MOOD DATA ================= */
const moodData = {
  initial: { bg: "bg-happy", emojis: ["🎧", "😋", "🌸", "😁"] },
  sad: { bg: "bg-sad", emojis: ["😔", "☔", "☹️", "💙"] },
  love: { bg: "bg-love", emojis: ["💖", "🌻", "🌸", "💗"] },
  happy: { bg: "bg-happy", emojis: ["✨", "😊", "🌷", "💞"] },
  dance: { bg: "bg-dance", emojis: ["💃", "🎶", "🕺🏻", "✨"] },
  fun: { bg: "bg-fun", emojis: ["🌈", "🧁", "🌼", "😄"] }
};

/* Dot positions for floating emojis */
const dotPositions = [
  { x: 6, y: 8 }, { x: 18, y: 22 }, { x: 8, y: 45 }, { x: 14, y: 72 },
  { x: 86, y: 10 }, { x: 92, y: 28 }, { x: 88, y: 55 }, { x: 82, y: 78 },
  { x: 35, y: 6 }, { x: 65, y: 6 }, { x: 38, y: 92 }, { x: 62, y: 92 }
];

/* ================= INITIAL LOAD ================= */
applyMood("initial", true);

/* ================= BUTTON CLICK ================= */
button.addEventListener("click", async () => {
    const text = input.value;
    if (!text) return;

    try {
        // 1. Tell Python to detect the mood and start the music
        const res = await fetch("/detect-mood", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text })
        });
        const data = await res.json();

        // 2. Update the UI colors and emojis
        if (data.status === "success") {
            applyMood(data.mood, false);
            console.log(`Vibing to: ${data.mood} ✨`);
        } else {
            // If Spotify isn't open, this alert will pop up
            alert(data.message);
        }

    } catch (err) {
        console.error("Error connecting to Auroraa backend:", err);
    }
});

/* ================= CORE FUNCTIONS ================= */
function applyMood(mood, isInitial) {
    // Reset background class
    bg.className = "background";
    bg.classList.add(moodData[mood].bg);

    // Clear old emojis
    document.querySelectorAll(".floating-emoji").forEach(e => e.remove());
    createDotBasedEmojis(moodData[mood].emojis, isInitial);

    // Update center emoji display
    let emojiDiv = document.querySelector(".mood-emoji");
    if (!emojiDiv) {
        emojiDiv = document.createElement("div");
        emojiDiv.className = "mood-emoji";
        card.appendChild(emojiDiv);
    }
    emojiDiv.textContent = moodData[mood].emojis.join(" ");
}

function createDotBasedEmojis(emojis, isInitial) {
    dotPositions.forEach((pos, index) => spawnDotEmoji(emojis[index % emojis.length], pos, isInitial));
}

function spawnDotEmoji(emoji, pos, isInitial) {
    const span = document.createElement("span");
    span.className = "floating-emoji";
    if (isInitial) span.classList.add("initial-emoji");
    span.textContent = emoji;
    span.style.left = pos.x + "%";
    span.style.top = pos.y + "%";
    span.style.animationDuration = (3 + Math.random()) + "s";
    span.style.animationDelay = Math.random() + "s";
    bg.appendChild(span);
}