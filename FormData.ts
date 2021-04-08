import { Blob } from "./Blob"
import { File } from "./File"
import { TextFile } from "./TextFile"
import { FormDataEntryValue } from "./FormDataEntryValue"

export class FormData {
	private data: { [name: string]: FormDataEntryValue[] | undefined } = {}
	get [Symbol.toStringTag]() {
		return this.data
	}
	append(name: string, value: string | Blob, fileName?: string): void {
		const v = this.getAll(name)
		v.push(typeof value == "string" ? value : new File(value, fileName || ""))
		this.data[name] = v
	}
	delete(name: string): void {
		delete this.data[name]
	}
	get(name: string): FormDataEntryValue | null {
		const result = this.data[name]
		return (result && result.length > 0 && result[0]) || null
	}
	getAll(name: string): FormDataEntryValue[] {
		return this.data[name] || []
	}
	has(name: string): boolean {
		return !this.data[name]
	}
	set(name: string, value: string | Blob, fileName?: string): void {
		this.data[name] = [!fileName && typeof value == "string" ? value : typeof value == "string" ? new TextFile(value, fileName) : new File(value, fileName || "")]
	}
	[Symbol.iterator](): IterableIterator<[string, FormDataEntryValue]> {
		return this.entries()
	}
	/**
	 * Returns an array of key, value pairs for every entry in the list.
	 */
	entries(): IterableIterator<[string, FormDataEntryValue]> {
		function* flatten(data: {
			[name: string]: FormDataEntryValue[] | undefined
		}): IterableIterator<[string, FormDataEntryValue]> {
			for (const entry of Object.entries(data))
				if (entry[1])
					for (const value of entry[1])
						yield [entry[0], value]
		}
		return flatten(this.data)
	}
	/**
	 * Returns a list of keys in the list.
	 */
	keys(): IterableIterator<string> {
		return Object.keys(this.data)[Symbol.iterator]()
	}
	/**
	 * Returns a list of values in the list.
	 */
	values(): IterableIterator<FormDataEntryValue> {
		return ([] as any[]).concat(...Object.values(this.data))[Symbol.iterator]()
	}
	toJSON(): any {
		return this.data
	}
	toString(boundary: string): string {
		let result: string = ""
		const fields = this.entries()
		for (const field of fields) {
			if (typeof field[1] == "string")
				result += `--${boundary}\r\nContent-Disposition: form-data; name="${field[0]}"\r\n\r\n${field[1]}\r\n`
			else {
				result += `--${boundary}\r\nContent-Disposition: form-data; name="${field[0]}"; filename="${field[1].name}"\r\nContent-Type: ${field[1].type}\r\n\r\n`
				result += field[1].data
				result += "\r\n"
			}
		}
		result += `--${boundary}--\r\n`
		return result
	}
	toStream(boundary: string): ReadableStream<Uint8Array> {
		const fields = this.entries()
		return new ReadableStream<Uint8Array>({
			async start(controller) {
				const encoder = new TextEncoder()
				for (const field of fields) {
					if (typeof field[1] == "string")
						controller.enqueue(
							encoder.encode(
								`--${boundary}\r\nContent-Disposition: form-data; name="${field[0]}"\r\n\r\n${field[1]}\r\n`
							)
						)
					else {
						controller.enqueue(
							encoder.encode(
								`--${boundary}\r\nContent-Disposition: form-data; name="${field[0]}"; filename="${field[1].name}"\r\nContent-Type: ${field[1].type}\r\n\r\n`
							)
						)
						controller.enqueue(typeof field[1].data == "string" ? new TextEncoder().encode(field[1].data) : field[1].data)
						controller.enqueue(encoder.encode("\r\n"))
					}
				}
				controller.enqueue(encoder.encode(`--${boundary}--\r\n`))
				controller.close()
			},
		})
	}
	toArrayBuffer(boundary: string): ArrayBuffer {
		function* toArrayBuffers(fields: IterableIterator<[string, FormDataEntryValue]>): IterableIterator<ArrayBuffer> {
			const encoder = new TextEncoder()
			for (const field of fields) {
				if (typeof field[1] == "string")
					yield encoder.encode(
						`--${boundary}\r\nContent-Disposition: form-data; name="${field[0]}"\r\n\r\n${field[1]}\r\n`
					)
				else {
					yield encoder.encode(
						`--${boundary}\r\nContent-Disposition: form-data; name="${field[0]}"; filename="${field[1].name}"\r\nContent-Type: ${field[1].type}\r\n\r\n`
					)
					yield typeof field[1].data == "string" ? new TextEncoder().encode(field[1].data) : field[1].data
					yield encoder.encode("\r\n")
				}
			}
			yield encoder.encode(`--${boundary}--\r\n`)
		}
		const data = Array.from(toArrayBuffers(this.entries()))
		let index = 0
		return data.reduce<Uint8Array>((r, d) => {
			r.set(new Uint8Array(d), index)
			index += d.byteLength
			return r
		}, new Uint8Array(data.reduce((r, d) => r + d.byteLength, 0)))
	}
	static async parse(body: Uint8Array, contentType: string): Promise<FormData> {
		const decoder = new TextDecoder()
		const boundary = new TextEncoder().encode("\r\n" + (getBoundary(contentType) || undefined))
		const headerBoundary = new TextEncoder().encode("\r\n\r\n")
		const result = new FormData()
		if (boundary.length > 0) {
			let start = findIndex(body, boundary.subarray(2)) + boundary.length - 2
			while (start < body.length && decoder.decode(body.subarray(start, start + 2)) != "--") {
				const header = parseHeader(
					decoder.decode(body.subarray(start, (start = findIndex(body, headerBoundary, start))))
				)
				start += headerBoundary.length
				const data = body.subarray(start, (start = findIndex(body, boundary, start)))
				start += boundary.length
				const contentDisposition: { [field: string]: string } = Object.fromEntries(
					(header["content-disposition"] || "")
						.substring(11)
						.split("; ")
						.map(f => f.split("=", 2))
						.map(f => [f[0].toLowerCase(), f[1] && f[1].substring(1, f[1].length - 1)])
				)
				if (contentDisposition.filename)
					result.append(
						contentDisposition.name,
						new Blob(data, { type: header["content-type"] }),
						contentDisposition.filename
					)
				else
					result.append(contentDisposition.name, decoder.decode(data))
			}
		}
		return result
	}
}

function getBoundary(contentType: string): string | null {
	// Examples for content types:
	//      multipart/form-data; boundary="----7dd322351017c"; ...
	//      multipart/form-data; boundary=----7dd322351017c; ...
	const m = contentType.match(/boundary=(?:"([^"]+)"|([^;]+))/i)
	// \r\n is part of the boundary.
	return m && "--" + (m[1] || m[2])
}
function findIndex(data: Uint8Array, boundary: Uint8Array, start = 0): number {
	const total = data.length - boundary.length
	while (start < total) {
		if (boundary.every((v, i) => v == data[start + i]))
			break
		start++
	}
	return start >= total ? data.length : start
}
function parseHeader(data: string): { [name: string]: string } {
	return Object.fromEntries(
		data
			.split("\r\n")
			.map(h => h.split(": ", 2))
			.map(h => [h[0].toLowerCase(), h[1]])
	)
}
