'use strict'

/*
|--------------------------------------------------------------------------
| adonis-backup
|--------------------------------------------------------------------------
|@author Hussein Elturkey <husseinelturkey@protonmail.com>
|
*/

const fs = require('fs')
const path = require('path')
const { promisify } = require('util')
const archiver = require('archiver-promise')
const Farbe = require('kleur')
const readdir = promisify(fs.readdir)
const stat = promisify(fs.stat)
const unlink = promisify(fs.unlink)

const Helpers = use('Helpers')
const Config = use('Config')
const backup = Config.get('backup')
const log = console.log


async function backupFactory(options) {

    if(options.cloudOnly && options.localOnly){
     log(Farbe.red('seriously!, it is not an acceptable argument!'))
        return
    }

    if (!Array.isArray(backup.include) || backup.include.length == 0) {
        log(Farbe.red('include, only array is allowed.'))
        return
    }

    const fileName = await backupFileName()

    log(Farbe.green('GatherMan is walking your directories...'))

    let resources = []

    for (let d of backup.include) {
        if (!d.includes(Helpers.appRoot())) {
            log(Farbe.red('it is not a good practice to walk in not-app-root directories.'))
            break
        }
        walk(d, function (paths) {
            resources.push(paths)
        })
    }

    if (!resources.length) {
        log(Farbe.red('you can not backup nothing, can you!'))
        return
    }

    log(Farbe.green('Hi, I have finished walking, now I am compressing...'))

    await compress(fileName, resources)

    if (backup.destination.disks.includes('s3') && options.localOnly !== true) {
        await s3(fileName)
    }

    if (backup.method === 'tar')
        await unlink(Helpers.appRoot('tar'))
    else if (backup.method === 'zip')
        await unlink(Helpers.appRoot('zip'))

    if (options.cloudOnly === true && backup.destination.disks.includes('s3')) {
        await unlink(Helpers.tmpPath('backup/') + fileName)
    } else if (options.cloudOnly === true && !backup.destination.disks.includes('s3')) {
        log(Farbe.red('confusing, trying to delete local backup file without uploading it to s3.'))
    }
}

async function backupFileName() {
    const now = new Date().toISOString().slice(0, 19)
    let extension = backup.method
    if (backup.gzip === true && extension === 'tar') {
        extension = extension + '.gz'
    }
    return backup.destination.filename_prefix + now + '.' + extension
}

function walk(dir, callback) {
    fs.readdirSync(dir).forEach( f => {
        let Paths = path.join(dir, f)
        let isDirectory = fs.statSync(Paths).isDirectory()
        isDirectory ? walk(Paths, callback) : callback(Paths)
    })
}

// async function walk(_resources) {
//     // exclude certain directories from backup.
//     if (backup.exclude.includes(_resources)) {
//         return []
//     }
//
//     let files = await readdir(_resources)
//
//     // return path only in case of empty directory.
//     if (files.length === 0) {
//         return _resources
//     }
//
//     files = await Promise.all(files.map(async file => {
//         const filePath = path.join(_resources, file)
//         const stats = fs.statSync(filePath)
//         if (stats.isDirectory()) {
//             return await walk(filePath)
//         } else if (stats.isFile()) {
//             return filePath
//         }
//     }))
//
//     let result = files.reduce((all, folderContents) => all.concat(folderContents), [])
//     // remove empty values from result array.
//     return result.filter(Boolean)
// }

async function compress(fileName, resources) {

    const archive = archiver(backup.method, {
        gzip: backup.gzip,
        zlib: { level: backup.level },
        statConcurrency: backup.concurrency
    })

    const output = fs.createWriteStream(Helpers.tmpPath('backup/') + fileName)

    output.on('close', () => {
        log(Farbe.cyan("file size is: " + humanSize(archive.pointer())))
        log(Farbe.cyan('congratulation, compressing has been done!'))
    })

    output.on('end', function() {
        log(Farbe.red('Data has been drained'))
    })

    archive.on('warning', function(err) {
        if (err.code === 'ENOENT') {
            throw err
        } else {
            throw err
        }
    })

    archive.on('error', function(err) {
        throw err
    })

    archive.pipe(output)

    for (let _file of resources) {
        const stats = await stat(_file)
        if (stats.isDirectory()) {
            archive.directory(_file)
        } else if (stats.isFile()) {
            archive.append(fs.createReadStream(_file), { name: _file })
        }
    }
    await archive.finalize()
}

async function s3(basename) {
    const Drive = use('Drive')
    try {
        log(Farbe.cyan('backup upload to drive began.'))
        let done = await Drive.disk('s3').put(backup.driverPath + basename, Helpers.tmpPath('backup/') + basename)
        if (done) {
            log(Farbe.green('backup has been uploaded successfully!'))
        } else {
            log(Farbe.red('backup has not been uploaded successfully!'))
        }
    } catch (err) {
        log(Farbe.red(err))
    }
}

function humanSize(bytes) {
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
    if (bytes === 0) return '0 Byte'
    const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)), 10)
    if (i === 0) return `${bytes} ${sizes[i]})`
    return `${(bytes / (1024 ** i)).toFixed(1)} ${sizes[i]}`
}
module.exports = { backupFactory }