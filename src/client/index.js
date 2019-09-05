import React from "react"
import ReactDOM from "react-dom"

import moment from "moment-timezone"

import {Container, Navbar, Nav, FormControl, Button, InputGroup, Modal} from 'react-bootstrap'

import ExifOrientationImg from 'react-exif-orientation-img'
import MediaQuery from "react-responsive"

import styles from './styles.js'

import 'emoji-mart/css/emoji-mart.css'
import { Picker } from 'emoji-mart'

import ChatIcon from './images/chat_icon_mini.png'
import FocusGif from './images/focus_on.gif'

//todo: Socket.IOでWebSocketサーバに接続する
import socketio from 'socket.io-client'
// const socket = socketio.connect('http://localhost:3000')
const socket = socketio.connect('https://dedaman.com')


const request = require('superagent')


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

// todo:書き込みフォームのコンポーネント
class ChatForm extends React.Component {
    constructor (props) {
        super(props)
        this.state = {
            name: '',
            message: '',
            show: false,
            setShow: false
        }
    }

    messageChanged (e) {
        var inputText = e.target.value
        console.log(inputText)
        this.setState({message: inputText})
    }
    //todo: サーバに名前とメッセージを送信
    send () {
        socket.emit('chat-msg', {
            name: user,
            message: this.state.message,
            add_img: '',
            now: moment().format("YYYY/MM/DD HH:mm"),
            fromDate: ''
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

    addEmoji(e){
        console.log(e.native)
        let emoji = e.native
        this.setState({message: this.state.message + emoji})
    }


    handleClose() {
        this.setState({setShow: false, show: false})
    }
    handleShow() {
        this.setState({setShow: true, show: true})
    }

    render () {

        return (
            <div style={styles.inputArea}>

                <InputGroup>
                    <InputGroup.Prepend>
                        <InputGroup.Text>メッセージ</InputGroup.Text>
                    </InputGroup.Prepend>
                    <FormControl as="textarea" aria-label="With textarea" value={this.state.message}  onChange={e => this.messageChanged(e)} onFocus={e => this.focusIn(e)} onBlur={e => this.focusOut(e)}/>
                </InputGroup>

                <div style={{textAlign:'right', marginTop:'5px'}}>
                    <Button variant="primary" onClick={e => this.send()}>メッセージ送信</Button>
                    &nbsp;<Button variant="outline-info" size="sm" onClick={e => this.handleShow(e)}>絵文字挿入</Button>
                </div>

                <hr />
                <SendImage />

                <Modal show={this.state.show} onHide={e => this.handleClose(e)}>
                    <Modal.Header closeButton>
                        <Modal.Title>絵文字挿入</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <span>
                            <Picker onSelect={e => this.addEmoji(e)}/>
                        </span>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={e => this.handleClose(e)}>
                            挿入終了
                        </Button>
                    </Modal.Footer>
                </Modal>
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
        this.setState({get_image: e.target.files[0]})
    }

    sendImg() {
        console.log('画像データは')
        console.dir(this.state.get_image)
        var dateNow = ''
        if(this.state.get_image) {
            dateNow = moment().format("YYYY/MM/DD HH:mm")
            socket.emit('image', {
                name: user,
                send_img: this.state.get_image,
                now: dateNow,
                fromDate: ''
            })
            this.setState({get_image: ''})
        }else {
            window.alert('画像が選択されていません')
        }
    }

    render() {
        return(
            <div style={{marginTop:'10px', backgroundColor: '#a2c6bd', padding: '10px', borderRadius: '10px'}}>

                <p style={{margin: '0'}}>画像を送る</p>
                <InputGroup className={"col-12"}>
                    <div className="custom-file">
                            <input className="btn" type="file" name="image" id="inputGroupFile02" onChange={e => this.GetFile(e)} />
                    </div>
                </InputGroup>
                <div style={{textAlign: 'right'}}>
                <Button variant="success" onClick={e => this.sendImg()}>画像を送信</Button>
                </div>

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
            arrUser: [],
            check_token: false
        }
    }

    //todo:下にスクロール
    scrollToBottom = () => {
        const node = ReactDOM.findDOMNode(this.refs.messagesEnd);
        node.scrollIntoView({behavior: "smooth", block: "end"});
    }

    //todo:接続解除処理
    disconnect(e) {
        //todo:接続を通知
        console.log('解除押した')
        socket.emit('exit_room', {
            room: room,
            name: user,
            message: '退室しました！',
            add_img: '',
            now: moment().format("YYYY/MM/DD HH:mm")
        })
        //todo:接続解除
        socket.disconnect()
    }

    checkToken(){
        request
            .get('https://dedaman.com/chat/check_token')
            .query({ token: room })
            .then(res => {
                console.dir('チェックしたトークンは' + res.body)
                this.setState({check_token: res.body})
            })
            .catch((error) => {
                if(error) {
                    console.log('トークンチェクエラー' + error.message)
                }
            })

    }


    // コンポーネントがマウントされたとき --- (※5)
    componentDidMount () {

        //todo:パラメータのトークンをチェックする
        this.checkToken()

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
            add_img: '',
            now: moment().format("YYYY/MM/DD HH:mm"),
            fromDate: ''
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
            console.log('既存ログは')
            console.dir(logs2)
            var changeLog = []
            logs2.map((item, key) => {
                changeLog.push({
                    add_img: item.add_img,
                    key: item.key,
                    message: item.message,
                    name: item.name,
                    now: item.now,
                    fromDate: moment(item.now).locale('ja').tz('Asia/Tokyo').fromNow()
                })
            })
            console.log('書き換えたログは')
            console.dir(changeLog)
            obj.key = 'key_' + (this.state.logs.length + 1)
            obj.fromDate = moment(obj.now).locale('ja').tz('Asia/Tokyo').fromNow()
            console.log(obj)
            // logs2.push(obj) // todo:既存配列にメッセージを追加
            changeLog.push(obj) // todo:既存配列にメッセージを追加
            // this.setState({logs: logs2}) //todo:メッセージを追加した配列をステートに保存
            this.setState({logs: changeLog}) //todo:メッセージを追加した配列をステートに保存

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
                    add_img: src,
                    now: imageData.now,
                    fromDate: moment(imageData.now).locale('ja').tz('Asia/Tokyo').fromNow()
                }
                const logs3 = this.state.logs //todo:既存メッセージを変数に
                preLog.key = 'key_' + (this.state.logs.length + 1)
                logs3.push(preLog) //todo:画像を既存メッセージ配列に追加
                this.setState({logs: logs3})

                this.setState({image_src: src}) //todo:画像メッセージを追加した配列をステートに再保存

                this.scrollToBottom()
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
        console.log('メッセージログです')
        console.dir(this.state.logs)
        console.log('入室したルームは' + this.state.join_room)
        console.log('stateに保存したユーザーは:' + this.state.user)
        console.log('参加しているユーザーは')
        console.dir(this.state.arrUser)
        const messages = this.state.logs.map((e) => {
            return (
                <section>
                    {(() => {
                        if(e.name === this.state.user){
                            return (
                                <div style={styles.from_my} key={e.key}>
                                    <p className={'user_name'}><i className="far fa-user"></i> {e.name}</p>
                                    <div style={{whiteSpace: 'pre-line'}}>{e.message}</div>
                                        {(() => {
                                            if (e.add_img) {
                                                return (
                                                    <div className={"send_img"}>
                                                        <MediaQuery query="(max-width: 414px)">
                                                            <img style={styles.sendImg} src={e.add_img}/>
                                                        </MediaQuery>
                                                        <MediaQuery query="(min-width: 415px)">
                                                            <ExifOrientationImg style={styles.sendImg} src={e.add_img}/>
                                                        </MediaQuery>
                                                    </div>
                                                )
                                            } else {
                                                return
                                            }
                                        })()}

                                    <p style={styles.msgDate} className={'from_date'}>{e.fromDate}</p>
                                </div>

                            )
                        }else {
                            return (
                                <div style={styles.from_opp} key={e.key}>
                                    <p style={styles.oppName} className={'user_name'}><i className="fas fa-user"></i> {e.name} <i style={styles.Balloon} className="far fa-comment"></i></p>

                                    <div style={{whiteSpace: 'pre-line'}}>{e.message}</div>
                                        {(() => {
                                            if (e.add_img) {
                                                return (
                                                    <div className={"send_img"}>
                                                        <MediaQuery query="(max-width: 414px)">
                                                            <img style={styles.sendImg} src={e.add_img}/>
                                                        </MediaQuery>
                                                        <MediaQuery query="(min-width: 415px)">
                                                            <ExifOrientationImg style={styles.sendImg} src={e.add_img}/>
                                                        </MediaQuery>
                                                    </div>
                                                )
                                            } else {
                                                return
                                            }
                                        })()}

                                    <p style={styles.msgDate} className={'from_date'}>{e.fromDate}</p>
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
                return value
            }
        })

        //todo:bootstrap navbar
        // var Navbar = ReactBootstrap.Navbar
        var navbarInstance = (
            <Navbar bg="origin" expand="lg" fixed="top">
                <Container>
                    <Navbar.Brand><img src={ChatIcon} /> <span style={styles.mainColor}>ANJ Simple Chat</span></Navbar.Brand>
                    <Nav>
                        {(() => {
                            if(this.state.user){
                                return <span>ようこそ！{this.state.user} さん</span>
                            }
                        })()}
                    </Nav>
                    <span>
                        <small style={styles.smallText}><i className="fas fa-user-friends"></i>参加ユーザー</small><br/>{showUserList}
                    </span>
                </Container>
            </Navbar>
        )
        return (
            <div>
            {(() => {
               if(this.state.check_token) {
                   return (
                       <div style={styles.bodyStyle}>
                           {navbarInstance}

                           <div className={'container'}>
                               <div className={'msg_list'}>
                                   {messages}
                                   {(() => {
                                       if(this.state.focus_status === true) {
                                           return (
                                               <p style={styles.smallText} className={'focus_status'}>
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
                               <div className="link_cc">
                                   データ送信の際は<a className={'btn btn-success'} href="https://www5.cloudcubez.jp/index.php/login" target={'_blank'}><i className="fas fa-cloud-upload-alt"></i>こちら</a>をご利用ください。
                               </div>
                           </div>
                           <div ref="messagesEnd">&nbsp;</div>
                       </div>
                   )
               }else {
                   return (
                       <div>
                           トークンエラーです！
                       </div>
                       )
               }
            })()}
            </div>
        )
    }
}




ReactDOM.render(
    <ChatApp />,
    document.getElementById('root'))
