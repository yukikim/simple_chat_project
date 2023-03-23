## チャットアプリ構築
URLパラメータでルームとユーザーを認識

#### ConoHa VPS

vps-2019-05-22-bot-api (118.27.3.109)  
IP:118.27.3.109

root:Anj@000525

- メモリ 1GB/CPU 2Core
- SSD 50GB
- ドメイン設定
- dedaman.com
- SSL証明:Let's Encrypt

- node v7.10.1
- nginx/1.16.1

---
**React にて構築**

**メインアプリ**

./src/client/index.js

#### build書き出しファイル
/usr/share/nginx/html/line

#### URL
https://dedaman.com/line?room=[トークン]&user=[ユーザー]

