import type { CompiledRuntime, BinaryCommand } from "./types"
import { RUNNO_LANG_BASE_URL } from "./constants"

/* ───────── Cross-origin isolation check ───────── */

export const getCrossOriginIsolationError = (): string | null => {
	if (typeof window === "undefined") return null
	if (window.crossOriginIsolated && typeof SharedArrayBuffer !== "undefined") {
		return null
	}
	return [
		"SharedArrayBuffer is unavailable in this deployment.",
		"Set HTTP response headers:",
		"Cross-Origin-Opener-Policy: same-origin",
		"Cross-Origin-Embedder-Policy: require-corp",
		"Then verify window.crossOriginIsolated === true.",
	].join(" ")
}

/* ───────── WASM compilation pipeline ───────── */

export const buildCompiledCommands = (
	runtime: CompiledRuntime,
	entryPath: string,
): {
	prepare: BinaryCommand[]
	run: { fsPath: string; binaryName: string; args?: string[]; env?: Record<string, string> }
} => {
	if (runtime === "clangpp") {
		return {
			prepare: [
				{
					binaryURL: `${RUNNO_LANG_BASE_URL}/clang.wasm`,
					binaryName: "clang",
					args: [
						"-cc1",
						"-emit-obj",
						"-disable-free",
						"-isysroot",
						"/sys",
						"-internal-isystem",
						"/sys/include/c++/v1",
						"-internal-isystem",
						"/sys/include",
						"-internal-isystem",
						"/sys/lib/clang/8.0.1/include",
						"-ferror-limit",
						"8",
						"-fmessage-length",
						"80",
						"-fcolor-diagnostics",
						"-O2",
						"-o",
						"/program.o",
						"-x",
						"c++",
						entryPath,
					],
					env: {},
					baseFSURL: `${RUNNO_LANG_BASE_URL}/clang-fs.tar.gz`,
				},
				{
					binaryURL: `${RUNNO_LANG_BASE_URL}/wasm-ld.wasm`,
					binaryName: "wasm-ld",
					args: [
						"--no-threads",
						"--export-dynamic",
						"-z",
						"stack-size=1048576",
						"-L/sys/lib/wasm32-wasi",
						"/sys/lib/wasm32-wasi/crt1.o",
						"/program.o",
						"-lc",
						"-lc++",
						"-lc++abi",
						"-o",
						"/program.wasm",
					],
					env: {},
				},
			],
			run: {
				fsPath: "/program.wasm",
				binaryName: "program",
				args: [],
				env: {},
			},
		}
	}

	// clang (C)
	return {
		prepare: [
			{
				binaryURL: `${RUNNO_LANG_BASE_URL}/clang.wasm`,
				binaryName: "clang",
				args: [
					"-cc1",
					"-triple",
					"wasm32-unknown-wasi",
					"-isysroot",
					"/sys",
					"-internal-isystem",
					"/sys/include",
					"-internal-isystem",
					"/sys/lib/clang/8.0.1/include",
					"-ferror-limit",
					"8",
					"-fmessage-length",
					"80",
					"-fcolor-diagnostics",
					"-O2",
					"-emit-obj",
					"-o",
					"/program.o",
					entryPath,
				],
				env: {},
				baseFSURL: `${RUNNO_LANG_BASE_URL}/clang-fs.tar.gz`,
			},
			{
				binaryURL: `${RUNNO_LANG_BASE_URL}/wasm-ld.wasm`,
				binaryName: "wasm-ld",
				args: [
					"--no-threads",
					"--export-dynamic",
					"-z",
					"stack-size=1048576",
					"-L/sys/lib/wasm32-wasi",
					"/sys/lib/wasm32-wasi/crt1.o",
					"/program.o",
					"-lc",
					"-o",
					"/program.wasm",
				],
				env: {},
			},
		],
		run: {
			fsPath: "/program.wasm",
			binaryName: "program",
			args: [],
			env: {},
		},
	}
}
