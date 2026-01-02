# 実装計画 - レシーバー位置設定と物理演算の修正

レシーバーの初期位置を自由に変更できるようにし、物理演算（軌道最適化）の不具合を修正します。

## ユーザーレビューが必要な項目

> [!IMPORTANT]
> サーブ速度の上限を150km/hに制限します。これにより、以前設定できていた高速なサーブは自動的に150km/h以下に調整されるようになります。

## 変更内容

### 1. データモデルの拡張
`ServeConfig` にレシーバーの初期位置を追加します。

#### [MODIFY] [index.ts](file:///c:/Users/hoge/Documents/GitHub/TennisServeSimulator/src/types/index.ts)
- `ServeConfig` インターフェースに `receiverPositionX` と `receiverPositionZ` を追加。

### 2. 物理エンジンの修正
レシーバー位置を外部から受け取れるようにし、最適化ロジックを調整します。

#### [MODIFY] [PhysicsEngine.ts](file:///c:/Users/hoge/Documents/GitHub/TennisServeSimulator/src/core/PhysicsEngine.ts)
- `calculateReceiverAnalysis`: ハードコードされていたレシーバー開始位置を `config` から取得するように変更。
- `optimizeServe`: 
    - `maxSpeed` を 150km/h 相当に変更。
    - 2.5m打点での軌道異常を修正（探索ロジックの改善または許容誤差の調整）。
    - 探索範囲 `deg` を -20度〜45度程度に広げ、より高低差に対応できるようにする。

### 3. UIと操作性の向上
ドラッグ操作とスライダーによる設定機能を追加します。

#### [MODIFY] [ServeScene.tsx](file:///c:/Users/hoge/Documents/GitHub/TennisServeSimulator/src/features/serve/ServeScene.tsx)
- 初期 `config` にレシーバーの初期位置を追加。
- `receiverVisualizerRef` を使用したレシーバーのドラッグ操作を実装。
- ドラッグ中の `setConfig` 更新処理をターゲットとレシーバーで分岐。

#### [MODIFY] [ControlPanel.tsx](file:///c:/Users/hoge/Documents/GitHub/TennisServeSimulator/src/components/ControlPanel.tsx)
- `Receiver Settings` フィールドセットに `receiverPositionX` と `receiverPositionZ` のスライダーを追加。

## 検証計画

### 手動検証
1. **レシーバーのドラッグ**:
    - 青いレシーバーマーカーをドラッグして位置が変更されること、および解析結果（距離、難易度など）が即座に反映されることを確認。
2. **スライダーによる設定**:
    - Control Panel の新しいスライダーを使用してレシーバーの位置を変更できることを確認。
3. **2.5m打点での軌道**:
    - 打点高さを2.5mに変更した際、「着弾点」を移動させても軌道が極端に不自然（極端に高いロブなど）にならないことを確認。
4. **速度制限**:
    - ターゲットを移動させた際の自動最適化後の速度が150km/hを超えないことを確認。
