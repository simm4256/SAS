var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var path = require('path');

app.use('/css',express.static('css'));
app.use('/image',express.static('image'));

app.get('/',function(req,res){
  res.sendfile('client2.html');
});

client={};
server={};

server = new newServer();

var count_connection=0;

io.on('connection',function(socket){

  console.log('user connected ['+ ++count_connection +']: '+socket.id);
  client[socket.id] = new newClient();
  client[socket.id].num = count_connection;
  server.userId[count_connection]=socket.id;



});

function newClient(){
  this.hp=20;
  this.haveOne=1;
}

function newServer(){
  this.userId=[];
}

http.listen('3000',function(){
  console.log('server on!');
});
