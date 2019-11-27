'use strict'

/*
|--------------------------------------------------------------------------
| adonis-backup
|--------------------------------------------------------------------------
|@author Hussein Elturkey <husseinelturkey@protonmail.com>
|
*/

const { ServiceProvider } = require('@adonisjs/fold')

class BackupProvider extends ServiceProvider {
    register() {
        this.app.bind('Adonis/Commands/Backup:Start', () => require('../src/Commands/BackupCommand'))
    }

    boot() {
        const ace = require('@adonisjs/ace')
        ace.addCommand('Adonis/Commands/Backup:Start')
    }
}

module.exports = BackupProvider