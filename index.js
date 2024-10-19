const express = require("express");
const http = require("http");
const socketio = require("socket.io");
const cors = require("cors");

const app = express();
const PORT = 3000;
app.use(cors());

const Server = http.createServer(app);

const nameToSocketIdMap = new Map();
const socketIdToNameMap = new Map();

const io = socketio(Server, {
  cors: { origin: "http://localhost:5173" },
});

io.on("connection", (socket) => {
  console.log("socket connected", socket.id);

  socket.on("room join", ({ name, room }) => {
    console.log(name, room, "from frontend");

    io.to(room).emit("user joined", { name, id: socket.id });
    socket.join(room);

    socket.emit("room join", { name, room });
  });

  socket.on("user call", ({ to, offer }) => {
    io.to(to).emit("incoming call", { from: socket.id, offer });
  });

  socket.on("call accepted", ({ to, answer }) => {
    io.to(to).emit("call accepted", { from: socket.id, answer });
  });

  socket.on("peer:ice-candidate", ({ to, candidate }) => {
    io.to(to).emit("peer:ice-candidate", { candidate });
  });

  socket.on("disconnect", () => {
    const name = socketIdToNameMap.get(socket.id);
    nameToSocketIdMap.delete(name);
    socketIdToNameMap.delete(socket.id);
    console.log(`User ${name} disconnected`);
  });
});

Server.listen(PORT, () => {
  console.log(`Server running at port ${PORT}`);
});
