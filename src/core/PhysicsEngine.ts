import { Vector3 } from 'three';
import { COURT_CONSTANTS } from './CourtConstants';
import type { ServeConfig, TrajectoryData, AnalysisResult } from '../types';

export class PhysicsEngine {
    private static readonly GRAVITY = 9.81;
    private static readonly DRAG_COEFFICIENT = 0.021; // Air resistance factor (k = Cd * rho * A / 2m)
    private static readonly MIN_CLEARANCE = 0.15; // Margin above net in meters

    /**
     * Calculate launch angle from peak height and peak position.
     * Uses kinematic equations: at peak, vy = 0.
     * Peak occurs at time t_peak = vy0 / g
     * Peak height: h_peak = h0 + vy0^2 / (2*g)
     * Peak position (horizontal): x_peak = vx * t_peak
     */
    // Removed calculateLaunchAngleFromPeak as we are switching to direct angle control

    /**
     * Calculates the full trajectory based on peak height and peak position.
     */
    static calculateTrajectory(config: ServeConfig): TrajectoryData {
        const startPos = new Vector3(config.serverPositionX, config.serverHeight, -COURT_CONSTANTS.length / 2);

        const speedMs = config.serveSpeed / 3.6;
        const vAngleRad = (config.launchAngleV * Math.PI) / 180;
        const hAngleRad = (config.launchAngleH * Math.PI) / 180;

        // Calculate velocity vector using spherical coordinates
        const vy = speedMs * Math.sin(vAngleRad);
        const vh = speedMs * Math.cos(vAngleRad);

        // hAngleH is clockwise from Z+ axis or similar.
        // Let's assume hAngle 0 is straight parallel to Z axis.
        const vx = vh * Math.sin(hAngleRad);
        const vz = vh * Math.cos(hAngleRad);

        const velocity = new Vector3(vx, vy, vz);

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
            // Drag: Fd = -k * |v| * v
            const speed = currentVel.length();
            const dragMagnitude = this.DRAG_COEFFICIENT * speed;

            // Acceleration = Gravity + Drag
            const accel = new Vector3(
                -dragMagnitude * currentVel.x,
                -this.GRAVITY - dragMagnitude * currentVel.y,
                -dragMagnitude * currentVel.z
            );

            // Update Velocity (v = v0 + a * dt)
            currentVel.add(accel.multiplyScalar(dt));

            // Move (p = p0 + v * dt)
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
        let bounceDistanceZ = 0;
        let bounceDistanceX = 0;

        if (bounced && !collisionDetected) {
            // Bounce response
            currentVel = bounceVelocity.clone();
            currentVel.y = Math.abs(currentVel.y) * 0.7; // Vertical elasticity
            currentVel.x *= config.bounceVelocityRetention; // Friction
            currentVel.z *= config.bounceVelocityRetention;

            bounceVelocity = currentVel.clone(); // Store for analysis

            // Simulate second bounce
            while (currentPos.y >= 0) {
                const speed = currentVel.length();
                const dragMagnitude = this.DRAG_COEFFICIENT * speed;

                const accel = new Vector3(
                    -dragMagnitude * currentVel.x,
                    -this.GRAVITY - dragMagnitude * currentVel.y,
                    -dragMagnitude * currentVel.z
                );

                currentVel.add(accel.multiplyScalar(dt));
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
    static optimizeServe(targetX: number, targetZ: number, serverX: number, serverHeight: number): { speed: number, launchAngleV: number, launchAngleH: number } {
        const startPos = new Vector3(serverX, serverHeight, -COURT_CONSTANTS.length / 2);
        const targetPos = new Vector3(targetX, 0, targetZ);

        // Horizontal direction to target
        const dx = targetPos.x - startPos.x;
        const dz = targetPos.z - startPos.z;
        const hAngleRad = Math.atan2(dx, dz);
        const hAngleDeg = hAngleRad * 180 / Math.PI;

        const range = Math.sqrt(dx * dx + dz * dz);

        // Net position (Z=0)
        const distToNet = Math.abs(0 - startPos.z);
        const fractionToNet = distToNet / Math.abs(dz);
        const rangeAtNet = range * fractionToNet;

        const maxSpeed = 150 / 3.6; // Limit to 150km/h
        const minSpeed = 50 / 3.6;
        const stepSpeed = 1.0;

        for (let v = maxSpeed; v >= minSpeed; v -= stepSpeed) {
            const bestTheta = this.findLaunchAngleForDistance(v, range, startPos.y);
            if (bestTheta !== null) {
                const heightAtNet = this.calculateHeightAtDistance(v, bestTheta, rangeAtNet, startPos.y);
                if (heightAtNet > COURT_CONSTANTS.netHeight + this.MIN_CLEARANCE) {
                    return {
                        speed: v * 3.6,
                        launchAngleV: bestTheta * 180 / Math.PI,
                        launchAngleH: hAngleDeg
                    };
                }
            }
        }

        // If no fast solution, return a safe lob
        return {
            speed: 80,
            launchAngleV: 20,
            launchAngleH: hAngleDeg
        };
    }

    private static findLaunchAngleForDistance(v: number, targetR: number, y0: number): number | null {
        // Search for the smallest (most downward) angle that hits the target within tolerance
        // Using simulation instead of analytic solution which doesn't account for drag
        const TOLERANCE = 0.25;

        for (let deg = -20; deg <= 45; deg += 0.5) {
            const rad = deg * Math.PI / 180;

            // Simulate a simple horizontal trajectory to find landing distance
            const traj = this.simulateTrajectory(
                new Vector3(0, y0, 0),
                new Vector3(0, v * Math.sin(rad), v * Math.cos(rad)),
                {} as any // Basic config
            );

            const dist = traj.bouncePoint.z;
            const err = Math.abs(dist - targetR);

            if (err < TOLERANCE) {
                return rad;
            }
        }

        return null;
    }

    private static calculateHeightAtDistance(v: number, theta: number, x: number, y0: number): number {
        // Simulate to find height at specific distance
        const traj = this.simulateTrajectory(
            new Vector3(0, y0, 0),
            new Vector3(0, v * Math.sin(theta), v * Math.cos(theta)),
            {} as any
        );

        // Find the point closest to distance x
        let bestHeight = 0;
        let minZDiff = Infinity;

        for (const p of traj.points) {
            const diff = Math.abs(p.z - x);
            if (diff < minZDiff) {
                minZDiff = diff;
                bestHeight = p.y;
            }
            if (p.z > x + 0.5) break; // Optimization
        }

        return bestHeight;
    }

    static calculateReceiverAnalysis(trajectory: TrajectoryData, config: ServeConfig): AnalysisResult {
        // Receiver starts at baseline on the appropriate side
        const receiverX = config.receiverPositionX;
        const receiverZ = config.receiverPositionZ;

        // Find optimal return position on the trajectory
        // This is the point on the serve trajectory that minimizes receiver's travel distance
        const optimalReturnPoint = this.findOptimalReturnPosition(
            trajectory.points,
            receiverX,
            receiverZ,
            config
        );

        // targetX is 1m laterally before the trajectory point
        // If receiver is on the right and moving left, stop 1m to the right of the ball
        // If receiver is on the left and moving right, stop 1m to the left of the ball
        const lateralOffset = (receiverX > optimalReturnPoint.x) ? 1.0 : -1.0;
        const targetX = optimalReturnPoint.x + lateralOffset;
        const targetZ = optimalReturnPoint.z; // No Z offset, as user said "lateral 1m before"

        // Calculate movement distances
        const moveX = targetX - receiverX;
        const moveZ = targetZ - receiverZ;
        const totalDistance = Math.sqrt(moveX * moveX + moveZ * moveZ);

        // Time calculations
        const receiveTime = optimalReturnPoint.time;
        const effectiveTime = Math.max(0, receiveTime - config.reactionDelay);
        const requiredSpeed = effectiveTime > 0 ? totalDistance / effectiveTime : Infinity;

        // Difficulty assessment
        let difficulty = 'N/A';
        if (requiredSpeed < 4) {
            difficulty = '比較的容易';
        } else if (requiredSpeed < 6) {
            difficulty = 'やや困難';
        } else if (requiredSpeed < 8) {
            difficulty = '困難';
        } else {
            difficulty = '非常に困難';
        }

        // Calculate receiver movement
        const receiverMovement = this.calculateReceiverMovement(
            receiverX,
            receiverZ,
            targetX,
            targetZ,
            receiveTime,
            config
        );

        const timingBuffer = receiveTime - (config.reactionDelay + (totalDistance / config.receiverSpeed));

        return {
            receiverStart: { x: receiverX, z: receiverZ },
            receiverTarget: { x: targetX, z: targetZ },
            moveX,
            moveZ,
            totalDistance,
            receiveTime,
            effectiveTime,
            requiredSpeed,
            difficulty,
            bounceDistanceY: trajectory.bounceDistanceY,
            bounceDistanceX: trajectory.bounceDistanceX,
            bounceVelocityY: trajectory.bounceVelocityY,
            bounceVelocityX: trajectory.bounceVelocityX,
            timingBuffer,
            receiverMovement
        };
    }

    /**
     * Find the optimal position on the serve trajectory for the receiver to return the ball
     * This minimizes the receiver's travel distance while considering the ball's trajectory
     */
    private static findOptimalReturnPosition(
        trajectoryPoints: Vector3[],
        receiverX: number,
        receiverZ: number,
        config: ServeConfig
    ): { x: number; z: number; time: number } {
        const dt = 0.01; // Time step used in trajectory simulation
        let bestScore = -Infinity;
        let optimalPoint = { x: receiverX, z: receiverZ, time: 0 };

        // 1. Find the first bounce index
        let firstBounceIndex = -1;
        for (let i = 0; i < trajectoryPoints.length; i++) {
            if (trajectoryPoints[i].y <= 0.01 && i > 10) { // Small epsilon and avoid start
                firstBounceIndex = i;
                break;
            }
        }

        // If no bounce detected (e.g. net hit), stay at start
        if (firstBounceIndex === -1) {
            return optimalPoint;
        }

        const IDEAL_HIT_HEIGHT = 1.0; // Optimal hitting height in meters
        const IDEAL_BUFFER_TIME = 0.25; // 250ms preparation time is enough

        // 2. Iterate through points after the first bounce
        for (let i = firstBounceIndex + 1; i < trajectoryPoints.length; i++) {
            const point = trajectoryPoints[i];
            const ballArrivalTime = i * dt;

            // Constraint: No backward movement (stay on/in front of baseline)
            let targetZ = point.z;
            if (targetZ > receiverZ) {
                targetZ = receiverZ;
            }

            // Calculate horizontal distance to this target position
            const dx = point.x - receiverX;
            const dz = targetZ - receiverZ;
            const distance = Math.sqrt(dx * dx + dz * dz);

            // Calculate timing
            const travelTime = distance / config.receiverSpeed;
            const receiverArrivalTime = config.reactionDelay + travelTime;
            const timeBuffer = ballArrivalTime - receiverArrivalTime;

            // Factor 1: Height Score (Closer to 1.0m is better)
            const heightDiff = Math.abs(point.y - IDEAL_HIT_HEIGHT);
            const heightScore = Math.max(0, 1.0 - heightDiff * 0.8);

            // Factor 2: Distance Score (Very high priority: Minimal movement)
            const distanceScore = Math.max(0, 1.0 - distance / 3.0);

            // Factor 3: Buffer Score (Arriving before ball. Saturated at IDEAL_BUFFER_TIME)
            let bufferScore = 0;
            if (timeBuffer > 0) {
                bufferScore = Math.min(1.0, timeBuffer / IDEAL_BUFFER_TIME);
            } else {
                bufferScore = -20.0; // Strictly reachable check
            }

            // Combined Score
            // Priority: Buffer (Reachable) > Distance (Minimal Move) > Height
            const score = heightScore * 1.5 + distanceScore * 8.0 + bufferScore * 10.0;

            if (score > bestScore) {
                bestScore = score;
                optimalPoint = { x: point.x, z: targetZ, time: ballArrivalTime };
            }
        }

        return optimalPoint;
    }

    /**
     * Calculate receiver movement path and timing using actual constant speed
     */
    private static calculateReceiverMovement(
        startX: number,
        startZ: number,
        targetX: number,
        targetZ: number,
        ballArrivalTime: number,
        config: ServeConfig
    ): import('../types').ReceiverMovement {
        const startPosition = new Vector3(startX, 0, startZ);
        const targetPosition = new Vector3(targetX, 0, targetZ);

        // Calculate movement distances
        const moveX = targetX - startX;
        const moveZ = targetZ - startZ;
        const totalDistance = Math.sqrt(moveX * moveX + moveZ * moveZ);

        // Time to complete movement lineally
        const travelTimeSeconds = totalDistance / config.receiverSpeed;

        // Effective time (after reaction delay)
        const effectiveTimeAvailable = Math.max(0, ballArrivalTime - config.reactionDelay);
        const canReach = totalDistance <= config.receiverSpeed * effectiveTimeAvailable + 0.001;

        // Generate movement path
        const movementPath: any[] = [];
        const numSteps = 30; // Number of animation frames

        for (let i = 0; i <= numSteps; i++) {
            const t = i / numSteps;
            const animationTime = t * ballArrivalTime;

            if (animationTime < config.reactionDelay) {
                // Stay at start during reaction delay
                movementPath.push(startPosition.clone());
            } else {
                const movementTime = animationTime - config.reactionDelay;

                if (movementTime < travelTimeSeconds) {
                    // Moving at constant speed (with easing for current segment)
                    const movementProgress = travelTimeSeconds > 0 ? movementTime / travelTimeSeconds : 1;
                    const easedProgress = this.easeInOutQuad(movementProgress);

                    const currentX = startX + moveX * easedProgress;
                    const currentZ = startZ + moveZ * easedProgress;
                    movementPath.push(new Vector3(currentX, 0, currentZ));
                } else {
                    // Already arrived, waiting at target
                    movementPath.push(targetPosition.clone());
                }
            }
        }

        const arrivalTime = config.reactionDelay + travelTimeSeconds;

        return {
            startPosition,
            targetPosition,
            movementPath,
            arrivalTime,
            canReach
        };
    }

    /**
     * Easing function for smooth animation
     */
    private static easeInOutQuad(t: number): number {
        return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    }
}
