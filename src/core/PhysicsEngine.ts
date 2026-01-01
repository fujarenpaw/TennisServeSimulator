import { Vector3 } from 'three';
import { COURT_CONSTANTS } from './CourtConstants';
import type { ServeConfig, TrajectoryData, AnalysisResult } from '../types';

export class PhysicsEngine {
    static calculateTrajectory(config: ServeConfig): TrajectoryData {
        const speedMs = config.serveSpeed / 3.6;
        const trajectoryPoints: Vector3[] = [];
        // bounceY in logic corresponds to Z coordinate on court
        const bounceZ = COURT_CONSTANTS.baselineToServiceLine - config.bounceDepth;

        let targetX = 0;

        if (config.bounceDirection === 'wide') {
            targetX = COURT_CONSTANTS.centerToSinglesLine;
        } else if (config.bounceDirection === 'body') {
            targetX = COURT_CONSTANTS.centerToSinglesLine * 0.5;
        } else {
            targetX = 0;
        }

        const startX = config.serverPositionX;
        const startY = 1.0;
        const startZ = -COURT_CONSTANTS.length / 2;

        // Calculate distance to first bounce target
        // bounceZ is relative to service line or something? 
        // In original code: bounceY = COURT.baselineToServiceLine - bounceDepth;
        // And distance calc: Math.pow(bounceY - startZ, 2)
        // Wait, let's verify coordinate system.
        // Original: 
        // startZ = -COURT.length / 2; (-11.885)
        // bounceY(which is Z) = 5.5 - bounceDepth. (e.g. 4.5)
        // Z axis: Center is 0. 
        // Service line Z should be: length/2 - 5.5 = 6.385?
        // Let's re-read original app.js carefully.
        // line 58: startZ = -COURT.length / 2;
        // line 40: bounceY = COURT.baselineToServiceLine - bounceDepth; (This is a POSITIVE number around 4.5)
        // line 60: Math.pow(bounceY - startZ, 2) -> (4.5 - (-11.885))^2.
        // This implies the bounce is at Z = +4.5ish.
        // But Service Line is at Z = -6.4 (if 0 is center and server is at -11).
        // Wait. Server is at -11. Net is 0. 
        // Receiver side service line should be at +6.4.
        // COURT.baselineToServiceLine is 5.5.
        // COURT.length/2 is 11.885.
        // 11.885 - 5.5 = 6.385.
        // So if bounceY means "Distance from Net" or "Z coordinate"?
        // In original code: bounceY = 5.5 - bounceDepth.
        // If bounceDepth is 1.0, bounceY = 4.5.
        // So the bounce is at Z = 4.5.
        // The service line is at Z = 6.4.
        // So it bounces Short of the service line? Yes.
        // 4.5 is closer to net than 6.4.
        // Correct.

        const targetZ = bounceZ; // Renaming to targetZ for clarity, though original used bounceY variable name

        const distance = Math.sqrt(Math.pow(targetX - startX, 2) + Math.pow(targetZ - startZ, 2));
        const timeToFirstBounce = distance / speedMs;
        const maxHeight = config.trajectoryHeight;
        const steps = 50;

        let collisionDetected = false;

        const netZ = 0;
        const peakZ = netZ + config.trajectoryPeakPosition;

        let peakProgress = 0.5;
        if (Math.abs(targetZ - startZ) > 0.001) {
            peakProgress = (peakZ - startZ) / (targetZ - startZ);
            peakProgress = Math.max(0.1, Math.min(0.9, peakProgress));
        }

        for (let i = 0; i <= steps; i++) {
            if (collisionDetected) break;

            const progress = i / steps;
            const x = startX + (targetX - startX) * progress;
            const z = startZ + (targetZ - startZ) * progress;

            // Helper to calculate Y at any progress
            const calculateY = (p: number) => {
                const yLinear = startY * (1 - p); // Linear from 1.0 to 0
                let arcFactor = 0;
                if (p <= peakProgress) {
                    arcFactor = Math.sin((Math.PI / 2) * (p / peakProgress));
                } else {
                    arcFactor = Math.cos((Math.PI / 2) * ((p - peakProgress) / (1 - peakProgress)));
                }
                return yLinear + maxHeight * arcFactor;
            };

            // Check for net collision
            if (i > 0) {
                const prevZ = startZ + (targetZ - startZ) * ((i - 1) / steps);
                if (prevZ < 0 && z >= 0) {
                    const progressAtNet = (0 - startZ) / (targetZ - startZ);
                    const netY = calculateY(progressAtNet);

                    if (netY < COURT_CONSTANTS.netHeight) {
                        const netX = startX + (targetX - startX) * progressAtNet;
                        trajectoryPoints.push(new Vector3(netX, netY, 0));
                        collisionDetected = true;
                        continue;
                    }
                }
            }

            const y = calculateY(progress);
            trajectoryPoints.push(new Vector3(x, Math.max(0, y), z));
        }

        if (!collisionDetected) {
            const bouncePoint = trajectoryPoints[trajectoryPoints.length - 1];
            const bounceSpeedMs = speedMs * config.bounceVelocityRetention;

            const vectorX = targetX - startX;
            const vectorZ = targetZ - startZ;
            const vectorLength = Math.sqrt(vectorX * vectorX + vectorZ * vectorZ);

            const normalizedVectorX = vectorX / vectorLength;
            const normalizedVectorZ = vectorZ / vectorLength;

            const bounceVelocityZ = bounceSpeedMs * normalizedVectorZ;
            const bounceVelocityX = bounceSpeedMs * normalizedVectorX;

            const bounceFlightTime = 0.5;
            const bounceDistanceZ = bounceVelocityZ * bounceFlightTime;
            const bounceDistanceX = bounceVelocityX * bounceFlightTime;

            const secondBounceZ = targetZ + bounceDistanceZ;
            const secondBounceX = targetX + bounceDistanceX;

            const bounceSteps = 30;
            const maxBounceHeight = maxHeight * 0.3;

            for (let i = 1; i <= bounceSteps; i++) {
                const progress = i / bounceSteps;
                const x = targetX + (secondBounceX - targetX) * progress;
                const z = targetZ + (secondBounceZ - targetZ) * progress;
                const y = maxBounceHeight * Math.sin(Math.PI * progress);

                trajectoryPoints.push(new Vector3(x, Math.max(0, y), z));
            }

            return {
                points: trajectoryPoints,
                bouncePoint: bouncePoint,
                secondBounceZ: secondBounceZ,
                secondBounceX: secondBounceX,
                bounceDistanceY: bounceDistanceZ,
                bounceDistanceX: bounceDistanceX,
                bounceVelocityY: bounceVelocityZ,
                bounceVelocityX: bounceVelocityX,
                timeToFirstBounce: timeToFirstBounce,
                targetX: targetX
            };
        } else {
            // Collision Case
            const collisionPoint = trajectoryPoints[trajectoryPoints.length - 1];
            return {
                points: trajectoryPoints,
                bouncePoint: collisionPoint,
                secondBounceZ: collisionPoint.z,
                secondBounceX: collisionPoint.x,
                bounceDistanceY: 0,
                bounceDistanceX: 0,
                bounceVelocityY: 0,
                bounceVelocityX: 0,
                timeToFirstBounce: timeToFirstBounce, // Approx
                targetX: targetX
            };
        }
    }

