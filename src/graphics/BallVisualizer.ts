import * as THREE from 'three';

export class BallVisualizer {
    mesh: THREE.Mesh;

    constructor(scene: THREE.Scene) {
        const ballGeometry = new THREE.SphereGeometry(0.2, 16, 16);
        const ballMaterial = new THREE.MeshStandardMaterial({ color: 0xffff00 });
        this.mesh = new THREE.Mesh(ballGeometry, ballMaterial);
        scene.add(this.mesh);
    }

    setPosition(pos: THREE.Vector3) {
        this.mesh.position.copy(pos);
    }
}
