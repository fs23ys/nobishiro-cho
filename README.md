# のびしろ帖

自分の長所・短所を日々記録し、週1回のペースで振り返るための個人用Webアプリ。
React + Vite / Firebase（Firestore + Authentication）/ GitHub Pages（ホスティング）構成。

公開URL: https://fs23ys.github.io/nobishiro-cho/

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

## デプロイ（GitHub Pages）

GitHubリポジトリ（`fs23ys/nobishiro-cho`、パブリック）に `main` ブランチをpushすると、
`.github/workflows/deploy.yml` のGitHub Actionsが自動でビルド・公開する。

1. リポジトリの「Settings」→「Pages」→「Build and deployment」→「Source」を `GitHub Actions` にする
2. 「Settings」→「Secrets and variables」→「Actions」で以下のRepository secretsを登録する（`.env` と同じ内容）
   - `VITE_FIREBASE_API_KEY` / `VITE_FIREBASE_AUTH_DOMAIN` / `VITE_FIREBASE_PROJECT_ID` / `VITE_FIREBASE_STORAGE_BUCKET` / `VITE_FIREBASE_MESSAGING_SENDER_ID` / `VITE_FIREBASE_APP_ID` / `VITE_ALLOWED_EMAIL`
3. `main` ブランチにpushすると、Actionsタブでワークフローが走り、完了後 `https://fs23ys.github.io/nobishiro-cho/` で公開される
4. 発行されるURL（`fs23ys.github.io`）を、Firebase Console の Authentication →「Settings」→「Authorized domains」に追加する（追加しないとGoogleログインがブロックされる）

以後は `main` ブランチにpushするたびに自動で再デプロイされる。

### Firebaseの設定（参考）

Firestore/Authenticationの設定手順は上記の通り。`firestore.rules` は Firebase Console の「ルール」タブから直接貼り付けて公開する運用としている（Firebase Hostingは使用していない）。
