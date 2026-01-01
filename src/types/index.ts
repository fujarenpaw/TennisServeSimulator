import { Vector3 } from 'three';

export interface ServeConfig {
  serveSpeed: number;             // km/h
  launchAngle: number;            // degrees (vertical)
  targetX: number;                // m (x coordinate)
  targetZ: number;                // m (z coordinate)
  serverHeight: number;           // m (height of serve impact)
  bounceVelocityRetention: number; // ratio
  reactionDelay: number;          // seconds
  serverPositionX: number;        // m
  showDimensions: boolean;
}

export interface TrajectoryData {
  points: Vector3[];
  bouncePoint: Vector3;
  secondBounceZ: number;
  secondBounceX: number;
  bounceDistanceY: number; // note: in original code this was bounceDistanceZ named bounceDistanceY in return
  bounceDistanceX: number;
  bounceVelocityY: number; // note: in original code this was bounceVelocityZ named bounceVelocityY in return
  bounceVelocityX: number;
  timeToFirstBounce: number;
  targetX: number;
}

export interface AnalysisResult {
  receiverStart: { x: number; z: number };
  receiverTarget: { x: number; z: number };
  moveX: number;
  moveZ: number;
  totalDistance: number;
  receiveTime: number;
  effectiveTime: number;
  requiredSpeed: number;
  difficulty: string;
  bounceDistanceY: number; // referring to Z depth
  bounceDistanceX: number;
  bounceVelocityY: number; // referring to Z velocity
  bounceVelocityX: number;
}
