const path = require('path');
const http = require('http');
const express = require('express');
const socketio = require('socket.io');
const formatMessage = require('./utils/messages');
const {
  userJoin,
  getCurrentUser,
  getRoomUsers,
  userLeave
} = require('./utils/users');
const botName = 'Chat Bot';


//Need to change messages to bot name time stamp 47


const app = express();
const server = http.createServer(app)
const io = socketio(server);

//Set Static Folder
app.use(express.static(path.join(__dirname, 'public')));

//Run when a client connects
io.on('connection', socket => {

  socket.on('joinRoom', ({
    username,
    room
  }) => {

    const user = userJoin(socket.id, username, room);

    socket.join(user.room);


    //welcome current user
    socket.emit('message', formatMessage(botName, 'Welcome to Chat'))

    //Boradcast when user connects
    socket.broadcast.to(user.room).emit('message', formatMessage(botName, `${user.username} has joined the chat`));

    //Send users and room info
    io.to(user.room).emit('roomUsers', {
      room: user.room,
      users: getRoomUsers(user.room)
    });

  });

  //Lister for chat messsage
  socket.on('chatMessage', (msg) => {
    const user = getCurrentUser(socket.id);

    //const user = getCurrentUser(socket.id);
    io.to(user.room).emit('message', formatMessage(user.username, msg))
  });

  //Runs when client disconnects
  socket.on('disconnect', () => {
    const user = userLeave(socket.id);

    if (user) {
      io.to(user.room).emit('message', formatMessage(botName, `${user.username} has left the chat`));

      //Send users and room info
      io.to(user.room).emit('roomUsers', {
        room: user.room,
        users: getRoomUsers(user.room)
      });
    }
  });

});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => console.log(`Server running on port ${PORT}`))
