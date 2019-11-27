'use strict'

/*
|--------------------------------------------------------------------------
| adonis-backup
|--------------------------------------------------------------------------
|@author Hussein Elturkey <husseinelturkey@protonmail.com>
|
*/

const numCPUs = require('os').cpus().length
const Helpers = use('Helpers')

module.exports = {
    /*
|--------------------------------------------------------------------------
| compress method
|--------------------------------------------------------------------------
| use compress option zip or tar.
| must be string.
| gzip compression only works with tar. so it is default to more compression rate.
*/
    method: 'tar',

    /*
|--------------------------------------------------------------------------
| concurrency
|--------------------------------------------------------------------------
| you can use upto max core numbers, Default is 4.
| we point it to max cpu cores by using const numCPUs = require('os').cpus().length.
| must be a number
*/
    concurrency: numCPUs,

    /*
|--------------------------------------------------------------------------
| compress level
|--------------------------------------------------------------------------
|
| compress level.
| must be integer more info read https://nodejs.org/api/zlib.html#zlib_class_options
|
*/
    level: 9,

    /*
|--------------------------------------------------------------------------
| gzip compress
|--------------------------------------------------------------------------
|
| gzip compress only works with tar compression.
| must be boolean.
|
*/
    gzip: true,

    /*
|--------------------------------------------------------------------------
| destination
|--------------------------------------------------------------------------
|
| filename_prefix works as a prefix for backup file.
| must be a string.
| disks only available right now is local and aws3 or digitalocean spaces, to use it just add driver name
| for example disks: ['local', 's3]
*/
    destination: {
        filename_prefix: 'backup_',
        disks: ['local']
    },

    /*
|--------------------------------------------------------------------------
| cloud driver backup directory
|--------------------------------------------------------------------------
| cloud driver backup path.
|
*/

    driverPath: 'backupDirectory/',

    /*
|--------------------------------------------------------------------------
| These directories and files will be excluded from the backup.
|--------------------------------------------------------------------------
| Directories used by the backup process will automatically be excluded.
|
*/

    exclude: [
        Helpers.appRoot('tmp'),
        Helpers.appRoot('node_modules'),
    ],

    /*
|--------------------------------------------------------------------------
| These directories and files will be included in the backup.
|--------------------------------------------------------------------------
| Directories used by the backup process will automatically be included.
|
*/

    include: [
        //Helpers.appRoot('public/')
    ]
}