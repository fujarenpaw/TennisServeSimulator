# 実装計画 - 物理演算の精度向上とUI改善

高い打点での軌道最適化を改善し、ターゲットマーカーの操作性を向上させます。

## ユーザーレビューが必要な項目

> [!NOTE]
> ターゲットマーカー（着弾点の緑の円）のサイズ設定箇所は [TrajectoryVisualizer.ts:L24](file:///c:/Users/hoge/Documents/GitHub/TennisServeSimulator/src/graphics/TrajectoryVisualizer.ts#L24) です。今回の修正でここを大きく変更します。

## 変更内容

### 1. 物理エンジンの修正
フラットな（角度が低い）軌道を優先するように、最適化アルゴリズムを調整します。

#### [MODIFY] [PhysicsEngine.ts](file:///c:/Users/hoge/Documents/GitHub/TennisServeSimulator/src/core/PhysicsEngine.ts)
- `findLaunchAngleForDistance`: 
    - 単純な「最小誤差」ではなく、「一定の許容誤差（0.1m以内）を満たす中で最も低い角度」を返すように変更します。
    - これにより、高い打点から打ち下ろすような直線的な軌道が優先的に選択されるようになります。

### 2. UIの改善
ドラッグしやすくするためにマーカーのサイズを調整します。

#### [MODIFY] [TrajectoryVisualizer.ts](file:///c:/Users/hoge/Documents/GitHub/TennisServeSimulator/src/graphics/TrajectoryVisualizer.ts)
- `targetMarker` の半径を `0.2` から `0.4` に拡大します。

## 検証計画

### 手動検証
1. **高い打点での軌道**:
    - 打点高さを3mに設定し、ターゲットをサービスライン付近に置いたとき、山なりの軌道（ロブ）ではなく、直線的な軌道になることを確認。
2. **操作性の確認**:
    - 緑のターゲットマーカーが大きくなり、マウスや指で掴みやすくなっていることを確認。
