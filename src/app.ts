import {
	AbstractMesh,
	ArcRotateCamera,
	Color3,
	Color4,
	Engine,
	Scene,
	SceneLoader,
	SpotLight,
	StandardMaterial,
	Vector3,
	VideoTexture,
	VideoTextureSettings
} from '@babylonjs/core';

import { Inspector } from '@babylonjs/inspector';
import gsap from 'gsap';

export class App {
	private engine: Engine;
	private scene: Scene;
	private camera: ArcRotateCamera | undefined;
	private model: AbstractMesh[] | undefined;
	private debug: boolean = false;

	constructor(private canvas: HTMLCanvasElement) {
		this.engine = new Engine(canvas, true);
		this.scene = new Scene(this.engine);
		this.engine.displayLoadingUI();
		this.setupScene();
		this.setupCamera();
		this.setupLights();
		this.loadModel().then(() => {
			this.engine.hideLoadingUI();
		});
		window.addEventListener('resize', () => {
			this.engine.resize();
		});
	}

	private setupScene(): void {
		this.scene.clearColor = new Color4(0.1, 0.1, 0.1, 1);
		this.scene.ambientColor = Color3.FromHexString('#ffffff');
	}

	private setupCamera(): void {
		this.camera = new ArcRotateCamera(
			'camera1',
			Math.PI / 2,
			Math.PI * 45,
			5,
			Vector3.Zero(),
			this.scene
		);
		this.camera.panningSensibility = 0;
		this.camera.allowUpsideDown = false;
		this.camera.wheelPrecision = 50;
		this.camera.wheelDeltaPercentage = 0.01;
		this.camera.upperRadiusLimit = 5;
		this.camera.lowerRadiusLimit = 2.3;
		this.camera.upperBetaLimit = Math.PI / 2 - 0.01;
		this.camera.lowerBetaLimit = 0.01;
		this.camera.alpha = Math.PI / 2;

		gsap.to(this.camera, {
			radius: 2.3,
			duration: 5,
			ease: 'power2.inOut',
			delay: 1,
			onComplete: () => {
				this.camera?.attachControl(this.canvas, true);
			}
		});
	}

	private setupLights(): void {
		const spotLight = new SpotLight(
			'spotLight',
			new Vector3(0, 2.5, 1.66),
			new Vector3(0, -1, 0),
			Math.PI / 2,
			10,
			this.scene
		);
		spotLight.intensity = 30;
		spotLight.diffuse = Color3.FromHexString('#f0f0f0');
		spotLight.specular = Color3.FromHexString('#f0f0f0');
	}

	private async loadModel(): Promise<void> {
		const { meshes } = await SceneLoader.ImportMeshAsync('', 'models/', 'tv.glb', this.scene);
		this.model = meshes;

		this.model.map((mesh) => {
			if (mesh.name !== 'Screen') {
				mesh.isPickable = false;
				mesh.doNotSyncBoundingInfo = true;
				mesh.freezeWorldMatrix();
			}
		});

		this.setupTVScreen();
		this.setupShelf();
	}

	private async setupTVScreen(): Promise<void> {
		const screen = this.scene.getMeshByName('Screen');
		if (screen) {
			const videoTexture = new VideoTexture(
				'video',
				['videoplayback.mp4'],
				this.scene,
				true,
				true,
				0,
				{
					muted: true,
					autoPlay: true,
					loop: true
				} as VideoTextureSettings
			);

			const screenMaterial = new StandardMaterial('screen', this.scene);
			screenMaterial.diffuseTexture = videoTexture;
			screenMaterial.diffuseTexture.hasAlpha = true;
			screenMaterial.diffuseTexture.getAlphaFromRGB = true;
			screenMaterial.emissiveColor = videoTexture.hasAlpha ? Color3.White() : Color3.Black();
			screenMaterial.emissiveTexture = videoTexture;
			screenMaterial.useAlphaFromDiffuseTexture = true;

			screen.material = screenMaterial;

			screen.onReady = () => {
				videoTexture.video.play();
			};

			this.camera?.setTarget(screen.position);
		}
	}

	private async setupShelf(): Promise<void> {
		const shelf = this.scene.getNodeByName('Shelf');
		if (shelf) {
			shelf.getChildMeshes().map((mesh) => {
				mesh.isPickable = false;
				mesh.doNotSyncBoundingInfo = true;
				mesh.freezeWorldMatrix();
			});
		}
	}

	public run(): void {
		if (this.debug) {
			Inspector.Show(this.scene, { embedMode: true });
		}
		this.engine.runRenderLoop(() => {
			this.scene.render();
		});
	}
}
