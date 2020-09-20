import { FormData } from "./FormData"

describe("FormData", () => {
	const body = `--X-BOUNDARY\r
Content-Disposition: form-data; name="message"\r
\r
HejHopp\r
--X-BOUNDARY\r
Content-Disposition: form-data; name="value"\r
\r
42\r
--X-BOUNDARY\r
Content-Disposition: form-data; name="file"; filename="test.txt"\r
Content-Type: text/plain\r
\r
This is the content of the file.\r
It contains two lines of content.\r
--X-BOUNDARY--\r
`
	it("parse", async () => {
		const data = await FormData.parse(new TextEncoder().encode(body), "multipart/form-data; boundary=X-BOUNDARY")
		expect(JSON.parse(JSON.stringify(data))).toEqual({
			file: [
				{
					data: [
						84,
						104,
						105,
						115,
						32,
						105,
						115,
						32,
						116,
						104,
						101,
						32,
						99,
						111,
						110,
						116,
						101,
						110,
						116,
						32,
						111,
						102,
						32,
						116,
						104,
						101,
						32,
						102,
						105,
						108,
						101,
						46,
						13,
						10,
						73,
						116,
						32,
						99,
						111,
						110,
						116,
						97,
						105,
						110,
						115,
						32,
						116,
						119,
						111,
						32,
						108,
						105,
						110,
						101,
						115,
						32,
						111,
						102,
						32,
						99,
						111,
						110,
						116,
						101,
						110,
						116,
						46,
					],
					lastModified: 0,
					name: "test.txt",
					type: "text/plain",
				},
			],
			value: ["42"],
			message: ["HejHopp"],
		})
		expect(new TextDecoder().decode(data.toArrayBuffer("X-BOUNDARY"))).toEqual(body)
	})
	it("toArrayBuffer", async () => {
		const data = await FormData.parse(new TextEncoder().encode(body), "multipart/form-data; boundary=X-BOUNDARY")
		const buffer = data.toArrayBuffer("X-BOUNDARY")
		const text = new TextDecoder().decode(buffer)
		expect(text).toEqual(body)
		expect(await FormData.parse(new Uint8Array(buffer), "multipart/form-data; boundary=X-BOUNDARY")).toEqual(data)
	})
})
