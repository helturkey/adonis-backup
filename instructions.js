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
        await await cli.copy(path.join(__dirname, './config', 'index.js'), path.join(cli.helpers.configPath(), 'backup.js'))
        cli.command.completed('create', 'config/backup.js')
    } catch (error) {
        console.log(error)
    }
}