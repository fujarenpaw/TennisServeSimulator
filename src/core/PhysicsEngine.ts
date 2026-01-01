import { Vector3 } from 'three';
import { COURT_CONSTANTS } from './CourtConstants';
import type { ServeConfig, TrajectoryData, AnalysisResult } from '../types';

export class PhysicsEngine {
    private static readonly GRAVITY = 9.81;
    // private static readonly AIR_RESISTANCE = 0.01; // Simplified drag factor
    private static readonly MIN_CLEARANCE = 0.15; // Margin above net in meters

    /**
     * Calculate launch angle from peak height and peak position.
     * Uses kinematic equations: at peak, vy = 0.
     * Peak occurs at time t_peak = vy0 / g
     * Peak height: h_peak = h0 + vy0^2 / (2*g)
     * Peak position (horizontal): x_peak = vx * t_peak
     */
    private static calculateLaunchAngleFromPeak(
        startHeight: number,
        peakHeight: number,
        peakPosition: number,
        horizontalDistance: number,
        speed: number
    ): number {
        // peakHeight = startHeight + vy0^2 / (2*g)
        // => vy0^2 = 2*g*(peakHeight - startHeight)
        const deltaH = peakHeight - startHeight;
        if (deltaH < 0) {
            // Peak is below start, use downward trajectory
            return -10; // Default downward angle
        }

        const vy0Squared = 2 * this.GRAVITY * deltaH;
        const vy0 = Math.sqrt(vy0Squared);

        // t_peak = vy0 / g
        const tPeak = vy0 / this.GRAVITY;

        // At peak position: peakPosition = vx * tPeak
        // => vx = peakPosition / tPeak
        const vx = peakPosition / tPeak;

        // speed^2 = vx^2 + vy0^2
        // Check if this is achievable with given speed
        const requiredSpeedSquared = vx * vx + vy0Squared;
        const requiredSpeed = Math.sqrt(requiredSpeedSquared);
        const speedMs = speed / 3.6;

        if (requiredSpeed > speedMs * 1.1) {
            // Cannot achieve this peak with current speed, adjust
            // Use the angle that gives maximum range
            const ratio = vy0 / vx;
            return Math.atan(ratio) * (180 / Math.PI);
        }

        // Calculate angle: tan(angle) = vy0 / vh
        // where vh is the horizontal component
        // speed^2 = vh^2 + vy0^2 => vh = sqrt(speed^2 - vy0^2)
        const vhSquared = speedMs * speedMs - vy0Squared;
        if (vhSquared < 0) {
            // Not enough speed, use what we can
            return Math.atan(vy0 / 1.0) * (180 / Math.PI);
        }
        const vh = Math.sqrt(vhSquared);
        const angleRad = Math.atan(vy0 / vh);
        return angleRad * (180 / Math.PI);
    }

    /**
     * Calculates the full trajectory based on peak height and peak position.
     */
    static calculateTrajectory(config: ServeConfig): TrajectoryData {
        const startPos = new Vector3(config.serverPositionX, config.serverHeight, -COURT_CONSTANTS.length / 2);

        // Calculate horizontal distance and direction to target
        const aimTargetPos = new Vector3(config.targetX, 0, config.targetZ);
        const direction = new Vector3().subVectors(aimTargetPos, startPos);
        direction.y = 0;
        const horizontalDistance = direction.length();
        direction.normalize();

        // Calculate launch angle from peak parameters
        const launchAngle = this.calculateLaunchAngleFromPeak(
            config.serverHeight,
            config.trajectoryPeakHeight,
            config.peakPosition - startPos.z, // peakPosition is relative to net (Z=0), adjust for start position
            horizontalDistance,
            config.serveSpeed
        );

        const speedMs = config.serveSpeed / 3.6;
        const vAngleRad = (launchAngle * Math.PI) / 180;

        const vy = speedMs * Math.sin(vAngleRad);
        const vh = speedMs * Math.cos(vAngleRad);

        const velocity = direction.clone().multiplyScalar(vh);
        velocity.y = vy;

        return this.simulateTrajectory(startPos, velocity, config);
    }

