'use strict'

/*
|--------------------------------------------------------------------------
| adonis-backup
|--------------------------------------------------------------------------
|@author Hussein Elturkey <husseinelturkey@protonmail.com>
|
*/

const { Command } = require('@adonisjs/ace')
const { backupFactory } = require('../Backup')
const Helpers = use('Helpers')

class BackupCommand extends Command {
    static get signature() {
        return `
        backup:start 
        { --cloudOnly? : remove local file after backup to cloud.} 
        { --localOnly? : backup file to local only.} 
        { --restore? : restore backup file to your app, be careful, it will replace your files.}
        `
    }

    static get description() {
        return 'a package to backup your app files.'
    }

    async handle(args, flags) {
        this.info('Backup has been began')
        await this.ensureDir(Helpers.tmpPath('backup'))
        await backupFactory(flags)
    }
}

module.exports = BackupCommand