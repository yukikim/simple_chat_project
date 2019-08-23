import React from "react"
import ReactDOM from "react-dom"
import styles from './styles.js'

import ChatIcon from './images/chat_icon.png'

//todo: Socket.IOでWebSocketサーバに接続する
import socketio from 'socket.io-client'
const socket = socketio.connect('http://localhost:3000')


//todo:パラメータからルームを取得する(?room=hoge)
var param = location.search
/**
 * パラメータをオブジェクトに変換する
 * @param param :url parameter
 * @param idDecode : false/true
 * @returns {{}}
 */
function queryString(param, idDecode) {
    param = param.replace(/\?/g, '')
    var sep = '&'
    var eq = '='
    var decode = (idDecode) ? decodeURIComponent : function(a){return a}
    return param.split(sep).reduce(function (obj, v) {
        var pair = v.split(eq)
        obj[pair[0]] = decode(pair[1])
        return obj
    }, {})
}


console.log(param)
var room = ''
var user = ''

if(param.search(/room/) === 1) {
    var paramObj = queryString(param, true)
    room = paramObj.room
    user = paramObj.user
}
console.log('ルーム名は' + room)
console.log('ユーザーは' + user)

// 書き込みフォームのコンポーネント --- (※2)
class ChatForm extends React.Component {
    constructor (props) {
        super(props)
        this.state = {
            name: '',
            message: ''
        }
    }

    messageChanged (e) {
        this.setState({message: e.target.value})
    }
    // サーバに名前とメッセージを送信 --- (※3)
    send () {
        socket.emit('chat-msg', {
            name: user,
            message: this.state.message,
            // msg_from: '',
            add_img: ''
        })
        //todo:roomを送信
        if(room){
            socket.emit('join_room', room)
        }
        this.setState({message: ''}) // フィールドをクリア
    }
    render () {
        return (
            <div>
                メッセージ:<br />
                <input value={this.state.message}
                       onChange={e => this.messageChanged(e)} /><br />
                <button onClick={e => this.send()}>送信</button>
                <SendImage />
            </div>
        )
    }
}

class SendImage extends React.Component {
    constructor(props) {
        super(props)
        this.state = {get_image: ''}
    }

    GetFile(e) {
        // console.dir(e.target.files[0])
        this.setState({get_image: e.target.files[0]})
    }

    sendImg() {
        console.dir(this.state.get_image)
        socket.emit('image', {name: user, send_img: this.state.get_image})
        this.setState({get_image: ''})
    }

    render() {
        return(
            <div>
                <input type="file" name="image" onChange={e => this.GetFile(e)} />
                <button onClick={e => this.sendImg()}>画像送信</button>
            </div>
        )
    }

}

// チャットアプリのメインコンポーネント定義 --- (※4)
class ChatApp extends React.Component {
    constructor (props) {
        super(props)
        this.state = {
            logs: [],
            image_src: '',
            join_room: '',
            user: user
        }
    }
    // コンポーネントがマウントされたとき --- (※5)
    componentDidMount () {

        //todo:ルームを送信
        socket.emit('join_room', room)


        socket.emit('chat-msg', {
            name: user,
            message: 'preMsg',
            add_img: ''
        })

        socket.on('join_room', (result) => {
            this.setState({join_room: result})
        })

        //todo: リアルタイムにメッセージを受信するように設定
        socket.on('chat-msg', (obj) => {
            const logs2 = this.state.logs
            obj.key = 'key_' + (this.state.logs.length + 1)
            console.log(obj)
            logs2.unshift(obj) // 既存ログに追加
            this.setState({logs: logs2})
        })

        //todo:画像を受信
        socket.on('image', (imageData) => {
            if(imageData) {
                // console.dir(imageData)
                var blob = new Blob([imageData.send_img], {type: "image/jpg"})
                var urlCreator = window.URL || window.webkitURL
                var src = urlCreator.createObjectURL(blob)
                console.log(src)

                var preLog = {
                    name: imageData.name,
                    message: '',
                    add_img: src
                }
                const logs3 = this.state.logs
                preLog.key = 'key_' + (this.state.logs.length + 1)
                logs3.unshift(preLog)
                this.setState({logs: logs3})

                this.setState({image_src: src})
            }
        })
    }


    render () {
        console.dir(this.state.logs)
        console.log('入室したルームは' + this.state.join_room)
        console.log('stateに保存したユーザーは:' + this.state.user)
        // ログ一つずつの描画内容を生成 --- (※6)
        const messages = this.state.logs.map((e) => {
            return (
                <section>
                    {(() => {
                        if(e.name === this.state.user){
                            return (
                                <div style={styles.from_my} key={e.key}>
                                    {/*<span className={'avater'}><img src={imgA} /> </span>*/}
                                    <span>{e.name}</span>
                                    <span>: {e.message}</span>
                                    <p className={"send_img"}>
                                        {(() => {
                                            if (e.add_img) {
                                                return <img src={e.add_img}/>
                                            } else {
                                                return
                                            }
                                        })()}

                                    </p>

                                    <p style={{clear: 'both'}}/>
                                </div>

                            )
                        }else {
                            return (
                                <div style={styles.from_opp} key={e.key}>
                                    {/*<span className={'avater'}><img src={imgB} /> </span>*/}
                                    <span>{e.name}</span>
                                    <span>: {e.message}</span>
                                    <p className={"send_img"}>
                                        {(() => {
                                            if (e.add_img) {
                                                return <img src={e.add_img}/>
                                            } else {
                                                return
                                            }
                                        })()}

                                    </p>

                                    <p style={{clear: 'both'}}/>
                                </div>

                            )
                        }
                    })()}
                </section>
            )
        })
        return (
            <div>
                <h1>チャットテスト</h1>
                <img src={ChatIcon} />
                <div className={'msg_list'}>{messages}</div>
                <ChatForm />
            </div>
        )
    }
}




ReactDOM.render(
    <ChatApp />,
    document.getElementById('root'))
