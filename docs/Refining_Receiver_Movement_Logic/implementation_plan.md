# テニスサーブシミュレーター改善実装計画

## 概要

テニスサーブシミュレーターに以下の3つの改善を実装します：

1. **レシーバーアニメーション**: サーブ時にレシーバーがボールに向かって移動
2. **カメラ視点制限**: カメラの回転を0-180度に制限
3. **軌道安定性**: パラメーター変更時の軌道の一貫性を改善

## User Review Required

> [!WARNING]
> **軌道安定性の問題**
> 
> 現在の `optimizeServe` 関数は、速度を変更すると異なる軌道パラメーター（peakHeight, peakPosition）を返します。これにより、速度を元に戻しても軌道が変わってしまいます。
> 
> 解決策：
> - ユーザーが着弾点をドラッグした場合のみ、`optimizeServe` を使用して物理パラメーターを自動調整
> - ユーザーが物理パラメーター（速度、軌道高さ、ピーク位置）を直接変更した場合は、着弾点を再計算して表示

## Proposed Changes

### Core Layer

#### [MODIFY] [index.ts](file:///c:/Users/hoge/Documents/GitHub/TennisServeSimulator/src/types/index.ts)

型定義にレシーバー移動速度パラメーターを追加：

```typescript
export interface ServeConfig {
  // ... 既存のフィールド
  receiverSpeed: number;        // m/s (レシーバーの移動速度)
}

export interface ReceiverMovement {
  startPosition: Vector3;
  targetPosition: Vector3;
  movementPath: Vector3[];      // アニメーション用の経路
  arrivalTime: number;          // 目標位置に到達する時間
  canReach: boolean;            // 到達可能かどうか
}

export interface AnalysisResult {
  // ... 既存のフィールド
  receiverMovement: ReceiverMovement;
}
```


---

#### [MODIFY] [PhysicsEngine.ts](file:///c:/Users/hoge/Documents/GitHub/TennisServeSimulator/src/core/PhysicsEngine.ts)

レシーバー移動計算とパラメーター管理の改善：

1. **新しいメソッド追加**:
   - `calculateReceiverMovement()`: レシーバーの移動経路を計算
   - `calculateActualLanding()`: 現在のパラメーターから実際の着弾点を計算

2. **`calculateReceiverAnalysis()` の拡張**:
   - レシーバーの移動経路を含む詳細な分析を返す
   - 深いボール（Z > 5m）と浅いボール（Z <= 5m）で異なる移動パターン
   - 深いボール: 主にX方向の移動
   - 浅いボール: X/Z両方向の移動

3. **`optimizeServe()` の改善**:
   - 現在の軌道パラメーターを可能な限り保持
   - 速度変更時は軌道形状を維持

---

### Graphics Layer

#### [NEW] [ReceiverVisualizer.ts](file:///c:/Users/hoge/Documents/GitHub/TennisServeSimulator/src/graphics/ReceiverVisualizer.ts)

レシーバーの視覚化とアニメーションを管理：

```typescript
export class ReceiverVisualizer {
  private receiverMesh: THREE.Mesh;
  private targetMesh: THREE.Mesh;
  private pathLine: THREE.Line;
  
  updateReceiverAnimation(movement: ReceiverMovement, progress: number): void;
  showMovementPath(path: Vector3[]): void;
  reset(): void;
}
```

---

### UI Layer

#### [MODIFY] [ControlPanel.tsx](file:///c:/Users/hoge/Documents/GitHub/TennisServeSimulator/src/components/ControlPanel.tsx)

レシーバー設定セクションを追加：

- 移動速度スライダー (2.0 - 8.0 m/s)


---

#### [MODIFY] [AnalysisPanel.tsx](file:///c:/Users/hoge/Documents/GitHub/TennisServeSimulator/src/components/AnalysisPanel.tsx)

レシーバー分析結果の表示を追加：

- 到達可能性の表示
- 必要な移動速度 vs 設定速度の比較
- 移動方向（X/Z）の内訳

---

### Feature Layer

#### [MODIFY] [ServeScene.tsx](file:///c:/Users/hoge/Documents/GitHub/TennisServeSimulator/src/features/serve/ServeScene.tsx)

1. **カメラ制限の追加**:
```typescript
controls.minAzimuthAngle = 0;
controls.maxAzimuthAngle = Math.PI; // 180度
```

2. **ReceiverVisualizerの統合**:
   - ReceiverVisualizerのインスタンスを作成
   - アニメーション中にレシーバーを更新

3. **パラメーター変更ハンドリングの改善**:
   - ドラッグ操作と直接パラメーター変更を区別
   - 直接変更時は着弾点を再計算

---

## Verification Plan

### Automated Tests

現時点では自動テストは実装しませんが、以下の手動テストを実施します。

### Manual Verification

1. **レシーバーアニメーション**:
   - [ ] アニメーション再生時にレシーバーが移動することを確認
   - [ ] 深いボール（Z > 5m）で主にX方向に移動することを確認
   - [ ] 浅いボール（Z <= 5m）でX/Z両方向に移動することを確認
   - [ ] レシーバー速度パラメーターを変更して動きが変わることを確認
   - [ ] 到達不可能なサーブで適切に表示されることを確認

2. **カメラ視点制限**:
   - [ ] マウスドラッグでカメラを回転
   - [ ] 0度未満、180度以上に回転できないことを確認
   - [ ] コートの裏側が見えないことを確認

3. **軌道安定性**:
   - [ ] 着弾点を設定し、パラメーターが自動調整されることを確認
   - [ ] サーブ速度を下げてから元に戻す
   - [ ] 着弾点が元の位置に戻ることを確認（または許容範囲内のずれ）
   - [ ] 軌道パラメーターを直接変更した場合、着弾点が再計算されることを確認
