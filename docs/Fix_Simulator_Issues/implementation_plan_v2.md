# 実装計画 v2

## ユーザー要望への対応
1. **ネット衝突**: ネットに当たった場合、その後の軌道（バウンドまで）を描画しない。
2. **ボールの視認性**: アニメーション時のボールを大きくし、色を見やすく調整（サイズ1.5倍、オレンジ色）。
3. **コート寸法表示**: コート上の全ての白線に寸法を表示する。

## 変更内容

### Core Logic

#### [MODIFY] [PhysicsEngine.ts](file:///c:/Users/hoge/Documents/GitHub/TennisServeSimulator/src/core/PhysicsEngine.ts)
- `calculateTrajectory` 内で衝突を検知した場合:
  - その時点で `trajectoryPoints` の生成を終了。
  - バウンド計算等の後続処理をスキップし、衝突地点を `bouncePoint` として扱う（または無効値を入れる）ことで、追加の線の描画を防ぎます。

### Graphics

#### [MODIFY] [BallVisualizer.ts](file:///c:/Users/hoge/Documents/GitHub/TennisServeSimulator/src/graphics/BallVisualizer.ts)
- `SphereGeometry` の半径を `0.1` → `0.15` に変更。
- 色を `0xffff00` (黄) → `0xffaa00` (オレンジ) に変更し、軌道（紫）とのコントラストを高めます。

#### [MODIFY] [CourtVisualizer.ts](file:///c:/Users/hoge/Documents/GitHub/TennisServeSimulator/src/graphics/CourtVisualizer.ts)
- `updateDimensions` を拡張し、以下のライン全てに寸法ラベルを配置します：
  - **ベースライン**: 10.97m
  - **サービスライン**: 8.23m (シングルス幅)
  - **センターサービスライン**: 12.8m (全長) または 6.4m (ネットから)
  - **シングルスサイドライン**: 23.77m
  - **ダブルスサイドライン**: 23.77m
  - **アレイ（ダブルスエリア）幅**: 1.37m

## 検証計画

### 手動検証
- **ネット衝突**: 高さ0.5mでサーブし、軌道がネットで完全に途切れることを確認。
- **ボール**: アニメーションを再生し、ボールが大きく見やすくなっていることを確認。
- **寸法**: 寸法表示ONにし、各ラインの横に数値が表示されていることを確認。
