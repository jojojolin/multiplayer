var express = require('express');
var router = express.Router();

router.prepareSocketIO = function (server) {
    var io = require('socket.io')(server);


    /**
     * 变量定义
     */
    let MAX = 30;//最大支持连接房间数
    let hall = null;//大厅
    let queue = null;//匹配队列
    let rooms = [];//游戏房间
    function Hall() {
        this.people = 0;
        this.socket = null;
    }
    function Queue(){
        this.people = 0;
        this.socket = null;
    }
    function Room(){
        this.people = 0;
        this.socket = null;
    }


    /**
     * 初始化变量
     */
    hall = new Hall();
    queue = new Queue();

    for(let n = 0;n < MAX;n++){
        rooms[n] = new Room();
    }
    function getFreeRoom(){
        for(let n = 0;n < MAX;n++){
            if(rooms[n].people === 0){
                return n;
            }
        }
        return -1;
    }


    /**
     * 连接 根目录
     */
    io.people = 0;
    io.on('connection',function(socket){
        io.people++;
        //console.log('someone connected');

        socket.on('disconnect',function(){
            io.people--;
            //console.log('someone disconnected');
        });
    });


    /**
     * 大厅
     */
    hall.socket = io.of('/hall').on('connection', function(socket) {
        hall.people++;
        console.log('someone connect hall. There are '+hall.people+' people in hall');

        hall.socket.emit('people changed',hall.people);

        socket.on('disconnect',function(){
            hall.people--;
            console.log('someone disconnect hall. There are '+hall.people+' people in hall');
            hall.socket.emit('people changed',hall.people);
        });
    });


    /**
     * 队列
     */
    queue.socket = io.of('/queue').on('connection',function(socket){
        queue.people+=1;
        console.log('someone connect queue. There are '+queue.people+' people in queue');

        if(queue.people === 1){
            socket.emit('set stand',1);
        }
        else if(queue.people === 2){
            socket.emit('set stand', 2);
            let roomId = getFreeRoom();
            if(roomId >= 0){
                queue.socket.emit('match success',roomId);
            }else{
                console.log('no free room!');
            }
        }

        socket.on('cancel match',function(){
            queue.people--;
            console.log('someone cancel queue. There are '+queue.people+' people in queue');
        });

        socket.on('disconnect',function(){
            queue.people--;
            console.log('someone disconnected queue. There are '+queue.people+' people in queue');
        });
    });


    /**
     * 房间
     */
    for(let i = 0; i < MAX; i++){
        rooms[i].socket = io.of('/rooms'+i).on('connection',function(socket){
            rooms[i].people++;
            console.log('some one connected room'+i+'. There are '+rooms[i].people+' people in the room');

            /**
             * 转发球员位置
             */
            socket.on('update player position',function(msg){
                //console.log('update player position: '+JSON.stringify(msg));
                rooms[i].socket.emit('update player position', msg);
            });

            /**
             * 转发足球位置
             */
            socket.on('update ball position',function(msg){
                //console.log('update ball position: '+JSON.stringify(msg));
                rooms[i].socket.emit('update ball position', msg);
            });

            socket.on('disconnect',function(){
                rooms[i].people--;
                console.log('someone disconnected room'+i+'. There are '+rooms[i].people+' people in the room');
            });
        });
    }
};


module.exports = router;

