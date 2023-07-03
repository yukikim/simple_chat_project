## チャットアプリ構築
URLパラメータでルームとユーザーを認識


- メモリ 1GB/CPU 2Core
- SSD 50GB
- ドメイン設定
- xxxxxxx
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
https://xxxxxxx/line?room=[トークン]&user=[ユーザー]

