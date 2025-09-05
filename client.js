const socket = io('http://localhost:8000');

const form = document.getElementById('send-container');
const messageInp = document.getElementById('messageInp');
const messageContainer = document.querySelector('.container');
const btnh = document.getElementById('btnh');
const typingDiv = document.getElementById("typing-indicator");
var audio = new Audio('ting.mp3');

const name = prompt("Enter your name to join");
socket.emit('new-user-joined', name);

// Append message
const append = (msgData, position) => {
  const messageElement = document.createElement("div");
  messageElement.classList.add("message", position);
  messageElement.dataset.id = msgData.id;

  // Message text
  const textSpan = document.createElement("span");
  textSpan.innerText = `${msgData.name ? msgData.name + ": " : ""}${msgData.message}`;

  // Timestamp
  const timeSpan = document.createElement("div");
  timeSpan.classList.add("time");
  timeSpan.innerText = msgData.time;

  // Emoji menu
  const reactionMenu = document.createElement("div");
  reactionMenu.classList.add("reaction-menu");
  ["👍", "❤️", "😂", "🔥", "😮"].forEach(emoji => {
    const e = document.createElement("span");
    e.innerText = emoji;
    e.addEventListener("click", () => {
      socket.emit("react", { msgId: msgData.id, emoji, user: name });
    });
    reactionMenu.appendChild(e);
  });

  messageElement.appendChild(textSpan);
  messageElement.appendChild(reactionMenu);
  messageElement.appendChild(timeSpan);
  messageContainer.append(messageElement);

  if (position === "l") audio.play();
  messageContainer.scrollTop = messageContainer.scrollHeight;
};

// Add reaction
function addReaction(msgId, emoji, user) {
  const msgElement = document.querySelector(`[data-id='${msgId}']`);
  if (msgElement) {
    let reaction = msgElement.querySelector(".reaction");
    if (!reaction) {
      reaction = document.createElement("span");
      reaction.classList.add("reaction");
      msgElement.appendChild(reaction);
    }
    reaction.innerText = `${emoji} (${user})`;
  }
}

// Send message
btnh.addEventListener('click', (e) => {
  e.preventDefault();
  const message = messageInp.value.trim();
  if (message !== "") {
    socket.emit('send', message); // only send to server (server will broadcast)
    messageInp.value = '';
  }
});

// Server events
socket.on('user-joined', name => {
  append({ id: Date.now() + Math.random(), message: `${name} joined the chat`, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }, 'r');
});

socket.on('receive', data => {
  const position = (data.name === name) ? 'r' : 'l';
  append(data, position);
});

socket.on('leave', name => {
  append({ id: Date.now() + Math.random(), message: `${name} left the chat`, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }, 'l');
});

// Typing
let typingTimeout;
messageInp.addEventListener("input", () => {
  socket.emit("typing", name);
  clearTimeout(typingTimeout);
  typingTimeout = setTimeout(() => {
    socket.emit("stopTyping");
  }, 2000);
});

socket.on("userTyping", (username) => {
  typingDiv.classList.remove("hidden");
  if (username === name) {
    typingDiv.innerHTML = `You are typing <span></span><span></span><span></span>`;
  } else {
    typingDiv.innerHTML = `${username} is typing <span></span><span></span><span></span>`;
  }
});

socket.on("userStopTyping", () => {
  typingDiv.classList.add("hidden");
});

// Reactions
socket.on("messageReaction", (data) => {
  addReaction(data.msgId, data.emoji, data.user);
});
