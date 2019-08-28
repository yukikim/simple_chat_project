import React from "react"
import ReactDOM from "react-dom"

import moment from "moment"
// var nowTheTime = ''
// var isNow = moment().format("YYYY/MM/DD HH:mm")

import styles from './styles.js'

import ChatIcon from './images/chat_icon.png'
import FocusGif from './images/focus_on.gif'

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
        var inputText = e.target.value
        // inputText = inputText.replace(/\\r|\\n/g, '<br>')
        console.log(inputText)
        this.setState({message: inputText})
    }
    // サーバに名前とメッセージを送信 --- (※3)
    send () {
        socket.emit('chat-msg', {
            name: user,
            message: this.state.message,
            // msg_from: '',
            add_img: '',
            now: moment().format("YYYY/MM/DD HH:mm")
        })
        //todo:roomを送信
        if(room){
            socket.emit('join_room', {
                room: room,
                name: user,
                now: moment().format("YYYY/MM/DD HH:mm")
            })
        }
        this.setState({message: ''}) // フィールドをクリア
    }

    focusIn(){
        console.log('フォーカスしてます')
        socket.emit('focus_on', {
            name: user,
            status: true
        })
    }
    focusOut(){
        console.log('フォーカスしていません')
        socket.emit('focus_on', {
            name: user,
            status: false
        })
    }



    render () {
        return (
            <div>
                メッセージ:<br />
                <textarea name={'message'} cols={'50'} rows={'5'} value={this.state.message} onChange={e => this.messageChanged(e)} onFocus={e => this.focusIn(e)} onBlur={e => this.focusOut(e)}></textarea>
                {/*<input value={this.state.message} onChange={e => this.messageChanged(e)} /><br />*/}
                <button onClick={e => this.send()}>送信</button>
                <SendImage />
                <div className={'debug_area'} style={{whiteSpace: 'pre-line'}}> {/*//todo:表示されるテキストの改行を活かす*/}
                    {/*{this.state.message}*/}
                </div>
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
        console.log('画像データは')
        console.dir(this.state.get_image)
        if(this.state.get_image) {
            socket.emit('image', {name: user, send_img: this.state.get_image})
            this.setState({get_image: ''})
        }else {
            window.alert('画像が選択されていません')
        }
        // this.setState({get_image: ''})
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
            user: user,
            focus_user: '',
            focus_status: false,
            arrUser: []
        }
    }

    scrollToBottom = () => {
        const node = ReactDOM.findDOMNode(this.messagesEnd);
        node.scrollIntoView({behavior: "smooth"});
    }

    // コンポーネントがマウントされたとき --- (※5)
    componentDidMount () {

        //todo:ルームを送信
        socket.emit('join_room', {
            room: room,
            name: user,
            now: moment().format("YYYY/MM/DD HH:mm")
        })


        //todo:入室メッセージの送信
        socket.emit('chat-msg', {
            name: user,
            message: '入室しました！',
            add_img: ''
        })

        //todo:ルームを受信
        socket.on('join_room', (result) => {
            this.setState({join_room: result.room}) //todo:ルーム名をステートに保存
            var addUser = this.state.arrUser
            addUser.push(result.name) //todo:接続ユーザーをステートに配列として保存
            this.setState({arrUser: addUser})
        })


        //todo: リアルタイムにメッセージを受信するように設定
        socket.on('chat-msg', (obj) => {
            const logs2 = this.state.logs
            obj.key = 'key_' + (this.state.logs.length + 1)
            console.log(obj)
            logs2.push(obj) // todo:既存配列にメッセージを追加
            this.setState({logs: logs2}) //todo:メッセージを追加した配列をステートに保存

            this.scrollToBottom()
        })

        //todo:画像を受信
        socket.on('image', (imageData) => {
            if(imageData) {
                // console.dir(imageData)
                var blob = new Blob([imageData.send_img], {type: "image/jpg"})
                var urlCreator = window.URL || window.webkitURL
                var src = urlCreator.createObjectURL(blob)
                console.log(src)

                //todo:既存メッセージ配列に追加するために配列を形成する
                var preLog = {
                    name: imageData.name,
                    message: '',
                    add_img: src
                }
                const logs3 = this.state.logs //todo:既存メッセージを変数に
                preLog.key = 'key_' + (this.state.logs.length + 1)
                logs3.push(preLog) //todo:画像を既存メッセージ配列に追加
                this.setState({logs: logs3})

                this.setState({image_src: src}) //todo:画像メッセージを追加した配列をステートに再保存
            }
        })

        //todo:テキストエリアへのフォーカス情報を受信
        socket.on('focus_on', (result) => {
            console.log('フォーカスを受信')
            console.dir(result)
            console.log('フォーカスしているのは' + result.name)
            console.log('フォーカスステータスは' + result.status)
            //todo:フォーカス情報をステートに保存
            this.setState({focus_user: result.name})
            this.setState({focus_status: result.status})
        })
    }


    render () {
        console.dir(this.state.logs)
        console.log('入室したルームは' + this.state.join_room)
        console.log('stateに保存したユーザーは:' + this.state.user)
        console.log('参加しているユーザーは')
        console.dir(this.state.arrUser)
        // ログ一つずつの描画内容を生成 --- (※6)
        // var msgLogs = this.state.logs
        // msgLogs.reverse()
        // console.log('ログを逆順にした')
        // console.dir(msgLogs.reverse())
        const messages = this.state.logs.map((e) => {
            return (
                <section>
                    {(() => {
                        if(e.name === this.state.user){
                            return (
                                <div style={styles.from_my} key={e.key}>
                                    <p className={'user_name'}>{e.name}</p>
                                    <div style={{whiteSpace: 'pre-line'}}>{e.message}</div>
                                    <div className={"send_img"}>
                                        {(() => {
                                            if (e.add_img) {
                                                return <img src={e.add_img}/>
                                            } else {
                                                return
                                            }
                                        })()}

                                    </div>

                                    <p style={{clear: 'both'}}/>
                                </div>

                            )
                        }else {
                            return (
                                <div style={styles.from_opp} key={e.key}>
                                    <p className={'user_name'}>{e.name}</p>
                                    <div style={{whiteSpace: 'pre-line'}}>{e.message}</div>
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

        var userList = this.state.arrUser //todo:参加ユーザー配列
        //todo:重複を削除
        var noDupUserList = userList.filter((x, i, self) => {
            return self.indexOf(x) === i
        })
        const showUserList = noDupUserList.map((value, key) => {
            if(key !== 0){
                return (
                    <li>{value}</li>
                )
            }
        })
        return (
            <div>
                <header>
                    {(() => {
                       if(this.state.user){
                           return <span>ようこそ！{this.state.user} さん</span>
                       }
                    })()}
                    <div className={'user_list'}>
                        <p>参加ユーザー</p>
                        <ul>
                        {showUserList}
                        </ul>
                    </div>
                </header>
                <h1>Simple Chat</h1>
                <img src={ChatIcon} />
                <div className={'msg_list'}>
                    {messages}
                    {(() => {
                       if(this.state.focus_status === true) {
                           return (
                            <p className={'focus_status'}>
                                {this.state.focus_user}:<img src={FocusGif} />
                                </p>
                           )
                       }else if(this.state.focus_status === false) {
                           return (
                               <p className={'focus_status'}>
                               </p>
                           )

                       }
                    })()}
                </div>
                <ChatForm />
                <div style={ {float:"left", clear: "both"} } ref={(el) => { this.messagesEnd = el; }}> </div>
            </div>
        )
    }
}




ReactDOM.render(
    <ChatApp />,
    document.getElementById('root'))
