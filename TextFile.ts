export class TextFile {
	constructor(readonly data: string, readonly name?: string) {
		this.type = name && name.endsWith("csv") ? "text/csv" : "text/plain"
	}
	readonly type: string
}
