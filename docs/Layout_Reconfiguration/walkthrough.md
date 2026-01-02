# レイアウト再構成の修正内容

分析結果の視認性を高めるため、画面構成を全面的に刷新しました。

## 変更内容

### 画面レイアウトの最適化 (`src/features/serve/ServeScene.tsx`)

- **2カラム構成の導入**: 画面上部を Flexbox を用いて分割し、**左側 2/3 を 3D シミュレーター**、**右側 1/3 を分析結果パネル**として配置しました。
- **独立したスクロール**: 右側の分析パネルは独立してスクロール可能（`overflowY: 'auto'`）となっており、シミュレーターを常に確認しながら詳細なデータを確認できます。
- **固定コントロールエリア**: 下部 300px をコントロール専用エリアとし、設定変更と分析結果を同時に目視できるようにしました。

### コンポーネントのデザイン調整 (`src/components/AnalysisPanel.tsx`)

- **サイドパネルへの最適化**: 上部の不要なマージンを削除し、カードのような影（`boxShadow`）を追加することで、サイドパネルとして情報の区切りが明確になるよう調整しました。

## 確認事項

- 画面左側でシミュレーターを操作しながら、右側の数値がリアルタイムに更新されることを確認してください。
- ウィンドウサイズをリサイズした際、2:1 の比率が保持され、情報の重なりが発生しないことを確認してください。

render_diffs(file:///c:/Users/hoge/Documents/GitHub/TennisServeSimulator/src/features/serve/ServeScene.tsx)
render_diffs(file:///c:/Users/hoge/Documents/GitHub/TennisServeSimulator/src/components/AnalysisPanel.tsx)
