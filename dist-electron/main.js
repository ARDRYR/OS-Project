import { BrowserWindow as e, app as t } from "electron";
import n from "node:path";
import { fileURLToPath as r } from "node:url";
import { spawn as i } from "node:child_process";
//#region electron/main.ts
var a = n.dirname(r(import.meta.url));
process.env.APP_ROOT = n.join(a, "..");
var o = process.env.VITE_DEV_SERVER_URL, s = n.join(process.env.APP_ROOT, "dist-electron"), c = n.join(process.env.APP_ROOT, "dist");
process.env.VITE_PUBLIC = o ? n.join(process.env.APP_ROOT, "public") : c;
var l, u = null;
function d() {
	let e = o ? n.join(process.env.APP_ROOT, "backend", ".venv", "Scripts", "python.exe") : n.join(process.env.APP_ROOT, "backend", "dist", "app.exe"), t = n.join(process.env.APP_ROOT, "backend", "app.py");
	console.log("🚀 Starting Backend...", e, t), u = i(e, [t], {
		cwd: n.join(process.env.APP_ROOT, "backend"),
		shell: !0
	}), u.stdout?.on("data", (e) => {
		console.log(`[Backend]: ${e}`);
	}), u.stderr?.on("data", (e) => {
		console.error(`[Backend Error]: ${e}`);
	}), u.on("close", (e) => {
		console.log(`[Backend] process exited with code ${e}`);
	});
}
function f() {
	l = new e({
		title: "Pokemon OS Scheduler Simulator",
		icon: n.join(process.env.VITE_PUBLIC, "images", "몬스터볼로고.png"),
		width: 1400,
		height: 900,
		webPreferences: {
			nodeIntegration: !0,
			contextIsolation: !1
		},
		autoHideMenuBar: !0
	}), o ? l.loadURL(o) : l.loadFile(n.join(c, "index.html"));
}
t.on("window-all-closed", () => {
	u && u.kill(), process.platform !== "darwin" && (t.quit(), l = null);
}), t.on("activate", () => {
	e.getAllWindows().length === 0 && f();
}), t.whenReady().then(() => {
	d(), f();
});
//#endregion
export { s as MAIN_DIST, c as RENDERER_DIST, o as VITE_DEV_SERVER_URL };
