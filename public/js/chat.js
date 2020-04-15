const socket = io();

// Elements
const $messageForm = document.querySelector('#messageForm');
const $messageFormInput = $messageForm.querySelector('input');
const $messageFormButton = $messageForm.querySelector('button');
const $locationButton = document.querySelector('#location');
const $messages = document.querySelector('#messages');
const $sidebar = document.querySelector('#sidebar');

// Templates
const messageTemplate = document.querySelector('#message-template').innerHTML;
const locationMessageTemplate = document.querySelector('#location-message-template').innerHTML;
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML;

// Options
const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true })

// Auto Scrolling
const autoscroll = () => {
    // New message element
    const $newMessage = $messages.lastElementChild;

    // Height of new message
    const newMessageStyles = getComputedStyle($newMessage);
    const newMessageMargin = parseInt(newMessageStyles.marginBottom);
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin;

    // Visible Height
    const visibleHeight = $messages.offsetHeight;

    // Height of messages container
    const containerHeight = $messages.scrollHeight;

    // How for have user scrolled
    const scrollOffset = $messages.scrollTop + visibleHeight;

    if(containerHeight - newMessageHeight <= scrollOffset) {
        $messages.scrollTop = $messages.scrollHeight;
    }
    
}


// Listens to text messages
socket.on('message', (message) => {
    console.log(message);
    const html = Mustache.render(messageTemplate, {
        username: message.username,
        message: message.text,
        createdAt: moment(message.createdAt).format('h:mm a')
    });
    $messages.insertAdjacentHTML('beforeend', html);
    autoscroll();
});

//Listens to location messages
socket.on('locationMessage', (message) => {
    console.log(message);
    const html = Mustache.render(locationMessageTemplate, {
        username: message.username,
        url: message.url,
        createdAt: moment(message.createdAt).format('h:mm a')
    });
    $messages.insertAdjacentHTML('beforeend', html);
    autoscroll();
});

socket.on('roomData', ({room, users}) => {
    const html = Mustache.render(sidebarTemplate, {
        room: room,
        users: users
    });

    $sidebar.innerHTML = html;
})


$messageForm.addEventListener('submit', (event) => {
    event.preventDefault();

    // Disabling Send button
    $messageFormButton.disabled = true;
    const message = $messageFormInput.value;

    socket.emit('sendMessage', message, (error) => {
        // Enabling Send Button
        $messageFormButton.disabled = false;

        $messageFormInput.value = '';
        $messageFormInput.focus();

        if(error) {
            return console.log(error);
        }
        console.log("message delivered");
    });

});

$locationButton.addEventListener('click', () => {
    if(!navigator.geolocation) {
        return alert("Geolocation is not supported by your browser");
    }
    // Disabling Location Button
    $locationButton.disabled = true;

    navigator.geolocation.getCurrentPosition((position) => {
        socket.emit('sendLocation', {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
        }, () => {
            // Enabling Location Button
            $locationButton.disabled = false;

            console.log('Location Shared!')
        });
    })
});

socket.emit('join', {username, room}, (error) => {
    if(error) {
        alert(error);
        location.href = "/";
    }
});