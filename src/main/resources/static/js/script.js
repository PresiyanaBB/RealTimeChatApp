'use strict';

const usernamePage = document.querySelector('#username-page');
const chatPage = document.querySelector('#chat-page');
const usernameForm = document.querySelector('#usernameForm');
const messageForm = document.querySelector('#messageForm');
const messageInput = document.querySelector('#message');
const messageArea = document.querySelector('#messageArea');
const connectingElement = document.querySelector('.connecting');

let stompClient = null;
let username = null;

const colors = [
    '#8dc0f6', '#71bc9c', '#92bdc3', '#fbb9b7',
    '#fbe9b2', '#fec1d6', '#fce3be', '#c4fbf6'
];

function connect(event) {
    username = document.querySelector('#name').value.trim();

    if (username) {
        usernamePage.classList.add('hidden');
        chatPage.classList.remove('hidden');

        const socket = new SockJS('/ws');

        stompClient = new StompJs.Client({
            webSocketFactory: () => socket,
            reconnectDelay: 5000,
            onConnect: onConnected,
            onStompError: onError
        });

        stompClient.activate();
    }

    event.preventDefault();
}

function onConnected() {
    stompClient.subscribe('/topic/public', onMessageReceived);

    stompClient.publish({
        destination: "/app/chat.addUser",
        body: JSON.stringify({ sender: username, type: 'JOIN' })
    });

    connectingElement.classList.add('hidden');
}

function onError(frame) {
    connectingElement.textContent = 'Could not connect to WebSocket server. Please refresh this page to try again!';
    connectingElement.style.color = 'red';
    console.error('STOMP error:', frame);
}

function sendMessage(event) {
    const messageContent = messageInput.value.trim();

    if (messageContent && stompClient && stompClient.connected) {
        const chatMessage = {
            sender: username,
            content: messageContent,
            type: 'CHAT'
        };

        stompClient.publish({
            destination: "/app/chat.sendMessage",
            body: JSON.stringify(chatMessage)
        });

        messageInput.value = '';
    }

    event.preventDefault();
}

function onMessageReceived(message) {
    const payload = JSON.parse(message.body);

    const messageElement = document.createElement('li');

    if (payload.type === 'JOIN') {
        messageElement.classList.add('event-message');
        payload.content = `${payload.sender} joined!`;
    } else if (payload.type === 'LEAVE') {
        messageElement.classList.add('event-message');
        payload.content = `${payload.sender} left!`;
    } else {
        messageElement.classList.add('websocket-message');

        // const avatarElement = document.createElement('i');
        // const avatarText = document.createTextNode(payload.sender[0]);
        // avatarElement.appendChild(avatarText);
        // avatarElement.style['background-color'] = getAvatarColor(payload.sender);
        // messageElement.appendChild(avatarElement);

        const usernameElement = document.createElement('span');
        const usernameText = document.createTextNode(payload.sender);
        usernameElement.style['background-color'] = getAvatarColor(payload.sender[0]);
        usernameElement.appendChild(usernameText);
        messageElement.appendChild(usernameElement);
    }

    const textElement = document.createElement('p');
    const messageText = document.createTextNode(payload.content);
    textElement.appendChild(messageText);

    messageElement.appendChild(textElement);
    messageArea.appendChild(messageElement);
    messageArea.scrollTop = messageArea.scrollHeight;
}

function getAvatarColor(sender) {
    let hash = 0;
    for (let i = 0; i < sender.length; i++) {
        hash = 31 * hash + sender.charCodeAt(i);
    }
    const index = Math.abs(hash % colors.length);
    return colors[index];
}

usernameForm.addEventListener('submit', connect, true);
messageForm.addEventListener('submit', sendMessage, true);
