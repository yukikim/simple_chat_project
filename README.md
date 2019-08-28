# チャットアプリ構築
URLパラメータでルームとユーザーを認識

WebsocketAPIはexpressで構築  
フロントはreact

    e.g, http://localhost:3000?room=test&user=kimura

- room=ルーム名：同じルーム名で参加できる
- user=ユーザー名：参加時の名前
パラメータなしで、だれでも参加できる

~~## スタートページをexpressで構築する~~
- ルーム設定
- ユーザー設定
- トークン発行

~~上記を設定してリンクURLを表示する~~

チャットのURLを出力するための設定アプリを作成する

src/


---

# React 開発環境構築

react の基本開発環境の構築です。

**express** and **react** 構築

### webpack導入

    $ npm i -D webpack-cli webpack webpack-dev-server html-webpack-plugin
    
- webpack-dev-server >> HMRやProxyを提供する開発用Server
- html-webpack-plugin >> distされたscriptをhtmlに埋め込んで出力する

### babel 導入

    $ npm i -D babel-core babel-loader@7 babel-preset-env babel-preset-react
    
### ES6 での記述を可能に

### loader 導入
    $ npm i -D css-loader style-loader

### React 導入
    $ npm i -S react react-dom

## 基本ファイル作成
#### src/client/index.html
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta http-equiv="X-UA-Compatible" content="ie=edge">
        <title>React and Webpack4</title>
    </head>
    <body>
    <section id="index"></section>
    </body>
    </html>

#### src/client/index.js
    import React from "react";
    import ReactDOM from "react-dom";

    const Index = () => {
      return <div>Hello React!</div>;
    };

    ReactDOM.render(<Index />, document.getElementById("index"));

#### config/webpack.config.js
    const HtmlWebPackPlugin = require("html-webpack-plugin");
    const path = require('path')

    const htmlWebpackPlugin = new HtmlWebPackPlugin({
      template: "./src/client/index.html",
      filename: "./index.html"
    });
     module.exports = {
      entry: "./src/client/index.js",
      output: {
        path: path.resolve('dist'),
        filename: '[name].js'
      },
      module: {
        rules: [
          {
            test: /\.js$/,
            exclude: /node_modules/,
            use: {
              loader: "babel-loader"
            }
          },
          {
            test: /\.css$/,
            use: ["style-loader", "css-loader"]
          }
        ]
      },
      plugins: [htmlWebpackPlugin]
    };

#### .babelrc
    {
      "presets": ["env", "react"]
    }

#### pacage.json 追記
    "scripts": {
        "client": "webpack-dev-server --config ./config/webpack.config.js --open --mode development",
        "build": "webpack --config ./config/webpack.config.js --mode development"
      },

- client	front 開発サーバーを立ち上げます
- build	front コードをビルドします


## express 構築

    $ npm i -S express

### babel 導入
    $ npm i -D babel-preset-es2015 babel-preset-stage-0 babel-cli

### .babelrc に追記
    {
      "presets": ["env", "react", "es2015", "stage-0"]
    }

### 開発用ユーティリティ
    $ npm i -D nodemon concurrently
    
- nodemon	対象のファイルを監視しnodeプロセスを再起動する
- concurrently	複数のコマンドを並列に実行する

## express 基本ファイル作成

#### src/server/server.js
    import express from 'express';
    import path from 'path';

    const app = express();

    app.use(express.static(path.join('./', 'dist')));

    app.get('/api', (req, res) => {
      res.send({api: 'test'});
    })

    app.get('*', function (req, res) {
        res.sendFile(path.resolve(__dirname, '../../dist/index.html'))
    })

    app.listen(3000, ()=> {
      console.log('server running');
    })

