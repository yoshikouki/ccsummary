# トラブルシューティングガイド

## よくある問題と解決方法

### 1. "~/.claude directory not found" エラー

**症状**
```bash
Error: ENOENT: no such file or directory, scandir '/home/user/.claude/projects'
```

**原因**
- Claude Codeがインストールされていない
- まだ一度もClaude Codeを使用していない

**解決方法**
```bash
# Claude Codeをインストール
npm install -g @anthropic/claude-code

# 一度実行して初期化
claude-code --version
```

### 2. レポートが空になる

**症状**
- プロジェクト数が0と表示される
- 活動が記録されていない

**原因**
- 指定した日付に活動がない
- プロジェクト名フィルターが一致しない

**解決方法**
```bash
# 利用可能なプロジェクトを確認
ccsummary list

# 日付を変更して再試行
ccsummary generate --date 2025-07-04

# フィルターを確認
ccsummary generate --project "正確なプロジェクト名"
```

### 3. JSONパースエラー

**症状**
```
Warning: Failed to parse JSON in session file
```

**原因**
- 破損したJSONLファイル
- 不完全な書き込み

**解決方法**
- 警告は無視しても問題ない（他の有効な行は処理される）
- 頻発する場合は、該当ファイルを確認：
```bash
# 問題のあるファイルを特定
find ~/.claude/projects -name "*.jsonl" -exec sh -c 'jq . {} > /dev/null 2>&1 || echo "Invalid: {}"' \;
```

### 4. メモリ不足エラー

**症状**
```
FATAL ERROR: Reached heap limit Allocation failed
```

**原因**
- 非常に大きなセッションファイル
- 長期間の活動履歴

**解決方法**
```bash
# Node.jsのメモリ制限を増やす
NODE_OPTIONS="--max-old-space-size=4096" ccsummary generate

# または期間を限定
ccsummary generate --date 2025-07-05 --project specific-project
```

### 5. 権限エラー

**症状**
```
Error: EACCES: permission denied, open '/home/user/.claude/...'
```

**原因**
- ファイルの権限設定
- 別のユーザーで実行したClaude Code

**解決方法**
```bash
# 権限を修正
chmod -R u+r ~/.claude

# 所有者を確認
ls -la ~/.claude
```

## パフォーマンスの問題

### 遅い分析速度

**最適化方法**

1. **特定のプロジェクトに絞る**
```bash
ccsummary generate --project myproject
```

2. **期間を限定する**
```bash
ccsummary generate --date 2025-07-05
```

3. **不要なファイルをクリーンアップ**
```bash
# 古いセッションファイルを削除（30日以上前）
find ~/.claude/projects -name "*.jsonl" -mtime +30 -delete
```

### メモリ使用量が多い

**対策**

1. **ストリーミング処理の活用**（将来の機能）
2. **バッチ処理の調整**
3. **キャッシュの活用**

## デバッグ方法

### 1. 詳細ログの有効化

```bash
# 環境変数でデバッグモードを有効化（将来実装予定）
DEBUG=ccsummary:* ccsummary generate
```

### 2. 中間データの確認

```typescript
// デバッグ用のコードを追加
console.log('Projects found:', projects.length);
console.log('Sessions analyzed:', sessions.length);
```

### 3. 単体での動作確認

```bash
# Node.jsで直接実行
node -e "
const { analyzeClaudeDirectory } = require('./dist/core/analyzer');
analyzeClaudeDirectory('~/.claude').then(console.log).catch(console.error);
"
```

## エラー報告の方法

問題が解決しない場合は、以下の情報を含めてIssueを作成してください：

1. **環境情報**
```bash
node --version
npm --version
ccsummary --version
uname -a
```

2. **エラーメッセージ**
- 完全なエラーメッセージ
- スタックトレース

3. **再現手順**
- 実行したコマンド
- 期待した結果
- 実際の結果

4. **関連ファイル**（機密情報を除く）
- 問題のあるJSONLファイルの一部
- 設定ファイル

## FAQ

**Q: 日報を自動生成できますか？**
A: はい、cronやGitHub Actionsを使用して自動化できます。

**Q: 複数ユーザーの日報をまとめられますか？**
A: 現在は単一ユーザーのみ対応です。将来的にチーム機能を検討しています。

**Q: 過去のデータを一括で分析できますか？**
A: スクリプトで日付をループすることで可能です：
```bash
for date in {1..30}; do
  ccsummary generate --date $(date -d "$date days ago" +%Y-%m-%d)
done
```

**Q: レポートのフォーマットをカスタマイズできますか？**
A: 現在はMarkdownのみですが、将来的にテンプレート機能を追加予定です。

## サポート

- GitHub Issues: [github.com/yoshikouki/ccsummary/issues](https://github.com/yoshikouki/ccsummary/issues)
- ドキュメント: [docs/](./)