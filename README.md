# ccsummary

Claude Code の使用状況を分析して日報を生成するCLIツールです。

## 概要

`ccsummary` は `~/.claude` ディレクトリの内容を解析し、プロジェクトごとの活動履歴、完了・未完了のタスク、統計情報などを含んだ日報を自動生成します。

## 機能

- 📊 Claude Code の使用状況分析
- 🚀 プロジェクトごとの活動履歴
- ✅ 完了・未完了タスクの追跡
- 📈 統計情報の表示
- 🎯 特定プロジェクトへのフィルタリング
- 📅 日付指定での分析
- 🖥️ インタラクティブなTUIダッシュボード
- 🔍 詳細なプロジェクト探索機能
- ⚡ リアルタイムダッシュボード

## インストール

```bash
npm install -g ccsummary
```

## 使用方法

### インタラクティブモード（推奨）

```bash
# デフォルト：インタラクティブモード（TTY環境）またはダッシュボード
ccsummary

# 明示的にインタラクティブモードを起動
ccsummary interactive

# ダッシュボードモードを起動
ccsummary dashboard

# 特定の日付でダッシュボードを表示
ccsummary dashboard --date 2025-07-05
```

### 基本的な使用方法

```bash
# 今日の日報を生成
ccsummary generate

# 特定の日付の日報を生成
ccsummary generate --date 2025-07-05

# 特定のプロジェクトのみの日報を生成
ccsummary generate --project myproject

# 出力ディレクトリを指定
ccsummary generate --output ~/my-reports
```

### プロジェクト一覧の確認

```bash
# 利用可能なプロジェクトを一覧表示
ccsummary list
```

### コマンド一覧

#### デフォルトコマンド
```bash
ccsummary  # インタラクティブモード（TTY環境）またはダッシュボード
```

#### interactive コマンド
```bash
ccsummary interactive [options]
```
- `-d, --date <date>`: 対象日付 (YYYY-MM-DD形式、デフォルト: 今日)
- `--claude-dir <path>`: .claude ディレクトリのパス (デフォルト: ~/.claude)

#### dashboard コマンド
```bash
ccsummary dashboard [options]
```
- `-d, --date <date>`: 対象日付 (YYYY-MM-DD形式、デフォルト: 今日)
- `-p, --project <name>`: 特定プロジェクト名でフィルタリング
- `--claude-dir <path>`: .claude ディレクトリのパス (デフォルト: ~/.claude)

#### generate コマンド
```bash
ccsummary generate [options]
```
- `-d, --date <date>`: 対象日付 (YYYY-MM-DD形式、デフォルト: 今日)
- `-o, --output <path>`: 出力ディレクトリ (デフォルト: ~/ccsummary)
- `-p, --project <name>`: 特定プロジェクト名でフィルタリング
- `--claude-dir <path>`: .claude ディレクトリのパス (デフォルト: ~/.claude)

#### list コマンド
```bash
ccsummary list [options]
```
- `--claude-dir <path>`: .claude ディレクトリのパス (デフォルト: ~/.claude)

## TUI機能

### インタラクティブモード
- 📁 プロジェクト選択画面
- 🌐 全プロジェクト統合表示
- 📂 個別プロジェクト詳細表示
- 🔍 プロジェクト詳細探索

### 各プロジェクトで確認できる情報
- 📊 概要（統計情報、セッション詳細、最近の活動）
- 💬 プロンプト詳細（全ユーザーメッセージ）
- ✅ TODO管理（完了・進行中・未着手）
- 🗣️ 対話詳細（セッション別メッセージ表示）

### キーボードショートカット
- `↑↓` / `j/k`: 移動
- `Enter`: 選択/詳細表示
- `1-3`: タブ切り替え
- `b` / `Backspace`: 戻る
- `d`: 詳細表示（プロジェクト画面で）
- `q` / `Escape`: 終了

## 出力例

生成される日報には以下の情報が含まれます：

- 📊 活動概要（プロジェクト数、セッション数、メッセージ数）
- 🚀 プロジェクト別活動（主な活動、完了・未完了タスク）
- 📈 統計情報（タスク完了率、最も活発なプロジェクト）

## 開発

```bash
# 依存関係のインストール
pnpm install

# 開発モードでの実行
pnpm dev

# ビルド
pnpm build

# テスト実行
pnpm test

# リンター実行
pnpm lint

# フォーマッター実行
pnpm format
```

## ライセンス

MIT

## 貢献

プルリクエストやIssueを歓迎します。