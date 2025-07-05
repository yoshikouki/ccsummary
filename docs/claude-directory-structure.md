# Claude Code ディレクトリ構造の解析

## 概要

Claude Codeは `~/.claude` ディレクトリに全ての設定、会話履歴、TODOリストを保存します。このドキュメントでは、開発中に発見したディレクトリ構造とデータフォーマットについて詳しく説明します。

## ディレクトリ構造

```
~/.claude/
├── CLAUDE.md              # グローバル設定（ユーザー指示）
├── commands/              # カスタムコマンド定義
├── ide/                   # IDE統合設定
├── local/                 # ローカル設定
├── projects/              # プロジェクト別の会話履歴
├── settings.json          # 基本設定
├── settings.local.json    # ローカル設定
├── statsig/               # 統計情報
└── todos/                 # TODOリスト
```

## プロジェクトディレクトリ

### エンコーディング規則

プロジェクトディレクトリ名は、実際のファイルシステムパスをエンコードした形式で保存されます：

- パスの先頭に `-` を追加
- パス区切り文字 `/` を `-` に置換

例：
- `/home/user/project` → `-home-user-project`
- `/home/yoshikouki/src/github.com/yoshikouki/ccsummary` → `-home-yoshikouki-src-github-com-yoshikouki-ccsummary`

### 会話履歴フォーマット (JSONL)

各プロジェクトディレクトリ内には、セッションごとにJSONL形式のファイルが保存されます：

```jsonl
{"parentUuid":null,"isSidechain":false,"userType":"external","cwd":"/path/to/project","sessionId":"uuid","version":"1.0.43","type":"user","message":{"role":"user","content":"ユーザーメッセージ"},"uuid":"message-uuid","timestamp":"2025-07-05T02:55:10.723Z"}
{"parentUuid":"parent-uuid","isSidechain":false,"userType":"external","cwd":"/path/to/project","sessionId":"uuid","version":"1.0.43","message":{"id":"msg_id","type":"message","role":"assistant","model":"claude-sonnet-4-20250514","content":[{"type":"text","text":"アシスタントの応答"}],"stop_reason":null,"stop_sequence":null,"usage":{...}},"requestId":"req_id","type":"assistant","uuid":"message-uuid","timestamp":"2025-07-05T02:55:19.518Z"}
```

#### 重要なフィールド

- `sessionId`: セッションを識別するUUID
- `cwd`: 作業ディレクトリのパス
- `message.role`: "user" または "assistant"
- `message.content`: メッセージ内容（文字列または配列）
- `timestamp`: ISO 8601形式のタイムスタンプ
- `uuid`: メッセージごとのユニークID
- `parentUuid`: 親メッセージのUUID（会話の流れを追跡）

## TODOリスト

### ファイル命名規則

TODOファイルは以下の形式で保存されます：
```
{sessionId}-agent-{agentId}.json
```

### JSONフォーマット

```json
[
  {
    "content": "タスクの内容",
    "status": "pending" | "in_progress" | "completed",
    "priority": "high" | "medium" | "low",
    "id": "unique-id"
  }
]
```

### 状態管理

- `pending`: 未着手のタスク
- `in_progress`: 実行中のタスク（同時に1つのみ推奨）
- `completed`: 完了したタスク

## コマンド定義

`commands/` ディレクトリ内のマークダウンファイルで、カスタムコマンドが定義されます：

### ファイル例: `check-similarity.md`

```markdown
# similarity-ts: AI Assistant Guide

## Purpose
Detects duplicate TypeScript/JavaScript code using AST comparison for refactoring.

## AI用プロンプト / AI Prompt
...
```

## 解析時の考慮事項

### 1. エラーハンドリング

- 無効なJSON行はスキップ
- 不完全なセッションファイルは無視
- アクセス権限エラーは警告として処理

### 2. パフォーマンス最適化

- 大量のファイルに対して並列処理を検討
- 日付フィルタリングは早期に適用
- メモリ効率を考慮したストリーミング処理

### 3. データの整合性

- セッションIDでメッセージをグルーピング
- タイムスタンプでソート
- 重複したTODOエントリの排除

## セキュリティ考慮事項

1. **機密情報の扱い**
   - 会話履歴に含まれる可能性のある機密情報
   - 環境変数や認証情報のフィルタリング

2. **アクセス制御**
   - ユーザーの~/.claudeディレクトリのみアクセス
   - 相対パスの検証

3. **出力の安全性**
   - HTMLエスケープは不要（Markdown出力）
   - ファイルパスの適切な処理

## まとめ

Claude Codeのデータ構造は：
- 明確で予測可能なディレクトリ構造
- 標準的なJSONL/JSONフォーマット
- セッションベースの会話管理
- プロジェクトごとの独立性

これらの特性により、効率的な解析と日報生成が可能になっています。