import { Vector3 } from 'three';

export interface ServeConfig {
  serveSpeed: number;             // km/h
  trajectoryPeakHeight: number;   // m (maximum height of trajectory)
  peakPosition: number;           // m (Z position where peak occurs, relative to net at Z=0)
  targetX: number;                // m (x coordinate)
  targetZ: number;                // m (z coordinate)
  serverHeight: number;           // m (height of serve impact)
  bounceVelocityRetention: number; // ratio
  reactionDelay: number;          // seconds
  serverPositionX: number;        // m
  showDimensions: boolean;
  receiverSpeed: number;          // m/s (receiver movement speed)
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

export interface ReceiverMovement {
  startPosition: Vector3;
  targetPosition: Vector3;
  movementPath: Vector3[];      // Animation path
  arrivalTime: number;          // Time to reach target position
  canReach: boolean;            // Whether receiver can reach the ball
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
  timingBuffer: number;          // Buffer time between arrival and ball contact (seconds)
  receiverMovement: ReceiverMovement;
}
