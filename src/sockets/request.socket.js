export default function requestSocket(io, socket) {

  socket.on('join_user', (userId) => {
    socket.join(`user_${userId}`);
  });

  socket.on('new_request', (data) => {
    // data: { photographerId, sessionId }

    io.to(`user_${data.photographerId}`)
      .emit('request_received', {
        sessionId: data.sessionId,
        from: socket.user?.id
      });
  });

  socket.on('request_response', (data) => {
    // accept / reject
    io.to(`user_${data.clientId}`)
      .emit('request_status', data);
  });

}
