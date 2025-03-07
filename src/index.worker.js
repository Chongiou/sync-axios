import { runAsWorker } from 'synckit'

runAsWorker(async conf => {
	try {
		const { url, method, headers, data } = conf

		const response = await fetch(url, {
			method: method,
			headers: headers,
			body: data,
		})
		
		return {
			ok: true,
			val: {
				config: conf,
				headers: Object.fromEntries(response.headers.entries()),
				status: response.status,
				statusText: response.statusText,
				data: await response.arrayBuffer(),
			}
		}
	} catch (err) {
		return {
			ok: false,
			val: err
		}
	}
})
