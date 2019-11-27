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

const Helpers = use('Helpers')
const Config = use('Config')
const backupOptions = Config.get('backup')

const readdir = promisify(fs.readdir)
const stat = promisify(fs.stat)
const unlink = promisify(fs.unlink)


async function runBackup() {
    const fileName = await backupFile()
    const _resources = Helpers.publicPath()
    console.log('GatherMan is walking your directories...')
    const resources = await walk(_resources)
    console.log('Hi, I have finished walking, now I am compressing...')
    await compress(fileName, resources)
    if (backupOptions.destination.disks.includes('s3')) {
        await s3(fileName)
    }
    if(backupOptions.method === 'tar')
        await unlink(Helpers.appRoot('tar'))
    else if(backupOptions.method === 'zip')
        await unlink(Helpers.appRoot('zip'))
}

async function compress(fileName, resources) {

    const archive = archiver(backupOptions.method, {
        gzip: backupOptions.gzip,
        zlib: { level: backupOptions.level },
        statConcurrency: backupOptions.concurrency
    })

    const output = fs.createWriteStream(Helpers.tmpPath('backup/') + fileName)

    output.on('close', function() {
        console.log("total size is " + humanSize(archive.pointer()))
        console.log('Hola, Backup is done!')
    });

    output.on('end', function() {
        console.log('Data has been drained')
    });

    archive.on('warning', function(err) {
        if (err.code === 'ENOENT') {
            throw err
        } else {
            throw err
        }
    });

    archive.on('error', function(err) {
        throw err
    });

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

async function backupFile() {
    const today = new Date()
    const now = today.getFullYear() + '-' + ("0" + (today.getMonth() + 1)).slice(-2) + '-' + ("0" + today.getDate()).slice(-2) + 'T' + ("0" + today.getHours()).slice(-2) +
        '-' + ("0" + today.getMinutes()).slice(-2) + '-' + today.getSeconds()

    let extension = backupOptions.method
    if (backupOptions.gzip === true && extension === 'tar') {
        extension = extension + '.gz'
    }

    return backupOptions.destination.filename_prefix + now + '.' + extension
}

async function walk(_resources) {
    let files = await readdir(_resources)
    if (files.length === 0) {
        return _resources
    }
    files = await Promise.all(files.map(async file => {
        const filePath = path.join(_resources, file)
        const stats = await stat(filePath)
        if (stats.isDirectory()) {
            return await walk(filePath)
        } else if (stats.isFile()) {
            return filePath
        }
    }))
    return files.reduce((all, folderContents) => all.concat(folderContents), [])
}

async function s3(basename) {
    const Drive = use('Drive')
    try {
        console.log('backup upload to drive began.')
        let done = await Drive.disk('s3').put(backupOptions.driverPath + basename, Helpers.tmpPath('backup/') + basename)
        if (done) {
            console.log('backup has been uploaded sucessfully!')
        } else {
            console.log('backup has not been uploaded sucessfully!')
        }
    } catch (err) {
        console.log(err)
    }
}

function humanSize(bytes) {
    var sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
    if (bytes == 0) return '0 Byte'
    var i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)))
    return Math.round(bytes / Math.pow(1024, i), 2) + ' ' + sizes[i]
}
module.exports = { runBackup }