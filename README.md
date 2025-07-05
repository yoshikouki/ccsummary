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

## インストール

```bash
npm install -g ccsummary
```

## 使用方法

### 基本的な使用方法

```bash
# 今日の日報を生成
npx ccsummary@latest generate

# 特定の日付の日報を生成
npx ccsummary@latest generate --date 2025-07-05

# 特定のプロジェクトのみの日報を生成
npx ccsummary@latest generate --project myproject

# 出力ディレクトリを指定
npx ccsummary@latest generate --output ./my-reports
```

### プロジェクト一覧の確認

```bash
# 利用可能なプロジェクトを一覧表示
npx ccsummary@latest list
```

### オプション一覧

#### generate コマンド

- `-d, --date <date>`: 対象日付 (YYYY-MM-DD形式、デフォルト: 今日)
- `-o, --output <path>`: 出力ディレクトリ (デフォルト: ./reports)
- `-p, --project <name>`: 特定プロジェクト名でフィルタリング
- `--claude-dir <path>`: .claude ディレクトリのパス (デフォルト: ~/.claude)

#### list コマンド

- `--claude-dir <path>`: .claude ディレクトリのパス (デフォルト: ~/.claude)

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