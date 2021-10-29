// PUT https://sheets.googleapis.com/v4/spreadsheets/spreadsheetId/values/Sheet1!A1:D5?valueInputOption=USER_ENTERED

fetch(url, {
	method: 'PUT',
	headers: {
		'Content-Type': 'application/json',
	},
	body: JSON.stringify(data)
})