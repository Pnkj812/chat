const io = require('socket.io')(8000, {
  cors: {
    origin: 'http://127.0.0.1:5500',
    methods: ['GET', 'POST']
  }
});

const users = {};
console.log("Server running...");

io.on('connection', socket => {
  console.log('User connected');

  socket.on('new-user-joined', name => {
    users[socket.id] = name;
    socket.broadcast.emit('user-joined', name);
  });

  // send message (to all including sender)
  socket.on('send', message => {
    const msgData = {
      id: Date.now() + Math.random(),  // server generates unique ID
      message,
      name: users[socket.id],
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    io.emit('receive', msgData); // send to everyone (including sender)
  });

  // reaction event (broadcast to all)
  socket.on('react', data => {
    io.emit('messageReaction', data);
  });

  socket.on('disconnect', () => {
    socket.broadcast.emit('leave', users[socket.id]);
    delete users[socket.id];
  });

  // Typing events
  socket.on('typing', name => {
    socket.broadcast.emit('userTyping', name);
  });

  socket.on('stopTyping', () => {
    socket.broadcast.emit('userStopTyping');
  });
});