### package.json に追記
    "scripts": {
     "server": "nodemon src/server/server.js  --exec babel-node",
      "dev": "concurrently \"npm run client\" \"npm run server\""

### CORS対策 Proxyをたてる

    $ npm i -D webpack-merge

#### config/webpack.config.dev.js

    const merge = require('webpack-merge');
    const webpackConfig = require('./webpack.config.js');

    module.exports = merge(webpackConfig, {
      mode: 'development',
      devServer: {
        historyApiFallback: true,
        inline: true,
        open: true,
        host: 'localhost',
        port: 8080,
        proxy: {
          '/api/**': {
            target: 'http://localhost:3000',
            secure: false,
            logLevel: 'debug'
          }
        },
      }
    })

### pacage.json 編集
    "scripts": {
        "server": "nodemon src/server/server.js  --exec babel-node",
        "client": "webpack-dev-server --config ./config/webpack.config.dev.js",
        "build": "webpack --config ./config/webpack.config.js --mode production",
        "dev": "NODE_ENV=development concurrently \"npm run client\" \"npm run server\"",
        "start": "NODE_ENV=production npm run build && npm run server"
      },
      
- server	:expressの立ち上げ
- client	:webpack-dev-serverの立ち上げ
- build	:frontコードのコンパイル
- dev	    :開発モード。expressサーバーとwebpack-dev-serverが立ち上がる
- start	:本番モード。frontコードをコンパイルし、expressを立ち上げる

#### src/client/index.js
    import React from "react";
    import ReactDOM from "react-dom";

    fetch('/api/').then(response => {
      console.log(response.json());
    })

    export const Index = () => {
      return <div>Hello React!</div>;
    };

    ReactDOM.render(<Index />, document.getElementById("index"));

---

## configrationの導入 

#### configrationは環境によって設定を切り替える際に利用する機能です

$ npm i config

ファイル追加

#### config/default.yml

    server:
        port: 3000

#### config/development.yml

    server:
        port: 3000

#### config/production.yml

    server:
        port: 3000

### server.js の修正

    import express from 'express';
    import path from 'path';
    import config from 'config';

    const app = express();

    const serverConfig = config.get('server');

    app.use(express.static(path.join('./', 'dist')));

    app.get('/api', (req, res) => {
      res.send({data: 'test'});
    })

    app.get('*', function (req, res) {
      res.sendFile(path.join('./', 'dist', 'index.html'))
    })

    app.listen(serverConfig.port, ()=> {
      console.log(`server starting -> [port] ${serverConfig.port} [env] ${process.env.NODE_ENV}`);
    })

---

### logging .導入
    $ npm i log4js

#### default.yml
    log:
      appenders:
        console:
          type: console
          category: system
        file:
          type: dateFile
          filename: logs/system.log
          pattern: "-yyyy-MM-dd"
          alwaysIncludePattern: false
          category: system
      categories:
        default:
          appenders:
          - console
          - file
          level: info
        error:
          appenders:
          - console
          - file
          level: error

#### src/server/logger.js
    import { getLogger, configure } from 'log4js';
    import config from 'config';
    configure(config.get('log'));

    class Log {
      constructor() {
        this.logger = getLogger();
      }
       info(log) {
        this.logger.info(log);
      }
       error(log) {
        this.logger.error(log);
      }
    }

    export const logger = new Log();

#### src/server/server.js
    app.listen(serverConfig.port, ()=> {
      logger.info(`server starting -> [port] ${serverConfig.port} [env] ${process.env.NODE_ENV}`)
    })

---

### Test 導入

### mocha

    $ npm i -D chai mocha sinon
    $ npm i -D enzyme enzyme-adapter-react-16 jsdom react-addons-test-utils chai-enzyme

#### test/enzyme.js
    const { JSDOM } = require('jsdom');

    const jsdom = new JSDOM('<!doctype html><html><body></body></html>');
    const { window } = jsdom;

    function copyProps(src, target) {
      Object.defineProperties(target, {
        ...Object.getOwnPropertyDescriptors(src),
        ...Object.getOwnPropertyDescriptors(target),
      });
    }

    global.window = window;
    global.document = window.document;
    global.navigator = {
      userAgent: 'node.js',
    };
    global.requestAnimationFrame = function (callback) {
      return setTimeout(callback, 0);
    };
    global.cancelAnimationFrame = function (id) {
      clearTimeout(id);
    };
    copyProps(window, global);

    const Adapter = require('enzyme-adapter-react-16')

    require('enzyme').configure({adapter: new Adapter()})

    import { Index } from '../../src/client'
    import React from "react"
    import { expect } from 'chai'
    import { shallow } from 'enzyme';

    describe('react test sample', () => {
      it('rendering <div>Hello React!</div>', () => {
        const result = shallow(<Index />).contains(<div>Hello React!</div>)
        expect(result).to.be.true
      });
    });

### package.json 追記

    "scripts": {
        "test": "mocha --require ./test/enzyme.js --compilers js:babel-register --recursive $(find test -name '*.spec.js')",
    

---
#### $ npm run test

