import express from 'express';
import path from 'path';
import config from 'config';

const app = express();

const serverConfig = config.get('server');

const Logs = require('./logger')

//todo:WebSocketモジュール
const server = require('http').createServer(app)
const socketio = require('socket.io')
const io = socketio.listen(server)

// app.use(express.static(path.join('./', 'dist')))
app.use(express.static(path.resolve(__dirname, '../../dist')))

app.get('/', function (req, res) {
    res.sendFile(path.resolve(__dirname, '../../dist/index.html'))
})

// todo:クライアントが接続したときのイベントを設定
io.on('connection', (socket) => {
    var room = ''
    console.log('ユーザが接続:', socket.client.id) //todo:debug
    //todo:ルーム受信
    socket.on('join_room', (result) => {
        room = result
        console.log('受信したルームは' + room) //todo:debug
        socket.join(room)

        io.to(room).emit('join_room', room)
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
})

//todo:サーバー起動
app.listen(serverConfig.port, ()=> {
    Logs.logger.info(`server starting -> [port] ${serverConfig.port} [env] ${process.env.NODE_ENV}`)
})