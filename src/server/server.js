const express = require('express') ;
const path = require('path') ;

const config = require('../../config/default')

const app = express();

const serverConfig = config.server

const Logs = require('./logger')

//todo:WebSocketモジュール
const server = require('http').createServer(app)
const socketio = require('socket.io')
const io = socketio.listen(server)

//todo:サーバー起動
server.listen(serverConfig.port, () => {
    console.log('起動しました', 'http://localhost:' + serverConfig.port)
})

// app.use(express.static(path.join('./', 'dist')))
app.use(express.static(path.resolve(__dirname, '../../dist')))

//todo:ルーティング
app.get('/', function (req, res) {
    res.sendFile(path.resolve(__dirname, '../../dist/index.html'))
})

// todo:クライアントが接続したときのイベントを設定
io.on('connection', (socket) => {
    var room = ''
    var name = ''
    console.log('ユーザが接続:', socket.client.id) //todo:debug
    //todo:ルーム受信
    socket.on('join_room', (result) => {
        room = result.room
        name = result.name
        console.log('受信したルームは' + room) //todo:debug
        console.log('受信したユーザーは' + name) //todo:debug
        socket.join(room)

        io.to(room).emit('join_room', result)
        io.to(room).emit('user_id', socket.client.id)
    })

    //todo: メッセージ受信時の処理を記述
    socket.on('chat-msg', (msg) => {
        console.log('メッセージ', msg) //todo:debug
        //todo:room限定送信
        console.log('nameSpace:' + room) //todo:debug
        io.to(room).emit('chat-msg', msg)
    })

    socket.on('image', (imageData) => {
        io.to(room).emit('image', (imageData))
    })

    socket.on('focus_on', (result) => {
        socket.broadcast.emit('focus_on', result)
    })

    //todo:接続解除時
    socket.on('exit_room', (result) => {
        console.log('解除メッセージ')
        console.dir(result)
        io.to(room).emit('chat-msg', result)
    })
})

