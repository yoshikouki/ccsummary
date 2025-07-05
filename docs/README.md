# ccsummary ドキュメント

Claude Code の日報生成ツール `ccsummary` の開発を通じて得られた知見と技術情報をまとめています。

## 📚 ドキュメント一覧

### 1. [Claude Directory Structure](./claude-directory-structure.md)
Claude Codeが使用する `~/.claude` ディレクトリの詳細な構造解析と、データフォーマットの仕様を解説しています。

**主な内容:**
- ディレクトリ構造の完全なマッピング
- JSONL形式の会話履歴フォーマット
- プロジェクト名のエンコーディング規則
- TODOリストのJSON構造

### 2. [Implementation Insights](./implementation-insights.md)
t-wadaさんとmizchiさんの設計思想に基づいた、実装上の知見と技術的な発見をまとめています。

**主な内容:**
- テスタブルな設計パターン
- TypeScriptでの型安全性
- CLI設計のベストプラクティス
- パフォーマンス最適化手法

### 3. [Claude Code Ecosystem](./claude-code-ecosystem.md)
Claude Code のエコシステム全体の理解と、ccsummaryの位置づけ、将来の発展可能性について考察しています。

**主な内容:**
- Claude Codeの基本概念
- データ永続化戦略
- 他ツールとの連携可能性
- セキュリティとプライバシーの考慮

### 4. [Troubleshooting](./troubleshooting.md)
よくある問題とその解決方法、デバッグ手法、パフォーマンス改善のヒントを提供しています。

**主な内容:**
- エラーメッセージと対処法
- パフォーマンスの問題解決
- デバッグ方法
- FAQ

## 🎯 このドキュメントの目的

1. **知識の保存**: コードを見なくても理解できる形で知識を保存
2. **再利用性**: 他のClaude Code関連ツール開発に活用可能
3. **コミュニティ貢献**: Claude Codeエコシステムの発展に寄与

## 🔍 重要な発見

### データ構造の特徴
- セッションベースの会話管理
- プロジェクトごとの独立性
- JSONL形式による効率的なストリーミング処理

### 設計上の知見
- Fail-Softなエラーハンドリング
- 型安全性とテスタビリティの両立
- ユーザー体験を重視したCLI設計

### 将来の可能性
- AIによる生産性分析
- チームコラボレーション機能
- 他の開発ツールとの統合

## 📝 貢献について

これらのドキュメントは、ccsummaryの開発過程で得られた知見をまとめたものです。新しい発見や改善提案がある場合は、プルリクエストを歓迎します。

## 📖 関連リソース

- [ccsummary README](../README.md)
- [Claude Code 公式ドキュメント](https://docs.anthropic.com/claude-code)
- [GitHub リポジトリ](https://github.com/yoshikouki/ccsummary)

---

*これらのドキュメントは、Claude Codeエコシステムの理解を深め、より良いツール開発を支援することを目的としています。*