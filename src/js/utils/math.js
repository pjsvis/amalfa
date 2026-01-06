export function dotProduct(a, b) {
	if (!a || !b) return 0;

	let vecA = a;
	let vecB = b;

	// Handle SQL.js BLOB (Uint8Array) -> Float32Array
	if (a instanceof Uint8Array) {
		vecA = new Float32Array(a.buffer, a.byteOffset, a.byteLength / 4);
	}
	if (b instanceof Uint8Array) {
		vecB = new Float32Array(b.buffer, b.byteOffset, b.byteLength / 4);
	}

	// Handle JSON strings (fallback)
	if (typeof a === "string") vecA = JSON.parse(a);
	if (typeof b === "string") vecB = JSON.parse(b);

	if (vecA.length !== vecB.length) return 0;

	let dot = 0;
	for (let i = 0; i < vecA.length; i++) {
		dot += vecA[i] * vecB[i];
	}
	return dot;
}
