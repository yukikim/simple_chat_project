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

app.use(express.static(path.join('./', 'dist')));

app.get('/api', (req, res) => {
    res.send({data: 'test'});
})

app.get('*', function (req, res) {
    res.sendFile(path.resolve(__dirname, '../../dist/index.html'))
})

app.listen(serverConfig.port, ()=> {
    Logs.logger.info(`server starting -> [port] ${serverConfig.port} [env] ${process.env.NODE_ENV}`)
})