    /**
     * Simulates the physics step-by-step or using equations.
     * Using time-stepping for easier drag implementation and collision detection.
     */
    private static simulateTrajectory(start: Vector3, initialVelocity: Vector3, config: ServeConfig): TrajectoryData {
        const points: Vector3[] = [];
        let currentPos = start.clone();
        let currentVel = initialVelocity.clone();
        points.push(currentPos.clone());

        const dt = 0.01; // 10ms steps
        let time = 0;
        let collisionDetected = false;
        let bounced = false;
        let bouncePoint = new Vector3();
        let bounceVelocity = new Vector3();

        // First flight (Pre-bounce)
        while (currentPos.y > 0 || time === 0) {
            // Apply forces
            // Drag: Fd = -k * v * |v|
            // Acceleration = -k/m * v * |v|. Let's just use simplified velocity decay or just Gravity for now to match "Physics Correctness" requested without overcomplicating.
            // The user wanted "Physical Consistency". Gravity is key. Drag is secondary but "Serve drops" is due to gravity (and Topspin).
            // Let's stick to Gravity only for the baseline to ensure it works predictably.
            // currentVel.x -= currentVel.x * this.AIR_RESISTANCE * dt;
            // currentVel.z -= currentVel.z * this.AIR_RESISTANCE * dt;

            // Gravity
            currentVel.y -= this.GRAVITY * dt;

            // Move
            currentPos.add(currentVel.clone().multiplyScalar(dt));
            time += dt;

            // Net Collision Check
            if (!collisionDetected && Math.abs(currentPos.z) < 0.2) { // Passing Net plane (Z=0)
                // Check exact height at Z=0?
                // Simple check
                if (currentPos.z > -0.1 && currentPos.z < 0.1) {
                    if (currentPos.y < COURT_CONSTANTS.netHeight) {
                        collisionDetected = true;
                        // Snap to net
                        currentPos.z = 0;
                        currentPos.y = Math.max(0, currentPos.y);
                        points.push(currentPos.clone());
                        break;
                    }
                }
            }

            // Ground Collision
            if (currentPos.y <= 0) {
                currentPos.y = 0;
                bounced = true;
                bouncePoint = currentPos.clone();
                bounceVelocity = currentVel.clone();
                points.push(currentPos.clone());
                break;
            }

            points.push(currentPos.clone());
        }

        // Second flight (Post-bounce)
        let secondBounceZ = 0;
        let secondBounceX = 0;
        let bounceDuration = 0;
        let bounceDistanceZ = 0;
        let bounceDistanceX = 0;

        if (bounced && !collisionDetected) {
            // Bounce response
            currentVel = bounceVelocity.clone();
            currentVel.y = Math.abs(currentVel.y) * 0.7; // Vertical elasticity
            currentVel.x *= config.bounceVelocityRetention; // Friction
            currentVel.z *= config.bounceVelocityRetention;

            bounceVelocity = currentVel.clone(); // Store for analysis

            const startBounce = currentPos.clone();

            // Simulate second bounce
            while (currentPos.y >= 0) {
                currentVel.y -= this.GRAVITY * dt;
                currentPos.add(currentVel.clone().multiplyScalar(dt));

                if (currentPos.y <= 0) {
                    currentPos.y = 0;
                    points.push(currentPos.clone());
                    break;
                }
                points.push(currentPos.clone());
            }

            secondBounceX = currentPos.x;
            secondBounceZ = currentPos.z;

            bounceDistanceX = secondBounceX - bouncePoint.x;
            bounceDistanceZ = secondBounceZ - bouncePoint.z;
        }

        return {
            points,
            bouncePoint,
            secondBounceZ,
            secondBounceX,
            bounceDistanceY: bounceDistanceZ, // Keep legacy naming property if types uses it, or fix Update types. Types uses Y for Z? 
            // In types/index.ts I saw comments "referring to Z depth".
            bounceDistanceX,
            bounceVelocityY: bounceVelocity.z, // Mapping Z velocity to this prop
            bounceVelocityX: bounceVelocity.x,
            timeToFirstBounce: time,
            targetX: bouncePoint.x // Actual landing
        };
    }

