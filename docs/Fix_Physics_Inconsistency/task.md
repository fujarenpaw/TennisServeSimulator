# Task List

- [x] Analyze `CourtConstants.ts` and `PhysicsEngine.ts` to map coordinate system. <!-- id: 0 -->
- [x] Create `implementation_plan.md` in `docs/Fix_Physics_Inconsistency/`. <!-- id: 1 -->
- [x] Refactor `ControlPanel.tsx`:
    - [x] Remove `trajectoryPeakPosition`.
    - [x] Remove `bounceDirection` (fixed enum).
    - [x] Create `Landing Position` controls (X slider, Z/Depth slider).
    - [x] (Optional) Visualize landing spot on a mini-map? Or just use sliders first.
- [x] Refactor `PhysicsEngine.ts`:
    - [x] Implement `calculateBallisticTrajectory(start, end, speed)`.
    - [x] Remove artificial sin/cos spline logic.
    - [x] Handle "Net Collision" with the new physics path.
- [x] Verify functionality (Walkthrough). <!-- id: 5 -->

## Phase 2: Refinement
- [x] Update `ServeConfig` to include `serverHeight`. <!-- id: 6 -->
- [x] Update `PhysicsEngine.ts` to use configurable `serverHeight`. <!-- id: 7 -->
- [x] Reorganize `ControlPanel.tsx`: <!-- id: 8 -->
    - [x] Group settings (Server, Target, Physics).
    - [x] Add `serverHeight` slider (50-250cm).
- [x] Update `ServeScene.tsx` visualization for server marker. <!-- id: 9 -->

## Phase 3: Intuitive Trajectory Controls
- [x] Replace `launchAngle` with `trajectoryPeakHeight` and `peakPosition` in `ServeConfig`. <!-- id: 10 -->
- [x] Update `PhysicsEngine.ts` to calculate launch angle from peak height/position. <!-- id: 11 -->
- [x] Update `ControlPanel.tsx` to show new sliders. <!-- id: 12 -->
- [x] Update bidirectional sync logic in `ControlPanel.tsx`. <!-- id: 13 -->
