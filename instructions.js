'use strict'

/*
|--------------------------------------------------------------------------
| adonis-backup
|--------------------------------------------------------------------------
|@author Hussein Elturkey <husseinelturkey@protonmail.com>
|
*/

const path = require('path')

module.exports = async (cli) => {
    try {
        const inFile = path.join(__dirname, './config', 'index.js')
        const outFile = path.join(cli.helpers.configPath(), 'backup.js')
        await cli.copy(inFile, outFile)
        cli.command.completed('create', 'config/backup.js')
    } catch (error) {
        console.log(error)
    }
}