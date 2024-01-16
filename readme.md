## Welcome to ChipCode

### Purpose

ChipCode library, written in Typescript, is for generating and validating highly random codes.  These codes may be used for distributed protocols; the aim is to enable data within a given search discovery session, for instance, to be encrypted with a session code such that identifiers are anonymized, yet are deterministic for the puprose of the session.  This library utilizes algorithms from NIST to ensure that the generated codes have sufficient randomness.

This library was built to affect "lifts" in [MyChips](https://github.com/gotchoices/MyCHIPs), but may be suitable for other peer-to-peer systems.  

### Codes and Nonces

* **Code** - A Code is a generated high-entropy identifier which can be used as an identifier and/or as a salt for the purpose of anonymizing other identifiers.  
* **Nonce** - A Nonce, for the purpose of this library, is the term for an identifier that has been anonymized by a Code.  A generated code is used as a cryptographically random salt to generate the hashed nonce, which acts as a surrogate identifier.  The nonce is produced by getting the base64 encoding of the SHA-256 hash of the identifier prepended to the Code.

Node: this library can verify the randomness of a given code relative to itself, but has no mechanism to verify that a given code isn't being reused.  A complete implementation must maintain a history of codes and validate that a given code isn't being reused

### Usage

####Generate a code:

	function generateCode(options: CodeOptions): string

The resulting code is guaranteed to pass randomness validation.  Note that it may take many iterations in order to find a sufficiently random code, and if the maximum tries elapses an exception will be thrown.

####Validate a given code:

	function validateCode(salt: string, options: CodeOptions): boolean

####Generate a nonce:

	function makeNonce(identifier: string, code: string): string

####Putting together:

	var code = generateCode(new CodeOptions());
	var nonce1 = makeNonce('xyz', code);
	var nonce2 = makeNonce('xyz', code);
	console.log(nonce1 === nonce2);	// true

### Development

* Build: ```npm run build```
	* Builds into an ES module
* Test: ```npm test```
* Install Jest VSCode extension for easy test debugging
