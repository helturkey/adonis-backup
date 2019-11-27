'use strict'

/*
|--------------------------------------------------------------------------
| adonis-backup
|--------------------------------------------------------------------------
|@author Hussein Elturkey <husseinelturkey@protonmail.com>
|
*/

const { Command } = require('@adonisjs/ace')
const { runBackup } = require('../Backup')
const Helpers = use('Helpers')

class BackupCommand extends Command {
    static get signature() {
        return 'backup:start'
    }

    static get description() {
        return 'backup command for files.'
    }

    async handle(args, options) {
        this.info('Backup has been began')
        await this.ensureDir(Helpers.tmpPath('backup'))
        await runBackup()
    }
}

module.exports = BackupCommand