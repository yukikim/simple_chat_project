import React from "react"
import ReactDOM from "react-dom"
import styles from './styles.js'

import ChatIcon from './images/chat_icon.png'


class SetUpApp extends React.Component {
    constructor (props) {
        super(props)
        this.state = {
            input_room: '',
            input_name: '',
            get_token: '',
            chatUrl: ''
        }
    }
    // コンポーネントがマウントされたとき --- (※5)
    componentDidMount () {

    }

    inputRoom(e) {
        this.setState({input_room: e.target.value})
    }
    inputName(e) {
        this.setState({input_name: e.target.value})
    }

    showUrl(){
        if(!this.state.input_room) {
            window.alert('ルームを入力してください')
        }else if(!this.state.input_name) {
            window.alert('名前を入力してください')
        }else {
            this.setState({chatUrl: 'http://localhost:3000?room=' + this.state.input_room + '&user=' + this.state.input_name})
        }
    }


    render () {
        console.log(this.state.input_room)
        console.log(this.state.input_name)
        return (
            <div>
                <h1>Simple Chat</h1>
                <img src={ChatIcon} />
                <div className={'input_box'}>
                    Room:<input name={'room'} type={'text'} onChange={e => this.inputRoom(e)} />
                    <br />
                    Name:<input name={'inputName'} type={'text'} onChange={e => this.inputName(e)} />

                </div>
                <button onClick={e => this.showUrl(e)}>チャットURLを取得する</button>
                <div className={'chat_link'}>
                    <a href={this.state.chatUrl} >{this.state.chatUrl}</a>
                </div>
            </div>
        )
    }
}




ReactDOM.render(
    <SetUpApp />,
    document.getElementById('root'))
