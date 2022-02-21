var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

app.get('/',function(req,res){
  res.sendfile("chatCountClient.html");
});

var chatCount=1;
io.on('connection',function(socket){
  var name = "user" + chatCount++;
  var msg = name + "님이 입장하셨습니다.";
  console.log('user connected : ',socket.id, name);
  io.to(socket.id).emit('give name',name);
  io.emit('receive message',msg);

  socket.on('disconnect',function(){
    console.log('user disconnected : ',socket.id);
  });

  socket.on('send message',function(name,text){
    var msg = name + " : " + text;
    console.log(msg);
    io.emit('receive message',msg);
  });

  socket.on('change name',function(newName,oldName){
    console.log("change name : " + oldName + " -> " + newName);
    io.to(socket.id).emit('give name',newName);
    var msg = "닉네임 변경 : " + oldName + " -> " + newName;
    io.emit('receive message',msg);
  });
});

http.listen('3001',function(){
  console.log("Server On!");
});
