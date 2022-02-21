var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var path = require('path');

app.use('/css',express.static('css'));
app.use('/image',express.static('image'));

app.get('/',function(req,res){
  res.sendfile('client.html');
});

client={};
server={};

server = new newServer();

var count_connection=0;
var count_searching=0;
var count_selecting=0;
var count_choosing=0;
var count_equip=0;
var count_complete=0;
var count_item=0;
var count_use=0;
var count_timer=0;
var time;
var font;
var isPlaying=false;
var selectingCard=[100,100,100,100];

io.on('connection',function(socket){

  client[socket.id] = new newClient();

  if(count_searching>=2){
    console.log('유저의 접속을 차단했습니다. 사유:인원초과');
    io.to(socket.id).emit('response : cannot access');
    client[socket.id].access=false;
    return;
  }

  console.log('user connected ['+ ++count_connection +']: '+socket.id);

  client[socket.id].num=-1;

  socket.on('disconnect',function(){
    if(client[socket.id].access){
      console.log('user'+client[socket.id].num+' disconnected. socket.id : '+socket.id);
      io.to(server.userId[(client[socket.id].num==1?2:1)]).emit('someone disconnect',isPlaying);
      init();
    }
    else{
      console.log('user disconnected ['+ count_connection-- +']');
    }
    delete client[socket.id];
  });

  var timer = function(){
    if(time>=1) io.emit('response : timer',time,font);
    time--;
    if(time<0){
      timerResult(font);
      clearInterval(timer_total);
    }
    if(timer_total._idleTimeout==-1) console.log('타이머 종료');
  }
  var timer_total;

  function timerResult(font){
    if(font=='txt_useCount'){
      console.log('round start!');
      var temp,x,y;
      while(true){
        temp = Math.floor(((Math.random()*12)+1));
        if(server.deck[temp-1]){
          console.log('temp:'+temp);
          server.deck[temp-1]=false;
          x=1+(Math.floor((temp-1)/3));
          server.givenCard[1]=x;
          break;
        }
      }
      while(true){
        temp = Math.floor(((Math.random()*12)+1));
        if(server.deck[temp-1]){
          console.log('temp:'+temp);
          server.deck[temp-1]=false;
          y=1+(Math.floor((temp-1)/3));
          server.givenCard[2]=y;
          break;
        }
      }
      console.log('x:'+x+'/y:'+y);
      isPlaying=true;
      io.to(server.userId[1]).emit('start game',x);
      io.to(server.userId[2]).emit('start game',y);
    }
  }

  socket.on('request : timer',function(type){
    if(++count_timer==1){
      if(type=='use'){
        font = 'txt_useCount';
        time = 9;

        timer_total = setInterval(timer,1000);
      }
    }
    if(count_timer==2){
      count_timer=0;
    }
  });

  socket.on('request : stop timer',function(){
    console.log('asd');
    clearInterval(timer_total);
  });




  socket.on('request : searching',function(){
    client[socket.id].num = ++count_searching;
    server.userId[count_searching]=socket.id;
    client[socket.id].access=true;
    console.log('user'+client[socket.id].num+' request searching // count : '+count_searching+' // ID = '+socket.id);
    if(count_searching==1){
      io.to(socket.id).emit('response : please wait (searching)');
    }
    else if(count_searching==2){
      for(var i=1;i<=4;i++){
        var x = Math.floor(((Math.random()*100)+1)%4);
        console.log('x : '+x);
        if(selectingCard[x]==100) selectingCard[x]=i;
        else i--;
      }
      console.log('섞기 완료 >> '+selectingCard[0]+selectingCard[1]+selectingCard[2]+selectingCard[3]);
      io.to(socket.id).emit('response : please select item');
      io.to(server.userId[1]).emit('response : please select item');
    }
    else{
      console.log('유저의 접속을 차단했습니다. 사유:인원초과');
      io.to(socket.id).emit('response : cannot access');
      client[socket.id].access=false;
      return;
    }
  });

  socket.on('request : item selecting complete',function(itemSelected){
    console.log('item select : user'+client[socket.id].num+' / '+itemSelected[1]+' & '+itemSelected[2]);
    client[socket.id].item=[];
    client[socket.id].item[1]=itemSelected[1];
    client[socket.id].item[2]=itemSelected[2];
    client[socket.id].item[10]=true;
    client[socket.id].item[20]=true;
    if(++count_item==1){
      io.to(socket.id).emit('response : please wait (item)');
    }
    if(count_item==2){
      io.to(socket.id).emit('response : please select card');
      io.to(server.userId[(client[socket.id].num==1?2:1)]).emit('response : please select card');
    }
  });

  socket.on('request : select card',function(num){
    console.log('user'+client[socket.id].num+' select : '+num+'('+selectingCard[num-1]+') // count : '+ ++count_selecting);
    client[socket.id].selectingCard=selectingCard[num-1];
    io.to(socket.id).emit('response : wait enemy selecting',num,selectingCard[num-1]);
    io.to(server.userId[(client[socket.id].num==1?2:1)]).emit('response : enemy selected',num,selectingCard[num-1]);
    if(count_selecting==2){
      io.to(server.userId[1]).emit('response : selecting complete',client[server.userId[1]].selectingCard > client[server.userId[2]].selectingCard ? true : false);
      io.to(server.userId[2]).emit('response : selecting complete',client[server.userId[1]].selectingCard > client[server.userId[2]].selectingCard ? false : true);
    }
  });

  socket.on('request : offense defense selecting',function(isOffense){
    client[socket.id].turn = isOffense;
    client[server.userId[(client[socket.id].num==1?2:1)]].turn=!isOffense;
    console.log('user'+client[socket.id].num+' select '+(isOffense==true?'offense':'defense')+'\nuser1:'+client[server.userId[1]].turn+' / user2:'+client[server.userId[2]].turn);
    io.to(socket.id).emit('response : activate timer','txt_useCount',10);
    io.to(server.userId[1]).emit('response : please use item',++server.round,client[server.userId[1]].turn);
    io.to(server.userId[2]).emit('response : please use item',server.round,client[server.userId[2]].turn);
  });

  socket.on('request : user use item',function(itemNum){
    console.log('user'+client[socket.id].num+' use item ['+client[socket.id].item[itemNum]+'] // count_use : '+ ++count_use);
    client[socket.id].item[itemNum*10]=false;
    io.to(socket.id).emit('response : you use item',itemNum);
    io.to(server.userId[(client[socket.id].num==1?2:1)]).emit('response : enemy use item');
    client[socket.id].use='item_logo_'+client[socket.id].item[itemNum];
  });

  socket.on('request : user choose number',function(isDraw,num){
    client[socket.id].chosenCard=(isDraw==false?num:server.givenCard[client[socket.id].num]);
    console.log('user'+client[socket.id].num+' choose number '+client[socket.id].chosenCard+' // count_choosing = '+ ++count_choosing);
    console.log('isDraw = '+isDraw);
    io.to(socket.id).emit('response : hide num',isDraw,num);
    io.to(socket.id).emit('response : disable num');
    io.to(socket.id).emit('response : show center',client[socket.id].chosenCard);
    io.to(server.userId[(client[socket.id].num==1?2:1)]).emit('response : enemy choose num');
    io.to(socket.id).emit('response : show your num',client[socket.id].chosenCard);
    if(count_choosing==1)
      io.to(socket.id).emit('response : please wait enemy choosing');
    else{
      count_choosing=0;
      io.to(server.userId[1]).emit('response : choose equip',client[server.userId[1]].turn);
      io.to(server.userId[2]).emit('response : choose equip',client[server.userId[2]].turn);
    }
  });

  socket.on('request : user choose equip',function(isSword){
    console.log('user'+client[socket.id].num+' choose  '+(isSword==true?'SWORD':'SHIELD')+' // count_equip = '+ ++count_equip);
    client[socket.id].equip = isSword;
    io.to(socket.id).emit('response : disable equip');
    if(count_equip==1){
      client[server.userId[1]].turn = !client[server.userId[1]].turn;
      client[server.userId[2]].turn = !client[server.userId[2]].turn;
      io.to(socket.id).emit('response : choose equip',false);
      io.to(socket.id).emit('response : show your equip',isSword);
      io.to(server.userId[(client[socket.id].num==1?2:1)]).emit('response : show enemy equip',isSword);
      io.to(server.userId[(client[socket.id].num==1?2:1)]).emit('response : choose equip',true);
    }
    else{
      count_equip=0;
      io.to(server.userId[1]).emit('response : show result',client[server.userId[1]].chosenCard,client[server.userId[1]].equip,client[server.userId[1]].use,client[server.userId[2]].chosenCard,client[server.userId[2]].equip,client[server.userId[2]].use);
      io.to(server.userId[2]).emit('response : show result',client[server.userId[2]].chosenCard,client[server.userId[2]].equip,client[server.userId[2]].use,client[server.userId[1]].chosenCard,client[server.userId[1]].equip,client[server.userId[1]].use);
    }
  });

  socket.on('request : hp down',function(x){
    client[socket.id].hp-=x;
  });

  socket.on('request : round complete',function(){
    var userHp=[];
    var isReset=false;
    client[socket.id].use='blank';
    userHp[1] = client[socket.id].hp;
    userHp[2] = client[server.userId[(client[socket.id].num==1?2:1)]].hp;
    console.log('user'+client[socket.id].num+' round complete');
    if((++count_complete)%2==1){
      server.round++;
    }
    if(server.round==7){
      isReset=true;
      console.log('deck shuffle!');
      server.deck=[true,true,true,true,true,true,true,true,true,true,true,true];
    }
    if(server.round==13){
      if((userHp[1]<=0 && userHp[2]<=0)||(userHp[1]==userHp[2])){
        console.log('<Game Over. Draw>');
        io.to(socket.id).emit('response : game over','draw');
      }
      else if(userHp[1]<=0 || userHp[1]<userHp[2]){
        console.log('<Game Over. User'+client[server.userId[(client[socket.id].num==1?2:1)]].num+' Win!>');
        io.to(socket.id).emit('response : game over','lose');
        io.to(server.userId[(client[socket.id].num==1?2:1)]).emit('response : game over','victory');
      }
    }
    else{
      if(userHp[1]<=0 && userHp[2]<=0){
        console.log('<Game Over. Draw>');
        io.to(socket.id).emit('response : game over','draw');
      }
      else if(userHp[1]<=0){
        console.log('<Game Over. User'+client[server.userId[(client[socket.id].num==1?2:1)]].num+' Win!>');
        io.to(socket.id).emit('response : game over','lose');
        io.to(server.userId[(client[socket.id].num==1?2:1)]).emit('response : game over','victory');
      }
      else if(userHp[1]>0 && userHp[2]>0){
        io.to(socket.id).emit('response : please use item',server.round,client[socket.id].turn,isReset);
      }
    }
  });

});

function init(){
  count_connection=0;
  count_searching=0;
  count_selecting=0;
  count_choosing=0;
  count_equip=0;
  count_complete=0;
  count_item=0;
  count_use=0;
  count_timer=0;
  isPlaying=false;
  selectingCard[0]=100;
  selectingCard[1]=100;
  selectingCard[2]=100;
  selectingCard[3]=100;
  server.round=0;
  server.deck=[true,true,true,true,true,true,true,true,true,true,true,true];
}

function newClient(){
  this.hp=15;
  this.sword=6;
  this.shield=6;
  this.use='blank';
}

function newServer(){
  this.userId=[];
  this.round=0;
  this.deck=[true,true,true,true,true,true,true,true,true,true,true,true];
  this.givenCard=[];
}

http.listen('3000',function(){
  console.log('server on!');
});
