/**
 * Represents the options for generating and validating Codes.
 */
export type CodeOptions = {
	/**
	 * The minimum entropy required for the generated Code.
	 * Default value is 0.996, which represents 99.6% of the maximum entropy.
	 */
	minEntropy: number;

	/**
	 * The length of the generated Code in bytes.  This cannot be less than 32 bytes.
	 * Default value is 32.
	 */
	byteLength: number;

	/**
	 * The maximum number of attempts to generate a valid Code (with enough randomness) before erroring.
	 * Default value is 500.
	 */
	maxGenerateTries: number;

	/**
	 * The upper p-value threshold for the frequency test.
	 * Default value is 0.23.
	 */
	frequencyPValueThreshold: number;

	/**
	 * The lower p-value threshold for the runs test.
	 * Default value is 0.61.
	 */
	runsPValueThreshold: number;

	/**
	 * The duration, relative to generation time, for expiration of a Code (in milliseconds)
	 * Expirations are rounded down to the 10s of seconds
	 * Default value is 30 minutes.
	 */
	ageMs: number;
}

export const codeOptionDefaults: CodeOptions = Object.freeze({
	/**
	 * The minimum entropy required for the generated Code.
	 * Default value is 0.996, which represents 99.6% of the maximum entropy.
	 */
	minEntropy: 0.996,

	/**
	 * The length of the generated Code in bytes.  This cannot be less than 32 bytes.
	 * Default value is 32.
	 */
	byteLength: 32,

	/**
	 * The maximum number of attempts to generate a valid Code (with enough randomness) before erroring.
	 * Default value is 500.
	 */
	maxGenerateTries: 500,

	/**
	 * The upper p-value threshold for the frequency test.
	 * Default value is 0.23.
	 */
	frequencyPValueThreshold: 0.23,

	/**
	 * The lower p-value threshold for the runs test.
	 * Default value is 0.61.
	 */
	runsPValueThreshold: 0.61,

	/**
	 * The duration, relative to generation time, for expiration of a Code (in milliseconds)
	 * Expirations are rounded down to the minute
	 * Default value is 30 minutes.
	 */
	ageMs: 30 * 60 * 1000,
});
