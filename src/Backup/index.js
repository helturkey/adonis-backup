'use strict'

/*
|--------------------------------------------------------------------------
| adonis-backup
|--------------------------------------------------------------------------
|@author Hussein Elturkey <husseinelturkey@protonmail.com>
|
*/

const { createReadStream, createWriteStream } = require('fs')
const { stat, readdir, unlink } = require('fs').promises
const { resolve } = require('path')
const archiver = require('archiver-promise')
const Farbe = require('kleur')

const Helpers = use('Helpers')
const Config = use('Config')
const backup = Config.get('backup')
const log = console.log


async function backupFactory(options) {

    if (options.cloudOnly && options.localOnly) {
        log(Farbe.red('seriously!, it is not an acceptable argument!'))
        return
    }

    if (!Array.isArray(backup.include) || backup.include.length == 0) {
        log(Farbe.red('include, only array is allowed.'))
        return
    }

    const fileName = await backupFileName()

    log(Farbe.green('GatherMan is walking your directories...'))

    const entries = []

    // in case of duplicated dirs!
    const directories = [...new Set(backup.include)]

    for (let directory of directories) {
        if (!directory.includes(Helpers.appRoot())) {
            log(Farbe.red('it is not a good practice to walk in not-app-root directories.'))
            break
        }
        const paths = await walk(directory)
        // resources.push(...paths) causes RangeError: Maximum call stack size exceeded in case of a lot of dirs and files.
        entries.push(paths)
    }

    // flat arrays and remove empty or undefined values.
    const resources = entries.flat().filter(Boolean)

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

async function walk(dir) {
    // exclude certain directories from backup.
    if (backup.exclude.includes(dir)) {
        return
    }

    let entries = await readdir(dir)

    // return path only in case of empty directory.
    if (entries.length === 0) {
        return dir
    }

    const files = await Promise.all(entries.map(async entry => {
        const path = resolve(dir, entry)
        const stats = await stat(path)
        if (stats.isDirectory()) {
            return await walk(path)
        } else {
            return path
        }
    }))
    return files.flat()
}

async function compress(fileName, resources) {

    const archive = archiver(backup.method, {
        gzip: backup.gzip,
        zlib: {
            level: backup.level
        },
        statConcurrency: backup.concurrency
    })

    const outputFile = createWriteStream(Helpers.tmpPath('backup/') + fileName)

    outputFile.on('close', () => {
        log(Farbe.cyan("file size is: " + humanSize(archive.pointer())))
        log(Farbe.cyan('congratulation, compressing has been done!'))
    })

    outputFile.on('end', () => {
        log(Farbe.red('data has been drained'))
    })

    archive.on('warning', (warn) => {
        log(Farbe.red(warn))
    })

    archive.on('error', (err) => {
        log(Farbe.red(err))
    })

    archive.pipe(outputFile)

    for (let resource of resources) {
        const stats = await stat(resource)
        if (stats.isDirectory()) {
            archive.directory(resource)
        } else {
            archive.append(createReadStream(resource), {
                name: resource
            })
        }
    }
    await archive.finalize()
}

async function s3(baseName) {
    const Drive = use('Drive')
    try {
        log(Farbe.cyan('backup upload to drive began.'))
        const done = await Drive.disk('s3').put(backup.driverPath + baseName, Helpers.tmpPath('backup/') + baseName)
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
module.exports = {
    backupFactory
}