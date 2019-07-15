const google = require('googleapis').google
const customSearch = google.customsearch('v1')
const state = require('./state.js')

const googleSearchCredentials = require('../credentials/google-search.json')


async function robot() {
    const content = state.load()

    const response = await customSearch.cse.list({
        key: googleSearchCredentials.apikey,
        cx: googleSearchCredentials.searchEngineId,
        q: 'Michael Jackson',
        searchType: 'image',
        num: 2
    })

    console.dir(response, { depth: null })
    process.exit(0)
}

module.exports = robot