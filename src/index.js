const express = require('express');
const path = require('path');
const http = require('http');
const socketio = require('socket.io');
const Filter = require('bad-words');
const { generateMessage, generateLocationMessage } = require('./utils/messages');
const { addUser, removeUser, getUser, getUsersInRoom } = require('./utils/users');


const app = express();
const server = http.createServer(app);
const io = socketio(server);

const port = process.env.PORT || 3000;
const publicDirectoryPath = path.join(__dirname, "../public");

app.use(express.static(publicDirectoryPath));


io.on('connection', (socket) => {
    console.log('New Web Socket Connection');

    // Joining User details
    socket.on('join', (options, callback) => {
        const { error, user } = addUser({id: socket.id, ...options});

        if(error) {
            return callback(error);
        }
        socket.join(user.room);

        // Welcome Message
    socket.emit("message", generateMessage('Admin', "Welcome!"));

    // Broadcasting when a new user has joined
    socket.broadcast.to(user.room).emit('message', generateMessage('Admin', `${user.username} has joined!`));

        callback();

        io.to(user.room).emit('roomData', {
            room: user.room,
            users: getUsersInRoom(user.room)
        })
        // socket.emit, io.emit, socket.broadcast.emit
        // io.to.emit, socket.broadcast.to.emit
    });

    // Receiving Messages
    socket.on('sendMessage', (message, callback) => {
        const user = getUser(socket.id);
        const filter = new Filter();

        if(filter.isProfane(message)) {
            return callback('Profanity is not allowed');
        }

        io.to(user.room).emit('message', generateMessage(user.username, message));
        callback();
    })
    
    // Sharing Location
    socket.on('sendLocation', (coords, callback) => {
        const user = getUser(socket.id);
        io.to(user.room).emit('locationMessage', generateLocationMessage(user.username, `https://google.com/maps?q=${coords.latitude},${coords.longitude}`));
        callback();
    })

    // When a user disconnects
    socket.on('disconnect', () => {
        const user = removeUser(socket.id);

        if(user) {
            io.to(user.room).emit('message', generateMessage('Admin', `${user.username} has left!`));
            io.to(user.room).emit('roomData', {
                room: user.room,
                users: getUsersInRoom(user.room)
            })
        }
    })
})


server.listen(port, () => {
    console.log(`Server is up on port: ${port}`);
})