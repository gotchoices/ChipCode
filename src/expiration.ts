import { calculateShannonEntropy } from "./code-validation";

/** Bit patterns masked with the expiration date to avoid
 * The two most significant 2 bits are ignored
*/
const patterns = [0x15A45D17, 0x2A5BA2E8, 0x2AAAAAAA, 0x15555555];

/** Interleves an expiration date with a given random code
 * With a 30 byte code, the expiration can go up past the year 10,000
*/
export async function interleveExpiration(data: Uint8Array, expiration: number) {
	if (data.length < 32) {
		throw new Error('Data length must be at least 32 bytes');
	}
	const expirationInMinutes = Math.floor(expiration / 60000);
	if (expirationInMinutes > 0x3FFFFFFF) {
		throw new Error('Expiration is too far in the future.  Greetings from the 21st century!');
	}

	const encodings = patterns.map((p, i) => (p & 0x3FFFFFFF) ^ ((i << 30) | expirationInMinutes));
	const entropies = encodings.map(v => {
		const base64String = btoa(String.fromCharCode((v >> 24) & 0xFF, (v >> 16) & 0xFF, (v >> 8) & 0xFF, v & 0xFF));
		return calculateShannonEntropy(base64String);
	});
	const bestIndex = entropies.indexOf(Math.max(...entropies));
	const encoding = encodings[bestIndex];

	// Interleave the expiration time bits with the random data
	for (let i = 0; i < 32; ++i) {
		data[i] = (data[i] & 0xFE) | ((encoding >> i) & 1);
	}
}

/** @returns the expiration of the given session code */
export function extractExpiration(data: Uint8Array) {
	let encoding = 0;
	// Extract the least significant bit from each byte
	for (let i = 0; i < 32; ++i) {
		const bit = data[i] & 1;
		encoding |= bit << i;
	}
	// Extract the pattern index from the 2 most significant bits
	const pattern = (encoding & 0xC0000000) >> 30;
	// Unmask the expiration time from the remaining 30 bits
	const expirationInMinutes = (patterns[pattern] & 0x3FFFFFFF) ^ encoding;
	// Return in milliseconds
	return expirationInMinutes * 60000;
}
