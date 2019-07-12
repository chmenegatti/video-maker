const algorithmia = require('algorithmia')
const algorithmiaApiKey = require('../credentials/algorithmia.json').apiKey
const sentenceBoundaryDetection = require('sbd')

const watsonApiKey = require('../credentials/watson-nlu.json').apiKey
const watsonUsername = require('../credentials/watson-nlu.json').username
const watsonPassword = require('../credentials/watson-nlu.json').password

const NaturalLanguageUnderstandingV1 = require('ibm-watson/natural-language-understanding/v1.js')

var nlu = new NaturalLanguageUnderstandingV1({
    username: watsonUsername,
    password: watsonPassword,
    version: '2018-04-05',
    url: 'https://gateway.watsonplatform.net/natural-language-understanding/api/'
  });

async function robot(content) {
    await fetchContentFromWikipedia(content)
    sanitizeContent(content)
    breakContentIntoSentences(content)

    async function fetchContentFromWikipedia(content) {
        const algorithmiaAuthenticated = algorithmia(algorithmiaApiKey)
        const wikipediaAlgorithm = algorithmiaAuthenticated.algo('web/WikipediaParser/0.1.2?timeout=300')
        const wikipediaResponde = await wikipediaAlgorithm.pipe(content.searchTerm)
        const wikipediaContent = wikipediaResponde.get()

        content.sourceContentOriginal = wikipediaContent.content

    }

    function sanitizeContent(content){
        const withoutBlankLinesAndMarkDown = removeBlankLinesAndMarkDown(content.sourceContentOriginal)
        const withoutDateInParentheses = removeDateInParentheses(withoutBlankLinesAndMarkDown)
        
        content.sourceContentSanitized = withoutDateInParentheses

        function removeBlankLinesAndMarkDown(text) {
            const allLines = text.split('\n')
            
            const withoutBlankLinesAndMarkDown = allLines.filter((line) => {
                if (line.trim().length === 0 || line.trim().startsWith('=')) {
                    return false
                }

                return true
            })

            return withoutBlankLinesAndMarkDown.join(' ')
        
        }
    }

    function removeDateInParentheses(text) {
        return text.replace(/\((?:\([^()]*\)|[^()])*\)/gm, '').replace(/  /g, ' ')
    }

    function breakContentIntoSentences(content) {
        content.sentences = []
        
        const sentences = sentenceBoundaryDetection.sentences(content.sourceContentSanitized)
        sentences.forEach((sentence) => {
            content.sentences.push({
                text: sentence,
                keyword: [],
                images: []
            })
        })
        
    }

    async function fetchWatsonAndReturnKeywords (sentence) {
        return new Promise((resolve, reject) => {
            nlu.analyze({
                text: sentence,
                features: { 
                    keywords: {}
                }
            }, (error, response) => {
                if (error) {
                    throw error
                }
                const keywords = response.keywords.map((keyword) => {
                    return keyword.text
                })
                resolve(keywords)
            })
        })
    }
}

module.exports = robot