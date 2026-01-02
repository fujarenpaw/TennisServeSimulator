import * as THREE from 'three';
import type { ReceiverMovement } from '../types';

export class ReceiverVisualizer {
    private receiverMesh: THREE.Mesh;
    private targetMesh: THREE.Mesh;
    private pathLine: THREE.Line | null = null;
    private scene: THREE.Scene;

    constructor(scene: THREE.Scene) {
        this.scene = scene;

        // Create receiver mesh (blue sphere)
        const receiverGeometry = new THREE.SphereGeometry(0.3, 16, 16);
        const receiverMaterial = new THREE.MeshStandardMaterial({ color: 0x0000ff });
        this.receiverMesh = new THREE.Mesh(receiverGeometry, receiverMaterial);
        this.receiverMesh.position.y = 0.3; // Slightly above ground
        scene.add(this.receiverMesh);

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
    updateReceiverAnimation(movement: ReceiverMovement, progress: number): void {
        // progress is 0 to 1 representing animation progress
        const pathIndex = Math.min(
            Math.floor(progress * movement.movementPath.length),
            movement.movementPath.length - 1
        );

        const position = movement.movementPath[pathIndex];
        this.receiverMesh.position.set(position.x, 0.3, position.z);
        this.targetMesh.position.set(
            movement.targetPosition.x,
            0.2,
            movement.targetPosition.z
        );
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
        this.receiverMesh.position.set(
            movement.startPosition.x,
            0.3,
            movement.startPosition.z
        );
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
        this.receiverMesh.position.set(receiverStart.x, 0.3, receiverStart.z);
        this.targetMesh.position.set(receiverTarget.x, 0.2, receiverTarget.z);
    }

    /**
     * Dispose of resources
     */
    dispose(): void {
        this.scene.remove(this.receiverMesh);
        this.scene.remove(this.targetMesh);
        if (this.pathLine) {
            this.scene.remove(this.pathLine);
        }
    }
}