    static calculateReceiverAnalysis(trajectory: TrajectoryData, config: ServeConfig): AnalysisResult {
        const receiverX = COURT_CONSTANTS.centerToSinglesLine;
        const receiverZ = 0;

        const bouncePoint = trajectory.bouncePoint;
        const secondBounceZ = trajectory.secondBounceZ;
        const bounceDistanceY = trajectory.bounceDistanceY; // This is actually Z distance

        let targetZ;
        if (bounceDistanceY < 0.5) {
            targetZ = bouncePoint.z + 0.3;
        } else {
            targetZ = secondBounceZ + 1.5;
        }

        const moveX = Math.abs(trajectory.targetX - receiverX);
        const moveZ = Math.abs(targetZ - receiverZ);
        const totalDistance = Math.sqrt(moveX * moveX + moveZ * moveZ);

        const bounceAirTime = config.trajectoryHeight * 0.15;
        const receiveTime = trajectory.timeToFirstBounce + bounceAirTime;
        const effectiveTime = receiveTime - config.reactionDelay;

        const requiredSpeed = effectiveTime > 0 ? totalDistance / effectiveTime : Infinity;

        let difficulty = '比較的容易';
        if (requiredSpeed > 8) difficulty = '非常に困難';
        else if (requiredSpeed > 6) difficulty = '困難';
        else if (requiredSpeed > 4) difficulty = 'やや困難';

        return {
            receiverStart: { x: receiverX, z: receiverZ },
            receiverTarget: { x: trajectory.targetX, z: targetZ },
            moveX: moveX,
            moveZ: moveZ,
            totalDistance: totalDistance,
            receiveTime: receiveTime,
            effectiveTime: effectiveTime,
            requiredSpeed: requiredSpeed,
            difficulty: difficulty,
            bounceDistanceY: bounceDistanceY,
            bounceDistanceX: trajectory.bounceDistanceX,
            bounceVelocityY: trajectory.bounceVelocityY,
            bounceVelocityX: trajectory.bounceVelocityX
        };
    }
}
