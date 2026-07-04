# のびしろ帖

自分の長所・短所を日々記録し、週1回のペースで振り返るための個人用Webアプリ。
React + Vite / Firebase（Firestore + Authentication + Hosting）構成。

## セットアップ

### 1. 依存関係のインストール

```
npm install
```

### 2. Firebaseプロジェクトの準備

[Firebase Console](https://console.firebase.google.com/) で以下を行う（詳細はセットアップ時のやり取りを参照）。

1. プロジェクトを新規作成
2. Authentication で「Google」を有効化（ユーザーの手動作成は不要。初回ログイン時に自動作成される）
3. Firestore Database を作成し、ルールを `firestore.rules` の内容に置き換えて公開
   - ルールはログインしたユーザーの中でも `fs.23ys@gmail.com` のみ許可するようにしている（他のGoogleアカウントは拒否）
4. Webアプリを登録し、`firebaseConfig` の値を取得

### 3. 環境変数の設定

`.env.example` を `.env` にコピーし、`firebaseConfig` の値と `VITE_ALLOWED_EMAIL`（ログインを許可するGoogleアカウント）を記入する。
このアプリはクライアント側でも `VITE_ALLOWED_EMAIL` と異なるアカウントでログインした場合は自動サインアウトする（実際のアクセス制御は上記Firestoreルールが担う）。

```
cp .env.example .env
```

### 4. 開発サーバー起動

```
npm run dev
```

## デプロイ（Firebase Hosting）

初回のみ:

```
npm install -g firebase-tools
firebase login
firebase use --add   # 作成したFirebaseプロジェクトを選択
```

デプロイ:

```
npm run build
firebase deploy
```

`firebase.json` は `dist` ディレクトリをHostingの公開先として設定済み。
`firestore.rules` は `firebase deploy --only firestore:rules` でも反映できる。
