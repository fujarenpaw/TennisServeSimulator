import * as THREE from 'three';
import type { ReceiverMovement } from '../types';
import { HumanoidCharacter } from './HumanoidCharacter';

export class ReceiverVisualizer {
    private character: HumanoidCharacter;
    private targetMesh: THREE.Mesh;
    private pathLine: THREE.Line | null = null;
    private scene: THREE.Scene;

    constructor(scene: THREE.Scene) {
        this.scene = scene;

        // Create humanoid character for receiver
        this.character = new HumanoidCharacter(0xffff00); // Yellow/Gold clothes for receiver
        scene.add(this.character.group);

        // Create target mesh (semi-transparent green sphere)
        const targetGeometry = new THREE.SphereGeometry(0.2, 16, 16);
        const targetMaterial = new THREE.MeshStandardMaterial({
            color: 0x00ff00,
            transparent: true,
            opacity: 0.5
        });
        this.targetMesh = new THREE.Mesh(targetGeometry, targetMaterial);
        this.targetMesh.position.y = 0.2;
        scene.add(this.targetMesh);
    }

    /**
     * Update receiver position during animation
     */
    updateReceiverAnimation(movement: ReceiverMovement, progress: number, ballPosition: THREE.Vector3): void {
        // progress is 0 to 1 representing animation progress
        const pathIndex = Math.min(
            Math.floor(progress * movement.movementPath.length),
            movement.movementPath.length - 1
        );

        const position = movement.movementPath[pathIndex];
        this.character.setPosition(position.x, 0, position.z);
        this.targetMesh.position.set(
            movement.targetPosition.x,
            0.2,
            movement.targetPosition.z
        );

        // Animation logic
        // If still moving significantly, use walk animation
        const nextPos = movement.movementPath[Math.min(pathIndex + 1, movement.movementPath.length - 1)];
        const dist = new THREE.Vector2(nextPos.x - position.x, nextPos.z - position.z).length();

        if (progress < 0.8 && dist > 0.01) {
            this.character.updateAnimation('WALK', progress * 10); // Speed up walk cycle
        } else if (progress >= 0.8) {
            // Near impact, decide forehand, backhand, or volley
            const isHigh = ballPosition.y > 1.2;
            const isForehand = movement.targetPosition.x > position.x;
            const actionProgress = (progress - 0.8) / 0.2;

            if (isHigh) {
                this.character.updateAnimation('VOLLEY', actionProgress);
            } else {
                this.character.updateAnimation(isForehand ? 'RETURN_FORE' : 'RETURN_BACK', actionProgress);
            }
        } else {
            this.character.updateAnimation('IDLE', progress);
        }
    }

    /**
     * Show movement path as a line
     */
    showMovementPath(movement: ReceiverMovement, show: boolean): void {
        // Remove existing path line
        if (this.pathLine) {
            this.scene.remove(this.pathLine);
            this.pathLine = null;
        }

        if (show && movement.movementPath.length > 0) {
            const points = movement.movementPath.map(p => new THREE.Vector3(p.x, 0.1, p.z));
            const geometry = new THREE.BufferGeometry().setFromPoints(points);
            const material = new THREE.LineBasicMaterial({
                color: movement.canReach ? 0x00ff00 : 0xff0000,
                linewidth: 2
            });
            this.pathLine = new THREE.Line(geometry, material);
            this.scene.add(this.pathLine);
        }
    }

    /**
     * Reset receiver to initial position
     */
    reset(movement: ReceiverMovement): void {
        this.character.setPosition(
            movement.startPosition.x,
            0,
            movement.startPosition.z
        );
        this.character.updateAnimation('IDLE', 0);
        this.targetMesh.position.set(
            movement.targetPosition.x,
            0.2,
            movement.targetPosition.z
        );
    }

    /**
     * Update marker positions without animation
     */
    updateMarkers(receiverStart: THREE.Vector3, receiverTarget: THREE.Vector3): void {
        this.character.setPosition(receiverStart.x, 0, receiverStart.z);
        this.character.updateAnimation('IDLE', 0);
        this.targetMesh.position.set(receiverTarget.x, 0.2, receiverTarget.z);
    }

    /**
     * Dispose of resources
     */
    dispose(): void {
        this.scene.remove(this.character.group);
        this.scene.remove(this.targetMesh);
        if (this.pathLine) {
            this.scene.remove(this.pathLine);
        }
    }

    // To maintain compatibility with existing Raycaster logic if any
    get receiverMesh() {
        return this.character.group;
    }
}