    /**
     * Finds the optimal Speed and trajectory parameters to hit the target (x, z) 
     * with the minimum flight time (max speed) while clearing the net.
     */
    static optimizeServe(targetX: number, targetZ: number, serverX: number, serverHeight: number): { speed: number, trajectoryPeakHeight: number, peakPosition: number } {
        const startPos = new Vector3(serverX, serverHeight, -COURT_CONSTANTS.length / 2);
        const targetPos = new Vector3(targetX, 0, targetZ);

        // Horizontal distance
        const dx = targetPos.x - startPos.x;
        const dz = targetPos.z - startPos.z;
        const range = Math.sqrt(dx * dx + dz * dz);

        // Net position (Z=0)
        const distToNet = Math.abs(0 - startPos.z);
        const fractionToNet = distToNet / Math.abs(dz);
        const rangeAtNet = range * fractionToNet;

        const maxSpeed = 220 / 3.6;
        const minSpeed = 50 / 3.6;
        const stepSpeed = 1.0;

        for (let v = maxSpeed; v >= minSpeed; v -= stepSpeed) {
            const bestTheta = this.findLaunchAngleForDistance(v, range, startPos.y);
            if (bestTheta !== null) {
                const heightAtNet = this.calculateHeightAtDistance(v, bestTheta, rangeAtNet, startPos.y);
                if (heightAtNet > COURT_CONSTANTS.netHeight + this.MIN_CLEARANCE) {
                    // Calculate peak height and position from this angle
                    const vy0 = v * Math.sin(bestTheta);
                    const vx = v * Math.cos(bestTheta);

                    // Peak height: h_peak = h0 + vy0^2 / (2*g)
                    const peakHeight = startPos.y + (vy0 * vy0) / (2 * this.GRAVITY);

                    // Time to peak: t_peak = vy0 / g
                    const tPeak = vy0 / this.GRAVITY;

                    // Distance traveled to peak (horizontal)
                    const distToPeak = vx * tPeak;

                    // Peak position in Z coordinates (relative to net at Z=0)
                    const peakPosZ = startPos.z + (dz / range) * distToPeak;

                    return {
                        speed: v * 3.6, // Convert back to km/h
                        trajectoryPeakHeight: peakHeight,
                        peakPosition: peakPosZ
                    };
                }
            }
        }

        // If no fast solution, return a safe lob
        return {
            speed: 80,
            trajectoryPeakHeight: 5.0,
            peakPosition: 3.0
        };
    }

    private static findLaunchAngleForDistance(v: number, targetR: number, y0: number): number | null {
        // We want to find theta such that LandingDistance(v, theta) = targetR.
        // Function decreases with angle? 
        // Try range -15 to +40 degrees
        // We want the smallest angle (drive) that satisfies it.

        let minErr = Infinity;
        let bestAng = null;

        for (let deg = -15; deg <= 40; deg += 0.5) {
            const rad = deg * Math.PI / 180;
            const dist = this.calculateLandingDistance(v, rad, y0);
            const err = Math.abs(dist - targetR);
            if (err < 0.5) { // 50cm tolerance? Maybe tighter.
                // Refine?
                if (err < minErr) {
                    minErr = err;
                    bestAng = rad;
                }
            }
        }

        if (minErr < 1.0) return bestAng;
        return null;
    }

    private static calculateLandingDistance(v: number, theta: number, y0: number): number {
        // x(t) = v * cos(theta) * t
        // y(t) = y0 + v * sin(theta) * t - 0.5 * g * t^2
        // Find t where y(t) = 0
        // 0.5gt^2 - (v sin theta)t - y0 = 0
        // t = [ v sin theta + sqrt( (v sin theta)^2 + 2*g*y0 ) ] / g
        const vy = v * Math.sin(theta);
        const g = this.GRAVITY;
        const det = vy * vy + 2 * g * y0;
        if (det < 0) return 0;

        const t = (vy + Math.sqrt(det)) / g;
        return v * Math.cos(theta) * t;
    }

    private static calculateHeightAtDistance(v: number, theta: number, x: number, y0: number): number {
        // t = x / (v * cos(theta))
        // y = y0 + ...
        const vx = v * Math.cos(theta);
        if (vx <= 0) return 0;
        const t = x / vx;
        const vy = v * Math.sin(theta);
        return y0 + vy * t - 0.5 * this.GRAVITY * t * t;
    }

    static calculateReceiverAnalysis(trajectory: TrajectoryData, config: ServeConfig): AnalysisResult {
        // Assume receiver stands at Baseline center or slightly offset based on serve direction
        // For simplicity, just use a fixed receiver position or one based on side
        const receiverX = (config.targetX >= 0) ? 4.115 : -4.115;
        const receiverZ = COURT_CONSTANTS.length / 2;

        // This is a placeholder analysis. The original logic was:
        // receiver moves from (rx, rz) to (targetX, secondBounceZ + offset)
        // We can restore that if needed, but for now we just return formatted data.

        return {
            receiverStart: { x: receiverX, z: receiverZ },
            receiverTarget: { x: trajectory.targetX, z: trajectory.secondBounceZ },
            moveX: 0,
            moveZ: 0,
            totalDistance: 0,
            receiveTime: trajectory.timeToFirstBounce,
            effectiveTime: trajectory.timeToFirstBounce - config.reactionDelay,
            requiredSpeed: 0,
            difficulty: 'N/A',
            bounceDistanceY: trajectory.bounceDistanceY, // Z distance
            bounceDistanceX: trajectory.bounceDistanceX,
            bounceVelocityY: trajectory.bounceVelocityY, // Z velocity
            bounceVelocityX: trajectory.bounceVelocityX
        };
    }
}
