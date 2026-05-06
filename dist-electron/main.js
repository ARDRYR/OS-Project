import { BrowserWindow, app } from "electron";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";
//#region electron/main.ts
var __dirname = path.dirname(fileURLToPath(import.meta.url));
process.env.APP_ROOT = path.join(__dirname, "..");
var VITE_DEV_SERVER_URL = process.env["VITE_DEV_SERVER_URL"];
var MAIN_DIST = path.join(process.env.APP_ROOT, "dist-electron");
var RENDERER_DIST = path.join(process.env.APP_ROOT, "dist");
process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, "public") : RENDERER_DIST;
var win;
var backendProcess = null;
function startBackend() {
	const pythonPath = !!VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, "backend", ".venv", "Scripts", "python.exe") : path.join(process.env.APP_ROOT, "backend", "dist", "app.exe");
	const scriptPath = path.join(process.env.APP_ROOT, "backend", "app.py");
	console.log("🚀 Starting Backend...", pythonPath, scriptPath);
	backendProcess = spawn(pythonPath, [scriptPath], {
		cwd: path.join(process.env.APP_ROOT, "backend"),
		shell: true
	});
	backendProcess.stdout?.on("data", (data) => {
		console.log(`[Backend]: ${data}`);
	});
	backendProcess.stderr?.on("data", (data) => {
		console.error(`[Backend Error]: ${data}`);
	});
	backendProcess.on("close", (code) => {
		console.log(`[Backend] process exited with code ${code}`);
	});
}
function createWindow() {
	win = new BrowserWindow({
		title: "Pokemon OS Scheduler Simulator",
		icon: path.join(process.env.VITE_PUBLIC, "images", "몬스터볼로고.png"),
		width: 1400,
		height: 900,
		webPreferences: {
			nodeIntegration: true,
			contextIsolation: false
		},
		autoHideMenuBar: true
	});
	if (VITE_DEV_SERVER_URL) win.loadURL(VITE_DEV_SERVER_URL);
	else win.loadFile(path.join(RENDERER_DIST, "index.html"));
}
app.on("window-all-closed", () => {
	if (backendProcess) backendProcess.kill();
	if (process.platform !== "darwin") {
		app.quit();
		win = null;
	}
});
app.on("activate", () => {
	if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
app.whenReady().then(() => {
	startBackend();
	createWindow();
});
//#endregion
export { MAIN_DIST, RENDERER_DIST, VITE_DEV_SERVER_URL };
