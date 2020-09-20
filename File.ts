import { Blob } from "./Blob"

export class File extends Blob {
	readonly lastModified: number
	get lastModifiedDate(): Date {
		return new Date(this.lastModified)
	}

	constructor(bits: Blob | Uint8Array, readonly name: string, options?: { type?: string; lastModified?: number }) {
		super(bits, options)
		this.lastModified = (options && options.lastModified) || 0
	}
	toJSON(): any {
		return { ...super.toJSON(), lastModified: this.lastModified, name: this.name }
	}
}
