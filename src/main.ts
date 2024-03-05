import { App } from './app.ts';

window.addEventListener('DOMContentLoaded', () => {
	const canvas = document.getElementById('renderCanvas') as HTMLCanvasElement;
	const app = new App(canvas);
	app.run();
});
