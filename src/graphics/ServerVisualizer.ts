import * as THREE from 'three';
import { HumanoidCharacter } from './HumanoidCharacter';
import { COURT_CONSTANTS } from '../core/CourtConstants';

export class ServerVisualizer {
    public character: HumanoidCharacter;
    private scene: THREE.Scene;

    constructor(scene: THREE.Scene) {
        this.scene = scene;
        this.character = new HumanoidCharacter(0xffffff); // White clothes for server
        this.character.setRotationY(Math.PI); // Facing opponent court (Z positive direction)
        scene.add(this.character.group);
    }

    /**
     * Update server position and animation
     */
    update(x: number, height: number, progress: number, isAnimating: boolean): void {
        const z = -COURT_CONSTANTS.length / 2;
        this.character.setPosition(x, 0, z);

        if (isAnimating) {
            // Determine serve type based on height
            const serveType = height < 2.0 ? 'SERVE_UNDER' : 'SERVE_STANDARD';
            this.character.updateAnimation(serveType, progress);
        } else {
            this.character.updateAnimation('IDLE', 0);
        }
    }

    dispose(): void {
        this.scene.remove(this.character.group);
    }
}
