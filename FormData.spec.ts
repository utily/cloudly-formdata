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
						84, 104, 105, 115, 32, 105, 115, 32, 116, 104, 101, 32, 99, 111, 110, 116, 101, 110, 116, 32, 111, 102, 32,
						116, 104, 101, 32, 102, 105, 108, 101, 46, 13, 10, 73, 116, 32, 99, 111, 110, 116, 97, 105, 110, 115, 32,
						116, 119, 111, 32, 108, 105, 110, 101, 115, 32, 111, 102, 32, 99, 111, 110, 116, 101, 110, 116, 46,
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
	it("toString", () => {
		const exampleCsv =
			"field1,field2,start date,end date,another date,created,gross,fee,net,currency\r\n" +
			'"example1","exampleA","2020-02-01","2020-02-07","2020-03-02","2020-01-16","2","3","4","EUR"\r\n' +
			'"example2","exampleA","2020-02-01","2020-02-07","2020-03-02","2020-01-16","2","3","4","EUR"\r\n' +
			'"example3","exampleA","2020-02-01","2020-02-07","2020-03-02","2020-01-16","2","3","4","EUR"\r\n'
		const data = new FormData()
		data.set("Dates", `Information ranging from 2021-01-01 to 2021-03-31`)
		data.set("FileExample", exampleCsv, "example.csv")
		const output = data.toString("X-BOUNDARY")
		expect(output.replace(/\s/g, "")).toEqual(
			`--X-BOUNDARY
    Content-Disposition: form-data; name="Dates"
    
    Information ranging from 2021-01-01 to 2021-03-31
    --X-BOUNDARY
    Content-Disposition: form-data; name="FileExample"; filename="example.csv"
		Content-Type:text/csv
    field1,field2,start date,end date,another date,created,gross,fee,net,currency
    "example1","exampleA","2020-02-01","2020-02-07","2020-03-02","2020-01-16","2","3","4","EUR"
    "example2","exampleA","2020-02-01","2020-02-07","2020-03-02","2020-01-16","2","3","4","EUR"
    "example3","exampleA","2020-02-01","2020-02-07","2020-03-02","2020-01-16","2","3","4","EUR"
    
    --X-BOUNDARY--`.replace(/\s/g, "")
		)
	})
})
