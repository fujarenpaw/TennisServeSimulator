import * as THREE from 'three';

export type AnimationType = 'IDLE' | 'SERVE_STANDARD' | 'SERVE_UNDER' | 'RETURN_FORE' | 'RETURN_BACK' | 'VOLLEY' | 'WALK' | 'SHUFFLE' | 'READY';

export class HumanoidCharacter {
    public group: THREE.Group;

    // Joint references
    private hips: THREE.Group;
    private spine: THREE.Group;
    private torso: THREE.Mesh;
    private head: THREE.Mesh;

    private armL: THREE.Group;
    private armR: THREE.Group;
    private upperArmL: THREE.Mesh;
    private lowerArmL: THREE.Mesh;
    private handL: THREE.Group;

    private upperArmR: THREE.Mesh;
    private lowerArmR: THREE.Mesh;
    private handR: THREE.Group;

    private legL: THREE.Group;
    private upperLegL: THREE.Mesh;
    private lowerLegL: THREE.Mesh;

    private legR: THREE.Group;
    private upperLegR: THREE.Mesh;
    private lowerLegR: THREE.Mesh;

    private racketGroup: THREE.Group;

    constructor(color: number = 0xcccccc) {
        this.group = new THREE.Group();

        const skinMaterial = new THREE.MeshStandardMaterial({ color });
        const racketMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });

        // Hips (Root of body)
        this.hips = new THREE.Group();
        this.hips.position.y = 0.9;
        this.group.add(this.hips);

        const hipsGeom = new THREE.BoxGeometry(0.35, 0.2, 0.18);
        const hipsMesh = new THREE.Mesh(hipsGeom, skinMaterial);
        this.hips.add(hipsMesh);

        // Spine & Torso
        this.spine = new THREE.Group();
        this.spine.position.y = 0.1;
        this.hips.add(this.spine);

        const torsoGeom = new THREE.BoxGeometry(0.4, 0.5, 0.2);
        this.torso = new THREE.Mesh(torsoGeom, skinMaterial);
        this.torso.position.y = 0.25;
        this.spine.add(this.torso);

        // Head
        const headGroup = new THREE.Group();
        headGroup.position.y = 0.25;
        this.torso.add(headGroup);

        const headGeom = new THREE.SphereGeometry(0.12, 16, 16);
        this.head = new THREE.Mesh(headGeom, skinMaterial);
        this.head.position.y = 0.15;
        headGroup.add(this.head);

        // Arms (Attached to Torso)
        this.armL = this.createArm(skinMaterial);
        this.armL.position.set(-0.25, 0.2, 0);
        this.torso.add(this.armL);

        this.armR = this.createArm(skinMaterial);
        this.armR.position.set(0.25, 0.2, 0);
        this.torso.add(this.armR);

        // Helper references for arms
        this.upperArmL = this.armL.children[0] as THREE.Mesh;
        this.lowerArmL = this.upperArmL.children[0].children[0] as THREE.Mesh;
        this.handL = this.lowerArmL.children[0] as THREE.Group;

        this.upperArmR = this.armR.children[0] as THREE.Mesh;
        this.lowerArmR = this.upperArmR.children[0].children[0] as THREE.Mesh;
        this.handR = this.lowerArmR.children[0] as THREE.Group;

        // Racket (attached to Right Hand)
        this.racketGroup = this.createRacket(racketMaterial);
        this.handR.add(this.racketGroup);

        // Legs (Attached to Hips)
        this.legL = this.createLeg(skinMaterial);
        this.legL.position.set(-0.12, -0.05, 0);
        this.hips.add(this.legL);

        this.legR = this.createLeg(skinMaterial);
        this.legR.position.set(0.12, -0.05, 0);
        this.hips.add(this.legR);

        // Helper references for legs
        this.upperLegL = this.legL.children[0] as THREE.Mesh;
        this.lowerLegL = this.upperLegL.children[0].children[0] as THREE.Mesh;

        this.upperLegR = this.legR.children[0] as THREE.Mesh;
        this.lowerLegR = this.upperLegR.children[0].children[0] as THREE.Mesh;
    }

    private createArm(material: THREE.Material): THREE.Group {
        const root = new THREE.Group();

        // Upper arm
        const upperGeom = new THREE.BoxGeometry(0.1, 0.3, 0.1);
        const upper = new THREE.Mesh(upperGeom, material);
        upper.position.y = -0.15;
        root.add(upper);

        // Elbow joint
        const lowerJoint = new THREE.Group();
        lowerJoint.position.y = -0.15;
        upper.add(lowerJoint);

        const lowerGeom = new THREE.BoxGeometry(0.08, 0.3, 0.08);
        const lower = new THREE.Mesh(lowerGeom, material);
        lower.position.y = -0.15;
        lowerJoint.add(lower);

        // Wrist
        const wrist = new THREE.Group();
        wrist.position.y = -0.15;
        lower.add(wrist);

        return root;
    }

    private createLeg(material: THREE.Material): THREE.Group {
        const root = new THREE.Group();

        // Upper leg
        const upperGeom = new THREE.BoxGeometry(0.14, 0.45, 0.14);
        const upper = new THREE.Mesh(upperGeom, material);
        upper.position.y = -0.225;
        root.add(upper);

        // Knee joint
        const lowerJoint = new THREE.Group();
        lowerJoint.position.y = -0.225;
        upper.add(lowerJoint);

        const lowerGeom = new THREE.BoxGeometry(0.12, 0.45, 0.12);
        const lower = new THREE.Mesh(lowerGeom, material);
        lower.position.y = -0.225;
        lowerJoint.add(lower);

        // Foot
        const footGeom = new THREE.BoxGeometry(0.13, 0.06, 0.25);
        const foot = new THREE.Mesh(footGeom, material);
        foot.position.y = -0.225;
        foot.position.z = 0.05;
        lower.add(foot);

        return root;
    }

    private createRacket(material: THREE.Material): THREE.Group {
        const group = new THREE.Group();
        // Handle
        const handleGeom = new THREE.CylinderGeometry(0.015, 0.015, 0.4);
        const handle = new THREE.Mesh(handleGeom, material);
        handle.position.y = 0.2;
        group.add(handle);

        // Frame
        const frameGeom = new THREE.TorusGeometry(0.14, 0.012, 8, 20);
        const frame = new THREE.Mesh(frameGeom, material);
        frame.position.y = 0.5;
        frame.rotation.x = Math.PI / 2;
        group.add(frame);

        group.rotation.x = -Math.PI / 2; // Pointing forward from hand
        return group;
    }

    public updateAnimation(type: AnimationType, progress: number): void {
        this.resetPose();

        switch (type) {
            case 'SERVE_STANDARD': this.animateServeStandard(progress); break;
            case 'SERVE_UNDER': this.animateServeUnder(progress); break;
            case 'RETURN_FORE': this.animateReturn(progress, true); break;
            case 'RETURN_BACK': this.animateReturn(progress, false); break;
            case 'VOLLEY': this.animateVolley(progress); break;
            case 'WALK': this.animateWalk(progress); break;
            case 'SHUFFLE': this.animateShuffle(progress); break;
            case 'READY': this.animateReady(); break;
            default: this.animateIdle(); break;
        }
    }

    private resetPose(): void {
        // Reset translate
        this.hips.position.y = 0.9;
        this.hips.rotation.set(0, 0, 0);
        this.spine.rotation.set(0, 0, 0);
        this.torso.rotation.set(0, 0, 0);
        this.head.parent!.rotation.set(0, 0, 0);

        this.armL.rotation.set(0, 0, 0.2);
        this.upperArmL.rotation.set(0, 0, 0);
        this.lowerArmL.parent!.rotation.set(0, 0, 0);
        this.handL.rotation.set(0, 0, 0);

        this.armR.rotation.set(0, 0, -0.2);
        this.upperArmR.rotation.set(0, 0, 0);
        this.lowerArmR.parent!.rotation.set(0.1, 0, 0);
        this.handR.rotation.set(0, 0, 0);

        this.legL.rotation.set(0, 0, 0);
        this.upperLegL.rotation.set(0, 0, 0);
        this.lowerLegL.parent!.rotation.set(0, 0, 0);

        this.legR.rotation.set(0, 0, 0);
        this.upperLegR.rotation.set(0, 0, 0);
        this.lowerLegR.parent!.rotation.set(0, 0, 0);
    }

    private animateIdle(): void {
        const time = Date.now() * 0.002;
        this.hips.position.y = 0.9 + Math.sin(time) * 0.01;
        this.armL.rotation.z = 0.2 + Math.sin(time * 0.5) * 0.05;
        this.armR.rotation.z = -0.2 - Math.sin(time * 0.5) * 0.05;
    }

    private animateReady(): void {
        // Lower stance, focused
        this.hips.position.y = 0.75;
        this.upperLegL.rotation.x = -0.4;
        this.lowerLegL.parent!.rotation.x = 0.8;
        this.upperLegR.rotation.x = -0.4;
        this.lowerLegR.parent!.rotation.x = 0.8;

        this.spine.rotation.x = 0.2; // Leaning forward
        this.armR.rotation.x = -1.0;
        this.lowerArmR.parent!.rotation.x = 1.0;
        this.armL.rotation.x = -1.0;
        this.lowerArmL.parent!.rotation.x = 1.0;
    }

    private animateServeStandard(progress: number): void {
        if (progress < 0.3) {
            // Toss phase: Arching back, knees bending
            const p = progress / 0.3;
            this.hips.position.y = 0.9 - 0.15 * p; // Bend knees
            this.upperLegL.rotation.x = -0.3 * p;
            this.lowerLegL.parent!.rotation.x = 0.6 * p;
            this.upperLegR.rotation.x = -0.3 * p;
            this.lowerLegR.parent!.rotation.x = 0.6 * p;

            this.armL.rotation.x = -Math.PI * 0.9 * p; // Toss arm up
            this.armR.rotation.x = Math.PI * 0.4 * p; // Racket arm back
            this.spine.rotation.x = -0.3 * p; // Arching back
        } else if (progress < 0.5) {
            // Trophy Pose / Loading
            const p = (progress - 0.3) / 0.2;
            this.hips.position.y = 0.75;
            this.armL.rotation.x = -Math.PI * 0.9;
            this.armR.rotation.x = Math.PI * 0.4 + 0.5 * p;
            this.lowerArmR.parent!.rotation.x = 1.5 * p;
            this.spine.rotation.x = -0.3 - 0.2 * p;
            this.torso.rotation.y = 0.4 * p; // Twist
        } else if (progress < 0.7) {
            // Explosive Impact
            const p = (progress - 0.5) / 0.2;
            this.hips.position.y = 0.75 + 0.3 * p; // Jumping up
            this.upperLegL.rotation.x = -0.3 * (1 - p);
            this.lowerLegL.parent!.rotation.x = 0.6 * (1 - p);
            this.upperLegR.rotation.x = -0.3 * (1 - p);
            this.lowerLegR.parent!.rotation.x = 0.6 * (1 - p);

            this.spine.rotation.x = -0.5 + 0.8 * p; // Snapping forward
            this.torso.rotation.y = 0.4 - 1.0 * p; // Unwind twist

            this.armR.rotation.x = Math.PI * 0.5 - Math.PI * 1.5 * p;
            this.lowerArmR.parent!.rotation.x = 1.5 * (1 - p);
            this.handR.rotation.x = 0.8 * p; // Wrist snap
        } else {
            // Follow-through
            const p = (progress - 0.7) / 0.3;
            this.hips.position.y = 1.05 - 0.15 * p;
            this.armR.rotation.x = -Math.PI * 1.0 - 0.5 * p;
            this.armR.rotation.z = -0.5 * p;
            this.spine.rotation.x = 0.3;
            this.torso.rotation.y = -0.6;
        }
    }

    private animateReturn(progress: number, isForehand: boolean): void {
        const side = isForehand ? 1 : -1;
        if (progress < 0.4) {
            // Unit Turn / Backswing
            const p = progress / 0.4;
            this.hips.position.y = 0.85; // Low center of gravity
            this.torso.rotation.y = side * 1.2 * p; // Shoulder turn
            this.spine.rotation.z = side * 0.2 * p; // Lean into side
            this.armR.rotation.y = side * 0.5 * p;
            this.lowerArmR.parent!.rotation.x = 0.8 * p;
        } else if (progress < 0.7) {
            // Acceleration phase
            const p = (progress - 0.4) / 0.3;
            this.torso.rotation.y = side * (1.2 - 2.5 * p); // Unwinding hips/shoulders
            this.armR.rotation.y = side * (0.5 - 1.5 * p);
            this.armR.rotation.x = -1.0 * p;
            this.handR.rotation.y = side * 0.5 * p; // Wrist involvement
        } else {
            // Follow-through
            const p = (progress - 0.7) / 0.3;
            this.torso.rotation.y = side * (-1.3 - 0.3 * p);
            this.armR.rotation.y = side * -1.2;
            this.armR.rotation.x = -1.0 - 0.5 * p;
            this.head.parent!.rotation.y = side * 0.5 * p; // Looking at target
        }
    }

    private animateWalk(progress: number): void {
        const cycle = progress * Math.PI * 4;
        this.hips.position.y = 0.9 + Math.abs(Math.sin(cycle)) * 0.04;
        this.hips.rotation.y = Math.sin(cycle) * 0.1;

        this.upperLegL.rotation.x = Math.sin(cycle) * 0.5;
        this.lowerLegL.parent!.rotation.x = Math.max(0, -Math.sin(cycle)) * 0.8;
        this.upperLegR.rotation.x = -Math.sin(cycle) * 0.5;
        this.lowerLegR.parent!.rotation.x = Math.max(0, Math.sin(cycle)) * 0.8;

        this.armL.rotation.x = -Math.sin(cycle) * 0.4;
        this.armR.rotation.x = Math.sin(cycle) * 0.4;
    }

    private animateShuffle(progress: number): void {
        // Lateral sidestep
        const cycle = progress * Math.PI * 6;
        this.hips.position.y = 0.85 + Math.abs(Math.sin(cycle)) * 0.06;

        this.upperLegL.rotation.z = Math.sin(cycle) * 0.3;
        this.upperLegR.rotation.z = Math.sin(cycle) * 0.3;

        // Ready arms during shuffle
        this.armR.rotation.x = -0.8;
        this.armL.rotation.x = -0.8;
    }

    private animateServeUnder(progress: number): void {
        // Simplified underhand with a bit more body movement
        const p = progress;
        this.hips.position.y = 0.9 - 0.1 * Math.sin(p * Math.PI);
        if (p < 0.5) {
            this.armR.rotation.x = Math.PI * 0.6 * (p / 0.5);
            this.spine.rotation.x = 0.2 * (p / 0.5);
        } else {
            const sp = (p - 0.5) / 0.5;
            this.armR.rotation.x = Math.PI * 0.6 - Math.PI * 1.3 * sp;
            this.spine.rotation.x = 0.2 - 0.4 * sp;
        }
    }

    private animateVolley(progress: number): void {
        // Quick punch with split-second lean
        this.hips.position.y = 0.8;
        if (progress < 0.3) {
            const p = progress / 0.3;
            this.armR.rotation.x = -0.5 * p;
            this.spine.rotation.x = 0.1 * p;
        } else if (progress < 0.6) {
            const p = (progress - 0.3) / 0.3;
            this.armR.rotation.x = -0.5 + 1.2 * p;
            this.spine.rotation.x = 0.1 - 0.3 * p;
            this.torso.rotation.y = -0.3 * p;
        } else {
            const p = (progress - 0.6) / 0.4;
            this.armR.rotation.x = 0.7 - 0.2 * p;
        }
    }

    public setPosition(x: number, y: number, z: number): void {
        this.group.position.set(x, y, z);
    }

    public setRotationY(angle: number): void {
        this.group.rotation.y = angle;
    }
}
