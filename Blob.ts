export class Blob {
	readonly data: Uint8Array
	readonly size: number
	readonly type: string
	constructor(array: Blob | Uint8Array, options?: BlobPropertyBag) {
		this.data = array instanceof Blob ? array.data : array
		this.size = this.data.byteLength
		this.type = (options && options.type) || (array instanceof Blob ? array.type : "")
	}
	async arrayBuffer(): Promise<ArrayBuffer> {
		return this.data
	}
	slice(start?: number, end?: number, contentType?: string): Blob {
		return new Blob(this.data.slice(start || 0, end), { type: contentType || "" })
	}
	stream(): ReadableStream {
		throw new Error("Not Implemented")
	}
	async text(): Promise<string> {
		return new TextDecoder().decode(this.data)
	}
	toJSON(): any {
		return { data: new Array(...this.data), type: this.type }
	}
}
